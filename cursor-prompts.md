# Cursor / Claude Code — פרומפטים לפרויקט מעקב תזונה

## מה הפרויקט?
אפליקציית מעקב תזונה אישית (HTML + JS + PWA) — קובץ יחיד עם localStorage, ללא backend.
נועד לשימוש מובייל כ-PWA עם Calorie Cycling (3 סוגי יום: אימון / מנוחה / ספורט).

---

## 🔍 פרומפט #1 — בדיקה ראשונית של הפרויקט

```
Review the project files: eran-nutrition-tracker.html, manifest.json, sw.js, icon.svg

Check the following and report findings:
1. Is the HTML valid and well-structured?
2. Does switchTab() correctly sync both .tab-btn (top) and .bn-btn (bottom nav)?
3. Do all onclick handlers match function names in the script?
4. Is localStorage key consistent throughout ('eran-v2')?
5. Are there any JS runtime errors you can spot (undefined variables, missing elements)?
6. Does the manifest.json reference correct file names?
7. Is the service worker (sw.js) using the correct cache name and ASSETS array?

Report any bugs found with exact file + line number.
```

---

## 📱 פרומפט #2 — יצירת PNG icons לאפליקציה

```
Generate PWA icons for the nutrition tracker app.

Create two PNG files:
- icon-192.png (192×192)
- icon-512.png (512×512)

Design: dark background (#1a1d27), rounded corners. Use a simple plate/fork icon
or a stylized "ע" (Hebrew letter Ayin) with a green (#22c55e) accent color.

Use Python with Pillow (pip install Pillow) to generate both files.
Save them in the project root next to eran-nutrition-tracker.html.

Also update manifest.json to confirm the icon entries are correct:
- icon.svg → "sizes": "any", "type": "image/svg+xml"
- icon-192.png → "sizes": "192x192", "type": "image/png", "purpose": "any maskable"
- icon-512.png → "sizes": "512x512", "type": "image/png", "purpose": "any maskable"
```

---

## 🎙️ פרומפט #3 — שלב ב׳: קול + AI (Gemini Flash)

```
Add voice meal logging to eran-nutrition-tracker.html.

Feature: user holds a microphone button → speaks what they ate → AI parses it → 
basket is populated with matching products from BASE_PRODUCTS array.

Implementation plan:
1. Add a mic button next to the search bar in the "today" tab:
   <button id="micBtn" onclick="startVoice()">🎙️ הקלט ארוחה</button>

2. Use Web Speech API (SpeechRecognition) — no API key needed, built into browsers:
   - Show recording state with visual feedback (pulsing red dot)
   - On result: send transcript + BASE_PRODUCTS list to Gemini API

3. Add Gemini API key field to settings tab:
   - Input: id="geminiKey", type="password"
   - Save to localStorage as S.geminiKey

4. Gemini API call (gemini-2.0-flash-exp, free tier):
   - Endpoint: https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent
   - Send: Hebrew transcript + product list as JSON
   - Prompt template:
     "המשתמש אמר: '{transcript}'
      מסד מוצרים זמין (JSON): {products}
      החזר JSON בלבד — רשימת פריטים שזוהו:
      [{ \"name\": \"...\", \"qty\": 1 }, ...]
      name חייב להיות שם מדויק מהרשימה. אל תמציא מוצרים חדשים."

5. Parse response → for each item: call selProd(name) then addToBasket() with qty
6. Show confirmation screen before committing: "זיהיתי: ביצה x2, גבינה לבנה x1 — נכון?"

Important:
- Graceful fallback if Web Speech API not supported (show text input instead)
- Handle Gemini API errors with user-friendly Hebrew message
- The BASE_PRODUCTS array is already defined in the HTML — pass only name+cat to Gemini to save tokens
- Keep all code in the single HTML file, no separate JS files needed yet
```

---

## 📸 פרומפט #4 — שלב ג׳: זיהוי ארוחה מתמונה (Gemini Vision)

