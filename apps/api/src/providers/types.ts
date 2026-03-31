import type { ContentMode, Platform } from '@pixel/contracts';

export type ProviderAsset = {
  kind: 'video' | 'image' | 'audio';
  sourceUrl: string;
  previewUrl?: string;
  width?: number;
  height?: number;
  durationMs?: number;
  fileNameSuggestion: string;
  mimeType?: string;
};

export type ProviderResolveInput = {
  url: string;
  platform: Platform;
  contentMode: ContentMode;
  preferNoWatermark: boolean;
};

export type ProviderResolveResult = {
  title: string;
  author?: string;
  thumbnailUrl?: string;
  warnings: string[];
  assets: ProviderAsset[];
};

export type ProviderHealthResult = {
  status: 'ok' | 'degraded' | 'down';
  message?: string;
};

export interface ProviderAdapter {
  readonly name: string;
  readonly platforms: readonly Platform[];
  resolve(input: ProviderResolveInput): Promise<ProviderResolveResult>;
  healthCheck(): Promise<ProviderHealthResult>;
}
