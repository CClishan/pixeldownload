import type { Platform } from '@pixel/contracts';
import { AppError } from './errors.js';

const hostIncludes = (url: URL, value: string) => url.hostname === value || url.hostname.endsWith(`.${value}`);

export const detectPlatform = (rawUrl: string): Platform => {
  let parsed: URL;

  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new AppError('invalid_url', 'URL format is invalid.', 400);
  }

  if (hostIncludes(parsed, 'instagram.com')) {
    return 'instagram';
  }

  if (hostIncludes(parsed, 'threads.net') || hostIncludes(parsed, 'threads.com')) {
    return 'threads';
  }

  if (hostIncludes(parsed, 'tiktok.com') || hostIncludes(parsed, 'vm.tiktok.com') || hostIncludes(parsed, 'vt.tiktok.com')) {
    return 'tiktok';
  }

  throw new AppError('unsupported_platform', 'Only Instagram, Threads, and TikTok links are supported in v1.', 400);
};
