# Backend - Sistema de Importação e Visualização de Vendas (SQLite)

Este projeto contém o backend para o Sistema de Importação e Visualização de Vendas. Ele é composto por um script de importação de dados de um arquivo de layout fixo (`.dat`) e uma API RESTful para servir esses dados, utilizando **SQLite** como banco de dados, o que elimina a necessidade de um servidor de banco de dados externo.

## Requisitos

- [Node.js](https://nodejs.org/) (versão 14 ou superior)

## 1. Configuração do Ambiente

No diretório raiz do projeto, siga os passos abaixo.

### 1.1. Instalar Dependências

Execute o comando para instalar as bibliotecas necessárias (`express`, `sqlite3`, `cors`, `dotenv`):

```bash
npm install
```

### 1.2. Configurar Variáveis de Ambiente

Crie uma cópia do arquivo `.env.example` e renomeie-a para `.env`. O conteúdo padrão já aponta para um arquivo de banco de dados `sales.db` que será criado na raiz do projeto.

```bash
# .env
# Caminho do arquivo de banco de dados SQLite
DB_FILE=sales.db

# Porta do servidor da API
API_PORT=3000
```

## 2. Executando a Aplicação

O processo foi simplificado ao máximo.

### 2.1. Criar e Popular o Banco de Dados

Para criar o banco de dados, as tabelas e importar os dados de uma só vez, execute o script de importação. Um arquivo de dados de exemplo já está incluído.

**Este comando fará tudo automaticamente:**
1.  Criará o arquivo `sales.db` (se não existir).
2.  Executará o script `db/init.sql` para criar as tabelas.
3.  Lerá o arquivo `.dat` e inserirá os dados no banco.

```bash
npm run import -- data/vendas_dia_2025-10-01.dat
```

### 2.2. Iniciar a API

Após a importação, inicie o servidor da API com o comando:

```bash
npm start
```

O servidor estará disponível em `http://localhost:3000`.

## 3. Testando a API

Com o servidor rodando, acesse o endpoint `GET /vendas` com um navegador ou `curl`.

```bash
curl http://localhost:3000/vendas
```

A resposta esperada será um JSON com a lista de vendas, similar ao exemplo abaixo:

```json
[
  {
    "id_venda": 1,
    "data_venda": "2025-10-01",
    "quantidade": 2,
    "produto": {
      "id": 1001,
      "nome": "Teclado Mecanico Gamer",
      "valor_unitario": 350.75
    },
    "cliente": {
      "id": 201,
      "nome": "Ana Silva"
    },
    "valor_total_venda": 701.5
  }
]
```