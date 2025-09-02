# 📊 מעקב השקעות והלוואות

## תיאור הפרויקט
אפליקציית web מתקדמת למעקב אחר השקעות, הלוואות ויעדים כלכליים אישיים. האפליקציה בנויה עם טכנולוגיות מתקדמות של Cloudflare ומספקת ממשק משתמש אינטואיטיבי בעברית.

## ✨ תכונות מושלמות
- ✅ **הזנת השקעות חודשיות** - מעקב מפורט אחר כל השקעה עם תאריך, סכום וקטגוריה
- ✅ **ניהול הלוואות** - מעקב אחר יתרות, תשלומים חודשיים וריבית
- ✅ **יעדים כלכליים** - הגדרת יעדים ומעקב אחר התקדמות
- ✅ **לוח בקרה מתקדם** - סטטיסטיקות ומגמות חזותיות
- ✅ **גרפים אינטראקטיביים** - הצגה חזותית של הנתונים הכלכליים
- ✅ **ממשק רספונסיבי** - עבודה מושלמת על מובייל ומחשב

## תכונות בפיתוח
- ⏳ **ייצוא נתונים** - Excel/PDF
- ⏳ **התראות** - תזכורות לתשלומים ויעדים
- ⏳ **קטגוריות מתקדמות** - תגיות ומסננים מתקדמים
- ⏳ **ניתוח סיכונים** - הערכת פרופיל סיכון
- ⏳ **גיבוי אוטומטי** - גיבוי נתונים לענן

## 🌐 כתובות URL

### לפיתוח (Sandbox)
- **פרונט אנד**: http://localhost:3000
- **API Base**: http://localhost:3000/api
- **Dashboard**: http://localhost:3000/api/dashboard

### API Endpoints מושלמים

#### 📈 השקעות (Investments)
- `GET /api/investments` - קבלת כל ההשקעות
- `POST /api/investments` - הוספת השקעה חדשה
  ```json
  {
    "amount": 5000,
    "date": "2024-09-02",
    "description": "השקעה בקרן מדד",
    "category": "קרנות נאמנות"
  }
  ```
- `DELETE /api/investments/:id` - מחיקת השקעה

#### 💳 הלוואות (Loans)
- `GET /api/loans` - קבלת כל ההלוואות הפעילות
- `POST /api/loans` - הוספת הלוואה חדשה
  ```json
  {
    "principal_amount": 500000,
    "current_balance": 450000,
    "interest_rate": 4.5,
    "monthly_payment": 3200,
    "start_date": "2024-01-01",
    "description": "משכנתא",
    "lender": "בנק הפועלים",
    "loan_type": "משכנתא"
  }
  ```
- `POST /api/loans/:id/payments` - הוספת תשלום הלוואה
  ```json
  {
    "payment_amount": 3200,
    "principal_payment": 1500,
    "interest_payment": 1700,
    "payment_date": "2024-09-01",
    "description": "תשלום חודשי ספטמבר"
  }
  ```

#### 🎯 יעדים כלכליים (Financial Goals)
- `GET /api/goals` - קבלת כל היעדים הפעילים
- `POST /api/goals` - הוספת יעד חדש
  ```json
  {
    "goal_name": "קרן חירום",
    "target_amount": 100000,
    "current_amount": 25000,
    "target_date": "2024-12-31",
    "goal_type": "חיסכון",
    "description": "קרן חירום של 6 חודשי הוצאות"
  }
  ```
- `PUT /api/goals/:id` - עדכון יעד
  ```json
  {
    "current_amount": 30000
  }
  ```

#### 📊 לוח בקרה (Dashboard)
- `GET /api/dashboard` - נתונים מסכמים
  ```json
  {
    "success": true,
    "data": {
      "totalInvestments": 45000,
      "totalDebts": 350000,
      "netWorth": -305000,
      "goals": {
        "totalGoals": 3,
        "totalSaved": 50000,
        "totalTarget": 200000,
        "completionRate": 25
      },
      "monthlyInvestments": [...]
    }
  }
  ```

## 🏗️ ארכיטקטורת נתונים

### מודל הנתונים
האפליקציה משתמשת במסד נתונים **Cloudflare D1** (SQLite) עם הטבלאות הבאות:

