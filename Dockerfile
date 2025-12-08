FROM node:22-alpine

WORKDIR /app

# Copiar package.json y package-lock.json primero para aprovechar el cache de Docker
COPY package.json package-lock.json* ./

# Instalar dependencias usando npm ci (más rápido y determinista)
# Si package-lock.json no existe, npm ci fallará y usaremos npm install
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Copiar el resto del código
COPY . .

# Exponer el puerto para desarrollo
EXPOSE 3000

# Comando por defecto (desarrollo)
CMD ["npm", "run", "dev"] 