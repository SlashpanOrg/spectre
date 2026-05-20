FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine

RUN apk add --no-cache git

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

RUN addgroup -g 1001 -S nodejs && \
    adduser -S spectre -u 1001 -G nodejs && \
    mkdir -p /home/spectre/.spectre && \
    chown -R spectre:nodejs /home/spectre /app

USER spectre

ENV HOME=/home/spectre

ENTRYPOINT ["node", "dist/index.js"]
CMD []
