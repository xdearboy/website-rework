FROM oven/bun:latest AS builder
WORKDIR /app

ARG VITE_GALLERY_BASE_URL
ARG GIT_COMMIT_HASH=dev
ENV VITE_GALLERY_BASE_URL=${VITE_GALLERY_BASE_URL}
ENV GIT_COMMIT_HASH=${GIT_COMMIT_HASH}

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

COPY . .

RUN bun run build
RUN bun build src/server/index.ts --target=node --outfile=server.js

FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/server.js /app/server.js

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80 3000

CMD ["sh", "-c", "node server.js & nginx -g 'daemon off;'"]
