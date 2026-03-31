import type { ContentMode, Platform } from '@pixel/contracts';
import { AppError } from '../lib/errors.js';
import { ensureFileExtension } from '../lib/filename.js';
import { normalizeOptionalHttpUrl } from '../lib/url.js';
import type { ProviderAsset } from './types.js';

const imageExtensions = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif']);
const videoExtensions = new Set(['mp4', 'm4v', 'mov', 'webm']);
const audioExtensions = new Set(['mp3', 'm4a', 'aac', 'wav', 'ogg']);

export const filterByContentMode = (assets: ProviderAsset[], contentMode: ContentMode) => {
  if (contentMode === 'video') {
    return assets.filter((asset) => asset.kind === 'video');
  }

  if (contentMode === 'image') {
    return assets.filter((asset) => asset.kind === 'image');
  }

  return assets;
};

export const filterAssetsByContentMode = filterByContentMode;

export const parseJsonObject = <T>(stdout: string, errorMessage: string): T => {
  try {
    return JSON.parse(stdout) as T;
  } catch {
    throw new AppError('provider_error', errorMessage, 502);
  }
};

export const parseJsonLines = <T>(stdout: string, errorMessage: string): T[] => {
  const lines = stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [];
  }

  try {
    return lines.map((line) => JSON.parse(line) as T);
  } catch {
    throw new AppError('provider_error', errorMessage, 502);
  }
};

export const normalizeCliError = (stderr: string, fallback: string) => {
  const message = stderr
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .at(-1);

  return message ?? fallback;
};

export const toPositiveInt = (value: unknown) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};

export const toDurationMs = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 1000) : undefined;
};

export const extensionToMimeType = (extension?: string) => {
  const normalized = extension?.replace(/^\./, '').toLowerCase();
  if (!normalized) {
    return undefined;
  }

  if (imageExtensions.has(normalized)) {
    return normalized === 'jpg' ? 'image/jpeg' : `image/${normalized}`;
  }

  if (videoExtensions.has(normalized)) {
    return normalized === 'm4v' ? 'video/mp4' : `video/${normalized}`;
  }

  if (audioExtensions.has(normalized)) {
    if (normalized === 'mp3') {
      return 'audio/mpeg';
    }

    return `audio/${normalized}`;
  }

  return undefined;
};

export const mimeTypeFromExtension = extensionToMimeType;

export const mimeTypeToExtension = (mimeType?: string) => {
  const normalized = mimeType?.toLowerCase();
  if (!normalized) {
    return undefined;
  }

  switch (normalized) {
    case 'image/jpeg':
      return 'jpg';
    case 'video/mp4':
      return 'mp4';
    case 'audio/mpeg':
      return 'mp3';
    default:
      return normalized.split('/')[1];
  }
};

export const detectAssetKind = (extension?: string, url?: string): ProviderAsset['kind'] | undefined => {
  const normalizedExtension = extension?.replace(/^\./, '').toLowerCase();
  if (normalizedExtension) {
    if (imageExtensions.has(normalizedExtension)) {
      return 'image';
    }

    if (videoExtensions.has(normalizedExtension)) {
      return 'video';
    }

    if (audioExtensions.has(normalizedExtension)) {
      return 'audio';
    }
  }

  try {
    const pathname = url ? new URL(url).pathname.toLowerCase() : '';
    const suffix = pathname.split('.').at(-1);
    return suffix ? detectAssetKind(suffix) : undefined;
  } catch {
    return undefined;
  }
};

export const assetKindFromExtension = detectAssetKind;

export const extensionFromUrl = (url?: string) => {
  try {
    const pathname = url ? new URL(url).pathname.toLowerCase() : '';
    const suffix = pathname.split('.').at(-1);
    return suffix || undefined;
  } catch {
    return undefined;
  }
};

export const fileNameForAsset = (
  platform: Platform,
  kind: ProviderAsset['kind'],
  index: number,
  extension?: string,
  mimeType?: string
) => {
  const resolvedMimeType = mimeType ?? extensionToMimeType(extension);
  const resolvedExtension = extension?.replace(/^\./, '').toLowerCase();
  const baseName = `${platform}-${kind}-${index}`;
  return resolvedExtension ? ensureFileExtension(`${baseName}.${resolvedExtension}`, resolvedMimeType) : ensureFileExtension(baseName, resolvedMimeType);
};

export const ensureAssets = (assets: ProviderAsset[], message: string) => {
  if (assets.length === 0) {
    throw new AppError('provider_error', message, 502);
  }

  return assets;
};

export const requireHttpUrl = (value: string | undefined) => normalizeOptionalHttpUrl(value);
