FROM node:22-slim
RUN corepack enable
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY shared ./shared
COPY backend ./backend

RUN pnpm install --prod --frozen-lockfile

EXPOSE 3001
WORKDIR /app/backend
CMD ["node", "src/server.js"]
