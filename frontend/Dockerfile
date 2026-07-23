# Build Stage
FROM node:22.20.0-slim AS builder
RUN corepack enable
WORKDIR /app
COPY package.json ./
RUN pnpm install --no-ignored-builds
COPY . .
RUN pnpm run build

# Runtime Stage
FROM node:22.20.0-slim
RUN corepack enable
WORKDIR /app

COPY package.json ./
RUN pnpm install --prod --no-ignored-builds

COPY --from=builder /app/dist ./dist

EXPOSE 8080
CMD ["node", "dist/server/entry.mjs"]
