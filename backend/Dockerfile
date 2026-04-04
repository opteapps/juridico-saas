FROM node:20-alpine
WORKDIR /app

# Build cache buster - alterar para forçar rebuild
# Cache invalidation: 2026-04-04-001
ARG CACHE_BUSTER=2026-04-04-001
RUN echo "Cache bust: $CACHE_BUSTER"

# Instala OpenSSL (necessário para Prisma)
RUN apk add --no-cache openssl

# Instala dependências (cache otimizado)
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Gera o Prisma Client
RUN npx prisma generate

# Copia o restante do código - esta camada muda sempre
COPY . .

EXPOSE 3001

# Inicia o servidor
CMD ["node", "src/server.js"]
