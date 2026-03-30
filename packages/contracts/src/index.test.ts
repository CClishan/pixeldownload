import { describe, expect, it } from 'vitest';
import { resolveRequestSchema } from './index';

describe('resolveRequestSchema', () => {
  it('applies request defaults', () => {
    expect(
      resolveRequestSchema.parse({
        url: 'https://www.instagram.com/p/demo/'
      })
    ).toMatchObject({
      platform: 'auto',
      contentMode: 'auto',
      preferNoWatermark: true
    });
  });
});
