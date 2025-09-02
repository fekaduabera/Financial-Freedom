// אפליקציית מעקב השקעות והלוואות - Frontend JavaScript

// משתנים גלובליים
let investmentsChart = null;
let currentSection = 'dashboard';

// פונקציות עזר
function formatCurrency(amount) {
    return new Intl.NumberFormat('he-IL', {
        style: 'currency',
        currency: 'ILS',
        minimumFractionDigits: 0
    }).format(amount);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL');
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg text-white ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
    }`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        document.body.removeChild(notification);
    }, 3000);
}

// ניווט בין חלקים
function showSection(sectionName) {
    // הסתרת כל החלקים
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // הצגת החלק הנבחר
    document.getElementById(`${sectionName}-section`).classList.remove('hidden');
    
    // עדכון ניווט
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.className = 'nav-btn py-3 px-4 text-gray-600 hover:text-blue-600';
    });
    document.getElementById(`nav-${sectionName}`).className = 'nav-btn py-3 px-4 text-blue-600 border-b-2 border-blue-600';
    
    currentSection = sectionName;
    
    // טעינת נתונים עבור החלק הנבחר
    switch(sectionName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'investments':
            loadInvestments();
            break;
        case 'loans':
            loadLoans();
            break;
        case 'goals':
            loadGoals();
            break;
    }
}

// =======================
// Dashboard Functions
// =======================

async function loadDashboard() {
    try {
        const response = await axios.get('/api/dashboard');
        if (response.data.success) {
            const data = response.data.data;
            
            // עדכון סטטיסטיקות
            document.getElementById('total-investments').textContent = formatCurrency(data.totalInvestments);
            document.getElementById('total-debts').textContent = formatCurrency(data.totalDebts);
            document.getElementById('net-worth').textContent = formatCurrency(data.netWorth);
            document.getElementById('goals-completion').textContent = data.goals.completionRate + '%';
            
            // יצירת גרף השקעות חודשי
            createInvestmentsChart(data.monthlyInvestments);
        }
    } catch (error) {
        console.error('שגיאה בטעינת Dashboard:', error);
        showNotification('שגיאה בטעינת נתוני לוח הבקרה', 'error');
    }
}

function createInvestmentsChart(monthlyData) {
    const ctx = document.getElementById('investmentsChart').getContext('2d');
    
    // מחיקת גרף קיים
    if (investmentsChart) {
        investmentsChart.destroy();
    }
    
    const labels = monthlyData.map(item => {
        const [year, month] = item.month.split('-');
        const monthNames = [
            'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
            'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
        ];
        return monthNames[parseInt(month) - 1] + ' ' + year;
    });
    
    const amounts = monthlyData.map(item => item.total);
    
    investmentsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'השקעות חודשיות',
                data: amounts,
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

// =======================
// Investments Functions
// =======================

async function loadInvestments() {
    try {
        const response = await axios.get('/api/investments');
        if (response.data.success) {
            displayInvestments(response.data.data);
        }
    } catch (error) {
        console.error('שגיאה בטעינת השקעות:', error);
        showNotification('שגיאה בטעינת השקעות', 'error');
    }
}

function displayInvestments(investments) {
    const container = document.getElementById('investments-list');
    
    if (investments.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">אין השקעות עדיין</p>';
        return;
    }
    
    container.innerHTML = investments.map(investment => `
        <div class="border rounded-lg p-4 flex justify-between items-center">
            <div>
                <h4 class="font-semibold text-gray-800">${investment.description || 'השקעה'}</h4>
                <p class="text-sm text-gray-600">
                    ${formatDate(investment.date)} | ${investment.category}
                </p>
            </div>
            <div class="text-left">
                <p class="text-xl font-bold text-green-600">${formatCurrency(investment.amount)}</p>
                <button onclick="deleteInvestment(${investment.id})" class="text-red-500 hover:text-red-700 text-sm">
                    <i class="fas fa-trash mr-1"></i>מחק
                </button>
            </div>
        </div>
    `).join('');
}

async function deleteInvestment(id) {
    if (!confirm('האם אתה בטוח שברצונך למחוק השקעה זו?')) return;
    
    try {
        const response = await axios.delete(`/api/investments/${id}`);
        if (response.data.success) {
            showNotification('השקעה נמחקה בהצלחה');
            loadInvestments();
            // רענון Dashboard אם אנחנו נמצאים בו
            if (currentSection === 'dashboard') {
                loadDashboard();
            }
        }
    } catch (error) {
        console.error('שגיאה במחיקת השקעה:', error);
        showNotification('שגיאה במחיקת השקעה', 'error');
    }
}

// =======================
// Loans Functions
// =======================

async function loadLoans() {
    try {
        const response = await axios.get('/api/loans');
        if (response.data.success) {
            displayLoans(response.data.data);
        }
    } catch (error) {
        console.error('שגיאה בטעינת הלוואות:', error);
        showNotification('שגיאה בטעינת הלוואות', 'error');
    }
}

function displayLoans(loans) {
    const container = document.getElementById('loans-list');
    
    if (loans.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">אין הלוואות פעילות</p>';
        return;
    }
    
    container.innerHTML = loans.map(loan => `
        <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h4 class="text-xl font-semibold text-gray-800">${loan.description || 'הלוואה'}</h4>
                    <p class="text-sm text-gray-600">${loan.loan_type} | ${loan.lender || 'ללא מלווה'}</p>
                </div>
                <span class="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">פעילה</span>
            </div>
            
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                    <p class="text-sm text-gray-600">סכום מקורי</p>
                    <p class="font-semibold">${formatCurrency(loan.principal_amount)}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-600">יתרה נוכחית</p>
                    <p class="font-semibold text-red-600">${formatCurrency(loan.current_balance)}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-600">ריבית שנתית</p>
                    <p class="font-semibold">${loan.interest_rate}%</p>
                </div>
                <div>
                    <p class="text-sm text-gray-600">תשלום חודשי</p>
                    <p class="font-semibold">${formatCurrency(loan.monthly_payment)}</p>
                </div>
            </div>
            
            <div class="border-t pt-4">
                <h5 class="font-semibold text-gray-700 mb-2">הוספת תשלום</h5>
                <form onsubmit="addLoanPayment(event, ${loan.id})" class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input type="number" placeholder="סכום תשלום" required class="border rounded px-3 py-2" name="amount">
                    <input type="date" required class="border rounded px-3 py-2" name="date">
                    <input type="text" placeholder="תיאור (אופציונלי)" class="border rounded px-3 py-2" name="description">
                    <button type="submit" class="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 md:col-span-3">
                        <i class="fas fa-plus mr-2"></i>הוסף תשלום
                    </button>
                </form>
            </div>
        </div>
    `).join('');
}

async function addLoanPayment(event, loanId) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    try {
        const response = await axios.post(`/api/loans/${loanId}/payments`, {
            payment_amount: parseFloat(formData.get('amount')),
            payment_date: formData.get('date'),
            description: formData.get('description')
        });
        
        if (response.data.success) {
            showNotification('תשלום נוסף בהצלחה');
            form.reset();
            loadLoans();
            // רענון Dashboard אם אנחנו נמצאים בו
            if (currentSection === 'dashboard') {
                loadDashboard();
            }
        }
    } catch (error) {
        console.error('שגיאה בהוספת תשלום:', error);
        showNotification('שגיאה בהוספת תשלום', 'error');
    }
}

// =======================
// Goals Functions
// =======================

async function loadGoals() {
    try {
        const response = await axios.get('/api/goals');
        if (response.data.success) {
            displayGoals(response.data.data);
        }
    } catch (error) {
        console.error('שגיאה בטעינת יעדים:', error);
        showNotification('שגיאה בטעינת יעדים', 'error');
    }
}

function displayGoals(goals) {
    const container = document.getElementById('goals-list');
    
    if (goals.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">אין יעדים כלכליים עדיין</p>';
        return;
    }
    
    container.innerHTML = goals.map(goal => {
        const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
        const isCompleted = progress >= 100;
        
        return `
            <div class="bg-white rounded-lg shadow-md p-6">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h4 class="text-xl font-semibold text-gray-800">${goal.goal_name}</h4>
                        <p class="text-sm text-gray-600">${goal.goal_type} ${goal.target_date ? '| יעד: ' + formatDate(goal.target_date) : ''}</p>
                    </div>
                    <span class="bg-${isCompleted ? 'green' : 'yellow'}-100 text-${isCompleted ? 'green' : 'yellow'}-800 text-xs px-2 py-1 rounded-full">
                        ${isCompleted ? 'הושלם' : 'בתהליך'}
                    </span>
                </div>
                
                <div class="mb-4">
                    <div class="flex justify-between text-sm text-gray-600 mb-1">
                        <span>${formatCurrency(goal.current_amount)} מתוך ${formatCurrency(goal.target_amount)}</span>
                        <span>${Math.round(progress)}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-3">
                        <div class="bg-purple-600 h-3 rounded-full transition-all duration-300" style="width: ${progress}%"></div>
                    </div>
                </div>
                
                ${goal.description ? `<p class="text-gray-600 text-sm mb-4">${goal.description}</p>` : ''}
                
                <div class="border-t pt-4">
                    <h5 class="font-semibold text-gray-700 mb-2">עדכון סכום</h5>
                    <form onsubmit="updateGoal(event, ${goal.id})" class="flex gap-3">
                        <input type="number" placeholder="סכום חדש" class="flex-1 border rounded px-3 py-2" name="amount" min="0" step="0.01">
                        <button type="submit" class="bg-purple-600 text-white rounded px-4 py-2 hover:bg-purple-700">
                            <i class="fas fa-save mr-2"></i>עדכן
                        </button>
                    </form>
                </div>
            </div>
        `;
    }).join('');
}

async function updateGoal(event, goalId) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const newAmount = parseFloat(formData.get('amount'));
    
    if (!newAmount || newAmount < 0) {
        showNotification('נא להזין סכום תקין', 'error');
        return;
    }
    
    try {
        const response = await axios.put(`/api/goals/${goalId}`, {
            current_amount: newAmount
        });
        
        if (response.data.success) {
            showNotification('יעד עודכן בהצלחה');
            form.reset();
            loadGoals();
            // רענון Dashboard אם אנחנו נמצאים בו
            if (currentSection === 'dashboard') {
                loadDashboard();
            }
        }
    } catch (error) {
        console.error('שגיאה בעדכון יעד:', error);
        showNotification('שגיאה בעדכון יעד', 'error');
    }
}

// =======================
// Form Handlers
// =======================

// הוספת השקעה
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('investment-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            amount: parseFloat(document.getElementById('investment-amount').value),
            date: document.getElementById('investment-date').value,
            description: document.getElementById('investment-description').value,
            category: document.getElementById('investment-category').value
        };
        
        try {
            const response = await axios.post('/api/investments', formData);
            if (response.data.success) {
                showNotification('השקעה נוספה בהצלחה');
                document.getElementById('investment-form').reset();
                loadInvestments();
                // רענון Dashboard אם אנחנו נמצאים בו
                if (currentSection === 'dashboard') {
                    loadDashboard();
                }
            }
        } catch (error) {
            console.error('שגיאה בהוספת השקעה:', error);
            showNotification('שגיאה בהוספת השקעה', 'error');
        }
    });

    // הוספת הלוואה
    document.getElementById('loan-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            principal_amount: parseFloat(document.getElementById('loan-principal').value),
            current_balance: parseFloat(document.getElementById('loan-balance').value),
            interest_rate: parseFloat(document.getElementById('loan-interest').value) || 0,
            monthly_payment: parseFloat(document.getElementById('loan-payment').value) || 0,
            start_date: document.getElementById('loan-start').value,
            description: document.getElementById('loan-description').value,
            lender: document.getElementById('loan-lender').value,
            loan_type: document.getElementById('loan-type').value
        };
        
        try {
            const response = await axios.post('/api/loans', formData);
            if (response.data.success) {
                showNotification('הלוואה נוספה בהצלחה');
                document.getElementById('loan-form').reset();
                loadLoans();
                // רענון Dashboard אם אנחנו נמצאים בו
                if (currentSection === 'dashboard') {
                    loadDashboard();
                }
            }
        } catch (error) {
            console.error('שגיאה בהוספת הלוואה:', error);
            showNotification('שגיאה בהוספת הלוואה', 'error');
        }
    });

    // הוספת יעד
    document.getElementById('goal-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            goal_name: document.getElementById('goal-name').value,
            target_amount: parseFloat(document.getElementById('goal-target').value),
            current_amount: parseFloat(document.getElementById('goal-current').value) || 0,
            target_date: document.getElementById('goal-date').value || null,
            goal_type: document.getElementById('goal-type').value,
            description: document.getElementById('goal-description').value
        };
        
        try {
            const response = await axios.post('/api/goals', formData);
            if (response.data.success) {
                showNotification('יעד נוסף בהצלחה');
                document.getElementById('goal-form').reset();
                loadGoals();
                // רענון Dashboard אם אנחנו נמצאים בו
                if (currentSection === 'dashboard') {
                    loadDashboard();
                }
            }
        } catch (error) {
            console.error('שגיאה בהוספת יעד:', error);
            showNotification('שגיאה בהוספת יעד', 'error');
        }
    });

    // הגדרת תאריך היום כברירת מחדל
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('investment-date').value = today;
    
    // טעינה ראשונית של Dashboard
    loadDashboard();
});