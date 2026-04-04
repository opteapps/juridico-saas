FROM node:20-alpine
WORKDIR /app

# Build cache buster - alterar para forçar rebuild
COPY .buildinfo /tmp/buildinfo
RUN cat /tmp/buildinfo

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

EXPOSE 3001

# Inicia o servidor
CMD ["node", "src/server.js"]
