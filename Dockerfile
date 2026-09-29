# Node 24 est requis pour node:sqlite.
FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3001 \
    DATABASE_PATH=/app/data/challenge.sqlite
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY --from=build /app/shared ./shared
# data/ contient la base SQLite et les images importées : à monter en volume.
RUN mkdir -p data/uploads && chown -R node:node /app/data
USER node
EXPOSE 3001
COPY --chown=node:node healthcheck.mjs ./
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD ["node", "healthcheck.mjs"]
CMD ["node", "server/index.mjs"]
