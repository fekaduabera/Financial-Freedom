import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

// נתונים זמניים בזיכרון (לבדיקה)
let tempInvestments = [
  { id: 1, amount: 5000, date: '2024-01-15', description: 'השקעה בקרן מדד תל אביב 35', category: 'קרנות נאמנות', created_at: new Date().toISOString() },
  { id: 2, amount: 3000, date: '2024-02-15', description: 'השקעה במניית טבע', category: 'מניות', created_at: new Date().toISOString() },
  { id: 3, amount: 4000, date: '2024-03-15', description: 'השקעה בביטקוין', category: 'קריפטו', created_at: new Date().toISOString() },
  { id: 4, amount: 5500, date: '2024-04-15', description: 'השקעה בקרן נסדק', category: 'קרנות נאמנות', created_at: new Date().toISOString() }
];

let tempLoans = [
  { 
    id: 1, 
    principal_amount: 800000, 
    current_balance: 720000, 
    interest_rate: 4.5, 
    monthly_payment: 4200, 
    start_date: '2023-01-01', 
    description: 'משכנתא לדירה ברמת גן', 
    lender: 'בנק הפועלים', 
    loan_type: 'משכנתא',
    is_active: 1
  },
  { 
    id: 2, 
    principal_amount: 50000, 
    current_balance: 35000, 
    interest_rate: 8.2, 
    monthly_payment: 1800, 
    start_date: '2023-06-01', 
    description: 'הלוואה לרכב', 
    lender: 'בנק לאומי', 
    loan_type: 'רכב',
    is_active: 1
  }
];

let tempGoals = [
  {
    id: 1,
    goal_name: 'קרן חירום',
    target_amount: 100000,
    current_amount: 65000,
    target_date: '2024-12-31',
    goal_type: 'חיסכון',
    description: 'קרן חירום של 6 חודשי הוצאות',
    is_active: 1
  },
  {
    id: 2,
    goal_name: 'דירה חדשה',
    target_amount: 400000,
    current_amount: 120000,
    target_date: '2026-06-01',
    goal_type: 'השקעה',
    description: 'מקדמה לדירה חדשה',
    is_active: 1
  }
];

let nextId = { investment: 5, loan: 3, goal: 3 };

const app = new Hono()

// Enable CORS for API routes
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// Serve favicon
app.get('/favicon.ico', serveStatic({ path: './public/favicon.ico' }))

// ========================
// API Routes - השקעות (Investments)
// ========================

app.get('/api/investments', async (c) => {
  try {
    return c.json({ 
      success: true, 
      data: tempInvestments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'שגיאה בטעינת השקעות' 
    }, 500)
  }
})

app.post('/api/investments', async (c) => {
  try {
    const { amount, date, description, category } = await c.req.json()
    
    if (!amount || !date) {
      return c.json({
        success: false,
        error: 'סכום ותאריך הם שדות חובה'
      }, 400)
    }
    
    const newInvestment = {
      id: nextId.investment++,
      amount: parseFloat(amount),
      date,
      description: description || '',
      category: category || 'כללי',
      created_at: new Date().toISOString()
    };
    
    tempInvestments.push(newInvestment);
    
    return c.json({
      success: true,
      data: newInvestment
    })
  } catch (error) {
    return c.json({
      success: false,
      error: 'שגיאה בהוספת השקעה'
    }, 500)
  }
})

app.delete('/api/investments/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    tempInvestments = tempInvestments.filter(inv => inv.id !== id);
    return c.json({ success: true })
  } catch (error) {
    return c.json({
      success: false,
      error: 'שגיאה במחיקת השקעה'
    }, 500)
  }
})

// ========================
// API Routes - הלוואות (Loans)  
// ========================

app.get('/api/loans', async (c) => {
  try {
    return c.json({ 
      success: true, 
      data: tempLoans.filter(loan => loan.is_active)
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'שגיאה בטעינת הלוואות' 
    }, 500)
  }
})

app.post('/api/loans', async (c) => {
  try {
    const { 
      principal_amount, 
      current_balance, 
      interest_rate, 
      monthly_payment, 
      start_date, 
      description, 
      lender, 
      loan_type 
    } = await c.req.json()
    
    if (!principal_amount || !current_balance || !start_date) {
      return c.json({
        success: false,
        error: 'סכום הלוואה, יתרה נוכחית ותאריך הם שדות חובה'
      }, 400)
    }
    
    const newLoan = {
      id: nextId.loan++,
      principal_amount: parseFloat(principal_amount),
      current_balance: parseFloat(current_balance),
      interest_rate: parseFloat(interest_rate) || 0,
      monthly_payment: parseFloat(monthly_payment) || 0,
      start_date,
      description: description || '',
      lender: lender || '',
      loan_type: loan_type || 'כללי',
      is_active: 1
    };
    
    tempLoans.push(newLoan);
    
    return c.json({
      success: true,
      data: newLoan
    })
  } catch (error) {
    return c.json({
      success: false,
      error: 'שגיאה בהוספת הלוואה'
    }, 500)
  }
})

