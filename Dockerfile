FROM node:18-alpine

WORKDIR /app

# Instalar dependencias
COPY package.json package-lock.json ./
RUN npm ci

# Copiar el resto del código
COPY . .

# Exponer el puerto para desarrollo
EXPOSE 3000

# Comando por defecto (desarrollo)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"] 