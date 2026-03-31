import type { ContentMode, Platform } from '@pixel/contracts';
import { AppError } from '../lib/errors.js';
import { ensureFileExtension, sanitizeFileName } from '../lib/filename.js';
import { request } from '../lib/network.js';
import { normalizeOptionalHttpUrl } from '../lib/url.js';
import type { ProviderAdapter, ProviderAsset, ProviderHealthResult, ProviderResolveInput, ProviderResolveResult } from './types.js';

type CobaltStatus = 'redirect' | 'stream' | 'picker' | 'tunnel' | 'local-processing' | 'error';

type CobaltPickerEntry = {
  type?: 'photo' | 'video' | 'gif';
  url?: string;
  thumb?: string;
};

type CobaltResponse = {
  status: CobaltStatus;
  url?: string;
  filename?: string;
  picker?: CobaltPickerEntry[];
  audio?: string;
  audioFilename?: string;
  text?: string;
  type?: string;
};

type CobaltInfo = {
  services?: Array<string | { key?: string; alias?: string }>;
  cobalt?: {
    services?: Array<string | { key?: string; alias?: string }>;
  };
};

const kindFromFileName = (fileName?: string): ProviderAsset['kind'] => {
  const lower = (fileName ?? '').toLowerCase();
  if (/\.(jpg|jpeg|png|webp|gif)$/i.test(lower)) {
    return 'image';
  }

  if (/\.(mp3|m4a|aac|wav|ogg)$/i.test(lower)) {
    return 'audio';
  }

  return 'video';
};

const filterByContentMode = (assets: ProviderAsset[], contentMode: ContentMode) => {
  if (contentMode === 'video') {
    return assets.filter((asset) => asset.kind === 'video');
  }

  if (contentMode === 'image') {
    return assets.filter((asset) => asset.kind === 'image');
  }

  return assets;
};

export class CobaltAdapter implements ProviderAdapter {
  readonly name = 'cobalt';
  readonly platforms: Platform[] = ['instagram', 'tiktok'];

  constructor(
    private readonly baseUrl: string,
    private readonly renderBaseUrl?: string,
    private readonly authToken?: string
  ) {}

  async resolve(input: ProviderResolveInput): Promise<ProviderResolveResult> {
    const targetBaseUrl = this.pickBaseUrl(input.cobaltTarget);
    const body = {
      url: input.url,
      downloadMode: 'auto',
      filenameStyle: 'basic',
      tiktokFullAudio: input.preferNoWatermark
    };

    const response = await request(targetBaseUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(this.authToken ? { Authorization: `Api-Key ${this.authToken}` } : {})
      },
      body: JSON.stringify(body)
    });

    const json = (await response.json()) as CobaltResponse;

    if (!response.ok || json.status === 'error') {
      throw new AppError('provider_error', json.text ?? 'Cobalt could not resolve this media.', 502);
    }

    if (json.status === 'local-processing') {
      throw new AppError(
        'provider_unsupported',
        'This source requires local media processing. Pixel Download v1 only supports direct downloadable assets.',
        502
      );
    }

    const assets = this.normalizeAssets(json, input.platform, targetBaseUrl);
    const filteredAssets = filterByContentMode(assets, input.contentMode);

    if (filteredAssets.length === 0) {
      throw new AppError('content_mode_empty', 'No assets matched the selected content mode for this post.', 400);
    }

    const title = sanitizeFileName(json.filename?.replace(/\.[a-z0-9]{2,5}$/i, '') ?? `${input.platform}-post`);

    return {
      title,
      warnings: json.audio && input.platform === 'tiktok' ? ['TikTok slideshow audio is exposed as a separate asset when available.'] : [],
      assets: filteredAssets,
      thumbnailUrl: filteredAssets.find((asset) => asset.previewUrl)?.previewUrl
    };
  }

  async healthCheck(): Promise<ProviderHealthResult> {
    const response = await request(this.baseUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...(this.authToken ? { Authorization: `Api-Key ${this.authToken}` } : {})
      }
    });

    if (!response.ok) {
      return {
        status: 'degraded',
        message: `Cobalt responded with ${response.status}.`
      };
    }

    const info = (await response.json()) as CobaltInfo;
    const services = info.services ?? info.cobalt?.services ?? [];
    const serviceKeys = new Set(
      services
        .flatMap((service) => (typeof service === 'string' ? [service] : [service.key, service.alias]))
        .filter(Boolean)
    );
    const missing = ['instagram', 'tiktok'].filter((key) => !serviceKeys.has(key));

    if (missing.length > 0) {
      return {
        status: 'degraded',
        message: `Missing service support for ${missing.join(', ')}.`
      };
    }

    return { status: 'ok' };
  }

  async warm(target: 'primary' | 'render' = 'primary') {
    const response = await request(this.pickBaseUrl(target), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...(this.authToken ? { Authorization: `Api-Key ${this.authToken}` } : {})
      }
    });

    if (!response.ok) {
      throw new AppError('provider_error', `Cobalt warmup failed with ${response.status}.`, 502);
    }

    return response;
  }

  private pickBaseUrl(target: 'primary' | 'render' = 'primary') {
    if (target === 'render') {
      if (!this.renderBaseUrl) {
        throw new AppError('provider_unavailable', 'Render cobalt is not configured on this API.', 400);
      }

      return this.renderBaseUrl;
    }

    return this.baseUrl;
  }

  private normalizeAssets(payload: CobaltResponse, platform: Platform, baseUrl: string): ProviderAsset[] {
    if (payload.status === 'redirect' || payload.status === 'stream' || payload.status === 'tunnel') {
      if (!payload.url) {
        throw new AppError('provider_error', 'Cobalt returned an empty download URL.', 502);
      }

      const fileName = ensureFileExtension(payload.filename ?? `${platform}-asset`, payload.type);
      return [
        {
          kind: kindFromFileName(fileName),
          sourceUrl: payload.url,
          fileNameSuggestion: fileName,
          mimeType: payload.type
        }
      ];
    }

    if (payload.status === 'picker') {
      const assets: ProviderAsset[] = (payload.picker ?? [])
        .filter((entry) => entry.url)
        .map((entry, index) => {
          const kind = entry.type === 'photo' ? 'image' : 'video';
          const fileName = ensureFileExtension(`${platform}-${kind}-${index + 1}`, kind === 'image' ? 'image/jpeg' : 'video/mp4');
          return {
            kind,
            sourceUrl: entry.url as string,
            previewUrl: normalizeOptionalHttpUrl(entry.thumb, baseUrl),
            fileNameSuggestion: fileName,
            mimeType: kind === 'image' ? 'image/jpeg' : 'video/mp4'
          };
        });

      if (payload.audio) {
        assets.push({
          kind: 'audio',
          sourceUrl: payload.audio,
          fileNameSuggestion: ensureFileExtension(payload.audioFilename ?? `${platform}-audio`, 'audio/mpeg'),
          mimeType: 'audio/mpeg'
        });
      }

      return assets;
    }

    throw new AppError('provider_error', 'Cobalt returned an unsupported status.', 502);
  }
}