#### `investments` - השקעות
- `id` - מזהה ייחודי
- `amount` - סכום ההשקעה
- `date` - תאריך ההשקעה
- `description` - תיאור ההשקעה
- `category` - קטגוריה (מניות, קרנות, קריפטו וכו')
- `created_at`, `updated_at` - חותמות זמן

#### `loans` - הלוואות
- `id` - מזהה ייחודי
- `principal_amount` - סכום הלוואה מקורי
- `current_balance` - יתרה נוכחית
- `interest_rate` - ריבית שנתית
- `monthly_payment` - תשלום חודשי
- `start_date` - תאריך תחילת הלוואה
- `description`, `lender`, `loan_type` - פרטי הלוואה
- `is_active` - האם הלוואה פעילה

#### `loan_payments` - תשלומי הלוואות
- `id` - מזהה ייחודי
- `loan_id` - קישור להלוואה
- `payment_amount` - סכום התשלום
- `principal_payment` - חלק הקרן
- `interest_payment` - חלק הריבית
- `payment_date` - תאריך התשלום
- `remaining_balance` - יתרה נותרת

#### `financial_goals` - יעדים כלכליים
- `id` - מזהה ייחודי
- `goal_name` - שם היעד
- `target_amount` - סכום היעד
- `current_amount` - סכום נוכחי
- `target_date` - תאריך יעד
- `goal_type` - סוג יעד (חיסכון, השקעה, תשלום חוב)

### שירותי אחסון
- **Cloudflare D1**: מסד נתונים ראשי - SQLite מבוזר גלובלית
- **Local Development**: SQLite מקומי עם `--local` flag

## 📱 מדריך משתמש

### דף הבית - לוח בקרה
- צפייה בסיכום כלכלי כללי
- גרף מגמת השקעות חודשית
- סטטיסטיקות מרכזיות: סך השקעות, חובות, הון נטו

### ניהול השקעות
1. **הוספת השקעה**: הזן סכום, תאריך, תיאור וקטגוריה
2. **צפייה ברשימה**: כל ההשקעות מוצגות בסדר תאריכים
3. **מחיקת השקעה**: כפתור מחיקה בכל רשומה

### ניהול הלוואות
1. **הוספת הלוואה**: פרטי הלוואה מלאים כולל ריבית ותשלום חודשי
2. **תשלומי הלוואה**: הוספת תשלומים שמעדכנים את היתרה אוטומטית
3. **מעקב יתרות**: עדכון יתרה בזמן אמת לאחר כל תשלום

### ניהול יעדים כלכליים
1. **הגדרת יעדים**: שם, סכום יעד, תאריך וסוג יעד
2. **מעקב התקדמות**: סרגל התקדמות חזותי ואחוזי השלמה
3. **עדכון סכומים**: הוספת כסף ליעד בקלות

## 🚀 פריסה ופיתוח

### Platform
- **Cloudflare Pages** - פלטפורמת אירוח ופריסה
- **Cloudflare D1** - מסד נתונים מבוזר
- **Cloudflare Workers** - Edge runtime

### טכנולוגיות
- **Backend**: Hono Framework + TypeScript
- **Frontend**: Vanilla JavaScript + TailwindCSS + Chart.js
- **Database**: Cloudflare D1 (SQLite)
- **Build Tool**: Vite
- **Development**: Wrangler CLI

### סטטוס פריסה
- **מצב פיתוח**: ✅ פעיל
- **בסיס נתונים**: ✅ הוקם עם נתוני דוגמה
- **API Routes**: ✅ פועלים
- **Frontend UI**: ✅ מושלם
- **עדכון אחרון**: 2024-09-02

### הוראות הפעלה מקומית
```bash
# הורדת dependencies
npm install

# הקמת מסד נתונים מקומי
npm run db:migrate:local
npm run db:seed

# בנייה
npm run build

# הפעלה עם PM2
pm2 start ecosystem.config.cjs

# גישה לאפליקציה
curl http://localhost:3000
```

### צעדים מומלצים להמשך פיתוח
1. **חיבור ל-GitHub** - העלאת הקוד למאגר
2. **פריסה ל-Cloudflare Pages** - פריסה לסביבת production  
3. **הוספת אימות משתמשים** - מערכת התחברות
4. **שיפור גרפים** - גרפים נוספים ואינטראקטיביים יותר
5. **ייצוא נתונים** - יכולת ייצוא Excel/PDF
6. **התראות** - מערכת התראות והתזכורות

## 🔧 תמיכה טכנית
בעיות נפוצות:
- **שגיאת מסד נתונים**: וודא שהמיגרציות רצו בהצלחה
- **בעיות CORS**: וודא ש-API routes מגדירים CORS נכון
- **בעיות בנייה**: נקה את תיקיית dist ובנה מחדש

## 📄 רישיון
פרויקט פרטי לשימוש אישי