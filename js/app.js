/**
 * Aguarda o DOM estar completamente carregado para iniciar a aplicação.
 * Isso garante que todos os elementos HTML estejam disponíveis para o JavaScript.
 */
document.addEventListener('DOMContentLoaded', () => {

    // --- Seleção de Elementos do DOM ---
    const transactionForm = document.getElementById('transaction-form');
    const editForm = document.getElementById('edit-form');
    const transactionsList = document.getElementById('transactions-list');
    const editModal = document.getElementById('edit-modal');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const exportBtn = document.getElementById('export-btn');
    const clearDataBtn = document.getElementById('clear-data-btn');
    const transactionDateInput = document.getElementById('transaction-date');

    // --- Estado da Aplicação ---
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    let categoryChart, monthlyChart;
    
    // --- Constantes ---
    const categoryIcons = {
        alimentacao: '🍽️',
        transporte: '🚗',
        moradia: '🏠',
        saude: '🏥',
        educacao: '📚',
        lazer: '🎮',
        trabalho: '💼',
        outros: '📦'
    };

    const categoryNames = {
        alimentacao: 'Alimentação',
        transporte: 'Transporte',
        moradia: 'Moradia',
        saude: 'Saúde',
        educacao: 'Educação',
        lazer: 'Lazer',
        trabalho: 'Trabalho',
        outros: 'Outros'
    };
    
    // --- Funções Principais ---

    /**
     * Adiciona uma nova transação.
     * @param {Event} e - O evento de submit do formulário.
     */
    function addTransaction(e) {
        e.preventDefault();
        
        const transaction = {
            id: Date.now(),
            type: document.getElementById('transaction-type').value,
            description: document.getElementById('transaction-description').value,
            amount: parseFloat(document.getElementById('transaction-amount').value),
            category: document.getElementById('transaction-category').value,
            date: document.getElementById('transaction-date').value,
            createdAt: new Date().toISOString()
        };

        transactions.unshift(transaction);
        saveTransactions();
        updateAll();
        transactionForm.reset();
        setDefaultDate();
        
        showNotification('Transação adicionada com sucesso!', 'success');
    }

    /**
     * Renderiza a lista de transações na tela com base nos filtros.
     */
    function renderTransactions() {
        const filteredTransactions = getFilteredTransactions();
        
        if (filteredTransactions.length === 0) {
            transactionsList.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <img src="https://placehold.co/200x150" alt="No transactions found illustration with empty calculator and coins scattered around in modern flat design" class="mx-auto mb-4 rounded-lg">
                    <p>Nenhuma transação encontrada com os filtros aplicados.</p>
                </div>
            `;
            return;
        }

        transactionsList.innerHTML = filteredTransactions.map(transaction => {
            return `
                <div class="expense-item animate-slide-up flex items-center justify-between p-4 rounded-lg">
                    <div class="flex items-center space-x-4">
                        <div class="category-icon bg-gray-100">
                            ${categoryIcons[transaction.category] || '📦'}
                        </div>
                        <div>
                            <h4 class="font-semibold text-gray-800">${transaction.description}</h4>
                            <div class="flex items-center space-x-2 text-sm text-gray-600">
                                <span>${categoryNames[transaction.category] || 'Outros'}</span>
                                <span>•</span>
                                <span>${formatDate(transaction.date)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center space-x-3">
                        <span class="font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}">
                            ${transaction.type === 'income' ? '+' : '-'} R$ ${transaction.amount.toFixed(2).replace('.', ',')}
                        </span>
                        <div class="flex space-x-1">
                            <button onclick="editTransaction(${transaction.id})" class="text-blue-500 hover:text-blue-700 p-1">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                                </svg>
                            </button>
                            <button onclick="deleteTransaction(${transaction.id})" class="text-red-500 hover:text-red-700 p-1">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Atualiza os cards de resumo (Receitas, Despesas, Saldo) do mês atual.
     */
    function updateSummary() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const monthlyTransactions = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate.getMonth() === currentMonth && 
                   transactionDate.getFullYear() === currentYear;
        });

        const income = monthlyTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const expenses = monthlyTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const balance = income - expenses;

        document.getElementById('total-income').textContent = `R$ ${income.toFixed(2).replace('.', ',')}`;
        document.getElementById('total-expenses').textContent = `R$ ${expenses.toFixed(2).replace('.', ',')}`;
        document.getElementById('total-balance').textContent = `R$ ${balance.toFixed(2).replace('.', ',')}`;
        
        const balanceStatus = document.getElementById('balance-status');
        if (balance > 0) {
            balanceStatus.textContent = 'Positivo';
            balanceStatus.className = 'text-green-200 text-xs mt-1';
        } else if (balance < 0) {
            balanceStatus.textContent = 'Negativo';
            balanceStatus.className = 'text-red-200 text-xs mt-1';
        } else {
            balanceStatus.textContent = 'Equilibrado';
            balanceStatus.className = 'text-white/70 text-xs mt-1';
        }
    }

    /**
     * Retorna a lista de transações filtradas com base nos seletores.
     * @returns {Array} Lista de transações filtradas.
     */
    function getFilteredTransactions() {
        const periodFilter = document.getElementById('period-filter').value;
        const typeFilter = document.getElementById('type-filter').value;
        const categoryFilter = document.getElementById('category-filter').value;
        
        return transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            const now = new Date();
            let periodMatch = true;
            
            switch(periodFilter) {
                case 'today':
                    periodMatch = transactionDate.toDateString() === now.toDateString();
                    break;
                case 'week':
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    periodMatch = transactionDate >= weekAgo;
                    break;
                case 'month':
                    periodMatch = transactionDate.getMonth() === now.getMonth() && 
                                 transactionDate.getFullYear() === now.getFullYear();
                    break;
                case 'year':
                    periodMatch = transactionDate.getFullYear() === now.getFullYear();
                    break;
            }
            
            const typeMatch = typeFilter === 'all' || transaction.type === typeFilter;
            const categoryMatch = categoryFilter === 'all' || transaction.category === categoryFilter;
            
            return periodMatch && typeMatch && categoryMatch;
        });
    }

    /**
     * Aplica os filtros e atualiza a lista e os gráficos.
     */
    function applyFilters() {
        renderTransactions();
        updateCharts();
    }

    /**
     * Preenche o modal de edição com os dados da transação.
     * @param {number} id - O ID da transação a ser editada.
     */
    window.editTransaction = function(id) {
        const transaction = transactions.find(t => t.id === id);
        if (!transaction) return;

        document.getElementById('edit-id').value = transaction.id;
        document.getElementById('edit-type').value = transaction.type;
        document.getElementById('edit-description').value = transaction.description;
        document.getElementById('edit-amount').value = transaction.amount;
        document.getElementById('edit-category').value = transaction.category;
        document.getElementById('edit-date').value = transaction.date;
        
        editModal.classList.remove('hidden');
        editModal.classList.add('flex');
    }

    /**
     * Atualiza uma transação existente.
     * @param {Event} e - O evento de submit do formulário de edição.
     */
    function updateTransaction(e) {
        e.preventDefault();
        
        const id = parseInt(document.getElementById('edit-id').value);
        const transactionIndex = transactions.findIndex(t => t.id === id);
        
        if (transactionIndex !== -1) {
            transactions[transactionIndex] = {
                ...transactions[transactionIndex],
                type: document.getElementById('edit-type').value,
                description: document.getElementById('edit-description').value,
                amount: parseFloat(document.getElementById('edit-amount').value),
                category: document.getElementById('edit-category').value,
                date: document.getElementById('edit-date').value,
                updatedAt: new Date().toISOString()
            };
            
            saveTransactions();
            updateAll();
            closeEditModal();
            showNotification('Transação atualizada com sucesso!', 'success');
        }
    }

    /**
     * Deleta uma transação.
     * @param {number} id - O ID da transação a ser deletada.
     */
    window.deleteTransaction = function(id) {
        if (confirm('Tem certeza que deseja excluir esta transação?')) {
            transactions = transactions.filter(t => t.id !== id);
            saveTransactions();
            updateAll();
            showNotification('Transação excluída com sucesso!', 'error');
        }
    }

    /**
     * Fecha o modal de edição.
     */
    function closeEditModal() {
        editModal.classList.add('hidden');
        editModal.classList.remove('flex');
    }

    /**
     * Inicializa os gráficos (Doughnut e Line) com Chart.js.
     */
    function initCharts() {
        // Gráfico de Categorias
        const categoryCtx = document.getElementById('categoryChart').getContext('2d');
        categoryChart = new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#ef4444', '#f59e0b', '#10b981', '#3b82f6',
                        '#8b5cf6', '#f97316', '#06b6d4', '#84cc16'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });

        // Gráfico Mensal
        const monthlyCtx = document.getElementById('monthlyChart').getContext('2d');
        monthlyChart = new Chart(monthlyCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Receitas',
                    data: [],
                    borderColor: '#10b981',
                    backgroundColor: '#10b981',
                    tension: 0.4
                }, {
                    label: 'Despesas',
                    data: [],
                    borderColor: '#ef4444',
                    backgroundColor: '#ef4444',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'R$ ' + value.toFixed(0);
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Atualiza os dados dos gráficos com base nas transações filtradas.
     */
    function updateCharts() {
        const filteredTransactions = getFilteredTransactions();
        
        // Atualizar gráfico de categorias
        const categoryData = {};
        filteredTransactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                const categoryName = categoryNames[t.category] || 'Outros';
                categoryData[categoryName] = (categoryData[categoryName] || 0) + t.amount;
            });

        categoryChart.data.labels = Object.keys(categoryData);
        categoryChart.data.datasets[0].data = Object.values(categoryData);
        categoryChart.update();

        // Atualizar gráfico mensal (últimos 6 meses)
        const monthlyData = {};
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        
        // Inicializar últimos 6 meses
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
            monthlyData[monthKey] = { income: 0, expense: 0 };
        }

        // Agrupar transações por mês
        transactions.forEach(t => {
            const date = new Date(t.date);
            const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
            if (monthlyData[monthKey]) {
                monthlyData[monthKey][t.type] += t.amount;
            }
        });

        monthlyChart.data.labels = Object.keys(monthlyData);
        monthlyChart.data.datasets[0].data = Object.values(monthlyData).map(d => d.income);
        monthlyChart.data.datasets[1].data = Object.values(monthlyData).map(d => d.expense);
        monthlyChart.update();
    }

    /**
     * Exporta os dados das transações para um arquivo JSON.
     */
    function exportData() {
        const dataStr = JSON.stringify(transactions, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `financas_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        showNotification('Dados exportados com sucesso!', 'success');
    }

    /**
     * Limpa todos os dados do localStorage após confirmação.
     */
    function clearAllData() {
        if (confirm('Tem certeza que deseja apagar todos os dados? Esta ação não pode ser desfeita.')) {
            transactions = [];
            saveTransactions();
            updateAll();
            showNotification('Todos os dados foram apagados!', 'error');
        }
    }

    // --- Funções Utilitárias ---

    /**
     * Salva o array de transações no localStorage.
     */
    function saveTransactions() {
        localStorage.setItem('transactions', JSON.stringify(transactions));
        updateLastUpdate();
    }

    /**
     * Atualiza a data do "Último update" no header.
     */
    function updateLastUpdate() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        document.getElementById('last-update').textContent = `Hoje às ${timeString}`;
    }

    /**
     * Formata uma string de data (YYYY-MM-DD) para o formato pt-BR.
     * @param {string} dateString - A data em formato YYYY-MM-DD.
     * @returns {string} A data em formato DD/MM/YYYY.
     */
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    }

    /**
     * Define a data padrão no formulário de nova transação para hoje.
     */
    function setDefaultDate() {
        transactionDateInput.value = new Date().toISOString().split('T')[0];
    }

    /**
     * Mostra uma notificação toast no canto da tela.
     * @param {string} message - A mensagem a ser exibida.
     * @param {string} type - 'success', 'error' ou 'info'.
     */
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg text-white font-semibold animate-slide-up ${
            type === 'success' ? 'bg-green-500' : 
            type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    /**
     * Função helper para atualizar todos os componentes da UI.
     */
    function updateAll() {
        updateSummary();
        renderTransactions();
        updateCharts();
    }

    // --- Inicialização e Event Listeners ---

    // Adiciona os listeners aos formulários
    transactionForm.addEventListener('submit', addTransaction);
    editForm.addEventListener('submit', updateTransaction);

    // Adiciona listeners aos filtros
    document.getElementById('period-filter').addEventListener('change', applyFilters);
    document.getElementById('type-filter').addEventListener('change', applyFilters);
    document.getElementById('category-filter').addEventListener('change', applyFilters);
    
    // Adiciona listeners aos botões
    exportBtn.addEventListener('click', exportData);
    clearDataBtn.addEventListener('click', clearAllData);
    cancelEditBtn.addEventListener('click', closeEditModal);

    // Fechar modal ao clicar fora
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) {
            closeEditModal();
        }
    });
    
    /**
     * Inicializa a aplicação.
     */
    function init() {
        setDefaultDate();
        initCharts();
        updateAll();
        updateLastUpdate();
        
        // Disponibiliza funções no escopo global para o HTML (onclick)
        // Isso é necessário porque o script está agora modularizado.
        window.editTransaction = editTransaction;
        window.deleteTransaction = deleteTransaction;
    }
    
    init();

});