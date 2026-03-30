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
