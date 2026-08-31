FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
COPY packages/schema/package.json ./packages/schema/
COPY services/coordinator/package.json ./services/coordinator/
RUN npm install --workspace=@zcashorg/coordinator --workspace=@zcashorg/schema
COPY packages/schema ./packages/schema
COPY services/coordinator ./services/coordinator
RUN npm run build -w @zcashorg/schema && npm run build -w @zcashorg/coordinator

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/schema ./packages/schema
COPY --from=build /app/services/coordinator ./services/coordinator
COPY package.json ./
ENV DATABASE_URL=postgres://zcashorg:zcashorg@postgres:5432/zcashorg
ENV PORT=8787
EXPOSE 8787
CMD ["node", "services/coordinator/dist/index.js"]
