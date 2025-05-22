FROM node:18-alpine

WORKDIR /app

# Limpiar instalación previa
RUN rm -rf node_modules package-lock.json

# Instalar dependencias
COPY package.json ./
RUN npm install

# Copiar el resto del código
COPY . .

# Exponer el puerto para desarrollo
EXPOSE 3000

# Comando por defecto (desarrollo)
CMD ["npm", "run", "dev"] 