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
  cobaltApiUrl: process.env.COBALT_API_URL ?? 'http://localhost:9000',
  cobaltRenderApiUrl: process.env.COBALT_RENDER_API_URL,
  cobaltAuthToken: process.env.COBALT_AUTH_TOKEN,
  threadsProviderBaseUrl: process.env.THREADS_PROVIDER_BASE_URL ?? 'https://lovethreads.net',
  tokenTtlMs: toNumber(process.env.TOKEN_TTL_MS, 20 * 60 * 1000)
};
