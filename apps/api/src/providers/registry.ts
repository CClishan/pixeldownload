import type { Platform } from '@pixel/contracts';
import { AppError } from '../lib/errors.js';
import type { ProviderAdapter } from './types.js';

export class ProviderRegistry {
  constructor(private readonly adapters: ProviderAdapter[]) {}

  get(platform: Platform) {
    const adapter = this.adapters.find((candidate) => candidate.platforms.includes(platform));
    if (!adapter) {
      throw new AppError('missing_provider', `No provider is configured for ${platform}.`, 500);
    }

    return adapter;
  }

  async health() {
    const entries = await Promise.all(
      this.adapters.map(async (adapter) => {
        const result = await adapter.healthCheck().catch(() => ({ status: 'down' as const, message: 'Health check failed.' }));
        return [adapter.name, result] as const;
      })
    );

    return Object.fromEntries(entries);
  }
}
