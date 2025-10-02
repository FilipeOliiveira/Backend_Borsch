require('dotenv').config();

// Valida a existência da variável de ambiente DB_FILE
if (!process.env.DB_FILE) {
    console.error("ERRO: A variável de ambiente DB_FILE não está definida.");
    console.error("Por favor, crie um arquivo .env (copiando de .env.example) e defina a variável DB_FILE.");
    process.exit(1);
}

const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = process.env.API_PORT || 3000;

// Conecta ao banco de dados SQLite em modo de leitura
const db = new sqlite3.Database(process.env.DB_FILE, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error(`Erro ao abrir o banco de dados: ${err.message}`);
    console.error('Certifique-se de que o banco de dados foi criado e populado executando o script de importação primeiro.');
    process.exit(1);
  }
  console.log('Conectado ao banco de dados SQLite para consulta.');
});

// Middlewares
app.use(cors());
app.use(express.json());

// Endpoint principal para obter todas as vendas
app.get('/vendas', (req, res) => {
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

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Erro ao buscar vendas:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
      return;
    }

    // Formata a resposta para o formato JSON desejado
    const result = rows.map(row => ({
      id_venda: row.id_venda,
      data_venda: row.data_venda, // SQLite já retorna no formato AAAA-MM-DD
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
      valor_total_venda: parseFloat(row.valor_total_venda.toFixed(2))
    }));

    res.json(result);
  });
});

app.listen(port, () => {
  console.log(`Servidor da API rodando em http://localhost:${port}`);
});

// Fecha a conexão com o banco de dados quando a aplicação é encerrada
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Conexão com o banco de dados fechada.');
    process.exit(0);
  });
});