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

O container do banco de dados foi iniciado, mas ele está vazio. Vamos criar as tabelas usando um método direto e à prova de erros.

1.  **Execute o comando abaixo** no seu terminal para entrar no ambiente de linha de comando do banco de dados:
    ```sh
    docker-compose exec db psql -U postgres
    ```

2.  Seu prompt de comando mudará para `postgres=#`. Isso confirma que você está dentro do banco de dados correto.

3.  **Copie todo o bloco de código SQL abaixo**:
    ```sql
    CREATE TABLE clientes (id SERIAL PRIMARY KEY, nome VARCHAR(255) NOT NULL);
    CREATE TABLE produtos (id SERIAL PRIMARY KEY, nome VARCHAR(255) NOT NULL, valor_unitario NUMERIC(10, 2) NOT NULL);
    CREATE TABLE vendas (id SERIAL PRIMARY KEY, data_venda DATE NOT NULL, quantidade INTEGER NOT NULL, produto_id INTEGER NOT NULL REFERENCES produtos(id), cliente_id INTEGER NOT NULL REFERENCES clientes(id));
    ```

4.  **Cole o bloco no terminal** (onde está o prompt `postgres=#`) e pressione **Enter**. As tabelas serão criadas.

5.  Para sair do ambiente do banco de dados, digite `\q` e pressione **Enter**. Você voltará ao seu terminal normal.

---

### **Como Usar a Aplicação**

*   **Para importar os dados do arquivo `.dat`**, execute no seu terminal (na pasta do projeto):
    ```sh
    docker-compose exec backend node src/importador.js data/vendas_dia_2025-10-01.dat
    ```

*   **Para acessar a aplicação**, abra seu navegador e vá para:
    [http://localhost:3000](http://localhost:3000)
