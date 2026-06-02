# Next.js 16 + Prisma 5 — imatge per a Dokploy
FROM node:20-slim

WORKDIR /app

# Prisma necessita openssl
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Dependències (capa cacheable)
COPY package*.json ./
RUN npm ci

# Codi i build
COPY . .
RUN npx prisma generate
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
EXPOSE 3000

# A l'arrencar: aplica migracions pendents i engega l'app
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start -- -H 0.0.0.0 -p 3000"]
