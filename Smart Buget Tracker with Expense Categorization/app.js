// Theme Management
const themeToggle = document.getElementById('themeToggle');
let isDarkMode = localStorage.getItem('darkMode') === 'true';

function toggleTheme() {
    isDarkMode = !isDarkMode;
    document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('darkMode', isDarkMode);
    updateExpenseChart(); // Update chart colors when theme changes
}

themeToggle.addEventListener('click', toggleTheme);

// Initialize theme
if (isDarkMode) {
    document.body.setAttribute('data-theme', 'dark');
}

// Transaction Management
// Clear any existing transactions from localStorage
localStorage.removeItem('transactions');

let transactions = [];
let categories = [
    'groceries',
    'entertainment',
    'utilities',
    'transportation',
    'healthcare'
];

// Save initial categories
localStorage.setItem('categories', JSON.stringify(categories));

const transactionForm = document.getElementById('transactionForm');
const categorySelect = document.getElementById('category');
const customCategoryGroup = document.getElementById('customCategoryGroup');
const customCategoryInput = document.getElementById('customCategory');

// Event Listeners
categorySelect.addEventListener('change', () => {
    customCategoryGroup.style.display = 
        categorySelect.value === 'custom' ? 'block' : 'none';
});

transactionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const description = document.getElementById('description').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const type = document.getElementById('type').value;
    let category = categorySelect.value;
    
    if (category === 'custom') {
        category = customCategoryInput.value.toLowerCase();
        if (!categories.includes(category)) {
            categories.push(category);
            localStorage.setItem('categories', JSON.stringify(categories));
            updateCategorySelect();
        }
    }
    
    const transaction = {
        id: Date.now().toString(),
        description,
        amount,
        type,
        category,
        date: new Date().toISOString()
    };
    
    transactions.unshift(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    
    transactionForm.reset();
    customCategoryGroup.style.display = 'none';
    updateUI();

    // Add animation for new transaction
    setTimeout(() => {
        const firstTransaction = document.querySelector('.transaction-item');
        if (firstTransaction) {
            firstTransaction.style.animation = 'slideIn 0.5s ease';
        }
    }, 0);
});

function updateCategorySelect() {
    const currentValue = categorySelect.value;
    categorySelect.innerHTML = `
        <option value="">Select Category</option>
        ${categories.map(cat => `
            <option value="${cat}">${cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
        `).join('')}
        <option value="custom">Add Custom Category</option>
    `;
    categorySelect.value = currentValue;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
}

function updateTransactionsList() {
    const transactionsList = document.getElementById('transactionsList');
    if (transactions.length === 0) {
        transactionsList.innerHTML = '<p class="text-center">No transactions yet. Add your first transaction above!</p>';
        return;
    }
    
    transactionsList.innerHTML = transactions.map(transaction => `
        <div class="transaction-item" onclick="toggleTransactionActions(this)">
            <div class="transaction-content">
                <div class="transaction-info">
                    <strong>${transaction.description}</strong>
                    <div>
                        <small>${new Date(transaction.date).toLocaleDateString()}</small>
                        <small>${transaction.category}</small>
                    </div>
                </div>
                <span class="transaction-amount ${transaction.type}">
                    ${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}
                </span>
            </div>
            <div class="transaction-actions">
                <button class="btn-edit" onclick="editTransaction('${transaction.id}', event)">Edit</button>
                <button class="btn-delete" onclick="deleteTransaction('${transaction.id}', event)">Delete</button>
            </div>
        </div>
    `).join('');
}

function toggleTransactionActions(element) {
    const wasExpanded = element.classList.contains('expanded');
    // Close all expanded items
    document.querySelectorAll('.transaction-item').forEach(item => {
        item.classList.remove('expanded');
    });
    // Toggle the clicked item
    if (!wasExpanded) {
        element.classList.add('expanded');
    }
}

function updateSummary() {
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = totalIncome - totalExpenses;
    
    document.getElementById('totalBalance').textContent = formatCurrency(balance);
    document.getElementById('totalIncome').textContent = formatCurrency(totalIncome);
    document.getElementById('totalExpenses').textContent = formatCurrency(totalExpenses);
}

let expenseChart;

function updateExpenseChart() {
    const expensesByCategory = {};
    transactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
        });
    
    const ctx = document.getElementById('expenseChart').getContext('2d');
    
    if (expenseChart) {
        expenseChart.destroy();
    }
    
    if (Object.keys(expensesByCategory).length === 0) {
        ctx.canvas.style.display = 'none';
        return;
    }
    
    ctx.canvas.style.display = 'block';
    expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(expensesByCategory).map(cat => 
                cat.charAt(0).toUpperCase() + cat.slice(1)
            ),
            datasets: [{
                data: Object.values(expensesByCategory),
                backgroundColor: [
                    '#3b82f6',
                    '#ef4444',
                    '#10b981',
                    '#f59e0b',
                    '#6366f1',
                    '#ec4899',
                    '#8b5cf6',
                    '#14b8a6'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: isDarkMode ? '#f3f4f6' : '#1f2937',
                        padding: 20,
                        font: {
                            size: 12
                        }
                    }
                }
            },
            animation: {
                animateScale: true,
                animateRotate: true
            }
        }
    });
}

function editTransaction(id, event) {
    event.stopPropagation();
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    
    document.getElementById('description').value = transaction.description;
    document.getElementById('amount').value = transaction.amount;
    document.getElementById('type').value = transaction.type;
    document.getElementById('category').value = transaction.category;
    
    transactions = transactions.filter(t => t.id !== id);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    updateUI();
}

function deleteTransaction(id, event) {
    event.stopPropagation();
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    
    transactions = transactions.filter(t => t.id !== id);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    updateUI();
}

function updateUI() {
    updateTransactionsList();
    updateSummary();
    updateExpenseChart();
}

// Initial setup
updateCategorySelect();
updateUI();