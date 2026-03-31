import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import archiver from 'archiver';
import fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import {
  apiErrorSchema,
  archiveRequestSchema,
  healthResponseSchema,
  resolveResponseSchema,
  resolveRequestSchema,
  type ArchiveRequest,
  type AssetKind,
  type Platform
} from '@pixel/contracts';
import { config } from './config.js';
import { AppError, asAppError } from './lib/errors.js';
import { ensureFileExtension, sanitizeFileName } from './lib/filename.js';
import { request as httpRequest } from './lib/network.js';
import { detectPlatform } from './lib/platform.js';
import { CobaltAdapter } from './providers/cobalt-adapter.js';
import { ProviderRegistry } from './providers/registry.js';
import { ThreadsAdapter } from './providers/threads-adapter.js';
import { TokenStore } from './services/token-store.js';

export type AppOptions = {
  providerRegistry?: ProviderRegistry;
  tokenStore?: TokenStore;
};

const createRegistry = () =>
  new ProviderRegistry([
    new CobaltAdapter(config.cobaltApiUrl, config.cobaltRenderApiUrl, config.cobaltAuthToken),
    new ThreadsAdapter(config.threadsProviderBaseUrl)
  ]);

const buildContentDisposition = (fileName: string) => `attachment; filename="${fileName}"`;
const kindOrder: AssetKind[] = ['video', 'image', 'audio'];
const parseCobaltTarget = (value: unknown): 'primary' | 'render' => (value === 'render' ? 'render' : 'primary');

