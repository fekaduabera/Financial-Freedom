import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

// נתונים זמניים בזיכרון (לבדיקה)
let tempInvestments = [
  { 
    id: 1, 
    amount: 5000, 
    date: '2024-01-15', 
    description: 'השקעה בקרן מדד תל אביב 35', 
    category: 'קרנות נאמנות', 
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1
  },
  { 
    id: 2, 
    amount: 3000, 
    date: '2024-02-15', 
    description: 'השקעה במניית טבע', 
    category: 'מניות', 
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1
  },
  { 
    id: 3, 
    amount: 4000, 
    date: '2024-03-15', 
    description: 'השקעה בביטקוין', 
    category: 'קריפטו', 
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1
  },
  { 
    id: 4, 
    amount: 5500, 
    date: '2024-04-15', 
    description: 'השקעה בקרן נסדק', 
    category: 'קרנות נאמנות', 
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1
  }
];

// טבלת היסטוריה להשקעות
let tempInvestmentHistory = [
  {
    id: 1,
    investment_id: 1,
    amount: 5000,
    date: '2024-01-15',
    description: 'השקעה בקרן מדד תל אביב 35',
    category: 'קרנות נאמנות',
    version: 1,
    change_type: 'created',
    change_description: 'השקעה נוצרה',
    changed_at: new Date().toISOString()
  }
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

// נתונים חודשיים להשקעות (בסגנון אקסל)
let monthlyInvestments = [
  { id: 1, year: 2024, month: 1, month_name: 'ינואר 2024', amount: 5000, cumulative: 5000, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 2, year: 2024, month: 2, month_name: 'פברואר 2024', amount: 3000, cumulative: 8000, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 3, year: 2024, month: 3, month_name: 'מרץ 2024', amount: 4000, cumulative: 12000, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 4, year: 2024, month: 4, month_name: 'אפריל 2024', amount: 5500, cumulative: 17500, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 5, year: 2024, month: 5, month_name: 'מאי 2024', amount: 2800, cumulative: 20300, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 6, year: 2024, month: 6, month_name: 'יוני 2024', amount: 4500, cumulative: 24800, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 7, year: 2024, month: 7, month_name: 'יולי 2024', amount: 3400, cumulative: 28200, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 8, year: 2024, month: 8, month_name: 'אוגוסט 2024', amount: 4400, cumulative: 32600, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 9, year: 2024, month: 9, month_name: 'ספטמבר 2024', amount: 2800, cumulative: 35400, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

let nextMonthlyId = 10;

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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1
    };
    
    tempInvestments.push(newInvestment);
    
    // הוספה להיסטוריה
    const historyEntry = {
      id: tempInvestmentHistory.length + 1,
      investment_id: newInvestment.id,
      amount: newInvestment.amount,
      date: newInvestment.date,
      description: newInvestment.description,
      category: newInvestment.category,
      version: 1,
      change_type: 'created',
      change_description: 'השקעה נוצרה',
      changed_at: new Date().toISOString()
    };
    
    tempInvestmentHistory.push(historyEntry);
    
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

// עדכון השקעה עם שמירת היסטוריה
app.put('/api/investments/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const { amount, date, description, category, change_description } = await c.req.json()
    
    const investment = tempInvestments.find(inv => inv.id === id);
    if (!investment) {
      return c.json({
        success: false,
        error: 'השקעה לא נמצאה'
      }, 404)
    }
    
    // שמירת הגרסה הקודמת בהיסטוריה
    const historyEntry = {
      id: tempInvestmentHistory.length + 1,
      investment_id: id,
      amount: investment.amount,
      date: investment.date,
      description: investment.description,
      category: investment.category,
      version: investment.version,
      change_type: 'updated',
      change_description: change_description || 'עודכנה השקעה',
      changed_at: new Date().toISOString()
    };
    
    tempInvestmentHistory.push(historyEntry);
    
    // עדכון ההשקעה
    investment.amount = parseFloat(amount) || investment.amount;
    investment.date = date || investment.date;
    investment.description = description || investment.description;
    investment.category = category || investment.category;
    investment.updated_at = new Date().toISOString();
    investment.version += 1;
    
    return c.json({
      success: true,
      data: investment
    })
  } catch (error) {
    return c.json({
      success: false,
      error: 'שגיאה בעדכון השקעה'
    }, 500)
  }
})

app.delete('/api/investments/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const investment = tempInvestments.find(inv => inv.id === id);
    
    if (investment) {
      // שמירה בהיסטוריה לפני מחיקה
      const historyEntry = {
        id: tempInvestmentHistory.length + 1,
        investment_id: id,
        amount: investment.amount,
        date: investment.date,
        description: investment.description,
        category: investment.category,
        version: investment.version,
        change_type: 'deleted',
        change_description: 'השקעה נמחקה',
        changed_at: new Date().toISOString()
      };
      
      tempInvestmentHistory.push(historyEntry);
    }
    
    tempInvestments = tempInvestments.filter(inv => inv.id !== id);
    return c.json({ success: true })
  } catch (error) {
    return c.json({
      success: false,
      error: 'שגיאה במחיקת השקעה'
    }, 500)
  }
})

