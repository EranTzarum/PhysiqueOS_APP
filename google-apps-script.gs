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
 */

// ─── הגדרות ──────────────────────────────────────────────────────────────────
const SPREADSHEET_ID = '1H_BMeiNaUuz4nA2162ygeozCSkRI7-UFqHsZYG6sUss';
const PRODUCTS_SHEET = 'מוצרים_DB';  // שם הטאב החדש לDB המוצרים

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
      .map(row => ({
        name:  String(row[0]).trim(),
        cat:   String(row[1] || 'אחר').trim(),
        unit:  parseFloat(row[2]) || 100,
        p:     parseFloat(row[3]) || 0,
        f:     parseFloat(row[4]) || 0,
        c:     parseFloat(row[5]) || 0,
        kcal:  parseFloat(row[6]) || 0,
      }));

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

    // בדוק אם המוצר כבר קיים (לפי שם)
    const existingData = sheet.getDataRange().getValues();
    const existingNames = existingData.slice(1).map(r => String(r[0]).trim().toLowerCase());

    if (existingNames.includes(product.name.toLowerCase())) {
      return jsonResponse({ success: false, error: 'Product already exists', name: product.name });
    }

    // הוסף את המוצר
    sheet.appendRow([
      product.name,
      product.cat  || 'אחר',
      product.unit || 100,
      product.p    || 0,
      product.f    || 0,
      product.c    || 0,
      product.kcal || 0,
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
    // כותרות
    const headers = ['שם', 'קטגוריה', 'יחידה (גרם)', 'חלבון (ל-100g)', 'שומן (ל-100g)', 'פחמימות (ל-100g)', 'קלוריות ל-100g'];
    sheet.appendRow(headers);
    // עיצוב כותרות
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#1e2235');
    headerRange.setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * פונקציית עזר — לייבא את כל המוצרים הבסיסיים מהאפליקציה לגוגל שיטס
 * הרץ אותה ידנית פעם אחת מ-Apps Script Editor אם רוצה לאתחל את הDB
 */
function importBaseProducts() {
  const BASE_PRODUCTS = [
    // בשר, עוף ודגים
    ['ביצה','בשר, עוף ודגים',50,13,11,1,155],
    ['חלבון ביצה','בשר, עוף ודגים',40,11,0,0,50],
    ['חביתה','בשר, עוף ודגים',158,10.13,7.6,0.95,114],
    ['ירך עוף (משולש)','בשר, עוף ודגים',110,20,8,0,165],
    ['שוק עוף (רגל)','בשר, עוף ודגים',70,21,5,0,140],
    ['חזה עוף','בשר, עוף ודגים',100,22,2,0,120],
    ['פרגית','בשר, עוף ודגים',100,22,4,0,145],
    ['פרגית אש','בשר, עוף ודגים',90,27,11,0,210],
    ['פילה עוף','בשר, עוף ודגים',100,23,2,0,120],
    ['קציצת עוף','בשר, עוף ודגים',100,22,7,0,160],
    ['כנפיים','בשר, עוף ודגים',25,24,13,0,210],
    ['בשר בקר רזה','בשר, עוף ודגים',100,20,5,0,135],
    ['סינטה דק דק','בשר, עוף ודגים',100,19,12,0,186],
    ['סטייק אנטריקוט','בשר, עוף ודגים',120,26,17,0,250],
    ['שניצל','בשר, עוף ודגים',100,18,11,12,220],
    ['קבב','בשר, עוף ודגים',50,17,20,1,250],
    ['נקניק','בשר, עוף ודגים',50,15,21,5,269],
    ['טונה','בשר, עוף ודגים',100,26,1,0,104],
    ['דג סלמון','בשר, עוף ודגים',100,20,13,0,206],
    // מוצרי חלב
    ['גבינה לבנה 5%','מוצרי חלב',125,8,5,4,96],
    ['קוטג\' 5%','מוצרי חלב',125,11,5,2.4,96],
    ['סקייר','מוצרי חלב',100,12,0.5,4,57],
    ['יוגורט טבעי','מוצרי חלב',150,5.6,1.2,4.6,53],
    ['מעדן פרו לייט','מוצרי חלב',124,10,0.4,4.5,62],
    ['גבינה צהובה 22%','מוצרי חלב',23,26,22,2,310],
    ['שייק חלבון','מוצרי חלב',25,81,7,2,354],
    ['שייק חלבון גבינה','מוצרי חלב',33,76,7.7,7.1,404],
    // דגנים
    ['לחם מחמצת','דגנים ולחם',25,9,1,50,250],
    ['פיתה קטנה','דגנים ולחם',50,7,2.5,46,236],
    ['טורטיה','דגנים ולחם',83,7.6,6,55,314],
    ['אורז מבושל','דגנים ולחם',100,2.7,0.3,28,130],
    ['שיבולת שועל','דגנים ולחם',40,11.9,6.9,59.7,367],
    // ירקות
    ['סלט ירקות','ירקות',200,2,0,10,40],
    ['ירקות חתוכים','ירקות',100,1,0,5,30],
    ['אבוקדו','ירקות',100,2,15,9,160],
    // פירות
    ['תפוח','פירות',150,0.3,0.2,14,52],
    ['בננה','פירות',120,1.1,0.3,23,89],
    // שמנים ואגוזים
    ['חמאת בוטנים טבעית','שמנים ואגוזים',15,28,49,12.4,617],
    ['שמן זית','שמנים ואגוזים',15,0,13.5,0,119],
    ['טחינה','שמנים ואגוזים',15,20.5,62.8,13.3,699],
    // ממרחים
    ['דבש','ממרחים ורטבים',12,0,0,83,332],
    // חטיפים
    ['פרכיות','חטיפים ומתוקים',5,8.6,4,77,387],
  ];

  const sheet = getOrCreateSheet();
  const existing = sheet.getDataRange().getValues().slice(1).map(r => r[0]);

  let added = 0;
  BASE_PRODUCTS.forEach(row => {
    if (!existing.includes(row[0])) {
      sheet.appendRow(row);
      added++;
    }
  });

  Logger.log(`ייבוא הושלם: ${added} מוצרים נוספו`);
  SpreadsheetApp.getUi().alert(`ייבוא הושלם! ${added} מוצרים נוספו לטאב "${PRODUCTS_SHEET}"`);
}