export const createApp = (options: AppOptions = {}) => {
  const app = fastify({
    logger: true,
    bodyLimit: 1024 * 1024
  });

  const registry = options.providerRegistry ?? createRegistry();
  const tokenStore = options.tokenStore ?? new TokenStore(config.tokenTtlMs);

  app.register(cors, {
    origin: config.allowedOrigins
  });

  app.register(rateLimit, {
    max: 60,
    timeWindow: '1 minute'
  });

  app.setErrorHandler((error, _request, reply) => {
    const appError = asAppError(error);
    reply.status(appError.statusCode).send(
      apiErrorSchema.parse({
        code: appError.code,
        message: appError.message,
        details: appError.details
      })
    );
  });

  app.get('/v1/health', async () => {
    const providers = await registry.health();
    const status = Object.values(providers).some((provider) => provider.status !== 'ok') ? 'degraded' : 'ok';

    return healthResponseSchema.parse({
      status,
      providers,
      timestamp: new Date().toISOString()
    });
  });

  app.post('/v1/resolve', async (request, reply) => {
    const payload = resolveRequestSchema.parse(request.body);
    const cobaltTarget = parseCobaltTarget(request.headers['x-cobalt-target']);
    const detectedPlatform = detectPlatform(payload.url);

    if (payload.platform !== 'auto' && payload.platform !== detectedPlatform) {
      throw new AppError('platform_mismatch', `The provided URL belongs to ${detectedPlatform}, not ${payload.platform}.`, 400);
    }

    const platform: Platform = payload.platform === 'auto' ? detectedPlatform : payload.platform;
    const provider = registry.get(platform);
    const result = await provider.resolve({
      ...payload,
      platform,
      cobaltTarget
    });

    const assets = result.assets
      .slice()
      .sort((left, right) => kindOrder.indexOf(left.kind) - kindOrder.indexOf(right.kind))
      .map((asset, index) => ({
        id: `${platform}-${index + 1}`,
        kind: asset.kind,
        downloadToken: tokenStore.create({
          sourceUrl: asset.sourceUrl,
          fileNameSuggestion: asset.fileNameSuggestion,
          mimeType: asset.mimeType,
          kind: asset.kind,
          previewUrl: asset.previewUrl
        }),
        previewUrl: asset.previewUrl,
        width: asset.width,
        height: asset.height,
        durationMs: asset.durationMs,
        fileNameSuggestion: asset.fileNameSuggestion,
        mimeType: asset.mimeType
      }));

    if (assets.length === 0) {
      throw new AppError('empty_result', 'No downloadable assets were returned for this public link.', 404);
    }

    reply.send(
      resolveResponseSchema.parse({
        id: randomUUID(),
        sourceUrl: payload.url,
        platform,
        title: result.title,
        author: result.author,
        thumbnailUrl: result.thumbnailUrl,
        warnings: result.warnings,
        assets,
        resolvedAt: new Date().toISOString()
      })
    );
  });

  app.post('/v1/cobalt/warm', async (request, reply) => {
    const target = parseCobaltTarget((request.body as { target?: string } | undefined)?.target ?? request.headers['x-cobalt-target']);
    const cobalt = registry.get('instagram');

    if (!(cobalt instanceof CobaltAdapter)) {
      throw new AppError('missing_provider', 'Cobalt is not available on this API.', 500);
    }

    await cobalt.warm(target);
    reply.send({
      ok: true,
      target
    });
  });

  app.get('/v1/file/:token', async (request, reply) => {
    const token = (request.params as { token: string }).token;
    const entry = tokenStore.get(token);

    if (!entry) {
      throw new AppError('token_expired', 'This download link has expired. Resolve the media again to get a fresh link.', 404);
    }

    const upstream = await httpRequest(entry.sourceUrl);
    if (!upstream.ok || !upstream.body) {
      throw new AppError('upstream_failed', `The source file could not be downloaded (${upstream.status}).`, 502);
    }

    const contentType = upstream.headers.get('content-type') ?? entry.mimeType ?? 'application/octet-stream';
    const fileName = ensureFileExtension(entry.fileNameSuggestion, contentType);

    reply.header('Content-Type', contentType);
    reply.header('Content-Disposition', buildContentDisposition(fileName));
    reply.header('Cache-Control', 'private, max-age=300');

    return reply.send(Readable.fromWeb(upstream.body));
  });

  app.post('/v1/archive', async (request, reply) => {
    const payload = archiveRequestSchema.parse(request.body) as ArchiveRequest;
    const archiveName = sanitizeFileName(payload.archiveName ?? `pixel-download-${Date.now()}`);
    const archive = archiver('zip', { zlib: { level: 9 } });
    const failed: string[] = [];

    archive.on('warning', (error) => {
      app.log.warn(error, 'archive warning');
    });

    archive.on('error', (error) => {
      app.log.error(error, 'archive error');
      reply.raw.destroy(error);
    });

    reply.header('Content-Type', 'application/zip');
    reply.header('Content-Disposition', buildContentDisposition(`${archiveName}.zip`));
    reply.send(archive);

    for (let index = 0; index < payload.assetTokens.length; index += 1) {
      const token = payload.assetTokens[index];
      const entry = tokenStore.get(token);
      if (!entry) {
        failed.push(`${token}: expired token`);
        continue;
      }

      try {
        const upstream = await httpRequest(entry.sourceUrl);
        if (!upstream.ok || !upstream.body) {
          failed.push(`${entry.fileNameSuggestion}: source responded with ${upstream.status}`);
          continue;
        }

        const mimeType = upstream.headers.get('content-type') ?? entry.mimeType;
        const fileName = ensureFileExtension(`${String(index + 1).padStart(2, '0')}-${entry.fileNameSuggestion}`, mimeType);
        archive.append(Readable.fromWeb(upstream.body), { name: fileName });
      } catch (error) {
        failed.push(`${entry.fileNameSuggestion}: ${error instanceof Error ? error.message : 'unknown failure'}`);
      }
    }

    if (failed.length > 0) {
      archive.append(`Some assets could not be included:\n\n${failed.map((line) => `- ${line}`).join('\n')}\n`, {
        name: 'ARCHIVE-NOTES.txt'
      });
    }

    await archive.finalize();
  });

  return app;
};
