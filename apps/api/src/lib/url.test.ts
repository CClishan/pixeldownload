import { describe, expect, it } from 'vitest';
import { normalizeOptionalHttpUrl } from './url.js';

describe('normalizeOptionalHttpUrl', () => {
  it('returns absolute http urls as-is', () => {
    expect(normalizeOptionalHttpUrl('https://cdn.example.com/demo.jpg')).toBe('https://cdn.example.com/demo.jpg');
  });

  it('resolves relative and protocol-relative urls against a base', () => {
    expect(normalizeOptionalHttpUrl('/preview/demo.jpg', 'https://resolver.example.com/tools')).toBe(
      'https://resolver.example.com/preview/demo.jpg'
    );
    expect(normalizeOptionalHttpUrl('//cdn.example.com/demo.jpg', 'https://resolver.example.com/tools')).toBe(
      'https://cdn.example.com/demo.jpg'
    );
  });

  it('drops empty and invalid urls', () => {
    expect(normalizeOptionalHttpUrl('')).toBeUndefined();
    expect(normalizeOptionalHttpUrl('not-a-url')).toBeUndefined();
    expect(normalizeOptionalHttpUrl('javascript:alert(1)', 'https://resolver.example.com')).toBeUndefined();
  });
});
