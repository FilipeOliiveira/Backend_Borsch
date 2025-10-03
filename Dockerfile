# Usa uma imagem oficial do Node.js como base. A tag 'alpine' é uma versão leve.
FROM node:18-alpine

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia os arquivos package.json e package-lock.json para o diretório de trabalho
# O '*' garante que ambos os arquivos sejam copiados
COPY package*.json ./

# Instala as dependências da aplicação
RUN npm install

# Copia o restante dos arquivos do projeto para o diretório de trabalho
COPY . .

# Expõe a porta 3000 para que possamos nos conectar a ela de fora do container
EXPOSE 3000

# Define o comando que será executado quando o container iniciar
CMD ["node", "src/api.js"]
