# Build Stage
FROM node:22.20.0-slim AS builder
RUN corepack enable
WORKDIR /app

# Copy frontend files only
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# Runtime Stage
FROM node:22.20.0-slim
RUN corepack enable
WORKDIR /app

# Copy only what's needed
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# Copy built frontend
COPY --from=builder /app/dist ./dist

EXPOSE 8080
CMD ["node", "dist/server/entry.mjs"]

