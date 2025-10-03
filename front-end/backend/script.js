document.addEventListener('DOMContentLoaded', () => {

    // --- FUNÇÕES AUXILIARES ---

    const formatCurrency = (value) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    // **NOVA FUNÇÃO ADAPTADA PARA OS CARDS**
    const populateSummaryCards = (data) => {
        // Como no desafio o arquivo é de um dia específico, vamos usar essa data.
        // No seu caso, o arquivo é vendas_dia_2025-10-01.dat
        const today = '2025-10-01'; 

        // Filtra os dados da API para incluir apenas as vendas do dia de hoje
        const salesToday = data.filter(item => item.data_venda === today);

        // Calcula os totais com base nos dados filtrados, acessando a nova estrutura de dados
        const totalSalesValue = salesToday.reduce((sum, item) => sum + item.valor_total_venda, 0);
        const totalItemsSold = salesToday.reduce((sum, item) => sum + item.quantidade, 0);
        const totalTransactions = salesToday.length;

        // Atualiza os elementos HTML
        document.getElementById('totalSalesValue').textContent = formatCurrency(totalSalesValue);
        document.getElementById('totalItemsSold').textContent = totalItemsSold;
        document.getElementById('totalTransactions').textContent = totalTransactions;
    };

    const renderTableRows = (data) => {
        const tableBody = document.getElementById('tableBody');
        tableBody.innerHTML = ''; 

        data.forEach(item => {
            const row = `
                <tr>
                    <td>${item.data_venda}</td>
                    <td>${item.cliente.nome}</td>
                    <td>${item.produto.nome}</td>
                    <td>${item.quantidade}</td>
                    <td>${formatCurrency(item.produto.valor_unitario)}</td>
                    <td>${formatCurrency(item.valor_total_venda)}</td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    };

    const renderNoResults = (searchTerm) => {
        const tableBody = document.getElementById('tableBody');
        tableBody.innerHTML = `
            <tr class="no-results-row">
                <td colspan="6">
                    Não há resultados para "<strong>${searchTerm}</strong>"
                </td>
            </tr>
        `;
    };
    
    // --- LÓGICA PRINCIPAL ---
    
    let allSalesData = []; 

    async function loadSalesData() {
        try {
                        const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? 'http://localhost:3000/vendas'
                : 'https://backend-borsch-3.onrender.com/vendas';
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error('Erro ao buscar dados da API');
            }
            allSalesData = await response.json(); 
            
            // Agora chamamos as duas funções para popular tanto a tabela quanto os cards
            renderTableRows(allSalesData);
            populateSummaryCards(allSalesData);

        } catch (error) {
            console.error(error);
        }
    }

    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('keyup', () => {
        const searchTerm = searchInput.value.toLowerCase();

        if (!searchTerm) {
            renderTableRows(allSalesData);
            return;
        }

        const filteredData = allSalesData.filter(item => {
            const clientName = item.cliente.nome.toLowerCase();
            const productName = item.produto.nome.toLowerCase();
            return clientName.includes(searchTerm) || productName.includes(searchTerm);
        });

        if (filteredData.length > 0) {
            renderTableRows(filteredData);
        } else {
            renderNoResults(searchTerm);
        }
    });
    
    loadSalesData();
});