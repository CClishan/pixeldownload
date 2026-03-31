import type { Platform } from '@pixel/contracts';
import { AppError } from '../lib/errors.js';
import { sanitizeFileName } from '../lib/filename.js';
import { runCommand, type CommandRunner } from '../lib/command.js';
import {
  assetKindFromExtension,
  extensionFromUrl,
  fileNameForAsset,
  filterAssetsByContentMode,
  mimeTypeFromExtension,
  mimeTypeToExtension
} from './provider-utils.js';
import type { ProviderAdapter, ProviderAsset, ProviderHealthResult, ProviderResolveInput, ProviderResolveResult } from './types.js';

type YtDlpThumbnail = {
  url?: string;
  width?: number;
  height?: number;
};

type YtDlpFormat = {
  url?: string;
  ext?: string;
  width?: number;
  height?: number;
  format_id?: string;
  format_note?: string;
  protocol?: string;
  acodec?: string;
  vcodec?: string;
  audio_ext?: string;
  video_ext?: string;
  resolution?: string;
  format?: string;
};

type YtDlpEntry = {
  url?: string;
  ext?: string;
  width?: number;
  height?: number;
  duration?: number;
  thumbnails?: YtDlpThumbnail[];
};

type YtDlpPayload = {
  id?: string;
  title?: string;
  uploader?: string;
  uploader_id?: string;
  uploader_url?: string;
  webpage_url?: string;
  url?: string;
  ext?: string;
  duration?: number;
  thumbnails?: YtDlpThumbnail[];
  requested_formats?: YtDlpFormat[];
  formats?: YtDlpFormat[];
  entries?: YtDlpEntry[];
};

const parsePayload = (stdout: string) => {
  try {
    return JSON.parse(stdout) as YtDlpPayload;
  } catch {
    throw new AppError('provider_error', 'yt-dlp returned invalid JSON output.', 502);
  }
};

const pickPreview = (thumbnails?: YtDlpThumbnail[]) =>
  thumbnails
    ?.filter((thumbnail) => Boolean(thumbnail.url))
    .sort((left, right) => (right.width ?? 0) * (right.height ?? 0) - (left.width ?? 0) * (left.height ?? 0))[0]?.url;

const formatIsDirectVideo = (format: YtDlpFormat) => {
  if (!format.url) {
    return false;
  }

  const extension = format.ext ?? extensionFromUrl(format.url);
  return assetKindFromExtension(extension) === 'video' && format.vcodec !== 'none';
};

const formatIsAudioOnly = (format: YtDlpFormat) => {
  if (!format.url) {
    return false;
  }

  const extension = format.ext ?? format.audio_ext ?? extensionFromUrl(format.url);
  return assetKindFromExtension(extension) === 'audio' && format.vcodec === 'none';
};

const pickBestVideoFormat = (formats: YtDlpFormat[]) =>
  formats
    .filter(formatIsDirectVideo)
    .sort((left, right) => {
      const leftScore = (left.ext === 'mp4' ? 1_000_000 : 0) + (left.width ?? 0) * (left.height ?? 0);
      const rightScore = (right.ext === 'mp4' ? 1_000_000 : 0) + (right.width ?? 0) * (right.height ?? 0);
      return rightScore - leftScore;
    })[0];

const pickBestAudioFormat = (formats: YtDlpFormat[]) =>
  formats
    .filter(formatIsAudioOnly)
    .sort((left, right) => {
      const leftScore = (left.ext === 'm4a' ? 1_000_000 : 0);
      const rightScore = (right.ext === 'm4a' ? 1_000_000 : 0);
      return rightScore - leftScore;
    })[0];

const normalizeEntryAsset = (entry: YtDlpEntry, platform: Platform, index: number): ProviderAsset => {
  if (!entry.url) {
    throw new AppError('provider_error', 'yt-dlp returned an empty TikTok asset URL.', 502);
  }

  const extension = entry.ext ?? extensionFromUrl(entry.url);
  const kind = assetKindFromExtension(extension);
  if (!kind || kind === 'audio') {
    throw new AppError('provider_error', 'yt-dlp returned an unsupported TikTok slideshow asset.', 502);
  }

  const mimeType = mimeTypeFromExtension(extension);
  return {
    kind,
    sourceUrl: entry.url,
    previewUrl: kind === 'image' ? entry.url : pickPreview(entry.thumbnails),
    width: entry.width,
    height: entry.height,
    durationMs: typeof entry.duration === 'number' && Number.isFinite(entry.duration) ? Math.round(entry.duration * 1000) : undefined,
    fileNameSuggestion: fileNameForAsset(platform, kind, index, extension, mimeType),
    mimeType
  };
};

