require('dotenv').config();
const fs = require('fs');
const { Pool } = require('pg');

// Configuração do Pool de Conexões do PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

// 1. Função para parsear uma linha do arquivo de dados (sem alterações)
function parseLine(line) {
  const idProduto = parseInt(line.substring(0, 4).trim(), 10);
  const nomeProduto = line.substring(4, 49).trim();
  const idCliente = parseInt(line.substring(50, 55).trim(), 10);
  const nomeCliente = line.substring(55, 107).trim();
  const qtdVendida = parseInt(line.substring(108, 110).trim(), 10);
  const valorUnitStr = line.substring(111, 119).trim();
  const valorUnitario = parseFloat(valorUnitStr.slice(0, -2) + '.' + valorUnitStr.slice(-2));
  const dataVenda = line.substring(121, 131).trim();
  return { idProduto, nomeProduto, idCliente, nomeCliente, qtdVendida, valorUnitario, dataVenda };
}

// 2. Função que executa a importação dos dados (reescrita para PostgreSQL)
async function importData() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('ERRO: Forneça o caminho do arquivo .dat como argumento.');
    process.exit(1);
  }

  // Obtém um cliente do pool de conexões. Usaremos o mesmo cliente para toda a transação.
  const client = await pool.connect();
  console.log(`Iniciando importação do arquivo: ${filePath}`);

  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');

    // Inicia a transação
    await client.query('BEGIN');

    // Prepara as queries de inserção. A sintaxe ON CONFLICT é específica do PostgreSQL.
    const produtoQuery = 'INSERT INTO produtos (id, nome, valor_unitario) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, valor_unitario = EXCLUDED.valor_unitario';
    const clienteQuery = 'INSERT INTO clientes (id, nome) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome';
    const vendaQuery = 'INSERT INTO vendas (produto_id, cliente_id, quantidade, data_venda) VALUES ($1, $2, $3, $4)';

    for (const line of lines) {
      const venda = parseLine(line);
      // Insere ou atualiza o produto
      await client.query(produtoQuery, [venda.idProduto, venda.nomeProduto, venda.valorUnitario]);
      // Insere ou atualiza o cliente
      await client.query(clienteQuery, [venda.idCliente, venda.nomeCliente]);
      // Insere a venda
      await client.query(vendaQuery, [venda.idProduto, venda.idCliente, venda.qtdVendida, venda.dataVenda]);
    }

    // Efetiva a transação
    await client.query('COMMIT');
    console.log(`Importação de ${lines.length} registros concluída com sucesso!`);

  } catch (error) {
    // Em caso de erro, desfaz a transação
    await client.query('ROLLBACK');
    console.error('Erro durante a importação. A transação foi desfeita (ROLLBACK).', error);
    process.exit(1); // Encerra com código de erro

  } finally {
    // Libera o cliente de volta para o pool, independentemente de sucesso ou falha.
    client.release();
  }
}

// 3. Ponto de entrada do script
importData()
  .then(() => {
    console.log('Processo finalizado. Fechando pool de conexões.');
    pool.end(); // Fecha todas as conexões do pool
  })
  .catch(() => {
    console.error('Processo encontrou um erro fatal. Fechando pool de conexões.');
    pool.end();
    process.exit(1);
  });
