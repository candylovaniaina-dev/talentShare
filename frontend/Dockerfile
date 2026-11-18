
FROM node:22-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 443
EXPOSE 5173
CMD ["npm", "run", "dev:docker"]
