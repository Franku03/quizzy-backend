# Etapa 1: Instalar dependencias
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Etapa 2: Compilar la app
FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build

# Etapa 3: Imagen final para producción
FROM node:20-slim AS runner
WORKDIR /usr/src/app
COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile
COPY --from=builder /app/dist ./dist

RUN chmod +x /usr/src/app \
    && chmod g+w /usr/src/app

EXPOSE 3000
CMD ["node", "-r", "dotenv/config", "dist/main"]
