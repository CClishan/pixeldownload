import { z } from 'zod';

export const platformSchema = z.enum(['instagram', 'threads', 'tiktok']);
export type Platform = z.infer<typeof platformSchema>;

export const requestedPlatformSchema = z.enum(['auto', ...platformSchema.options]);
export type RequestedPlatform = z.infer<typeof requestedPlatformSchema>;

export const contentModeSchema = z.enum(['auto', 'video', 'image']);
export type ContentMode = z.infer<typeof contentModeSchema>;

export const resultModeSchema = z.enum(['single', 'zip']);
export type ResultMode = z.infer<typeof resultModeSchema>;

export const queueItemStateSchema = z.enum(['pending', 'resolving', 'ready', 'error']);
export type QueueItemState = z.infer<typeof queueItemStateSchema>;

export const assetKindSchema = z.enum(['video', 'image', 'audio']);
export type AssetKind = z.infer<typeof assetKindSchema>;

export const resolvedAssetSchema = z.object({
  id: z.string().min(1),
  kind: assetKindSchema,
  downloadToken: z.string().min(1),
  previewUrl: z.string().url().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  durationMs: z.number().int().positive().optional(),
  fileNameSuggestion: z.string().min(1),
  mimeType: z.string().min(1).optional()
});
export type ResolvedAsset = z.infer<typeof resolvedAssetSchema>;

export const resolveRequestSchema = z.object({
  url: z.string().url(),
  platform: requestedPlatformSchema.default('auto'),
  contentMode: contentModeSchema.default('auto'),
  preferNoWatermark: z.boolean().default(true)
});
export type ResolveRequest = z.infer<typeof resolveRequestSchema>;

export const resolveResponseSchema = z.object({
  id: z.string().min(1),
  sourceUrl: z.string().url(),
  platform: platformSchema,
  title: z.string().min(1),
  author: z.string().min(1).optional(),
  thumbnailUrl: z.string().url().optional(),
  warnings: z.array(z.string()).default([]),
  assets: z.array(resolvedAssetSchema).min(1),
  resolvedAt: z.string().datetime()
});
export type ResolveResponse = z.infer<typeof resolveResponseSchema>;

export const archiveRequestSchema = z.object({
  assetTokens: z.array(z.string().min(1)).min(1),
  archiveName: z.string().min(1).max(96).optional()
});
export type ArchiveRequest = z.infer<typeof archiveRequestSchema>;

export const providerHealthSchema = z.object({
  status: z.enum(['ok', 'degraded', 'down']),
  message: z.string().optional()
});
export type ProviderHealth = z.infer<typeof providerHealthSchema>;

export const healthResponseSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  providers: z.record(providerHealthSchema),
  timestamp: z.string().datetime()
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const apiErrorSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  details: z.string().optional()
});
export type ApiError = z.infer<typeof apiErrorSchema>;
