import type { Platform } from '@pixel/contracts';
import { AppError } from '../lib/errors.js';
import { sanitizeFileName } from '../lib/filename.js';
import { runCommand, type CommandRunner } from '../lib/command.js';
import {
  assetKindFromExtension,
  ensureAssets,
  extensionFromUrl,
  fileNameForAsset,
  filterAssetsByContentMode,
  mimeTypeFromExtension
} from './provider-utils.js';
import type { ProviderAdapter, ProviderAsset, ProviderHealthResult, ProviderResolveInput, ProviderResolveResult } from './types.js';

type GalleryEntry = {
  url?: string;
  video_url?: string;
  extension?: string;
  filename?: string;
  width?: number;
  height?: number;
  duration?: number;
  content_type?: string;
  mimetype?: string;
  type?: string;
  media_type?: string;
  shortcode?: string;
  post_shortcode?: string;
  post_id?: string;
  owner_username?: string;
  username?: string;
  display_url?: string;
  thumbnail_url?: string;
  preview_url?: string;
};

type GalleryErrorEvent = [
  number,
  {
    error?: string;
    message?: string;
  }
];

const parseJsonLines = (stdout: string) => {
  const trimmed = stdout.trim();
  if (!trimmed) {
    throw new AppError('provider_error', 'gallery-dl returned no JSON output.', 502);
  }

  try {
    const parsed = JSON.parse(trimmed) as GalleryEntry[] | GalleryErrorEvent[];
    if (!Array.isArray(parsed)) {
      throw new AppError('provider_error', 'gallery-dl returned invalid JSON output.', 502);
    }

    if (parsed.length > 0 && Array.isArray(parsed[0])) {
      const errorEvent = parsed.find(
        (entry): entry is GalleryErrorEvent =>
          Array.isArray(entry) && typeof entry[1] === 'object' && entry[1] !== null
      );
      throw new AppError('provider_error', errorEvent?.[1]?.message ?? 'gallery-dl could not resolve this Instagram post.', 502);
    }

    return parsed as GalleryEntry[];
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError('provider_error', 'gallery-dl returned invalid JSON output.', 502);
  }
};

const kindFromEntry = (entry: GalleryEntry): ProviderAsset['kind'] => {
  const hintedType = entry.media_type ?? entry.type;
  if (hintedType === 'video') {
    return 'video';
  }

  if (hintedType === 'image' || hintedType === 'photo') {
    return 'image';
  }

  if (entry.video_url) {
    return 'video';
  }

  if (entry.display_url) {
    return 'image';
  }

  const extension = entry.extension ?? extensionFromUrl(entry.url);
  const kind = assetKindFromExtension(extension);
  if (!kind || kind === 'audio') {
    throw new AppError('provider_error', 'gallery-dl returned an unsupported Instagram asset.', 502);
  }

  return kind;
};

const normalizeAssets = (entries: GalleryEntry[], platform: Platform) => {
  const assets = entries
    .flatMap((entry, index) => {
      const kind = kindFromEntry(entry);
      const sourceUrl = kind === 'video' ? entry.video_url ?? entry.url : entry.display_url ?? entry.url;
      if (!sourceUrl) {
        return [];
      }

      const extension = entry.extension ?? extensionFromUrl(sourceUrl);
      const mimeType = entry.content_type ?? entry.mimetype ?? mimeTypeFromExtension(extension);

      return [{
        kind,
        sourceUrl,
        previewUrl: entry.thumbnail_url ?? entry.display_url ?? entry.preview_url ?? (kind === 'image' ? sourceUrl : undefined),
        width: entry.width,
        height: entry.height,
        durationMs: typeof entry.duration === 'number' && Number.isFinite(entry.duration) ? Math.round(entry.duration * 1000) : undefined,
        fileNameSuggestion: fileNameForAsset(platform, kind, index + 1, extension, mimeType),
        mimeType
      } satisfies ProviderAsset];
    });

  return ensureAssets(assets, 'gallery-dl did not return downloadable Instagram assets.');
};

export class GalleryDlAdapter implements ProviderAdapter {
  readonly name = 'gallery-dl';
  readonly platforms: Platform[] = ['instagram'];

  constructor(
    private readonly binaryPath: string,
    private readonly cookiesFile?: string,
    private readonly runner: CommandRunner = runCommand
  ) {}

  async resolve(input: ProviderResolveInput): Promise<ProviderResolveResult> {
    const { stdout } = await this.runner(this.binaryPath, [
      '--resolve-json',
      '--quiet',
      '--no-input',
      '--config-ignore',
      ...(this.cookiesFile ? ['--cookies', this.cookiesFile] : []),
      input.url
    ]);

    let entries: GalleryEntry[];
    try {
      entries = parseJsonLines(stdout);
    } catch (error) {
      if (
        error instanceof AppError &&
        error.message.includes('accounts/login') &&
        !this.cookiesFile
      ) {
        throw new AppError(
          'provider_auth_required',
          'Instagram redirected gallery-dl to the login page. Set GALLERY_DL_COOKIES_FILE to a Netscape-format Instagram cookies file and retry.',
          502
        );
      }

      throw error;
    }

    const assets = filterAssetsByContentMode(normalizeAssets(entries, input.platform), input.contentMode);

    if (assets.length === 0) {
      throw new AppError('content_mode_empty', 'No Instagram assets matched the selected content mode.', 400);
    }

    const first = entries[0];
    const title = sanitizeFileName(first.shortcode ?? first.post_shortcode ?? first.post_id ?? `${input.platform}-post`);
    const author = first.owner_username ?? first.username;

    return {
      title,
      author,
      warnings: [],
      thumbnailUrl: assets.find((asset) => asset.previewUrl)?.previewUrl,
      assets
    };
  }

  async healthCheck(): Promise<ProviderHealthResult> {
    try {
      await this.runner(this.binaryPath, ['--version']);
      return { status: 'ok' };
    } catch (error) {
      return {
        status: 'degraded',
        message: error instanceof Error ? error.message : 'gallery-dl version check failed.'
      };
    }
  }
}
