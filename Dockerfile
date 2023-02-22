FROM node:16.9.0

WORKDIR /usr/app/gsw

COPY . .

RUN npm install \
 && npm install -g typescript
 
RUN npm run build
RUN chmod 644 ./data

CMD ["npm", "start"]
