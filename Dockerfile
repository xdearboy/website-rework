FROM oven/bun:latest AS builder
WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --no-save

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

RUN mkdir -p /app/public/thumbs

CMD ["sh", "-c", "bun run src/server/index.ts & nginx -g 'daemon off;'"]
