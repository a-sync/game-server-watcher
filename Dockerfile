# syntax = docker/dockerfile:1

##########
FROM node:20 as base
LABEL fly_launch_runtime="Node.js"

WORKDIR /app
ENV NODE_ENV="production"

##########
FROM base as builder

COPY --link package.json package-lock.json ./
RUN npm ci --include=dev

COPY --link . .
RUN npm run build

RUN rm -rf node_modules

##########
FROM base

COPY --from=builder /app /app
RUN npm ci --omit=dev

EXPOSE 8080
CMD [ "npm", "run", "start" ]
