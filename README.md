# Pixel Download

Browser-first media downloader for Instagram, Threads, and TikTok.

## Workspaces

- `apps/web` - Vite + React frontend for Vercel
- `apps/api` - Fastify download API for Docker deployment
- `packages/contracts` - shared request/response contracts

## Quick start

```bash
npm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
npm run dev:api
npm run dev:web
```

## Build

```bash
npm run build
```

## Test

```bash
npm run test
```

## Production deployment

Current production split:

- Web: Vercel
- API: `https://api.pixloading.com`

### API env

`apps/api/.env`

```bash
HOST=0.0.0.0
PORT=3000
ALLOWED_ORIGINS=https://pixeldownload-web.vercel.app
YT_DLP_BIN=yt-dlp
GALLERY_DL_BIN=gallery-dl
GALLERY_DL_COOKIES_FILE=/opt/pixeldownload/secrets/instagram-cookies.txt
FFMPEG_BIN=ffmpeg
THREADS_PROVIDER_BASE_URL=https://lovethreads.net
TOKEN_TTL_MS=1200000
```

`GALLERY_DL_COOKIES_FILE` 是可选项，但现在 Instagram 经常会把公开链接重定向到登录页。要稳定解析 Instagram，建议提供一个 Netscape 格式的 Instagram cookies 文件。

### API container

The API image is built from `apps/api/Dockerfile`, bundles `yt-dlp`, `gallery-dl`, and `ffmpeg`, and is intended to run behind Nginx.

```bash
docker build --platform linux/amd64 -f apps/api/Dockerfile -t pixloading-api:latest .
docker run -d \
  --name pixloading-api \
  --restart unless-stopped \
  --env-file /opt/pixeldownload/apps/api/.env \
  -p 127.0.0.1:3000:3000 \
  pixloading-api:latest
```

### Nginx reverse proxy

Terminate TLS at Nginx and proxy only to local services:

- `api.pixloading.com` -> `127.0.0.1:3000`

Expose only `80/443` publicly. Do not expose `3000`.

### Vercel env

Set the web app API base to:

```bash
VITE_API_BASE_URL=https://api.pixloading.com
```
