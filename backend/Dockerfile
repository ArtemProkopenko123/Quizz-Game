FROM node:22-alpine

WORKDIR /app

COPY package.json yarn.lock ./
RUN corepack enable && yarn install --frozen-lockfile

COPY . .
RUN yarn build

ENV NODE_ENV=production

CMD ["node", "dist/main.js"]
