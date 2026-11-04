FROM node:24-alpine
WORKDIR /app
COPY engine.mjs server.mjs ./
ENV NODE_ENV=production
ENV DATA_DIR=/data
RUN mkdir -p /data && chown node:node /data
USER node
CMD ["node", "server.mjs"]