app.post('/api/loans/:id/payments', async (c) => {
  try {
    const loanId = parseInt(c.req.param('id'));
    const { payment_amount, principal_payment, payment_date, description } = await c.req.json()
    
    if (!payment_amount || !payment_date) {
      return c.json({
        success: false,
        error: 'סכום תשלום ותאריך הם שדות חובה'
      }, 400)
    }
    
    // מציאת ההלוואה ועדכון היתרה
    const loan = tempLoans.find(l => l.id === loanId);
    if (loan) {
      const principalPmt = principal_payment || payment_amount;
      loan.current_balance = Math.max(0, loan.current_balance - principalPmt);
    }
    
    return c.json({
      success: true,
      data: { 
        id: Date.now(), // ID זמני
        remaining_balance: loan ? loan.current_balance : 0
      }
    })
  } catch (error) {
    return c.json({
      success: false,
      error: 'שגיאה בהוספת תשלום הלוואה'
    }, 500)
  }
})

// ========================
// API Routes - יעדים כלכליים (Financial Goals)
// ========================

app.get('/api/goals', async (c) => {
  try {
    return c.json({ 
      success: true, 
      data: tempGoals.filter(goal => goal.is_active)
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'שגיאה בטעינת יעדים' 
    }, 500)
  }
})

app.post('/api/goals', async (c) => {
  try {
    const { 
      goal_name, 
      target_amount, 
      current_amount, 
      target_date, 
      goal_type, 
      description 
    } = await c.req.json()
    
    if (!goal_name || !target_amount) {
      return c.json({
        success: false,
        error: 'שם יעד וסכום יעד הם שדות חובה'
      }, 400)
    }
    
    const newGoal = {
      id: nextId.goal++,
      goal_name,
      target_amount: parseFloat(target_amount),
      current_amount: parseFloat(current_amount) || 0,
      target_date: target_date || null,
      goal_type: goal_type || 'חיסכון',
      description: description || '',
      is_active: 1
    };
    
    tempGoals.push(newGoal);
    
    return c.json({
      success: true,
      data: newGoal
    })
  } catch (error) {
    return c.json({
      success: false,
      error: 'שגיאה בהוספת יעד'
    }, 500)
  }
})

app.put('/api/goals/:id', async (c) => {
  try {
    const goalId = parseInt(c.req.param('id'));
    const { current_amount } = await c.req.json()
    
    const goal = tempGoals.find(g => g.id === goalId);
    if (goal) {
      goal.current_amount = parseFloat(current_amount);
    }
    
    return c.json({ success: true })
  } catch (error) {
    return c.json({
      success: false,
      error: 'שגיאה בעדכון יעד'
    }, 500)
  }
})

// ========================
// Dashboard API - נתונים מסכמים
// ========================

app.get('/api/dashboard', async (c) => {
  try {
    // חישוב סך כל ההשקעות
    const totalInvestments = tempInvestments.reduce((sum, inv) => sum + inv.amount, 0);
    
    // חישוב סך כל החובות
    const totalDebts = tempLoans
      .filter(loan => loan.is_active)
      .reduce((sum, loan) => sum + loan.current_balance, 0);
    
    // חישוב התקדמות יעדים
    const activeGoals = tempGoals.filter(goal => goal.is_active);
    const totalSaved = activeGoals.reduce((sum, goal) => sum + goal.current_amount, 0);
    const totalTarget = activeGoals.reduce((sum, goal) => sum + goal.target_amount, 0);
    const completionRate = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;
    
    // חישוב השקעות מצטברות לפי חודש (נתונים לדוגמה)
    const monthlyInvestments = [
      { month: '2024-01', total: 5000 },
      { month: '2024-02', total: 8000 },
      { month: '2024-03', total: 12000 },
      { month: '2024-04', total: 17500 },
      { month: '2024-05', total: 20300 },
      { month: '2024-06', total: 24800 },
      { month: '2024-07', total: 28200 },
      { month: '2024-08', total: 32600 },
      { month: '2024-09', total: 35400 }
    ];
    
    return c.json({
      success: true,
      data: {
        totalInvestments,
        totalDebts,
        netWorth: totalInvestments - totalDebts,
        goals: {
          totalGoals: activeGoals.length,
          totalSaved,
          totalTarget,
          completionRate
        },
        monthlyInvestments
      }
    })
  } catch (error) {
    console.error('Dashboard error:', error);
    return c.json({
      success: false,
      error: 'שגיאה בטעינת נתוני Dashboard'
    }, 500)
  }
})

