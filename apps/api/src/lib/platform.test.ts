import { describe, expect, it } from 'vitest';
import { detectPlatform } from './platform.js';

describe('detectPlatform', () => {
  it('detects instagram links', () => {
    expect(detectPlatform('https://www.instagram.com/p/ABC123/')).toBe('instagram');
  });

  it('detects threads links', () => {
    expect(detectPlatform('https://www.threads.net/@pixel/post/C0DEX')).toBe('threads');
  });

  it('detects tiktok short links', () => {
    expect(detectPlatform('https://vm.tiktok.com/ZM123456/')).toBe('tiktok');
  });
});
