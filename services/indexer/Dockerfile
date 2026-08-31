FROM node:20-alpine
WORKDIR /app
COPY services/indexer/package.json ./
RUN npm install
COPY services/indexer ./
RUN npm run build
ENV INDEXER_PORT=8788
EXPOSE 8788
CMD ["node", "dist/index.js"]
