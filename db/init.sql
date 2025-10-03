-- Tabela de Produtos
CREATE TABLE produtos (
    id INTEGER PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    valor_unitario DECIMAL(10, 2) NOT NULL
);

-- Tabela de Clientes
CREATE TABLE clientes (
    id INTEGER PRIMARY KEY,
    nome VARCHAR(255) NOT NULL
);

-- Tabela de Vendas
CREATE TABLE vendas (
    id SERIAL PRIMARY KEY,
    produto_id INTEGER REFERENCES produtos(id),
    cliente_id INTEGER REFERENCES clientes(id),
    quantidade INTEGER NOT NULL,
    data_venda DATE NOT NULL
);
