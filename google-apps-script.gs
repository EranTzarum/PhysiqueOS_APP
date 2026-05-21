/**
 * Google Apps Script — סנכרון מסד מוצרים עם אפליקציית המעקב של ערן
 *
 * הוראות התקנה:
 * 1. פתח https://script.google.com → "פרויקט חדש"
 * 2. החלף את כל הקוד הקיים בקוד הזה
 * 3. עדכן את SPREADSHEET_ID למטה (מתוך הקישור לגיליון שלך)
 * 4. לחץ על "פרוס" → "פריסה חדשה"
 *    - סוג: Web App
 *    - הפעלה בשם: Me
 *    - מי יכול לגשת: Anyone
 * 5. אשר הרשאות → העתק את ה-URL
 * 6. הדבק את ה-URL בהגדרות האפליקציה (טאב ⚙️ → שדה Sheets URL)
 *
 * Phase 3.5: עמודה H = מנה ברירת מחדל (גרם) / defaultGrams
 */

// ─── הגדרות ──────────────────────────────────────────────────────────────────
const SPREADSHEET_ID = '1H_BMeiNaUuz4nA2162ygeozCSkRI7-UFqHsZYG6sUss';
const PRODUCTS_SHEET = 'מוצרים_DB';

// ─── GET: שלח את כל המוצרים לאפליקציה ───────────────────────────────────────
function doGet(e) {
  try {
    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();

    if (data.length <= 1) {
      return jsonResponse([]);
    }

    const products = data.slice(1)
      .filter(row => row[0] && row[0] !== '')
      .map(row => {
        const unit = parseFloat(row[2]) || 100;
        const defaultGrams = parseFloat(row[7]) || unit;
        return {
          name: String(row[0]).trim(),
          cat: String(row[1] || 'אחר').trim(),
          unit: unit,
          p: parseFloat(row[3]) || 0,
          f: parseFloat(row[4]) || 0,
          c: parseFloat(row[5]) || 0,
          kcal: parseFloat(row[6]) || 0,
          defaultGrams: defaultGrams,
        };
      });

    return jsonResponse(products);

  } catch (err) {
    return jsonResponse({ error: err.toString() });
  }
}

// ─── POST: קבל מוצר חדש מהאפליקציה ──────────────────────────────────────────
function doPost(e) {
  try {
    const product = JSON.parse(e.postData.contents);

    if (!product.name) {
      return jsonResponse({ success: false, error: 'Missing product name' });
    }

    const sheet = getOrCreateSheet();

    const existingData = sheet.getDataRange().getValues();
    const existingNames = existingData.slice(1).map(r => String(r[0]).trim().toLowerCase());

    if (existingNames.includes(product.name.toLowerCase())) {
      return jsonResponse({ success: false, error: 'Product already exists', name: product.name });
    }

    const unit = product.unit || 100;
    const defaultGrams = product.defaultGrams || unit;

    sheet.appendRow([
      product.name,
      product.cat || 'אחר',
      unit,
      product.p || 0,
      product.f || 0,
      product.c || 0,
      product.kcal || 0,
      defaultGrams,
    ]);

    return jsonResponse({ success: true, message: `"${product.name}" נוסף בהצלחה` });

  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

// ─── עזרים ───────────────────────────────────────────────────────────────────
function getOrCreateSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(PRODUCTS_SHEET);

  if (!sheet) {
    sheet = ss.insertSheet(PRODUCTS_SHEET);
    const headers = [
      'שם',
      'קטגוריה',
      'יחידה (גרם)',
      'חלבון (ל-100g)',
      'שומן (ל-100g)',
      'פחמימות (ל-100g)',
      'קלוריות ל-100g',
      'מנה ברירת מחדל (גרם)',
    ];
    sheet.appendRow(headers);
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#1e2235');
    headerRange.setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  } else {
    ensureDefaultGramsColumn(sheet);
  }

  return sheet;
}

/** מוסיף עמודת defaultGrams לגיליון קיים אם חסרה */
function ensureDefaultGramsColumn(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const hasCol = headers.some(h => String(h).indexOf('מנה') >= 0 || String(h).toLowerCase().indexOf('default') >= 0);
  if (hasCol) return;

  const lastCol = sheet.getLastColumn();
  sheet.getRange(1, lastCol + 1).setValue('מנה ברירת מחדל (גרם)');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const unit = parseFloat(data[i][2]) || 100;
    sheet.getRange(i + 1, lastCol + 1).setValue(unit);
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * הרץ פעם אחת מ-Apps Script Editor — ממלא עמודת מנה ברירת מחדל = יחידה
 */
function backfillDefaultGrams() {
  const sheet = getOrCreateSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  let colIdx = headers.findIndex(h => String(h).indexOf('מנה') >= 0);
  if (colIdx < 0) {
    ensureDefaultGramsColumn(sheet);
    colIdx = sheet.getLastColumn() - 1;
  }
  let updated = 0;
  for (let i = 1; i < data.length; i++) {
    const unit = parseFloat(data[i][2]) || 100;
    const current = parseFloat(data[i][colIdx]);
    if (!current || current <= 0) {
      sheet.getRange(i + 1, colIdx + 1).setValue(unit);
      updated++;
    }
  }
  SpreadsheetApp.getUi().alert(`מנה ברירת מחדל: עודכנו ${updated} שורות`);
}

/**
 * ייבוא מוצרי בסיס — הרץ ידנית פעם אחת (אופציונלי)
 */
function importBaseProducts() {
  const BASE_PRODUCTS = [
    ['ביצה', 'בשר, עוף ודגים', 50, 13, 11, 1, 155],
    ['חלבון ביצה', 'בשר, עוף ודגים', 40, 11, 0, 0, 50],
    ['חזה עוף', 'בשר, עוף ודגים', 100, 22, 2, 0, 120],
    ['גבינה לבנה 5%', 'מוצרי חלב', 125, 8, 5, 4, 96],
    ['לחם מחמצת', 'דגנים ולחם', 25, 9, 1, 50, 250],
    ['פרכיות', 'חטיפים ומתוקים', 5, 8.6, 4, 77, 387],
  ];

  const sheet = getOrCreateSheet();
  const existing = sheet.getDataRange().getValues().slice(1).map(r => r[0]);
  let added = 0;

  BASE_PRODUCTS.forEach(row => {
    if (!existing.includes(row[0])) {
      const unit = row[2];
      sheet.appendRow([row[0], row[1], unit, row[3], row[4], row[5], row[6], unit]);
      added++;
    }
  });

  SpreadsheetApp.getUi().alert(`ייבוא: ${added} מוצרים נוספו`);
}
