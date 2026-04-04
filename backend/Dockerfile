FROM node:20-alpine
WORKDIR /app

# Build cache buster - alterar para forçar rebuild
ARG BUILD_DATE=2026-04-04
ARG BUILD_COMMIT=4b9b281

# Instala OpenSSL (necessário para Prisma)
RUN apk add --no-cache openssl

# Instala dependências (cache otimizado)
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Gera o Prisma Client
RUN npx prisma generate

# Copia o restante do código
COPY . .

# Exibe info do build
RUN echo "Build: $BUILD_DATE - $BUILD_COMMIT"

EXPOSE 3001

# Inicia o servidor
CMD ["node", "src/server.js"]