// Default route - Main App
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="he" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>מעקב השקעות והלוואות</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <link href="/static/styles.css" rel="stylesheet">
        <style>
            body { font-family: 'Arial', sans-serif; }
            .rtl { direction: rtl; text-align: right; }
        </style>
    </head>
    <body class="bg-gray-100 rtl">
        <div class="min-h-screen">
            <!-- Header -->
            <header class="bg-blue-600 text-white shadow-lg">
                <div class="container mx-auto px-4 py-6">
                    <h1 class="text-3xl font-bold">
                        <i class="fas fa-chart-line mr-3"></i>
                        מעקב השקעות והלוואות
                    </h1>
                    <p class="text-blue-200 text-sm mt-2">
                        <i class="fas fa-info-circle mr-1"></i>
                        גרסת הדגמה - הנתונים נשמרים זמנית בזיכרון
                    </p>
                </div>
            </header>

            <!-- Navigation -->
            <nav class="bg-white shadow-md">
                <div class="container mx-auto px-4">
                    <div class="flex space-x-reverse space-x-6">
                        <button onclick="showSection('dashboard')" class="nav-btn py-3 px-4 text-blue-600 border-b-2 border-blue-600" id="nav-dashboard">
                            <i class="fas fa-tachometer-alt ml-2"></i>
                            לוח בקרה
                        </button>
                        <button onclick="showSection('investments')" class="nav-btn py-3 px-4 text-gray-600 hover:text-blue-600" id="nav-investments">
                            <i class="fas fa-coins ml-2"></i>
                            השקעות
                        </button>
                        <button onclick="showSection('loans')" class="nav-btn py-3 px-4 text-gray-600 hover:text-blue-600" id="nav-loans">
                            <i class="fas fa-credit-card ml-2"></i>
                            הלוואות
                        </button>
                        <button onclick="showSection('goals')" class="nav-btn py-3 px-4 text-gray-600 hover:text-blue-600" id="nav-goals">
                            <i class="fas fa-bullseye ml-2"></i>
                            יעדים כלכליים
                        </button>
                    </div>
                </div>
            </nav>

            <!-- Main Content -->
            <main class="container mx-auto px-4 py-8">
                
                <!-- Dashboard Section -->
                <div id="dashboard-section" class="section">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div class="bg-white rounded-lg shadow-md p-6">
                            <h3 class="text-lg font-semibold text-gray-700 mb-2">
                                <i class="fas fa-chart-line text-green-500 ml-2"></i>
                                סך השקעות
                            </h3>
                            <p id="total-investments" class="text-3xl font-bold text-green-600">₪0</p>
                        </div>
                        <div class="bg-white rounded-lg shadow-md p-6">
                            <h3 class="text-lg font-semibold text-gray-700 mb-2">
                                <i class="fas fa-credit-card text-red-500 ml-2"></i>
                                סך חובות
                            </h3>
                            <p id="total-debts" class="text-3xl font-bold text-red-600">₪0</p>
                        </div>
                        <div class="bg-white rounded-lg shadow-md p-6">
                            <h3 class="text-lg font-semibold text-gray-700 mb-2">
                                <i class="fas fa-balance-scale text-blue-500 ml-2"></i>
                                הון נטו
                            </h3>
                            <p id="net-worth" class="text-3xl font-bold text-blue-600">₪0</p>
                        </div>
                        <div class="bg-white rounded-lg shadow-md p-6">
                            <h3 class="text-lg font-semibold text-gray-700 mb-2">
                                <i class="fas fa-bullseye text-purple-500 ml-2"></i>
                                השלמת יעדים
                            </h3>
                            <p id="goals-completion" class="text-3xl font-bold text-purple-600">0%</p>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div class="bg-white rounded-lg shadow-md p-6">
                            <h3 class="text-xl font-semibold text-gray-800 mb-4">
                                <i class="fas fa-chart-line text-blue-500 ml-2"></i>
                                מגמת השקעות מצטברת
                            </h3>
                            <div style="position: relative; height: 300px; width: 100%;">
                                <canvas id="investmentsChart"></canvas>
                            </div>
                        </div>
                        
                        <div class="bg-white rounded-lg shadow-md p-6">
                            <h3 class="text-xl font-semibold text-gray-800 mb-4">
                                <i class="fas fa-chart-pie text-green-500 ml-2"></i>
                                השקעות לפי קטגוריה
                            </h3>
                            <div style="position: relative; height: 300px; width: 100%;">
                                <canvas id="categoriesChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Investments Section -->
                <div id="investments-section" class="section hidden">
                    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h3 class="text-xl font-semibold text-gray-800 mb-4">
                            <i class="fas fa-plus-circle text-green-500 ml-2"></i>
                            הוספת השקעה חדשה
                        </h3>
                        <form id="investment-form" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <input type="number" id="investment-amount" placeholder="סכום השקעה" class="border rounded-lg px-3 py-2" required>
                            <input type="date" id="investment-date" class="border rounded-lg px-3 py-2" required>
                            <input type="text" id="investment-description" placeholder="תיאור השקעה" class="border rounded-lg px-3 py-2">
                            <select id="investment-category" class="border rounded-lg px-3 py-2">
                                <option value="מניות">מניות</option>
                                <option value="קרנות נאמנות">קרנות נאמנות</option>
                                <option value="אגחות">אגחות</option>
                                <option value="קריפטו">קריפטו</option>
                                <option value="נדלן">נדלן</option>
                                <option value="כללי">כללי</option>
                            </select>
                            <button type="submit" class="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 md:col-span-2 lg:col-span-4">
                                <i class="fas fa-plus ml-2"></i>
                                הוסף השקעה
                            </button>
                        </form>
                    </div>

                    <div class="bg-white rounded-lg shadow-md p-6">
                        <h3 class="text-xl font-semibold text-gray-800 mb-4">
                            <i class="fas fa-list text-blue-500 ml-2"></i>
                            רשימת השקעות
                        </h3>
                        <div id="investments-list" class="space-y-4">
                            <!-- השקעות יטענו כאן דינמית -->
                        </div>
                    </div>
                </div>

                <!-- Loans Section -->
                <div id="loans-section" class="section hidden">
                    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h3 class="text-xl font-semibold text-gray-800 mb-4">
                            <i class="fas fa-plus-circle text-red-500 ml-2"></i>
                            הוספת הלוואה חדשה
                        </h3>
                        <form id="loan-form" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="number" id="loan-principal" placeholder="סכום הלוואה מקורי" class="border rounded-lg px-3 py-2" required>
                            <input type="number" id="loan-balance" placeholder="יתרה נוכחית" class="border rounded-lg px-3 py-2" required>
                            <input type="number" id="loan-interest" placeholder="ריבית שנתית %" step="0.1" class="border rounded-lg px-3 py-2">
                            <input type="number" id="loan-payment" placeholder="תשלום חודשי" class="border rounded-lg px-3 py-2">
                            <input type="date" id="loan-start" class="border rounded-lg px-3 py-2" required>
                            <input type="text" id="loan-lender" placeholder="מלווה (בנק וכו')" class="border rounded-lg px-3 py-2">
                            <input type="text" id="loan-description" placeholder="תיאור הלוואה" class="border rounded-lg px-3 py-2">
                            <select id="loan-type" class="border rounded-lg px-3 py-2">
                                <option value="משכנתא">משכנתא</option>
                                <option value="רכב">הלוואת רכב</option>
                                <option value="אישי">הלוואה אישית</option>
                                <option value="עסקי">הלוואה עסקית</option>
                                <option value="כללי">כללי</option>
                            </select>
                            <button type="submit" class="bg-red-600 text-white rounded-lg px-4 py-2 hover:bg-red-700 md:col-span-2">
                                <i class="fas fa-plus ml-2"></i>
                                הוסף הלוואה
                            </button>
                        </form>
                    </div>

                    <div id="loans-list" class="space-y-6">
                        <!-- הלוואות יטענו כאן דינמית -->
                    </div>
                </div>

                <!-- Goals Section -->
                <div id="goals-section" class="section hidden">
                    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h3 class="text-xl font-semibold text-gray-800 mb-4">
                            <i class="fas fa-plus-circle text-purple-500 ml-2"></i>
                            הוספת יעד כלכלי חדש
                        </h3>
                        <form id="goal-form" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" id="goal-name" placeholder="שם היעד" class="border rounded-lg px-3 py-2" required>
                            <input type="number" id="goal-target" placeholder="סכום יעד" class="border rounded-lg px-3 py-2" required>
                            <input type="number" id="goal-current" placeholder="סכום נוכחי (אופציונלי)" class="border rounded-lg px-3 py-2">
                            <input type="date" id="goal-date" class="border rounded-lg px-3 py-2">
                            <select id="goal-type" class="border rounded-lg px-3 py-2">
                                <option value="חיסכון">חיסכון</option>
                                <option value="השקעה">השקעה</option>
                                <option value="תשלום חוב">תשלום חוב</option>
                            </select>
                            <input type="text" id="goal-description" placeholder="תיאור היעד" class="border rounded-lg px-3 py-2">
                            <button type="submit" class="bg-purple-600 text-white rounded-lg px-4 py-2 hover:bg-purple-700 md:col-span-2">
                                <i class="fas fa-plus ml-2"></i>
                                הוסף יעד
                            </button>
                        </form>
                    </div>

                    <div id="goals-list" class="space-y-6">
                        <!-- יעדים יטענו כאן דינמית -->
                    </div>
                </div>

            </main>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app