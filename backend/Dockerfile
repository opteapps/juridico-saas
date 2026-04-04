FROM node:20-alpine
WORKDIR /app

# Build cache buster - alterar para forçar rebuild
# Cache invalidation: 2026-04-04-002
ARG CACHE_BUSTER=2026-04-04-002
RUN echo "Cache bust: $CACHE_BUSTER"

# Instala OpenSSL (necessário para Prisma)
RUN apk add --no-cache openssl

# Copia arquivos de configuração
COPY package*.json ./
COPY prisma ./prisma/

# Instala dependências
RUN npm ci

# Gera o Prisma Client (sempre gerar no build)
RUN npx prisma generate

# Copia o restante do código
COPY . .

# Gera novamente para garantir
RUN npx prisma generate

EXPOSE 3001

# Inicia o servidor
CMD ["sh", "-c", "npx prisma generate && npx prisma db push --accept-data-loss --skip-generate && node src/server.js"]
