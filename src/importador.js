require('dotenv').config();

// Valida a existência da variável de ambiente DB_FILE
if (!process.env.DB_FILE) {
    console.error("ERRO: A variável de ambiente DB_FILE não está definida.");
    console.error("Por favor, crie um arquivo .env (copiando de .env.example) e defina a variável DB_FILE.");
    process.exit(1);
}

const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

// 1. Função para parsear uma linha do arquivo de dados
function parseLine(line) {
  const idProduto = parseInt(line.substring(0, 4).trim(), 10);
  const nomeProduto = line.substring(4, 54).trim();
  const idCliente = parseInt(line.substring(54, 58).trim(), 10);
  const nomeCliente = line.substring(58, 108).trim();
  const qtdVendida = parseInt(line.substring(108, 111).trim(), 10);
  const valorUnitStr = line.substring(111, 121).trim();
  const valorUnitario = parseFloat(valorUnitStr.slice(0, -2) + '.' + valorUnitStr.slice(-2));
  const dataVenda = line.substring(121, 131).trim();
  return { idProduto, nomeProduto, idCliente, nomeCliente, qtdVendida, valorUnitario, dataVenda };
}

// 2. Função que executa a importação dos dados
function importData() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Erro: Forneça o caminho do arquivo .dat como argumento.');
    process.exit(1);
  }

  const db = new sqlite3.Database(process.env.DB_FILE, (err) => {
    if (err) {
      console.error('Erro ao conectar ao SQLite para importação:', err.message);
      return process.exit(1);
    }
  });

  console.log(`Iniciando importação do arquivo: ${filePath}`);
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const lines = fileContent.split('\n').filter(line => line.trim() !== '');

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    const stmtProduto = db.prepare(`INSERT INTO produtos (id, nome, valor_unitario) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET nome = excluded.nome, valor_unitario = excluded.valor_unitario`);
    const stmtCliente = db.prepare(`INSERT INTO clientes (id, nome) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET nome = excluded.nome`);
    const stmtVenda = db.prepare(`INSERT INTO vendas (produto_id, cliente_id, quantidade, data_venda) VALUES ($1, $2, $3, $4)`);

    for (const line of lines) {
      const venda = parseLine(line);
      stmtProduto.run(venda.idProduto, venda.nomeProduto, venda.valorUnitario);
      stmtCliente.run(venda.idCliente, venda.nomeCliente);
      stmtVenda.run(venda.idProduto, venda.idCliente, venda.qtdVendida, venda.dataVenda);
    }

    stmtProduto.finalize();
    stmtCliente.finalize();
    stmtVenda.finalize();

    db.run('COMMIT', (err) => {
      if (err) {
        console.error('Erro ao commitar transação:', err.message);
      } else {
        console.log(`Importação de ${lines.length} registros concluída com sucesso!`);
      }
      db.close();
    });
  });
}

// 3. Função que prepara o banco de dados e chama a importação
function initializeDatabaseAndImport() {
    const db = new sqlite3.Database(process.env.DB_FILE);
    console.log("Verificando banco de dados...");

    const init_sql = fs.readFileSync('db/init.sql', 'utf8');
    db.exec(init_sql, (err) => {
        // Ignora o erro se a tabela já existir
        if (err && !err.message.includes('already exists')) {
            console.error("Erro ao inicializar o banco de dados.", err.message);
            db.close();
            return;
        }
        
        console.log("Banco de dados pronto.");
        db.close((err) => {
            if (err) {
                return console.error("Erro ao fechar conexão de inicialização:", err.message);
            }
            // Chama a importação somente após garantir que o DB está pronto
            importData();
        });
    });
}

// 4. Ponto de entrada do script
initializeDatabaseAndImport();