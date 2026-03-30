import { describe, expect, it, vi } from 'vitest';
import { TokenStore } from './token-store.js';

describe('TokenStore', () => {
  it('stores and retrieves unexpired tokens', () => {
    const store = new TokenStore(1_000);
    const token = store.create({
      sourceUrl: 'https://cdn.example.com/file.mp4',
      fileNameSuggestion: 'file.mp4',
      kind: 'video'
    });

    expect(store.has(token)).toBe(true);
    expect(store.get(token)?.fileNameSuggestion).toBe('file.mp4');
  });

  it('expires tokens after the ttl window', () => {
    vi.useFakeTimers();
    const store = new TokenStore(500);
    const token = store.create({
      sourceUrl: 'https://cdn.example.com/file.mp4',
      fileNameSuggestion: 'file.mp4',
      kind: 'video'
    });

    vi.advanceTimersByTime(501);
    expect(store.get(token)).toBeUndefined();
    vi.useRealTimers();
  });
});
