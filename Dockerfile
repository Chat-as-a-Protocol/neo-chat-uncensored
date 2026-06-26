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
WORKDIR /app

# Copiamos apenas o necessário para instalar dependências de produção
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile

# Copiamos o build
COPY --from=builder /app/dist ./dist

EXPOSE 8080
# Usamos o node para rodar o servidor SSR gerado pelo Astro
CMD ["node", "dist/server/entry.mjs"]
