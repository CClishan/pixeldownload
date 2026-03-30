import type { Platform, RequestedPlatform } from '@pixel/contracts';
import type { Locale, QueueItem } from './types';

const urlPattern = /https?:\/\/[^\s<>")]+/g;

export const extractUrls = (input: string) => {
  const matches = input.match(urlPattern) ?? [];
  const deduped = new Set<string>();

  for (const match of matches) {
    deduped.add(match.trim());
  }

  return Array.from(deduped);
};

export const summarizeUrl = (value: string) => {
  try {
    const url = new URL(value);
    const tail = url.pathname.replace(/\/$/, '') || '/';
    return `${url.hostname}${tail}`;
  } catch {
    return value;
  }
};

export const platformLabel = (platform: RequestedPlatform | Platform) => {
  switch (platform) {
    case 'auto':
      return 'AUTO';
    case 'instagram':
      return 'INSTAGRAM';
    case 'threads':
      return 'THREADS';
    case 'tiktok':
      return 'TIKTOK';
  }
};

export const buildArchiveName = (locale: Locale, queue: QueueItem[]) => {
  const readyItems = queue.filter((item) => item.status === 'ready').length;
  const stamp = new Date().toISOString().slice(0, 10);
  return locale === 'zh' ? `pixel-download-${readyItems}项-${stamp}` : `pixel-download-${readyItems}-items-${stamp}`;
};

export const countSelectedAssets = (queue: QueueItem[]) =>
  queue.reduce((sum, item) => sum + item.selectedTokens.length, 0);

export const countReadyItems = (queue: QueueItem[]) => queue.filter((item) => item.status === 'ready').length;

export const resetResolvedItems = (queue: QueueItem[]) =>
  queue.map((item) => ({
    ...item,
    status: 'pending' as const,
    error: undefined,
    response: undefined,
    expanded: false,
    selectedTokens: []
  }));
