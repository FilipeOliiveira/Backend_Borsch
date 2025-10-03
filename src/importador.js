require('dotenv').config();
const fs = require('fs');
const { Pool } = require('pg');

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

function parseLine(line) {
  const idProduto = parseInt(line.substring(0, 4).trim(), 10);
  const nomeProduto = line.substring(4, 49).trim();
  const idCliente = parseInt(line.substring(50, 55).trim(), 10);
  const nomeCliente = line.substring(55, 107).trim();
  const qtdVendida = parseInt(line.substring(108, 110).trim(), 10);
  const valorUnitStr = line.substring(111, 119).trim();
  const valorUnitario = parseFloat(valorUnitStr.slice(0, -2) + '.' + valorUnitStr.slice(-2));

  // Correção final e definitiva para o formato da data
  let dataVenda = line.substring(121, 131).trim();
  if (dataVenda.startsWith('025')) {
    dataVenda = dataVenda.replace('025', '2025');
  } else if (dataVenda.startsWith('25')) {
    dataVenda = dataVenda.replace('25', '2025');
  }

  return { idProduto, nomeProduto, idCliente, nomeCliente, qtdVendida, valorUnitario, dataVenda };
}

async function importData() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('ERRO: Forneça o caminho do arquivo .dat como argumento.');
    process.exit(1);
  }

  const client = await pool.connect();
  console.log(`Iniciando importação do arquivo: ${filePath}`);

  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');

    await client.query('BEGIN');

    const produtoQuery = 'INSERT INTO produtos (id, nome, valor_unitario) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, valor_unitario = EXCLUDED.valor_unitario';
    const clienteQuery = 'INSERT INTO clientes (id, nome) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome';
    const vendaQuery = 'INSERT INTO vendas (produto_id, cliente_id, quantidade, data_venda) VALUES ($1, $2, $3, $4)';

    for (const line of lines) {
      const venda = parseLine(line);
      await client.query(produtoQuery, [venda.idProduto, venda.nomeProduto, venda.valorUnitario]);
      await client.query(clienteQuery, [venda.idCliente, venda.nomeCliente]);
      await client.query(vendaQuery, [venda.idProduto, venda.idCliente, venda.qtdVendida, venda.dataVenda]);
    }

    await client.query('COMMIT');
    console.log(`Importação de ${lines.length} registros concluída com sucesso!`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro durante a importação. A transação foi desfeita (ROLLBACK).', error);
    process.exit(1);

  } finally {
    client.release();
  }
}

importData()
  .then(() => {
    console.log('Processo finalizado. Fechando pool de conexões.');
    pool.end();
  })
  .catch(() => {
    console.error('Processo encontrou um erro fatal. Fechando pool de conexões.');
    pool.end();
    process.exit(1);
  });
