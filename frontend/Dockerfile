# Build Stage
FROM node:22.20.0-slim AS builder
RUN corepack enable
WORKDIR /app

# Copy monorepo files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json ./frontend/
COPY shared ./shared

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy frontend source
COPY frontend ./frontend

# Build frontend
WORKDIR /app/frontend
RUN pnpm run build

# Runtime Stage
FROM node:22.20.0-slim
RUN corepack enable
WORKDIR /app

# Copy monorepo structure
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json ./frontend/

# Install production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy built frontend from builder
COPY --from=builder /app/frontend/dist ./frontend/dist

# Use the built files
WORKDIR /app/frontend

EXPOSE 8080
CMD ["node", "dist/server/entry.mjs"]

