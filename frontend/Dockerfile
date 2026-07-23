# Build Stage
FROM node:22.20.0-slim AS builder
RUN corepack enable
WORKDIR /app

COPY package.json ./
RUN pnpm install --no-frozen-lockfile

COPY . .
RUN pnpm run build

# Runtime Stage
FROM node:22.20.0-slim
RUN corepack enable
WORKDIR /app

# Copy package.json and install production dependencies for runtime modules
COPY package.json ./
RUN pnpm install --prod --no-frozen-lockfile

# Copy built dist output
COPY --from=builder /app/dist ./dist

EXPOSE 8080
CMD ["node", "dist/server/entry.mjs"]
