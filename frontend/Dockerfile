# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Cache buster
ARG CACHE_BUSTER=2026-04-04-007
RUN echo "Cache bust: $CACHE_BUSTER"

COPY package*.json ./
RUN npm ci

COPY . .

# Build com a URL da API injetada via variável de ambiente
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Stage 2: Serve com nginx
FROM nginx:alpine

# Remove configurações padrão
RUN rm -f /etc/nginx/conf.d/*

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh

RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]