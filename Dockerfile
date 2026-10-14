FROM node:22-alpine

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY api ./api
COPY public ./public
COPY container ./container

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "container/server.mjs"]
