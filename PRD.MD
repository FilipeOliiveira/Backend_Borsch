PRD do Backend: Sistema de Importação e Visualização de Vendas
1. Introdução e Objetivo

Este documento descreve os requisitos técnicos para o desenvolvimento dos componentes de backend do "Sistema de Importação e Visualização de Vendas". O objetivo do backend é fornecer uma solução robusta para processar um arquivo de texto de vendas (

.dat) gerado por um sistema legado , armazenar esses dados de forma estruturada em um banco de dados e expô-los através de uma API RESTful para aplicações cliente.


2. Arquitetura do Backend

A solução de backend será composta por 3 partes principais que se integram para formar o fluxo de dados:


Leitor de Arquivo (Processador Batch): Um script em Node.js para ler e processar o arquivo de vendas.


Banco de Dados: Uma instância PostgreSQL para o armazenamento persistente e organizado dos dados.



API RESTful: Uma aplicação em Node.js que serve como interface de comunicação para acessar os dados do banco.

O fluxo de dados para o backend é: 

Arquivo .dat -> [Leitor de Arquivo] -> [Banco de Dados] <- [API].

3. Requisitos Técnicos Detalhados

3.1 Leitor de Arquivo (Processador Batch - Node.js)

Objetivo: Ler o arquivo de texto com largura fixa, interpretar seus dados e inseri-los de forma estruturada no banco de dados.


Fonte de Dados: O arquivo vendas_dia_AAAA-MM-DD.dat , que possui um layout de largura fixa.


Layout do Arquivo de Entrada: Cada linha do arquivo deve ser parseada de acordo com a seguinte especificação:

Campo	Posição Inicial	Posição Final	Tamanho	Tipo	Descrição
ID_PRODUTO	1	4	4	Numérico	
Identificador único do produto 

NOME_PRODUTO	5	54	50	Texto	
Nome do produto 

ID_CLIENTE	55	58	4	Numérico	
Identificador único do cliente 

NOME_CLIENTE	59	108	50	Texto	
Nome do cliente 

QTD_VENDIDA	109	111	3	Numérico	
Quantidade de itens vendidos 

VALOR_UNIT	112	121	10	Numérico (Decimal)	
Preço de uma unidade do produto 

DATA VENDA	122	131	10	Data (AAAA-MM-DD)	
Data da transação 


Exportar para as Planilhas
Lógica de Processamento:

O leitor deve ser "inteligente". Ao processar cada linha (venda), ele deve verificar a existência do produto e do cliente no banco de dados.

Se um produto (

ID_PRODUTO) ou cliente (ID_CLIENTE) não existir nas tabelas correspondentes, o script deve primeiro criá-lo.

Se já existirem, o script deve apenas registrar a nova venda, associando-a aos IDs existentes.

Tecnologias e Bibliotecas (Node.js):

Node.js: Ambiente de execução.

fs (File System): Módulo nativo para a leitura do arquivo .dat.

pg: Biblioteca para a comunicação com o banco de dados PostgreSQL.

dotenv: Biblioteca para gerenciar variáveis de ambiente (ex: credenciais do banco de dados).

3.2 Banco de Dados (PostgreSQL)

Objetivo: Armazenar as informações de vendas, clientes e produtos de forma organizada para evitar redundância.



Tecnologia: PostgreSQL.


Modelagem de Dados: O banco de dados relacional terá 3 tabelas.

Tabela: produtos

SQL:

SQL

CREATE TABLE produtos (
    id INTEGER PRIMARY KEY, -- ID único do produto (do arquivo) [cite: 29]
    nome VARCHAR(255) NOT NULL, -- Nome do produto [cite: 29]
    valor_unitario DECIMAL(10, 2) NOT NULL -- Preço unitário atual do produto [cite: 29]
);
Tabela: clientes

SQL:

SQL

CREATE TABLE clientes (
    id INTEGER PRIMARY KEY, -- ID único do cliente (do arquivo) [cite: 35, 36, 37, 38]
    nome VARCHAR(255) NOT NULL -- Nome do cliente [cite: 39, 40, 41]
);
Tabela: vendas

SQL:

SQL

CREATE TABLE vendas (
    id SERIAL PRIMARY KEY, -- ID único da transação de venda [cite: 43]
    produto_id INTEGER REFERENCES produtos(id), -- Chave estrangeira para a tabela produtos [cite: 43]
    cliente_id INTEGER REFERENCES clientes(id), -- Chave estrangeira para a tabela clientes [cite: 44]
    quantidade INTEGER NOT NULL, -- Quantidade de itens vendidos [cite: 44]
    data_venda DATE NOT NULL -- Data em que a venda ocorreu [cite: 44]
);
3.3 API RESTful (Node.js)

Objetivo: Servir como uma ponte entre o banco de dados e o frontend , fornecendo os dados de forma segura e padronizada em JSON.



Tecnologia: Node.js com o framework Express.js.


Endpoint Principal: A API deve ter pelo menos um endpoint principal.


Endpoint: GET /vendas 


Descrição: Retorna uma lista de todas as vendas, combinando informações das três tabelas (vendas, produtos, clientes).


Formato da Resposta: JSON.

Estrutura da Resposta: A resposta deve ser um array de objetos, onde cada objeto representa uma venda e inclui dados aninhados do produto e do cliente, além de um campo calculado valor_total_venda (quantidade * valor_unitario).

JSON

[
  {
    "id_venda": 1, // [cite: 56]
    "data_venda": "2025-09-29", // [cite: 57]
    "quantidade": 2, // [cite: 58]
    "produto": {
      "id": 1001, // [cite: 61]
      "nome": "Teclado Mecânico Gamer", // [cite: 62]
      "valor_unitario": 350.75 // [cite: 63]
    },
    "cliente": {
      "id": 201, // [cite: 66]
      "nome": "Ana Silva" // [cite: 67]
    },
    "valor_total_venda": 701.50 // [cite: 68]
  }
]
Tecnologias e Bibliotecas (Node.js):

Express.js: Framework web para criar a API e gerenciar as rotas.

pg: Biblioteca para executar as consultas SQL no banco PostgreSQL.

cors: Middleware para habilitar o acesso à API a partir de diferentes origens (necessário para o frontend).

dotenv: Para gerenciar variáveis de ambiente, como a porta do servidor e as credenciais do banco de dados.