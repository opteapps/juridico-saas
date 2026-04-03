FROM node:20-alpine
WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Instala dependências (cache otimizado)
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Gera o Prisma Client
RUN npx prisma generate

# Copia o restante do código
COPY . .

# Create entrypoint script
RUN echo '#!/bin/sh' > /entrypoint.sh && \
    echo 'npx prisma db push --accept-data-loss' >> /entrypoint.sh && \
    echo 'exec node src/server.js' >> /entrypoint.sh && \
    chmod +x /entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["/entrypoint.sh"]