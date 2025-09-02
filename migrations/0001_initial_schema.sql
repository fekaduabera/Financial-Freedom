-- מודל נתונים עבור אפליקציית מעקב השקעות והלוואות

-- טבלת השקעות - לכל הזנה חודשית
CREATE TABLE IF NOT EXISTS investments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  amount REAL NOT NULL,           -- סכום ההשקעה
  date DATE NOT NULL,             -- תאריך ההשקעה
  description TEXT,               -- תיאור ההשקעה
  category TEXT DEFAULT 'כללי',   -- קטגוריה (מניות, קרנות, קריפטו וכו')
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- טבלת הלוואות - לכל הלוואה
CREATE TABLE IF NOT EXISTS loans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  principal_amount REAL NOT NULL,     -- סכום ההלוואה המקורי
  current_balance REAL NOT NULL,      -- יתרה נוכחית
  interest_rate REAL DEFAULT 0,       -- שיעור ריבית שנתי
  monthly_payment REAL DEFAULT 0,     -- תשלום חודשי
  start_date DATE NOT NULL,           -- תאריך תחילת ההלוואה
  description TEXT,                   -- תיאור ההלוואה
  lender TEXT,                        -- מלווה (בנק, פרטי וכו')
  loan_type TEXT DEFAULT 'כללי',      -- סוג הלוואה (משכנתא, אישי, וכו')
  is_active BOOLEAN DEFAULT 1,        -- האם ההלוואה פעילה
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- טבלת תשלומי הלוואות - לכל תשלום חודשי
CREATE TABLE IF NOT EXISTS loan_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  loan_id INTEGER NOT NULL,
  payment_amount REAL NOT NULL,       -- סכום התשלום
  principal_payment REAL DEFAULT 0,   -- חלק הקרן בתשלום
  interest_payment REAL DEFAULT 0,    -- חלק הריבית בתשלום
  payment_date DATE NOT NULL,         -- תאריך התשלום
  remaining_balance REAL,             -- יתרה נותרת אחרי התשלום
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE
);

-- טבלת יעדים כלכליים
CREATE TABLE IF NOT EXISTS financial_goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  goal_name TEXT NOT NULL,            -- שם היעד
  target_amount REAL NOT NULL,        -- סכום היעד
  current_amount REAL DEFAULT 0,      -- סכום נוכחי
  target_date DATE,                   -- תאריך יעד
  goal_type TEXT DEFAULT 'חיסכון',     -- סוג יעד (חיסכון, השקעה, תשלום חוב)
  description TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- אינדקסים לשיפור ביצועים
CREATE INDEX IF NOT EXISTS idx_investments_date ON investments(date);
CREATE INDEX IF NOT EXISTS idx_investments_category ON investments(category);
CREATE INDEX IF NOT EXISTS idx_loans_is_active ON loans(is_active);
CREATE INDEX IF NOT EXISTS idx_loan_payments_loan_id ON loan_payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_payments_date ON loan_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_financial_goals_is_active ON financial_goals(is_active);