// קבלת היסטוריה של השקעה
app.get('/api/investments/:id/history', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const history = tempInvestmentHistory
      .filter(h => h.investment_id === id)
      .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime());
    
    return c.json({ 
      success: true, 
      data: history 
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'שגיאה בטעינת היסטוריה' 
    }, 500)
  }
})

// שחזור השקעה לגרסה קודמת
app.post('/api/investments/:id/restore/:version', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const version = parseInt(c.req.param('version'));
    
    const investment = tempInvestments.find(inv => inv.id === id);
    const historyEntry = tempInvestmentHistory.find(h => 
      h.investment_id === id && h.version === version
    );
    
    if (!investment || !historyEntry) {
      return c.json({
        success: false,
        error: 'השקעה או גרסה לא נמצאו'
      }, 404)
    }
    
    // שמירת הגרסה הנוכחית בהיסטוריה לפני השחזור
    const currentHistoryEntry = {
      id: tempInvestmentHistory.length + 1,
      investment_id: id,
      amount: investment.amount,
      date: investment.date,
      description: investment.description,
      category: investment.category,
      version: investment.version,
      change_type: 'backup_before_restore',
      change_description: `גיבוי לפני שחזור לגרסה ${version}`,
      changed_at: new Date().toISOString()
    };
    
    tempInvestmentHistory.push(currentHistoryEntry);
    
    // שחזור לגרסה קודמת
    investment.amount = historyEntry.amount;
    investment.date = historyEntry.date;
    investment.description = historyEntry.description;
    investment.category = historyEntry.category;
    investment.updated_at = new Date().toISOString();
    investment.version += 1;
    
    // רישום השחזור בהיסטוריה
    const restoreHistoryEntry = {
      id: tempInvestmentHistory.length + 1,
      investment_id: id,
      amount: investment.amount,
      date: investment.date,
      description: investment.description,
      category: investment.category,
      version: investment.version,
      change_type: 'restored',
      change_description: `שוחזר מגרסה ${version}`,
      changed_at: new Date().toISOString()
    };
    
    tempInvestmentHistory.push(restoreHistoryEntry);
    
    return c.json({
      success: true,
      data: investment
    })
  } catch (error) {
    return c.json({
      success: false,
      error: 'שגיאה בשחזור השקעה'
    }, 500)
  }
})

// ========================
// API Routes - השקעות חודשיות (Monthly Investments)
// ========================

// קבלת כל ההשקעות החודשיות
app.get('/api/monthly-investments', async (c) => {
  try {
    const sortedData = monthlyInvestments.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
    
    return c.json({ 
      success: true, 
      data: sortedData 
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'שגיאה בטעינת השקעות חודשיות' 
    }, 500)
  }
})

// עדכון השקעה חודשית
app.put('/api/monthly-investments/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const { amount } = await c.req.json();
    
    const monthlyInvestment = monthlyInvestments.find(m => m.id === id);
    if (!monthlyInvestment) {
      return c.json({
        success: false,
        error: 'השקעה חודשית לא נמצאה'
      }, 404)
    }
    
    // עדכון הסכום
    monthlyInvestment.amount = parseFloat(amount) || 0;
    monthlyInvestment.updated_at = new Date().toISOString();
    
    // חישוב מחדש של סכומים מצטברים
    recalculateCumulativeAmounts();
    
    return c.json({
      success: true,
      data: monthlyInvestment
    })
  } catch (error) {
    return c.json({
      success: false,
      error: 'שגיאה בעדכון השקעה חודשית'
    }, 500)
  }
})

// הוספת חודש חדש
app.post('/api/monthly-investments', async (c) => {
  try {
    const { year, month } = await c.req.json();
    
    if (!year || !month) {
      return c.json({
        success: false,
        error: 'שנה וחודש הם שדות חובה'
      }, 400)
    }
    
    // בדיקה שהחודש לא קיים כבר
    const exists = monthlyInvestments.find(m => m.year === year && m.month === month);
    if (exists) {
      return c.json({
        success: false,
        error: 'חודש זה כבר קיים'
      }, 400)
    }
    
    const monthNames = [
      'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
      'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
    ];
    
    const newMonthlyInvestment = {
      id: nextMonthlyId++,
      year: parseInt(year),
      month: parseInt(month),
      month_name: `${monthNames[month - 1]} ${year}`,
      amount: 0,
      cumulative: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    monthlyInvestments.push(newMonthlyInvestment);
    recalculateCumulativeAmounts();
    
    return c.json({
      success: true,
      data: newMonthlyInvestment
    })
  } catch (error) {
    return c.json({
      success: false,
      error: 'שגיאה בהוספת חודש חדש'
    }, 500)
  }
})

// מחיקת חודש
app.delete('/api/monthly-investments/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    monthlyInvestments = monthlyInvestments.filter(m => m.id !== id);
    recalculateCumulativeAmounts();
    
    return c.json({ success: true })
  } catch (error) {
    return c.json({
      success: false,
      error: 'שגיאה במחיקת חודש'
    }, 500)
  }
})

