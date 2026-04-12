# Monorepo backend image — build from repository root so Railway (root context) always gets backend/dist.
FROM node:22-alpine

WORKDIR /app

COPY package.json yarn.lock ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

RUN corepack enable && yarn install --frozen-lockfile

COPY backend ./backend
COPY data ./data
RUN yarn workspace backend build

ENV NODE_ENV=production

CMD ["node", "backend/dist/main.js"]
