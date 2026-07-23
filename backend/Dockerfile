FROM node:22-slim
RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY . .

EXPOSE 3001
CMD ["node", "src/server.js"]

