FROM node:latest

WORKDIR /app

COPY package*.json ./

RUN npm install -g npm@latest && \ 
    npm install && \
    npx update-browserslist-db@latest

COPY . .

EXPOSE 5000

CMD ["npm", "run", "dev" ]

