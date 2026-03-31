import { describe, expect, it, vi } from 'vitest';
import { GalleryDlAdapter } from './gallery-dl-adapter.js';

describe('GalleryDlAdapter', () => {
  it('maps Instagram carousel records into provider assets', async () => {
    const runner = vi.fn().mockResolvedValue({
      stdout: JSON.stringify([
        {
          shortcode: 'ABC123',
          owner_username: 'pixel',
          display_url: 'https://cdn.example.com/one.jpg',
          width: 1080,
          height: 1350,
          extension: 'jpg'
        },
        {
          shortcode: 'ABC123',
          owner_username: 'pixel',
          video_url: 'https://cdn.example.com/two.mp4',
          display_url: 'https://cdn.example.com/two.jpg',
          width: 1080,
          height: 1920,
          extension: 'mp4',
          media_type: 'video'
        }
      ]),
      stderr: ''
    });

    const adapter = new GalleryDlAdapter('gallery-dl', undefined, runner);
    const result = await adapter.resolve({
      url: 'https://www.instagram.com/p/ABC123/',
      platform: 'instagram',
      contentMode: 'auto',
      preferNoWatermark: true
    });

    expect(runner).toHaveBeenCalledWith('gallery-dl', ['--resolve-json', '--quiet', '--no-input', '--config-ignore', 'https://www.instagram.com/p/ABC123/']);
    expect(result.title).toBe('ABC123');
    expect(result.author).toBe('pixel');
    expect(result.assets).toHaveLength(2);
    expect(result.assets[0]).toMatchObject({
      kind: 'image',
      sourceUrl: 'https://cdn.example.com/one.jpg',
      previewUrl: 'https://cdn.example.com/one.jpg',
      fileNameSuggestion: 'instagram-image-1.jpg'
    });
    expect(result.assets[1]).toMatchObject({
      kind: 'video',
      sourceUrl: 'https://cdn.example.com/two.mp4',
      previewUrl: 'https://cdn.example.com/two.jpg',
      fileNameSuggestion: 'instagram-video-2.mp4'
    });
  });

  it('filters records by content mode', async () => {
    const runner = vi.fn().mockResolvedValue({
      stdout: JSON.stringify([
        {
          video_url: 'https://cdn.example.com/reel.mp4',
          display_url: 'https://cdn.example.com/reel.jpg',
          extension: 'mp4',
          media_type: 'video'
        },
        {
          display_url: 'https://cdn.example.com/frame.jpg',
          extension: 'jpg',
          media_type: 'image'
        }
      ]),
      stderr: ''
    });

    const adapter = new GalleryDlAdapter('gallery-dl', undefined, runner);
    const result = await adapter.resolve({
      url: 'https://www.instagram.com/p/ABC123/',
      platform: 'instagram',
      contentMode: 'image',
      preferNoWatermark: true
    });

    expect(result.assets).toHaveLength(1);
    expect(result.assets[0]?.kind).toBe('image');
  });

  it('reports health from the local binary', async () => {
    const runner = vi.fn().mockResolvedValue({
      stdout: '1.30.0\n',
      stderr: ''
    });

    const adapter = new GalleryDlAdapter('gallery-dl', undefined, runner);
    await expect(adapter.healthCheck()).resolves.toEqual({ status: 'ok' });
  });

  it('surfaces upstream login redirects from gallery-dl', async () => {
    const runner = vi.fn().mockResolvedValue({
      stdout: JSON.stringify([
        [-1, { error: 'AbortExtraction', message: 'HTTP redirect to login page (https://www.instagram.com/accounts/login/)' }]
      ]),
      stderr: ''
    });

    const adapter = new GalleryDlAdapter('gallery-dl', undefined, runner);
    await expect(
      adapter.resolve({
        url: 'https://www.instagram.com/p/locked/',
        platform: 'instagram',
        contentMode: 'auto',
        preferNoWatermark: true
      })
    ).rejects.toMatchObject({
      code: 'provider_auth_required',
      message: 'Instagram redirected gallery-dl to the login page. Set GALLERY_DL_COOKIES_FILE to a Netscape-format Instagram cookies file and retry.'
    });
  });

  it('passes the configured cookies file to gallery-dl', async () => {
    const runner = vi.fn().mockResolvedValue({
      stdout: JSON.stringify([
        {
          shortcode: 'ABC123',
          owner_username: 'pixel',
          display_url: 'https://cdn.example.com/one.jpg',
          extension: 'jpg'
        }
      ]),
      stderr: ''
    });

    const adapter = new GalleryDlAdapter('gallery-dl', '/tmp/instagram-cookies.txt', runner);
    await adapter.resolve({
      url: 'https://www.instagram.com/p/ABC123/',
      platform: 'instagram',
      contentMode: 'auto',
      preferNoWatermark: true
    });

    expect(runner).toHaveBeenCalledWith('gallery-dl', [
      '--resolve-json',
      '--quiet',
      '--no-input',
      '--config-ignore',
      '--cookies',
      '/tmp/instagram-cookies.txt',
      'https://www.instagram.com/p/ABC123/'
    ]);
  });
});
