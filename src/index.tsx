import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

type Bindings = {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS for API routes
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// ========================
// API Routes - השקעות (Investments)
// ========================

// קבלת כל ההשקעות
app.get('/api/investments', async (c) => {
  try {
    const { env } = c
    
    const result = await env.DB.prepare(`
      SELECT 
        id, amount, date, description, category, 
        created_at, updated_at
      FROM investments 
      ORDER BY date DESC
    `).all()
    
    return c.json({ 
      success: true, 
      data: result.results || [] 
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'שגיאה בטעינת השקעות' 
    }, 500)
  }
})

// הוספת השקעה חדשה
app.post('/api/investments', async (c) => {
  try {
    const { env } = c
    const { amount, date, description, category } = await c.req.json()
    
    if (!amount || !date) {
      return c.json({
        success: false,
        error: 'סכום ותאריך הם שדות חובה'
      }, 400)
    }
    
    const result = await env.DB.prepare(`
      INSERT INTO investments (amount, date, description, category)
      VALUES (?, ?, ?, ?)
    `).bind(amount, date, description || '', category || 'כללי').run()
    
    return c.json({
      success: true,
      data: { 
        id: result.meta.last_row_id, 
        amount, 
        date, 
        description, 
        category 
      }
    })
  } catch (error) {
    return c.json({
      success: false,
      error: 'שגיאה בהוספת השקעה'
    }, 500)
  }
})

// מחיקת השקעה
app.delete('/api/investments/:id', async (c) => {
  try {
    const { env } = c
    const id = c.req.param('id')
    
    await env.DB.prepare(`
      DELETE FROM investments WHERE id = ?
    `).bind(id).run()
    
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

// קבלת כל ההלוואות הפעילות
app.get('/api/loans', async (c) => {
  try {
    const { env } = c
    
    const result = await env.DB.prepare(`
      SELECT 
        id, principal_amount, current_balance, interest_rate,
        monthly_payment, start_date, description, lender, loan_type,
        is_active, created_at, updated_at
      FROM loans 
      WHERE is_active = 1
      ORDER BY start_date DESC
    `).all()
    
    return c.json({ 
      success: true, 
      data: result.results || [] 
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'שגיאה בטעינת הלוואות' 
    }, 500)
  }
})

// הוספת הלוואה חדשה
app.post('/api/loans', async (c) => {
  try {
    const { env } = c
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
    
    const result = await env.DB.prepare(`
      INSERT INTO loans (
        principal_amount, current_balance, interest_rate, 
        monthly_payment, start_date, description, lender, loan_type
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      principal_amount, 
      current_balance, 
      interest_rate || 0, 
      monthly_payment || 0, 
      start_date, 
      description || '', 
      lender || '', 
      loan_type || 'כללי'
    ).run()
    
    return c.json({
      success: true,
      data: { 
        id: result.meta.last_row_id, 
        principal_amount,
        current_balance,
        interest_rate,
        monthly_payment,
        start_date,
        description,
        lender,
        loan_type
      }
    })
  } catch (error) {
    return c.json({
      success: false,
      error: 'שגיאה בהוספת הלוואה'
    }, 500)
  }
})

// הוספת תשלום הלוואה
app.post('/api/loans/:id/payments', async (c) => {
  try {
    const { env } = c
    const loanId = c.req.param('id')
    const { 
      payment_amount, 
      principal_payment, 
      interest_payment, 
      payment_date, 
      description 
    } = await c.req.json()
    
    if (!payment_amount || !payment_date) {
      return c.json({
        success: false,
        error: 'סכום תשלום ותאריך הם שדות חובה'
      }, 400)
    }
    
    // עדכון יתרת ההלוואה
    const principalPmt = principal_payment || payment_amount
    
    await env.DB.prepare(`
      UPDATE loans 
      SET current_balance = current_balance - ?, 
          updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).bind(principalPmt, loanId).run()
    
    // קבלת היתרה החדשה
    const loanResult = await env.DB.prepare(`
      SELECT current_balance FROM loans WHERE id = ?
    `).bind(loanId).first()
    
    const remaining_balance = loanResult ? loanResult.current_balance : 0
    
    // הוספת התשלום לטבלה
    const result = await env.DB.prepare(`
      INSERT INTO loan_payments (
        loan_id, payment_amount, principal_payment, 
        interest_payment, payment_date, remaining_balance, description
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      loanId, 
      payment_amount, 
      principal_payment || payment_amount, 
      interest_payment || 0, 
      payment_date, 
      remaining_balance,
      description || ''
    ).run()
    
    return c.json({
      success: true,
      data: { 
        id: result.meta.last_row_id,
        remaining_balance
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

// קבלת כל היעדים הפעילים
app.get('/api/goals', async (c) => {
  try {
    const { env } = c
    
    const result = await env.DB.prepare(`
      SELECT 
        id, goal_name, target_amount, current_amount, 
        target_date, goal_type, description, is_active,
        created_at, updated_at
      FROM financial_goals 
      WHERE is_active = 1
      ORDER BY target_date ASC
    `).all()
    
    return c.json({ 
      success: true, 
      data: result.results || [] 
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'שגיאה בטעינת יעדים' 
    }, 500)
  }
})

// הוספת יעד חדש
app.post('/api/goals', async (c) => {
  try {
    const { env } = c
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
    
    const result = await env.DB.prepare(`
      INSERT INTO financial_goals (
        goal_name, target_amount, current_amount, 
        target_date, goal_type, description
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      goal_name, 
      target_amount, 
      current_amount || 0, 
      target_date || null, 
      goal_type || 'חיסכון', 
      description || ''
    ).run()
    
    return c.json({
      success: true,
      data: { 
        id: result.meta.last_row_id, 
        goal_name,
        target_amount,
        current_amount,
        target_date,
        goal_type,
        description
      }
    })
  } catch (error) {
    return c.json({
      success: false,
      error: 'שגיאה בהוספת יעד'
    }, 500)
  }
})

// עדכון יעד (הוספת כסף ליעד)
app.put('/api/goals/:id', async (c) => {
  try {
    const { env } = c
    const goalId = c.req.param('id')
    const { current_amount } = await c.req.json()
    
    await env.DB.prepare(`
      UPDATE financial_goals 
      SET current_amount = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).bind(current_amount, goalId).run()
    
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
    const { env } = c
    
    // סך כל ההשקעות
    const investmentsTotal = await env.DB.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM investments
    `).first()
    
    // סך כל החובות
    const loansTotal = await env.DB.prepare(`
      SELECT COALESCE(SUM(current_balance), 0) as total 
      FROM loans 
      WHERE is_active = 1
    `).first()
    
    // התקדמות יעדים
    const goalsProgress = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_goals,
        COALESCE(SUM(current_amount), 0) as total_saved,
        COALESCE(SUM(target_amount), 0) as total_target
      FROM financial_goals 
      WHERE is_active = 1
    `).first()
    
    // השקעות לפי חודש (12 חודשים אחרונים)
    const monthlyInvestments = await env.DB.prepare(`
      SELECT 
        strftime('%Y-%m', date) as month,
        SUM(amount) as total
      FROM investments 
      WHERE date >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month ASC
    `).all()
    
    return c.json({
      success: true,
      data: {
        totalInvestments: investmentsTotal?.total || 0,
        totalDebts: loansTotal?.total || 0,
        netWorth: (investmentsTotal?.total || 0) - (loansTotal?.total || 0),
        goals: {
          totalGoals: goalsProgress?.total_goals || 0,
          totalSaved: goalsProgress?.total_saved || 0,
          totalTarget: goalsProgress?.total_target || 0,
          completionRate: goalsProgress?.total_target > 0 
            ? Math.round(((goalsProgress?.total_saved || 0) / goalsProgress.total_target) * 100) 
            : 0
        },
        monthlyInvestments: monthlyInvestments.results || []
      }
    })
  } catch (error) {
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

                    <div class="bg-white rounded-lg shadow-md p-6">
                        <h3 class="text-xl font-semibold text-gray-800 mb-4">
                            <i class="fas fa-chart-area text-blue-500 ml-2"></i>
                            מגמת השקעות חודשית
                        </h3>
                        <canvas id="investmentsChart" width="400" height="200"></canvas>
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