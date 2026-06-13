FROM oven/bun:latest AS builder
WORKDIR /app

ARG VITE_GALLERY_BASE_URL
ENV VITE_GALLERY_BASE_URL=${VITE_GALLERY_BASE_URL}

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

COPY . .

RUN bun run build

FROM oven/bun:latest

WORKDIR /app

RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/src /app/src
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/node_modules /app/node_modules

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80 3000

CMD ["sh", "-c", "bun run src/server/index.ts & nginx -g 'daemon off;'"]
