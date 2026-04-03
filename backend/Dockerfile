FROM node:20-alpine
WORKDIR /app

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
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node src/server.js"]
