const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const splitOrigins = (value: string | undefined) =>
  (value ?? 'http://localhost:5173')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export const config = {
  host: process.env.HOST ?? '0.0.0.0',
  port: toNumber(process.env.PORT, 3000),
  allowedOrigins: splitOrigins(process.env.ALLOWED_ORIGINS),
  ytDlpBin: process.env.YT_DLP_BIN ?? 'yt-dlp',
  galleryDlBin: process.env.GALLERY_DL_BIN ?? 'gallery-dl',
  galleryDlCookiesFile: process.env.GALLERY_DL_COOKIES_FILE,
  ffmpegBin: process.env.FFMPEG_BIN ?? 'ffmpeg',
  threadsProviderBaseUrl: process.env.THREADS_PROVIDER_BASE_URL ?? 'https://lovethreads.net',
  tokenTtlMs: toNumber(process.env.TOKEN_TTL_MS, 20 * 60 * 1000)
};
