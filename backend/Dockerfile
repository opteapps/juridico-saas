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

EXPOSE 3001

# Aplica migrações e inicia o servidor
CMD ["sh", "-c", "npx prisma db push --accept-data-loss 2>&1 && echo '=== STARTING SERVER ===' && node src/server.js 2>&1"]