# Guia de Deploy da Aplicação com Docker

Este guia detalha os passos para executar esta aplicação em qualquer máquina que tenha o Docker instalado.

---

### **Pré-requisitos**

*   **Docker Desktop**: É a única dependência necessária. Certifique-se de que ele esteja instalado e em execução na nova máquina.

---

### **Passo a Passo da Configuração Inicial**

#### **1. Copie o Projeto**

Copie toda a pasta deste projeto para a nova máquina.

#### **2. Configure o Arquivo de Ambiente (`.env`)**

Dentro da pasta do projeto, crie um arquivo chamado `.env`. Este arquivo conterá as senhas e configurações da aplicação.

**Atenção:** A configuração mais importante é a `DB_HOST`. Como a aplicação (backend) e o banco de dados (db) rodarão em containers diferentes gerenciados pelo Docker Compose, o endereço do banco de dados deve ser o nome do serviço, que é `db`.

Copie e cole o seguinte conteúdo no seu arquivo `.env`:

```
# Porta da API
API_PORT=3000

# Configurações do Banco de Dados PostgreSQL
# ATENÇÃO: DB_HOST deve ser 'db' para a comunicação entre containers
DB_HOST=db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=mysecretpassword
DB_DATABASE=postgres
```

#### **3. Inicie a Aplicação com Docker Compose**

Abra um terminal (PowerShell, CMD, etc.) e, usando o comando `cd`, navegue para a pasta raiz deste projeto (a mesma pasta que contém o arquivo `docker-compose.yml`).

Execute os seguintes comandos:

1.  **Construa a imagem da aplicação:**
    ```sh
    docker-compose build
    ```
    *(Este comando lê o `Dockerfile` e cria a imagem da sua aplicação. Pode demorar alguns minutos na primeira vez).* 

2.  **Inicie os containers da aplicação e do banco de dados:**
    ```sh
    docker-compose up -d
    ```
    *(Este comando inicia tudo em segundo plano. Para verificar se os containers subiram, você pode usar o comando `docker ps`).*

#### **4. Configure o Banco de Dados (Executar apenas uma vez)**

O container do banco de dados foi iniciado, mas ele está vazio. Precisamos criar as tabelas.

1.  **Conecte-se ao Banco de Dados:**
    *   Use seu programa preferido (DBeaver, pgAdmin, etc.) para se conectar ao banco de dados.
    *   **Importante:** Ao configurar a conexão no seu programa, use `localhost` como host, pois o programa está na sua máquina (host) se conectando à porta que o Docker expõe.
    *   **Dados de Conexão:**
        *   Host: `localhost`
        *   Porta: `5432`
        *   Base de Dados: `postgres`
        *   Usuário: `postgres`
        *   Senha: `mysecretpassword` (a mesma do seu arquivo `.env`)

2.  **Execute o Script de Criação de Tabelas:**
    *   Após conectar, abra uma nova janela de script/query.
    *   Copie e cole o código SQL abaixo e execute-o para criar as tabelas.

```sql
-- Tabela de Clientes
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL
);

-- Tabela de Produtos
CREATE TABLE produtos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    valor_unitario NUMERIC(10, 2) NOT NULL
);

-- Tabela de Vendas
CREATE TABLE vendas (
    id SERIAL PRIMARY KEY,
    data_venda DATE NOT NULL,
    quantidade INTEGER NOT NULL,
    produto_id INTEGER NOT NULL REFERENCES produtos(id),
    cliente_id INTEGER NOT NULL REFERENCES clientes(id)
);
```

---

### **Como Usar a Aplicação**

*   **Para importar os dados do arquivo `.dat`**, execute no seu terminal (na pasta do projeto):
    ```sh
    docker-compose exec backend node src/importador.js data/vendas_dia_2025-10-01.dat
    ```

*   **Para acessar a aplicação**, abra seu navegador e vá para:
    [http://localhost:3000](http://localhost:3000)
