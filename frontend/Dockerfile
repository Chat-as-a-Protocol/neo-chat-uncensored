# Build Stage
FROM node:22.20.0-slim AS builder
RUN corepack enable
WORKDIR /app

# Copy frontend module files (package.json + pnpm-lock.yaml)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build
RUN pnpm run build

# Runtime Stage
FROM node:22.20.0-slim
RUN corepack enable
WORKDIR /app

# Copy dist only
COPY --from=builder /app/dist ./dist

EXPOSE 8080
CMD ["node", "dist/server/entry.mjs"]

