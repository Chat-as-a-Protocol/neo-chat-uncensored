# Build Stage
FROM node:22-slim AS builder
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm run build

# Runtime Stage
FROM node:22-slim
RUN corepack enable
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
# Precisamos do pnpm para o comando serve
RUN pnpm install -g serve

EXPOSE 8080
CMD serve dist -l $PORT
