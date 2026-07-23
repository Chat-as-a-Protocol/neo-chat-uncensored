FROM node:22-slim
RUN corepack enable
WORKDIR /app

COPY package.json ./
RUN pnpm install --prod --no-frozen-lockfile

# Selective copy for lean production image
COPY src ./src
COPY schema.sql ./
COPY shared ./shared

EXPOSE 3001
CMD ["node", "src/server.js"]
