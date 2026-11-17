# MudrikDidtribution

חלוקה אקראית של המשתתפים הנוכחים לשלוש קבוצות. האפליקציה סטטית ופועלת כולה בדפדפן: אין שרת, אין חשבונות ואין שליחת נתונים החוצה. בנק השמות, הנוכחות והחלוקה האחרונה נשמרים ב־localStorage של הדפדפן בלבד.

## הרצה מקומית

נדרש Node.js 20 ומעלה.

```bash
npm install
npm run dev        # שרת פיתוח, http://localhost:5173
```

גרסת הפצה:

```bash
npm run build      # בדיקת טיפוסים ובנייה לתיקיית dist
npm run preview    # הגשת dist, http://localhost:4173
```

תיקיית `dist` היא אתר סטטי שאפשר להגיש מכל שרת קבצים, גם מתת־נתיב.

## פריסה

הקובץ `.github/workflows/deploy.yml` בונה ובודק כל Pull Request, ובכל דחיפה ל־`main` גם מפרסם את `dist` ל־GitHub Pages. הגדרה חד־פעמית במאגר: Settings ← Pages ← Source: **GitHub Actions**. האתר המפורסם ציבורי. השמות נשמרים בדפדפן בלבד ואינם עולים לשרת.

## בדיקות

```bash
npm test           # בדיקות הלוגיקה (Vitest)
```

## מבנה

| נתיב | תוכן |
|---|---|
| `src/lib/names.ts` | פירוק רשימת שמות, ניקוי רווחים, זיהוי כפילויות |
| `src/lib/distribute.ts` | ערבוב Fisher–Yates עם Web Crypto, חלוקה לשלוש וערבוב מחדש |
| `src/lib/state.ts` | בנק השמות, הנוכחות והחלוקה, וביטול החלוקה כשהנוכחות משתנה |
| `src/lib/storage.ts` | שמירה, שחזור ואימות הנתונים מ־localStorage |
| `src/components` | שני המסכים: בחירת משתתפים ותוצאות החלוקה |
| `src/styles.css` | העיצוב, לפי `DESIGN.md` |

הגופן Heebo מוגש מקומית מתוך `src/assets/fonts`, ברישיון SIL Open Font License (הקובץ `OFL.txt` באותה תיקייה).