```
Add photo meal recognition to eran-nutrition-tracker.html.

Feature: user taps camera button → takes photo or uploads image → 
Gemini Vision identifies food items and portions → suggests meal entries.

Implementation:
1. Add camera button in today tab:
   <button onclick="openCamera()">📸 צלם ארוחה</button>

2. Use <input type="file" accept="image/*" capture="environment"> for mobile camera access
   - On mobile: opens rear camera directly
   - On desktop: opens file picker

3. Convert image to base64 using FileReader API

4. Send to Gemini Vision (gemini-2.0-flash-exp supports vision):
   Request body:
   {
     "contents": [{
       "parts": [
         { "text": "זהה את המזון בתמונה. עבור כל פריט, הצג שם בעברית + כמות משוערת בגרמים. החזר JSON בלבד: [{\"food\": \"...\", \"grams\": 100}]" },
         { "inline_data": { "mime_type": "image/jpeg", "data": "{base64}" } }
       ]
     }]
   }

5. Match identified foods against BASE_PRODUCTS by name similarity
   (use simple includes() check, then show unmatched as "לא נמצא במסד")

6. Show confirmation UI before adding to basket:
   - List identified items with checkboxes
   - Allow manual adjustment of quantities
   - "הוסף לסל" button commits all checked items

7. Compress image before sending (max 1MB) using canvas:
   const canvas = document.createElement('canvas');
   // Scale down to max 800px wide while preserving aspect ratio

Use the same Gemini API key from S.geminiKey (set in step 3 prompts).
Keep everything in the single HTML file.
```

---

## 🚀 פרומפט #5 — פריסה ל-Vercel (Deployment)

```
Deploy this nutrition tracker as a static site to Vercel.

The project is a single-page app with these files:
- eran-nutrition-tracker.html (main app)
- manifest.json (PWA manifest)
- sw.js (service worker)
- icon.svg (app icon)
- icon-192.png (if created)
- icon-512.png (if created)

Steps:
1. Create vercel.json in project root:
{
  "version": 2,
  "builds": [{ "src": "**", "use": "@vercel/static" }],
  "routes": [
    { "src": "/", "dest": "/eran-nutrition-tracker.html" },
    { "src": "/(.*)", "dest": "/$1" }
  ],
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache" },
        { "key": "Service-Worker-Allowed", "value": "/" }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" }
      ]
    }
  ]
}

2. Deploy using Vercel CLI: vercel --prod
   OR push to GitHub and connect the repo to Vercel dashboard.

3. After deployment:
   - Test PWA install prompt on Android Chrome
   - Test "Add to Home Screen" on iOS Safari (manual share → Add to Home Screen)
   - Verify sw.js is served with correct headers
   - Test offline mode: load app → turn off internet → verify it still works

4. Update sw.js ASSETS array to use absolute paths after knowing the Vercel domain.

Important: The app uses localStorage — data is per-browser, not synced to cloud.
Google Sheets sync (via Apps Script URL in settings) continues to work for product DB.
```

---

## 🔧 פרומפט #6 — בדיקות ו-QA כלליות

```
Run a comprehensive QA check on eran-nutrition-tracker.html:

Functional tests (test manually by opening the file in browser):
1. Add a meal with multiple products using the basket system
   - Search for "ביצה" → select → add to basket
   - Search for "גבינה לבנה 5%" → select → add to basket
   - Name the meal "ארוחת בוקר" → commit → verify both appear under the meal name
   - Verify calorie/macro totals update correctly

2. Day type switching
   - Switch to "יום מנוחה" → verify targets change to 2300 cal / 165g protein
   - Switch to "יום ספורט" → verify targets change to 3000 cal
   - Reload page → verify day type persists from localStorage

3. Week view
   - Switch to שבוע tab → verify last 7 days appear
   - Today should show today's meals data

4. Weight log
   - Add a weight entry → verify it appears with date
   - Add second entry → verify trend arrow (▲/▼) appears

5. Product search
   - Search "פרכ" → verify "פרכיות" appears in dropdown
   - Search "שייק" → verify protein shakes appear

6. Mobile responsiveness
   - Open Chrome DevTools → toggle mobile mode (375px width)
   - Verify bottom nav appears and top tabs disappear
   - Verify all inputs are at least 16px font size (no zoom on focus)
   - Verify buttons are at least 48px tall

Report any failures with exact reproduction steps.
```

---

## 📁 מבנה הפרויקט בגיטהאב

```
nutrition-tracker/
├── eran-nutrition-tracker.html   # Main app (single file)
├── manifest.json                  # PWA manifest
├── sw.js                          # Service worker (offline support)
├── icon.svg                       # App icon (SVG)
├── icon-192.png                   # App icon 192×192 (generate with prompt #2)
├── icon-512.png                   # App icon 512×512 (generate with prompt #2)
├── google-apps-script.gs          # Google Sheets sync backend
├── vercel.json                    # Deployment config (create with prompt #5)
└── cursor-prompts.md              # This file
```
