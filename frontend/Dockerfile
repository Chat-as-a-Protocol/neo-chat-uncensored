# Build Stage
FROM node:22.20.0-slim AS builder
RUN corepack enable
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY shared ./shared
COPY frontend ./frontend

RUN pnpm install --frozen-lockfile
RUN pnpm --filter neo-chat-uncensored-frontend build

# Runtime Stage
FROM node:22.20.0-slim
RUN corepack enable
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY shared ./shared
COPY frontend/package.json ./frontend/package.json

RUN pnpm install --prod --frozen-lockfile
COPY --from=builder /app/frontend/dist ./frontend/dist

EXPOSE 8080
WORKDIR /app/frontend
CMD ["node", "dist/server/entry.mjs"]
