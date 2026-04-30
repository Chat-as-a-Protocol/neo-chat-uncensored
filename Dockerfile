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
# Instalamos o serve localmente para garantir que esteja no PATH
RUN npm install -g serve
COPY --from=builder /app/dist ./dist

EXPOSE 8080
# Usamos o formato JSON para o CMD e garantimos o uso da variável $PORT do Railway
CMD ["sh", "-c", "serve dist -l tcp://0.0.0.0:${PORT:-3000}"]
