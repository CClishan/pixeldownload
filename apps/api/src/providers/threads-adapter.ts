import { load } from 'cheerio';
import { AppError } from '../lib/errors.js';
import { ensureFileExtension } from '../lib/filename.js';
import { request } from '../lib/network.js';
import type { ProviderAdapter, ProviderAsset, ProviderHealthResult, ProviderResolveInput, ProviderResolveResult } from './types.js';

export class ThreadsAdapter implements ProviderAdapter {
  readonly name = 'threads';
  readonly platforms = ['threads'] as const;

  constructor(private readonly baseUrl: string) {}

  async resolve(input: ProviderResolveInput): Promise<ProviderResolveResult> {
    const origin = this.baseUrl.replace(/\/$/, '');
    const form = new URLSearchParams({
      q: input.url,
      t: 'media',
      lang: 'en'
    });

    const response = await request(new URL('/api/ajaxSearch', origin), {
      method: 'POST',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        Origin: origin,
        Referer: `${origin}/en`,
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: form.toString()
    });

    const json = (await response.json()) as { status?: string; data?: string };

    if (!response.ok || json.status !== 'ok' || !json.data) {
      throw new AppError('provider_error', 'Threads resolver could not read this public post.', 502);
    }

    const $ = load(json.data);
    const assets: ProviderAsset[] = [];

    $('.download-box > li').each((index, element) => {
      const item = $(element);
      const thumbnail = item.find('.download-items__thumb img').attr('src');

      if (item.find('.icon-dlimage').length > 0) {
        const variants = item
          .find('.photo-option option')
          .toArray()
          .map((option) => {
            const url = $(option).attr('value');
            const label = $(option).text().trim();
            if (!url || !label.includes('x')) {
              return undefined;
            }

            const [width, height] = label.split('x').map((value) => Number(value));
            return { url, width, height };
          })
          .filter((value): value is { url: string; width: number; height: number } => Boolean(value))
          .sort((left, right) => right.width * right.height - left.width * left.height);

        const best = variants[0];
        if (best) {
          assets.push({
            kind: 'image',
            sourceUrl: best.url,
            previewUrl: thumbnail,
            width: best.width,
            height: best.height,
            fileNameSuggestion: ensureFileExtension(`threads-image-${index + 1}`, 'image/jpeg'),
            mimeType: 'image/jpeg'
          });
        }
      }

      if (item.find('.icon-dlvideo').length > 0) {
        const url = item.find('a[title="Download Video"]').attr('href');
        if (url) {
          assets.push({
            kind: 'video',
            sourceUrl: url,
            previewUrl: thumbnail,
            fileNameSuggestion: ensureFileExtension(`threads-video-${index + 1}`, 'video/mp4'),
            mimeType: 'video/mp4'
          });
        }
      }
    });

    const filteredAssets =
      input.contentMode === 'image'
        ? assets.filter((asset) => asset.kind === 'image')
        : input.contentMode === 'video'
          ? assets.filter((asset) => asset.kind === 'video')
          : assets;

    if (filteredAssets.length === 0) {
      throw new AppError('content_mode_empty', 'No Threads assets matched the selected content mode.', 400);
    }

    return {
      title: 'threads-post',
      warnings: ['Threads support is powered by a brittle public extractor and may need future provider swaps.'],
      thumbnailUrl: filteredAssets.find((asset) => asset.previewUrl)?.previewUrl,
      assets: filteredAssets
    };
  }

  async healthCheck(): Promise<ProviderHealthResult> {
    const response = await request(this.baseUrl, { method: 'GET' });
    if (!response.ok) {
      return {
        status: 'degraded',
        message: `Threads provider responded with ${response.status}.`
      };
    }

    return { status: 'ok' };
  }
}