// פונקציה לחישוב מחדש של סכומים מצטברים
function recalculateCumulativeAmounts() {
  const sortedData = monthlyInvestments.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });
  
  let cumulative = 0;
  sortedData.forEach(item => {
    cumulative += item.amount;
    item.cumulative = cumulative;
  });
}

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
    // חישוב סך כל ההשקעות מהנתונים החודשיים
    const totalInvestments = monthlyInvestments.reduce((sum, inv) => sum + inv.amount, 0);
    
    // חישוב סך כל החובות
    const totalDebts = tempLoans
      .filter(loan => loan.is_active)
      .reduce((sum, loan) => sum + loan.current_balance, 0);
    
    // חישוב התקדמות יעדים
    const activeGoals = tempGoals.filter(goal => goal.is_active);
    const totalSaved = activeGoals.reduce((sum, goal) => sum + goal.current_amount, 0);
    const totalTarget = activeGoals.reduce((sum, goal) => sum + goal.target_amount, 0);
    const completionRate = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;
    
    // השקעות מצטברות לפי חודש מהנתונים החודשיים
    const monthlyInvestmentsData = monthlyInvestments
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      })
      .map(item => ({
        month: `${item.year}-${String(item.month).padStart(2, '0')}`,
        total: item.cumulative
      }));
    
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
        monthlyInvestments: monthlyInvestmentsData
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

                <!-- Monthly Investments Section (Excel Style) -->
                <div id="investments-section" class="section hidden">
                    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-xl font-semibold text-gray-800">
                                <i class="fas fa-table text-green-500 ml-2"></i>
                                השקעות חודשיות (סגנון אקסל)
                            </h3>
                            <button onclick="addNewMonth()" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                                <i class="fas fa-plus ml-1"></i>
                                הוסף חודש
                            </button>
                        </div>
                        
                        <div class="overflow-x-auto">
                            <table class="w-full border-collapse border border-gray-300" id="monthly-investments-table">
                                <thead>
                                    <tr class="bg-gray-100">
                                        <th class="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700">
                                            <i class="fas fa-calendar ml-1"></i>
                                            חודש
                                        </th>
                                        <th class="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700">
                                            <i class="fas fa-coins ml-1"></i>
                                            השקעה חודשית (₪)
                                        </th>
                                        <th class="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700">
                                            <i class="fas fa-chart-line ml-1"></i>
                                            סכום מצטבר (₪)
                                        </th>
                                        <th class="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700">
                                            <i class="fas fa-cog ml-1"></i>
                                            פעולות
                                        </th>
                                    </tr>
                                </thead>
                                <tbody id="monthly-investments-tbody">
                                    <!-- השקעות חודשיות יטענו כאן דינמית -->
                                </tbody>
                            </table>
                        </div>
                        
                        <div class="mt-4 p-4 bg-blue-50 rounded-lg">
                            <div class="flex justify-between items-center">
                                <span class="text-blue-800 font-semibold">
                                    <i class="fas fa-calculator ml-1"></i>
                                    סיכום כללי:
                                </span>
                                <div class="text-left">
                                    <span class="text-blue-900 font-bold text-lg" id="total-monthly-investments">₪0</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Legacy Individual Investments (Hidden by default) -->
                    <div class="bg-white rounded-lg shadow-md p-6" style="display: none;">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-semibold text-gray-800">
                                <i class="fas fa-list text-blue-500 ml-2"></i>
                                השקעות בודדות (מצב מתקדם)
                            </h3>
                            <button onclick="toggleLegacyInvestments()" class="text-blue-600 hover:text-blue-800 text-sm">
                                <i class="fas fa-eye ml-1"></i>
                                הצג/הסתר
                            </button>
                        </div>
                        <div id="investments-list" class="space-y-4 hidden">
                            <!-- השקעות בודדות יטענו כאן דינמית -->
                        </div>
                    </div>
                </div>

                <!-- Edit Investment Modal -->
                <div id="edit-investment-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden z-50">
                    <div class="flex items-center justify-center min-h-screen p-4">
                        <div class="bg-white rounded-lg shadow-lg max-w-md w-full">
                            <div class="px-6 py-4 border-b border-gray-200">
                                <h3 class="text-lg font-medium text-gray-900">
                                    <i class="fas fa-edit text-blue-500 ml-2"></i>
                                    עריכת השקעה
                                </h3>
                                <button onclick="closeEditModal()" class="absolute top-4 left-4 text-gray-400 hover:text-gray-600">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                            
                            <form id="edit-investment-form" class="p-6 space-y-4">
                                <input type="hidden" id="edit-investment-id">
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">סכום השקעה</label>
                                    <input type="number" id="edit-investment-amount" class="w-full border rounded-lg px-3 py-2" required>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">תאריך</label>
                                    <input type="date" id="edit-investment-date" class="w-full border rounded-lg px-3 py-2" required>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">תיאור השקעה</label>
                                    <input type="text" id="edit-investment-description" class="w-full border rounded-lg px-3 py-2">
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">קטגוריה</label>
                                    <select id="edit-investment-category" class="w-full border rounded-lg px-3 py-2">
                                        <option value="מניות">מניות</option>
                                        <option value="קרנות נאמנות">קרנות נאמנות</option>
                                        <option value="אגחות">אגחות</option>
                                        <option value="קריפטו">קריפטו</option>
                                        <option value="נדלן">נדלן</option>
                                        <option value="כללי">כללי</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">סיבת השינוי</label>
                                    <input type="text" id="edit-change-description" placeholder="למשל: תיקון סכום, עדכון תיאור" class="w-full border rounded-lg px-3 py-2">
                                </div>
                                
                                <div class="flex justify-between pt-4">
                                    <button type="button" onclick="showInvestmentHistory()" class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600">
                                        <i class="fas fa-history ml-1"></i>
                                        היסטוריה
                                    </button>
                                    
                                    <div class="space-x-2 space-x-reverse">
                                        <button type="button" onclick="closeEditModal()" class="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">
                                            ביטול
                                        </button>
                                        <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                                            <i class="fas fa-save ml-1"></i>
                                            שמור שינויים
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                <!-- Investment History Modal -->
                <div id="investment-history-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden z-50">
                    <div class="flex items-center justify-center min-h-screen p-4">
                        <div class="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
                            <div class="px-6 py-4 border-b border-gray-200">
                                <h3 class="text-lg font-medium text-gray-900">
                                    <i class="fas fa-history text-green-500 ml-2"></i>
                                    היסטוריית השינויים
                                </h3>
                                <button onclick="closeHistoryModal()" class="absolute top-4 left-4 text-gray-400 hover:text-gray-600">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                            
                            <div class="p-6 overflow-y-auto max-h-[60vh]">
                                <div id="investment-history-content">
                                    <!-- היסטוריה תיטען כאן דינמית -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Add New Month Modal -->
                <div id="add-month-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden z-50">
                    <div class="flex items-center justify-center min-h-screen p-4">
                        <div class="bg-white rounded-lg shadow-lg max-w-md w-full">
                            <div class="px-6 py-4 border-b border-gray-200">
                                <h3 class="text-lg font-medium text-gray-900">
                                    <i class="fas fa-plus text-green-500 ml-2"></i>
                                    הוספת חודש חדש
                                </h3>
                                <button onclick="closeAddMonthModal()" class="absolute top-4 left-4 text-gray-400 hover:text-gray-600">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                            
                            <form id="add-month-form" class="p-6 space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">שנה</label>
                                    <select id="new-month-year" class="w-full border rounded-lg px-3 py-2" required>
                                        <option value="">בחר שנה</option>
                                        <option value="2023">2023</option>
                                        <option value="2024" selected>2024</option>
                                        <option value="2025">2025</option>
                                        <option value="2026">2026</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">חודש</label>
                                    <select id="new-month-month" class="w-full border rounded-lg px-3 py-2" required>
                                        <option value="">בחר חודש</option>
                                        <option value="1">ינואר</option>
                                        <option value="2">פברואר</option>
                                        <option value="3">מרץ</option>
                                        <option value="4">אפריל</option>
                                        <option value="5">מאי</option>
                                        <option value="6">יוני</option>
                                        <option value="7">יולי</option>
                                        <option value="8">אוגוסט</option>
                                        <option value="9">ספטמבר</option>
                                        <option value="10">אוקטובר</option>
                                        <option value="11">נובמבר</option>
                                        <option value="12">דצמבר</option>
                                    </select>
                                </div>
                                
                                <div class="flex justify-end space-x-2 space-x-reverse pt-4">
                                    <button type="button" onclick="closeAddMonthModal()" class="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">
                                        ביטול
                                    </button>
                                    <button type="submit" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                                        <i class="fas fa-plus ml-1"></i>
                                        הוסף חודש
                                    </button>
                                </div>
                            </form>
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