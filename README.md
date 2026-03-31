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
- Cobalt: `https://cobalt.pixloading.com`

### API env

`apps/api/.env`

```bash
HOST=0.0.0.0
PORT=3000
ALLOWED_ORIGINS=https://pixeldownload-web.vercel.app
COBALT_API_URL=https://cobalt.pixloading.com
COBALT_AUTH_TOKEN=
THREADS_PROVIDER_BASE_URL=https://lovethreads.net
TOKEN_TTL_MS=1200000
```

### API container

The API image is built from `apps/api/Dockerfile` and is intended to run behind Nginx.

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
- `cobalt.pixloading.com` -> `127.0.0.1:9000`

Expose only `80/443` publicly. Do not expose `3000/9000`.

### Vercel env

Set the web app API base to:

```bash
VITE_API_BASE_URL=https://api.pixloading.com
```
