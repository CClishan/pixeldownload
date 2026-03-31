FROM cgr.dev/chainguard/node:latest-dev AS base
WORKDIR /app
USER root

COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/contracts/package.json ./packages/contracts/package.json
RUN npm install

COPY . .
RUN npm run build --workspace @pixel/api

EXPOSE 3000
ENTRYPOINT ["node"]
CMD ["apps/api/dist/index.js"]
