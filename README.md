# Vendor Registration Portal

A **static website** for collecting vendor applications. Form data is stored in **Google Sheets** and uploaded documents (Business Registration, Tax Documents, Cancelled Cheque) are saved to **Google Drive**. Designed for easy deployment on **GitHub Pages**.

---

## Project Structure

```
vendor-registration/
├── index.html          ← Main form page
├── css/
│   └── style.css       ← All styles
├── js/
│   └── script.js       ← Form logic + Google Sheets submission
├── apps-script.gs      ← Google Apps Script backend code
└── README.md           ← This file
```

---

## STEP 1 — Set Up Google Sheets

1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet.
2. Name the spreadsheet (e.g. **"Vendor Registrations"**).
3. Copy the **Spreadsheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/  <<<SPREADSHEET_ID>>>  /edit
   ```

---

## STEP 2 — Set Up Google Drive Folder

1. Go to [drive.google.com](https://drive.google.com) and create a new folder (e.g. **"Vendor Documents"**).
2. Open the folder and copy its **Folder ID** from the URL:
   ```
   https://drive.google.com/drive/folders/  <<<FOLDER_ID>>>
   ```

---

## STEP 3 — Deploy Google Apps Script

1. Open your Google Sheet → click **Extensions → Apps Script**.
2. Delete any existing code in the editor.
3. Copy the entire content of **`apps-script.gs`** and paste it.
4. At the top of the script, fill in your IDs:
   ```javascript
   const SPREADSHEET_ID  = "paste-your-spreadsheet-id-here";
   const DRIVE_FOLDER_ID = "paste-your-drive-folder-id-here";
   ```
5. Click **Save** (💾 icon).
6. Click **Deploy → New deployment**.
7. Choose type: **Web App**.
8. Set:
   - **Execute as:** `Me`
   - **Who has access:** `Anyone`
9. Click **Deploy** → Authorise when prompted.
10. Copy the **Web App URL** (it looks like `https://script.google.com/macros/s/AKfyc.../exec`).

> ⚠️ **Every time you edit the Apps Script**, you must create a **new deployment** to apply changes.

---

## STEP 4 — Connect the Website to Apps Script

1. Open **`js/script.js`** in a text editor.
2. Find line 8:
   ```javascript
   const GOOGLE_SCRIPT_URL = "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE";
   ```
3. Replace `YOUR_GOOGLE_APPS_SCRIPT_URL_HERE` with your Web App URL:
   ```javascript
   const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfyc.../exec";
   ```
4. Save the file.

---

## STEP 5 — Deploy to GitHub Pages

1. Create a new repository on [github.com](https://github.com).
2. Upload all project files maintaining the folder structure:
   ```
   index.html
   css/style.css
   js/script.js
   apps-script.gs
   README.md
   ```
3. Go to **Settings → Pages**.
4. Under **Source**, select **Deploy from a branch**.
5. Choose **branch: `main`** and **folder: `/ (root)`**.
6. Click **Save**.
7. Your site will be live at:
   ```
   https://<your-username>.github.io/<repository-name>/
   ```

---

## How It Works

```
User fills form
      │
      ▼
Browser validates input & converts files to base64
      │
      ▼
POST request → Google Apps Script Web App
      │
      ├── Saves vendor data → Google Sheet row
      ├── Uploads documents → Google Drive folder
      └── Sends acknowledgement email to vendor
```

---

## What Gets Stored in Google Sheets

| Column | Data |
|--------|------|
| Reference ID | Auto-generated unique ID (e.g. VND-LXYZ-AB12) |
| Submitted At | ISO timestamp |
| Status | "Pending Review" (update manually) |
| Company Info | Name, Type, Reg No, GST, PAN, Year, Website |
| Contact Info | Name, Email, Phone, Address, City, State, PIN |
| Business Info | Nature, Categories, Turnover, Employees, Category |
| Bank Details | Bank, Account Holder, Account No, IFSC, Branch |
| Documents | Google Drive links for all 3 uploaded files |

---

## Document Uploads

Vendors can upload (max 5 MB each, PDF / JPG / PNG):
- ✅ Business Registration Certificate
- ✅ Tax Document (GST / PAN)
- ✅ Cancelled Cheque / Bank Proof

Files are saved to Google Drive inside a subfolder named after the Reference ID and Company name.

---

## Customisation Tips

- **Change colours:** Edit CSS variables at the top of `css/style.css` (`:root` block).
- **Add/remove fields:** Edit the form in `index.html`, update `script.js` payload, and update `HEADERS` array in `apps-script.gs`.
- **Change email content:** Edit the `sendAcknowledgement()` function in `apps-script.gs`.
- **Add more file uploads:** Follow the pattern in Section 5 of `index.html` and `setupFileUpload()` calls in `script.js`.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Form submits but nothing in Sheet | Check Spreadsheet ID and ensure Apps Script is deployed as *Anyone* |
| Files not appearing in Drive | Check Drive Folder ID; ensure the folder is shared appropriately |
| CORS error in browser console | This is expected with `mode: 'no-cors'` — submissions still succeed |
| "Script URL not configured" message | Paste your Web App URL into `js/script.js` line 8 |
| Re-deployed script not working | Make sure to create a **New Deployment** (not update existing) |

---

## Support

For issues, open a GitHub Issue in your repository or contact your administrator.
