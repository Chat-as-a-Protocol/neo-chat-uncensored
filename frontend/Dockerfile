# Build Stage - work from monorepo root
FROM node:22.20.0-slim AS builder
RUN corepack enable
WORKDIR /workspace

# Copy monorepo root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy frontend module
COPY frontend/package.json ./frontend/

# Install all workspace dependencies
RUN pnpm install --frozen-lockfile

# Copy all frontend source
COPY frontend ./frontend

# Build only frontend
RUN cd frontend && pnpm run build

# Runtime Stage
FROM node:22.20.0-slim
RUN corepack enable
WORKDIR /app

# Copy only frontend dist
COPY --from=builder /workspace/frontend/dist ./dist

EXPOSE 8080
CMD ["node", "dist/server/entry.mjs"]