const buildSlideshowAssets = (payload: YtDlpPayload, platform: Platform) => {
  const entries = payload.entries?.filter((entry) => Boolean(entry.url)) ?? [];
  if (entries.length === 0) {
    throw new AppError('provider_error', 'yt-dlp did not return slideshow assets for this TikTok post.', 502);
  }

  const assets = entries.map((entry, index) => normalizeEntryAsset(entry, platform, index + 1));
  const audioFormat = pickBestAudioFormat([...(payload.requested_formats ?? []), ...(payload.formats ?? [])]);

  if (audioFormat?.url) {
    const extension = audioFormat.ext ?? audioFormat.audio_ext ?? extensionFromUrl(audioFormat.url) ?? mimeTypeToExtension('audio/mpeg');
    const mimeType = mimeTypeFromExtension(extension) ?? 'audio/mpeg';
    assets.push({
      kind: 'audio',
      sourceUrl: audioFormat.url,
      fileNameSuggestion: fileNameForAsset(platform, 'audio', assets.length + 1, extension, mimeType),
      mimeType
    });
  }

  return assets;
};

const buildVideoAsset = (payload: YtDlpPayload, platform: Platform): ProviderAsset => {
  const directFormat = pickBestVideoFormat(payload.requested_formats ?? []) ?? pickBestVideoFormat(payload.formats ?? []);
  const sourceUrl = directFormat?.url ?? payload.url;
  const extension = payload.ext ?? directFormat?.ext ?? extensionFromUrl(sourceUrl);
  const kind = assetKindFromExtension(extension);

  if (!sourceUrl || kind !== 'video') {
    throw new AppError(
      'provider_unsupported',
      'This TikTok post does not expose a direct downloadable video and would require local media processing.',
      502
    );
  }

  const mimeType = mimeTypeFromExtension(extension);
  return {
    kind: 'video',
    sourceUrl,
    previewUrl: pickPreview(payload.thumbnails),
    durationMs: typeof payload.duration === 'number' && Number.isFinite(payload.duration) ? Math.round(payload.duration * 1000) : undefined,
    width: directFormat?.width,
    height: directFormat?.height,
    fileNameSuggestion: fileNameForAsset(platform, 'video', 1, extension, mimeType),
    mimeType
  };
};

export class YtDlpAdapter implements ProviderAdapter {
  readonly name = 'yt-dlp';
  readonly platforms: Platform[] = ['tiktok'];

  constructor(
    private readonly binaryPath: string,
    private readonly ffmpegPath: string,
    private readonly runner: CommandRunner = runCommand
  ) {}

  async resolve(input: ProviderResolveInput): Promise<ProviderResolveResult> {
    const args = ['--dump-single-json', '--no-warnings', '--no-playlist', '--skip-download', '--ffmpeg-location', this.ffmpegPath, input.url];
    const { stdout } = await this.runner(this.binaryPath, args);
    const payload = parsePayload(stdout);
    const rawAssets = payload.entries?.length ? buildSlideshowAssets(payload, input.platform) : [buildVideoAsset(payload, input.platform)];
    const assets = filterAssetsByContentMode(rawAssets, input.contentMode);

    if (assets.length === 0) {
      throw new AppError('content_mode_empty', 'No TikTok assets matched the selected content mode.', 400);
    }

    return {
      title: sanitizeFileName(payload.title ?? payload.id ?? `${input.platform}-post`),
      author: payload.uploader ?? payload.uploader_id,
      thumbnailUrl: assets.find((asset) => asset.previewUrl)?.previewUrl ?? pickPreview(payload.thumbnails),
      warnings: rawAssets.some((asset) => asset.kind === 'audio') ? ['TikTok slideshow audio is exposed as a separate asset when available.'] : [],
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
        message: error instanceof Error ? error.message : 'yt-dlp version check failed.'
      };
    }
  }
}
