FROM node:18 as builder

RUN mkdir /app
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install 

COPY . .
RUN npm run build && rm -rf node_modules

#######################################################################

FROM node:18
LABEL fly_launch_runtime="nodejs"

WORKDIR /app
ENV NODE_ENV production

COPY --from=builder /app /app
RUN npm install

CMD [ "npm", "run", "start" ]
