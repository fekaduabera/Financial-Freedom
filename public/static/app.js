// אפליקציית מעקב השקעות והלוואות - Frontend JavaScript

// משתנים גלובליים
let investmentsChart = null;
let categoriesChart = null;
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
            loadMonthlyInvestments();
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
            
            // יצירת גרפים
            createInvestmentsChart(data.monthlyInvestments);
            createCategoriesChart();
        }
    } catch (error) {
        console.error('שגיאה בטעינת Dashboard:', error);
        showNotification('שגיאה בטעינת נתוני לוח הבקרה', 'error');
    }
}

function createInvestmentsChart(monthlyData) {
    const ctx = document.getElementById('investmentsChart');
    if (!ctx) return;
    
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
                label: 'השקעות חודשיות (₪)',
                data: amounts,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index',
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    callbacks: {
                        label: function(context) {
                            return 'השקעות: ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 12
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        },
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    });
}

function createCategoriesChart() {
    const ctx = document.getElementById('categoriesChart');
    if (!ctx) return;
    
    // מחיקת גרף קיים
    if (categoriesChart) {
        categoriesChart.destroy();
    }
    
    // נתוני קטגוריות לדוגמה
    const categoryData = {
        labels: ['קרנות נאמנות', 'מניות', 'קריפטו', 'אגחות', 'נדל"ן'],
        datasets: [{
            data: [10500, 8000, 4000, 3000, 2000],
            backgroundColor: [
                '#3b82f6', // כחול
                '#10b981', // ירוק
                '#f59e0b', // כתום
                '#ef4444', // אדום
                '#8b5cf6'  // סגול
            ],
            borderColor: '#ffffff',
            borderWidth: 3
        }]
    };
    
    categoriesChart = new Chart(ctx, {
        type: 'doughnut',
        data: categoryData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        font: {
                            size: 12
                        },
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = formatCurrency(context.parsed);
                            const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
                            const percentage = Math.round((context.parsed / total) * 100);
                            return label + ': ' + value + ' (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}

// =======================
// Monthly Investments Functions (Excel Style)
// =======================

async function loadMonthlyInvestments() {
    try {
        const response = await axios.get('/api/monthly-investments');
        if (response.data.success) {
            displayMonthlyInvestments(response.data.data);
        }
    } catch (error) {
        console.error('שגיאה בטעינת השקעות חודשיות:', error);
        showNotification('שגיאה בטעינת השקעות חודשיות', 'error');
    }
}

function displayMonthlyInvestments(monthlyData) {
    const tbody = document.getElementById('monthly-investments-tbody');
    const totalElement = document.getElementById('total-monthly-investments');
    
    if (!tbody || !totalElement) return;
    
    if (monthlyData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-gray-500 py-8">אין נתונים חודשיים עדיין</td></tr>';
        totalElement.textContent = '₪0';
        return;
    }
    
    // חישוב סיכום
    const totalInvestments = monthlyData.reduce((sum, item) => sum + item.amount, 0);
    totalElement.textContent = formatCurrency(totalInvestments);
    
    tbody.innerHTML = monthlyData.map(item => `
        <tr class="hover:bg-gray-50">
            <td class="border border-gray-300 px-4 py-3 text-center font-medium">
                ${item.month_name}
            </td>
            <td class="border border-gray-300 px-4 py-3 text-center">
                <input 
                    type="number" 
                    value="${item.amount}" 
                    onchange="updateMonthlyInvestment(${item.id}, this.value)"
                    onblur="updateMonthlyInvestment(${item.id}, this.value)"
                    class="w-full text-center border-0 bg-transparent focus:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                    step="0.01"
                    min="0"
                />
            </td>
            <td class="border border-gray-300 px-4 py-3 text-center font-bold text-green-600">
                ${formatCurrency(item.cumulative)}
            </td>
            <td class="border border-gray-300 px-4 py-3 text-center">
                <button onclick="deleteMonth(${item.id})" class="text-red-500 hover:text-red-700 text-sm px-2 py-1 rounded hover:bg-red-50">
                    <i class="fas fa-trash mr-1"></i>מחק
                </button>
            </td>
        </tr>
    `).join('');
}

async function updateMonthlyInvestment(id, amount) {
    try {
        const response = await axios.put(`/api/monthly-investments/${id}`, {
            amount: parseFloat(amount) || 0
        });
        
        if (response.data.success) {
            // רענון הטבלה לעדכון הסכומים המצטברים
            loadMonthlyInvestments();
            // רענון Dashboard אם נמצאים בו
            if (currentSection === 'dashboard') {
                loadDashboard();
            }
        }
    } catch (error) {
        console.error('שגיאה בעדכון השקעה חודשית:', error);
        showNotification('שגיאה בעדכון השקעה חודשית', 'error');
        // טעינה מחדש לשחזור הערך הקודם
        loadMonthlyInvestments();
    }
}

async function deleteMonth(id) {
    if (!confirm('האם אתה בטוח שברצונך למחוק חודש זה?')) return;
    
    try {
        const response = await axios.delete(`/api/monthly-investments/${id}`);
        if (response.data.success) {
            showNotification('חודש נמחק בהצלחה');
            loadMonthlyInvestments();
            if (currentSection === 'dashboard') {
                loadDashboard();
            }
        }
    } catch (error) {
        console.error('שגיאה במחיקת חודש:', error);
        showNotification('שגיאה במחיקת חודש', 'error');
    }
}

function addNewMonth() {
    document.getElementById('add-month-modal').classList.remove('hidden');
}

function closeAddMonthModal() {
    document.getElementById('add-month-modal').classList.add('hidden');
}

function toggleLegacyInvestments() {
    const container = document.getElementById('investments-list');
    if (container.classList.contains('hidden')) {
        container.classList.remove('hidden');
        loadInvestments(); // טעינת השקעות בודדות
    } else {
        container.classList.add('hidden');
    }
}

// =======================
// Legacy Investments Functions
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
        <div class="border rounded-lg p-4 hover:border-blue-300 transition-colors">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                        <h4 class="font-semibold text-gray-800">${investment.description || 'השקעה'}</h4>
                        ${investment.version > 1 ? `<span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">v${investment.version}</span>` : ''}
                    </div>
                    <p class="text-sm text-gray-600 mb-1">
                        ${formatDate(investment.date)} | ${investment.category}
                    </p>
                    <p class="text-xs text-gray-500">
                        נוצר: ${formatDate(investment.created_at)} 
                        ${investment.updated_at !== investment.created_at ? `| עודכן: ${formatDate(investment.updated_at)}` : ''}
                    </p>
                </div>
                <div class="text-left">
                    <p class="text-xl font-bold text-green-600 mb-2">${formatCurrency(investment.amount)}</p>
                    <div class="flex gap-2">
                        <button onclick="editInvestment(${investment.id})" class="text-blue-500 hover:text-blue-700 text-sm">
                            <i class="fas fa-edit mr-1"></i>ערוך
                        </button>
                        <button onclick="showInvestmentHistoryById(${investment.id})" class="text-green-500 hover:text-green-700 text-sm">
                            <i class="fas fa-history mr-1"></i>היסטוריה
                        </button>
                        <button onclick="deleteInvestment(${investment.id})" class="text-red-500 hover:text-red-700 text-sm">
                            <i class="fas fa-trash mr-1"></i>מחק
                        </button>
                    </div>
                </div>
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

// פונקציות עריכת השקעות
async function editInvestment(id) {
    try {
        // טעינת נתוני ההשקעה הנוכחיים
        const response = await axios.get('/api/investments');
        if (response.data.success) {
            const investment = response.data.data.find(inv => inv.id === id);
            if (investment) {
                // מילוי הטופס
                document.getElementById('edit-investment-id').value = investment.id;
                document.getElementById('edit-investment-amount').value = investment.amount;
                document.getElementById('edit-investment-date').value = investment.date;
                document.getElementById('edit-investment-description').value = investment.description;
                document.getElementById('edit-investment-category').value = investment.category;
                document.getElementById('edit-change-description').value = '';
                
                // פתיחת המודל
                document.getElementById('edit-investment-modal').classList.remove('hidden');
            }
        }
    } catch (error) {
        console.error('שגיאה בטעינת נתוני השקעה:', error);
        showNotification('שגיאה בטעינת נתוני השקעה', 'error');
    }
}

function closeEditModal() {
    document.getElementById('edit-investment-modal').classList.add('hidden');
}

async function showInvestmentHistoryById(id) {
    document.getElementById('edit-investment-id').value = id;
    await showInvestmentHistory();
}

async function showInvestmentHistory() {
    const investmentId = document.getElementById('edit-investment-id').value;
    if (!investmentId) {
        showNotification('לא נבחרה השקעה', 'error');
        return;
    }
    
    try {
        const response = await axios.get(`/api/investments/${investmentId}/history`);
        if (response.data.success) {
            displayInvestmentHistory(response.data.data);
            document.getElementById('investment-history-modal').classList.remove('hidden');
        }
    } catch (error) {
        console.error('שגיאה בטעינת היסטוריה:', error);
        showNotification('שגיאה בטעינת היסטוריה', 'error');
    }
}

function closeHistoryModal() {
    document.getElementById('investment-history-modal').classList.add('hidden');
}

function displayInvestmentHistory(history) {
    const container = document.getElementById('investment-history-content');
    
    if (history.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">אין היסטוריה עדיין</p>';
        return;
    }
    
    const getChangeTypeIcon = (type) => {
        switch(type) {
            case 'created': return '<i class="fas fa-plus text-green-500"></i>';
            case 'updated': return '<i class="fas fa-edit text-blue-500"></i>';
            case 'deleted': return '<i class="fas fa-trash text-red-500"></i>';
            case 'restored': return '<i class="fas fa-undo text-purple-500"></i>';
            case 'backup_before_restore': return '<i class="fas fa-archive text-gray-500"></i>';
            default: return '<i class="fas fa-circle text-gray-400"></i>';
        }
    };
    
    const getChangeTypeText = (type) => {
        switch(type) {
            case 'created': return 'נוצרה';
            case 'updated': return 'עודכנה';
            case 'deleted': return 'נמחקה';
            case 'restored': return 'שוחזרה';
            case 'backup_before_restore': return 'גיבוי';
            default: return 'שונה';
        }
    };
    
    container.innerHTML = `
        <div class="space-y-4">
            ${history.map(entry => `
                <div class="border-r-4 border-blue-200 bg-gray-50 p-4 rounded">
                    <div class="flex justify-between items-start mb-2">
                        <div class="flex items-center gap-2">
                            ${getChangeTypeIcon(entry.change_type)}
                            <span class="font-semibold text-gray-800">${getChangeTypeText(entry.change_type)}</span>
                            <span class="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">v${entry.version}</span>
                        </div>
                        <div class="text-left">
                            <p class="text-xs text-gray-500">${formatDate(entry.changed_at)}</p>
                            ${entry.change_type !== 'deleted' && entry.change_type !== 'backup_before_restore' ? `
                                <button onclick="restoreInvestmentVersion(${entry.investment_id}, ${entry.version})" 
                                        class="text-xs text-blue-500 hover:text-blue-700 mt-1">
                                    <i class="fas fa-undo mr-1"></i>שחזר לגרסה זו
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="text-gray-600">סכום:</span>
                            <span class="font-medium">${formatCurrency(entry.amount)}</span>
                        </div>
                        <div>
                            <span class="text-gray-600">תאריך:</span>
                            <span class="font-medium">${formatDate(entry.date)}</span>
                        </div>
                        <div class="col-span-2">
                            <span class="text-gray-600">תיאור:</span>
                            <span class="font-medium">${entry.description}</span>
                        </div>
                        <div>
                            <span class="text-gray-600">קטגוריה:</span>
                            <span class="font-medium">${entry.category}</span>
                        </div>
                    </div>
                    
                    ${entry.change_description ? `
                        <div class="mt-2 text-sm text-gray-600 italic">
                            "${entry.change_description}"
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
    `;
}

async function restoreInvestmentVersion(investmentId, version) {
    if (!confirm(`האם אתה בטוח שברצונך לשחזר לגרסה ${version}?`)) return;
    
    try {
        const response = await axios.post(`/api/investments/${investmentId}/restore/${version}`);
        if (response.data.success) {
            showNotification('השקעה שוחזרה בהצלחה לגרסה קודמת');
            closeHistoryModal();
            closeEditModal();
            loadInvestments();
            if (currentSection === 'dashboard') {
                loadDashboard();
            }
        }
    } catch (error) {
        console.error('שגיאה בשחזור השקעה:', error);
        showNotification('שגיאה בשחזור השקעה', 'error');
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

    // עריכת השקעה
    document.getElementById('edit-investment-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const investmentId = document.getElementById('edit-investment-id').value;
        const formData = {
            amount: parseFloat(document.getElementById('edit-investment-amount').value),
            date: document.getElementById('edit-investment-date').value,
            description: document.getElementById('edit-investment-description').value,
            category: document.getElementById('edit-investment-category').value,
            change_description: document.getElementById('edit-change-description').value
        };
        
        try {
            const response = await axios.put(`/api/investments/${investmentId}`, formData);
            if (response.data.success) {
                showNotification('השקעה עודכנה בהצלחה');
                closeEditModal();
                loadInvestments();
                // רענון Dashboard אם אנחנו נמצאים בו
                if (currentSection === 'dashboard') {
                    loadDashboard();
                }
            }
        } catch (error) {
            console.error('שגיאה בעדכון השקעה:', error);
            showNotification('שגיאה בעדכון השקעה', 'error');
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

    // הוספת חודש חדש
    document.getElementById('add-month-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            year: parseInt(document.getElementById('new-month-year').value),
            month: parseInt(document.getElementById('new-month-month').value)
        };
        
        try {
            const response = await axios.post('/api/monthly-investments', formData);
            if (response.data.success) {
                showNotification('חודש חדש נוסף בהצלחה');
                closeAddMonthModal();
                document.getElementById('add-month-form').reset();
                loadMonthlyInvestments();
                if (currentSection === 'dashboard') {
                    loadDashboard();
                }
            }
        } catch (error) {
            console.error('שגיאה בהוספת חודש חדש:', error);
            if (error.response && error.response.data && error.response.data.error) {
                showNotification(error.response.data.error, 'error');
            } else {
                showNotification('שגיאה בהוספת חודש חדש', 'error');
            }
        }
    });

    // הגדרת תאריך היום כברירת מחדל לטפסים הישנים
    const investmentDateField = document.getElementById('investment-date');
    if (investmentDateField) {
        const today = new Date().toISOString().split('T')[0];
        investmentDateField.value = today;
    }
    
    // טעינה ראשונית של Dashboard
    loadDashboard();
});