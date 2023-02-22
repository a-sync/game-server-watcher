FROM node:16

WORKDIR /usr/app/gsw

COPY package.json .
COPY tsconfig.json .

RUN npm install \
 && npm install -g typescript \
 && npm install -g ts-node

COPY . .
RUN chmod 644 ./data

CMD ["ts-node", "./src/server.ts"]
