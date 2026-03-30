import { describe, expect, it } from 'vitest';
import { buildArchiveName, extractUrls } from './utils';

describe('extractUrls', () => {
  it('extracts and deduplicates urls', () => {
    expect(
      extractUrls('https://a.example/test\nhttps://b.example/demo\nhttps://a.example/test')
    ).toEqual(['https://a.example/test', 'https://b.example/demo']);
  });
});

describe('buildArchiveName', () => {
  it('uses locale-aware naming', () => {
    expect(
      buildArchiveName('en', [{ id: '1', url: 'https://a.example', status: 'ready', expanded: false, selectedTokens: [] }])
    ).toContain('pixel-download-1-items-');
  });
});
