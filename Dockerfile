FROM node:22-alpine AS builder

WORKDIR /build

COPY package*.json tsconfig*.json nest-cli.json ./
RUN yarn install --frozen-lockfile

COPY libs libs
COPY apps apps
RUN yarn run build

# ---

FROM node:22-alpine

USER node
WORKDIR /app

COPY --from=builder --chown=node:node /build/package*.json ./
COPY --from=builder --chown=node:node /build/node_modules/ ./node_modules/
COPY --from=builder --chown=node:node /build/dist/ ./dist/

CMD ["yarn", "run", "start:api:prod"]
