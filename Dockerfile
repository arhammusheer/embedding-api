FROM node:16-alpine

WORKDIR /usr/src/app

COPY package.json .
COPY . .

RUN npm install

RUN npx prisma generate

RUN npm run build

EXPOSE 8080

EXPOSE 3000

CMD ["npm", "run", "start"]