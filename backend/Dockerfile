FROM node:22-slim
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
WORKDIR /app/backend
EXPOSE 3001
CMD [ "node", "src/server.js" ]
