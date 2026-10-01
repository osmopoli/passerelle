# --- Build : front React (-> server/public) puis serveur AdonisJS (-> server/build)
FROM node:22-alpine AS build
WORKDIR /app
COPY client/package.json client/package-lock.json client/
COPY server/package.json server/package-lock.json server/
RUN npm ci --prefix client && npm ci --prefix server
COPY client client
COPY server server
RUN npm run build --prefix client && npm run build --prefix server

# --- Runtime : uniquement le build de production
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3333 \
    TZ=UTC \
    LOG_LEVEL=info
COPY --from=build /app/server/build ./
RUN npm ci --omit=dev
EXPOSE 3333
# APP_KEY et DB_* sont fournis à l'exécution (variables d'environnement).
CMD ["sh", "-c", "node ace migration:run --force && node bin/server.js"]
