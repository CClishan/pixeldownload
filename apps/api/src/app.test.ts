import { describe, expect, it } from 'vitest';
import { createApp } from './app.js';
import { ProviderRegistry } from './providers/registry.js';
import type { ProviderAdapter } from './providers/types.js';
import { TokenStore } from './services/token-store.js';

const provider: ProviderAdapter = {
  name: 'stub',
  platforms: ['instagram'],
  async resolve() {
    return {
      title: 'demo-post',
      warnings: [],
      assets: [
        {
          kind: 'video',
          sourceUrl: 'https://cdn.example.com/demo.mp4',
          fileNameSuggestion: 'demo.mp4',
          mimeType: 'video/mp4'
        }
      ]
    };
  },
  async healthCheck() {
    return { status: 'ok' };
  }
};

describe('createApp', () => {
  it('resolves a supported link', async () => {
    const app = createApp({
      providerRegistry: new ProviderRegistry([provider]),
      tokenStore: new TokenStore(60_000)
    });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/resolve',
      payload: {
        url: 'https://www.instagram.com/p/ABC123/',
        platform: 'auto',
        contentMode: 'auto',
        preferNoWatermark: true
      }
    });

    expect(response.statusCode).toBe(200);
    const payload = response.json();
    expect(payload.platform).toBe('instagram');
    expect(payload.assets).toHaveLength(1);
  });
});
