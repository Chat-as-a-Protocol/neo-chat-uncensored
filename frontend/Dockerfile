# Build Stage
FROM node:22.20.0-slim AS builder
RUN corepack enable
WORKDIR /workspace

# Copy everything from root
COPY . .

# Install all dependencies (workspace)
RUN pnpm install --frozen-lockfile

# Build only frontend
RUN cd frontend && pnpm run build

# Runtime Stage
FROM node:22.20.0-slim
RUN corepack enable
WORKDIR /app

# Copy frontend dist directly
COPY --from=builder /workspace/frontend/dist ./

EXPOSE 8080
CMD ["node", "server/entry.mjs"]

