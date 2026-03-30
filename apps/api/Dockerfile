FROM node:24-slim AS base
WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/contracts/package.json ./packages/contracts/package.json
RUN npm install

COPY . .
RUN npm run build --workspace @pixel/api

EXPOSE 3000
CMD ["node", "apps/api/dist/index.js"]
