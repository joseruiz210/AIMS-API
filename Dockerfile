# Imagen base oficial de Node.js 20 sobre Alpine Linux
FROM node:20-alpine

# Directorio de trabajo del contenedor
WORKDIR /app

# Copiar manifiestos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el esquema de Prisma y generar los tipos del cliente
COPY prisma ./prisma/
RUN npx prisma generate

# Copiar el resto del código del backend
COPY . .

# Exponer el puerto 3000 donde corre la API REST
EXPOSE 3000

# Comando por defecto para iniciar el servidor Node
CMD ["node", "src/server.js"]
