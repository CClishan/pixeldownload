import { describe, expect, it, vi } from 'vitest';
import { YtDlpAdapter } from './yt-dlp-adapter.js';

describe('YtDlpAdapter', () => {
  it('returns a direct TikTok video asset', async () => {
    const runner = vi.fn().mockResolvedValue({
      stdout: JSON.stringify({
        title: 'demo video',
        uploader: 'pixel',
        thumbnails: [{ url: 'https://cdn.example.com/post.jpg', width: 720, height: 1280 }],
        duration: 12.3,
        formats: [
          {
            url: 'https://cdn.example.com/video.webm',
            ext: 'webm',
            width: 720,
            height: 1280,
            vcodec: 'vp9',
            acodec: 'none',
            protocol: 'https'
          },
          {
            url: 'https://cdn.example.com/video.mp4',
            ext: 'mp4',
            width: 1080,
            height: 1920,
            vcodec: 'h264',
            acodec: 'aac',
            protocol: 'https'
          }
        ]
      }),
      stderr: ''
    });

    const adapter = new YtDlpAdapter('yt-dlp', 'ffmpeg', runner);
    const result = await adapter.resolve({
      url: 'https://www.tiktok.com/@pixel/video/123',
      platform: 'tiktok',
      contentMode: 'auto',
      preferNoWatermark: true
    });

    expect(runner).toHaveBeenCalledWith('yt-dlp', [
      '--dump-single-json',
      '--no-warnings',
      '--no-playlist',
      '--skip-download',
      '--ffmpeg-location',
      'ffmpeg',
      'https://www.tiktok.com/@pixel/video/123'
    ]);
    expect(result.title).toBe('demo-video');
    expect(result.author).toBe('pixel');
    expect(result.warnings).toEqual([]);
    expect(result.assets).toEqual([
      expect.objectContaining({
        kind: 'video',
        sourceUrl: 'https://cdn.example.com/video.mp4',
        previewUrl: 'https://cdn.example.com/post.jpg',
        fileNameSuggestion: 'tiktok-video-1.mp4',
        durationMs: 12300
      })
    ]);
  });

  it('returns slideshow images plus separate audio when available', async () => {
    const runner = vi.fn().mockResolvedValue({
      stdout: JSON.stringify({
        title: 'demo slideshow',
        entries: [
          {
            url: 'https://cdn.example.com/slide-1.jpg',
            ext: 'jpg',
            width: 1080,
            height: 1920
          },
          {
            url: 'https://cdn.example.com/slide-2.jpg',
            ext: 'jpg',
            width: 1080,
            height: 1920
          }
        ],
        formats: [
          {
            url: 'https://cdn.example.com/audio.m4a',
            ext: 'm4a',
            acodec: 'aac',
            vcodec: 'none',
            protocol: 'https'
          }
        ]
      }),
      stderr: ''
    });

    const adapter = new YtDlpAdapter('yt-dlp', 'ffmpeg', runner);
    const result = await adapter.resolve({
      url: 'https://www.tiktok.com/@pixel/photo/123',
      platform: 'tiktok',
      contentMode: 'auto',
      preferNoWatermark: true
    });

    expect(result.assets).toHaveLength(3);
    expect(result.assets.map((asset) => asset.kind)).toEqual(['image', 'image', 'audio']);
    expect(result.warnings).toEqual(['TikTok slideshow audio is exposed as a separate asset when available.']);
  });

  it('filters slideshow results by content mode', async () => {
    const runner = vi.fn().mockResolvedValue({
      stdout: JSON.stringify({
        title: 'demo slideshow',
        entries: [
          {
            url: 'https://cdn.example.com/slide-1.jpg',
            ext: 'jpg'
          }
        ],
        formats: [
          {
            url: 'https://cdn.example.com/audio.m4a',
            ext: 'm4a',
            acodec: 'aac',
            vcodec: 'none',
            protocol: 'https'
          }
        ]
      }),
      stderr: ''
    });

    const adapter = new YtDlpAdapter('yt-dlp', 'ffmpeg', runner);
    const result = await adapter.resolve({
      url: 'https://www.tiktok.com/@pixel/photo/123',
      platform: 'tiktok',
      contentMode: 'image',
      preferNoWatermark: true
    });

    expect(result.assets).toHaveLength(1);
    expect(result.assets[0]?.kind).toBe('image');
    expect(result.warnings).toEqual(['TikTok slideshow audio is exposed as a separate asset when available.']);
  });
});
