FROM node:22-slim
RUN corepack enable
WORKDIR /app
COPY package.json ./
RUN pnpm install --prod
COPY . .
EXPOSE 3001
CMD [ "node", "src/server.js" ]
