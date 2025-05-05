# Etapa 1: Build da aplicação
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN chmod -R +x node_modules/.bin && npx vite build

# Etapa 2: Rodar a aplicação
FROM node:18-alpine
WORKDIR /app

# ⬇️ Instala o serve globalmente
RUN npm install -g serve

# copia o conteúdo da dist para a raiz
COPY --from=builder /app/dist ./ 

EXPOSE 3200
CMD ["serve", "-s", ".", "-l", "3200"]