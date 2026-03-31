import type { ContentMode, HealthResponse, RequestedPlatform, ResolveResponse, ResultMode } from '@pixel/contracts';

export type Locale = 'zh' | 'en';

export type AppSettings = {
  platformLock: RequestedPlatform;
  contentMode: ContentMode;
  resultMode: ResultMode;
  preferNoWatermark: boolean;
};

export type QueueItem = {
  id: string;
  url: string;
  status: 'pending' | 'resolving' | 'ready' | 'error';
  error?: string;
  response?: ResolveResponse;
  expanded: boolean;
  selectedTokens: string[];
};

export type ServiceHealth = HealthResponse | null;

export type CobaltTarget = 'primary' | 'render';
