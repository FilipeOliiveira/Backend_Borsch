require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const port = process.env.API_PORT || 3000;

// Lógica de configuração do banco de dados para suportar tanto o ambiente local (Docker) quanto a nuvem (Render)
const dbConfig = process.env.DATABASE_URL ? 
  // Configuração para Nuvem (Render, Heroku, etc.)
  {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Necessário para a maioria das conexões de DB em nuvem
    }
  } : 
  // Configuração para Ambiente Local (Docker)
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  };

const pool = new Pool(dbConfig);

// Testa a conexão com o banco de dados
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('ERRO: Não foi possível conectar ao banco de dados PostgreSQL.', err.stack);
    console.error('Verifique se o servidor PostgreSQL está rodando e se as variáveis no arquivo .env estão corretas.');
    process.exit(1);
  } else {
    console.log('Conectado ao banco de dados PostgreSQL com sucesso.');
  }
});

// Middlewares
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos do front-end
app.use(express.static(path.join(__dirname, '..', 'front-end')));

// Endpoint principal para obter todas as vendas
app.get('/vendas', async (req, res) => {
  const query = `
    SELECT
      v.id AS id_venda,
      v.data_venda,
      v.quantidade,
      p.id AS produto_id,
      p.nome AS produto_nome,
      p.valor_unitario,
      c.id AS cliente_id,
      c.nome AS cliente_nome,
      (v.quantidade * p.valor_unitario) AS valor_total_venda
    FROM vendas v
    JOIN produtos p ON v.produto_id = p.id
    JOIN clientes c ON v.cliente_id = c.id
    ORDER BY v.id;
  `;

  try {
    const { rows } = await pool.query(query);

    // Formata a resposta para o formato JSON desejado
    const result = rows.map(row => ({
      id_venda: row.id_venda,
      data_venda: new Date(row.data_venda).toISOString().split('T')[0], // Formata a data para AAAA-MM-DD
      quantidade: row.quantidade,
      produto: {
        id: row.produto_id,
        nome: row.produto_nome,
        valor_unitario: parseFloat(row.valor_unitario)
      },
      cliente: {
        id: row.cliente_id,
        nome: row.cliente_nome
      },
      valor_total_venda: parseFloat(parseFloat(row.valor_total_venda).toFixed(2))
    }));

    res.json(result);
  } catch (err) {
    console.error('Erro ao buscar vendas:', err.stack);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.listen(port, () => {
  console.log(`Servidor da API rodando em http://localhost:${port}`);
});

// Fecha o pool de conexões quando a aplicação é encerrada
process.on('SIGINT', async () => {
  console.log('Fechando pool de conexões do PostgreSQL...');
  await pool.end();
  console.log('Pool de conexões fechado. Encerrando aplicação.');
  process.exit(0);
});
