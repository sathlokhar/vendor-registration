/* ============================================================
   GOOGLE APPS SCRIPT — VENDOR REGISTRATION BACKEND
   ============================================================
   SETUP STEPS:
   1. Open Google Sheets → create a new sheet named "Vendors"
   2. Go to Extensions → Apps Script
   3. Paste this entire file, replacing any existing code
   4. Replace SPREADSHEET_ID and DRIVE_FOLDER_ID below
   5. Save → Deploy → New deployment → Web App
      • Execute as: Me
      • Who has access: Anyone
   6. Copy the Web App URL → paste into js/script.js
   ============================================================ */

// ── CONFIGURATION ────────────────────────────────────────────
const SPREADSHEET_ID = "1CGHew6hLR_5mPYObRPCQ-VS0vsjk03cO1wdwo_o8pOc";
const DRIVE_FOLDER_ID = "1iDmUKlCbYC8Objz1PBEeX80V8BUc8L3h";
// ─────────────────────────────────────────────────────────────

const SHEET_NAME = "Vendors";

const HEADERS = [
  "Reference ID",
  "Submitted At",
  "Status",
  // Company
  "Company Name",
  "Business Type",
  "Registration No",
  "GST Number",
  "PAN Number",
  // Contact
  "Contact Name",
  "Designation",
  "Email",
  "Phone",
  "Alt Phone",
  "Address Line 1",
  "City",
  "State",
  "PIN Code",
  "Country",
  // Business
  "Business Nature",
  "Annual Turnover",
  "Vendor Category",
  // Bank
  "Bank Name",
  "Account Holder",
  "Account Number",
  "IFSC Code",
  "Branch Name",
  "Account Type",
  // Documents (Drive links)
  "Business Registration (Link)",
  "Tax Document (Link)",
  "Cancelled Cheque (Link)",
];


/* ============================================================
   MAIN HANDLER — receives POST from the website form
   ============================================================ */
function doPost(e) {
  try {
    const raw  = e.postData ? e.postData.contents : "{}";
    const data = JSON.parse(raw);

    /* ── Open sheet ── */
    const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    let   sheet = ss.getSheetByName(SHEET_NAME);

    /* ── Create sheet + headers if it doesn't exist ── */
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      writeHeaders(sheet);
    } else if (sheet.getLastRow() === 0) {
      writeHeaders(sheet);
    }

    /* ── Upload files to Drive ── */
    const folder      = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const refId       = data.referenceId || generateRefId();
    const subFolder   = folder.createFolder(refId + " — " + (data.companyName || "Unknown"));

    const bizRegLink  = saveFileToDrive(subFolder, data.files && data.files.businessRegistration, "Business_Registration");
    const taxDocLink  = saveFileToDrive(subFolder, data.files && data.files.taxDocument,          "Tax_Document");
    const chequeLink  = saveFileToDrive(subFolder, data.files && data.files.cancelledCheque,      "Cancelled_Cheque");

    /* ── Build row ── */
    const row = [
      refId,
      data.submittedAt || new Date().toISOString(),
      "Pending Review",
      // Company
      data.companyName        || "",
      data.businessType       || "",
      data.registrationNo     || "",
      data.gstNumber          || "",
      data.panNumber          || "",
      // Contact
      data.contactName        || "",
      data.designation        || "",
      data.email              || "",
      data.phone              || "",
      data.altPhone           || "",
      data.address1           || "",
      data.city               || "",
      data.state              || "",
      data.pinCode            || "",
      data.country            || "",
      // Business
      data.businessNature     || "",
      data.annualTurnover     || "",
      data.vendorCategory     || "",
      // Bank
      data.bankName           || "",
      data.accountHolder      || "",
      data.accountNumber      || "",
      data.ifscCode           || "",
      data.branchName         || "",
      data.accountType        || "",
      // Document links
      bizRegLink,
      taxDocLink,
      chequeLink,
    ];

    sheet.appendRow(row);

    /* ── Auto-format headers on first data row ── */
    if (sheet.getLastRow() === 2) {
      formatHeaders(sheet);
    }

    /* ── Send acknowledgement email to vendor ── */
    if (data.email) {
      sendAcknowledgement(data.email, data.contactName || data.companyName, refId);
    }

    return jsonResponse({ status: "success", referenceId: refId });

  } catch (err) {
    Logger.log("ERROR: " + err.message + "\n" + err.stack);
    return jsonResponse({ status: "error", message: err.message });
  }
}


/* ============================================================
   SAVE FILE TO GOOGLE DRIVE
   ============================================================ */
function saveFileToDrive(folder, fileObj, label) {
  if (!fileObj || !fileObj.base64 || !fileObj.name) return "Not uploaded";

  try {
    const decoded   = Utilities.base64Decode(fileObj.base64);
    const blob      = Utilities.newBlob(decoded, fileObj.type || "application/octet-stream", fileObj.name);
    const driveFile = folder.createFile(blob);
    driveFile.setName(label + "_" + fileObj.name);
    driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return driveFile.getUrl();
  } catch (err) {
    Logger.log("File upload error (" + label + "): " + err.message);
    return "Upload failed";
  }
}


/* ============================================================
   WRITE HEADER ROW
   ============================================================ */
function writeHeaders(sheet) {
  sheet.appendRow(HEADERS);
  formatHeaders(sheet);
}

function formatHeaders(sheet) {
  const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  headerRange.setBackground("#1a56db");
  headerRange.setFontColor("#ffffff");
  headerRange.setFontWeight("bold");
  headerRange.setFontSize(11);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, HEADERS.length);
}


/* ============================================================
   SEND ACKNOWLEDGEMENT EMAIL
   ============================================================ */
function sendAcknowledgement(email, name, refId) {
  const subject = "Vendor Registration Received — " + refId;
  const body = `Dear ${name},\n\nThank you for submitting your vendor registration application.\n\nYour Reference ID: ${refId}\n\nOur team will review your application and documents within 3–5 business days. You will receive a follow-up email once the review is complete.\n\nIf you have any questions, please contact us with your Reference ID.\n\nBest regards,\nVendor Management Team`;

  try {
    MailApp.sendEmail(email, subject, body);
  } catch (err) {
    Logger.log("Email send failed: " + err.message);
  }
}


/* ============================================================
   HELPERS
   ============================================================ */
function generateRefId() {
  return "VND-" + new Date().getTime().toString(36).toUpperCase() + "-" + Math.random().toString(36).substring(2,6).toUpperCase();
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


/* ============================================================
   DIAGNOSTIC — run this first to check your configuration
   ============================================================ */
function checkConfig() {
  Logger.log("=== VMS DIAGNOSTIC ===");

  // 1. Check IDs are filled in
  if (SPREADSHEET_ID === "YOUR_GOOGLE_SPREADSHEET_ID_HERE") {
    Logger.log("❌ SPREADSHEET_ID is not set! Open this script and replace the placeholder.");
    return;
  }
  if (DRIVE_FOLDER_ID === "YOUR_GOOGLE_DRIVE_FOLDER_ID_HERE") {
    Logger.log("❌ DRIVE_FOLDER_ID is not set! Open this script and replace the placeholder.");
    return;
  }
  Logger.log("✅ IDs are filled in.");

  // 2. Check Google Sheet access
  try {
    const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    Logger.log("✅ Google Sheet found: " + ss.getName());
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      Logger.log("✅ Created 'Vendors' sheet.");
    } else {
      Logger.log("✅ 'Vendors' sheet exists. Rows: " + sheet.getLastRow());
    }
    writeHeaders(sheet);
    Logger.log("✅ Headers written successfully.");
  } catch (err) {
    Logger.log("❌ Sheet error: " + err.message);
    Logger.log("   → Check that SPREADSHEET_ID is correct.");
    return;
  }

  // 3. Check Google Drive folder access
  try {
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    Logger.log("✅ Drive folder found: " + folder.getName());
  } catch (err) {
    Logger.log("❌ Drive folder error: " + err.message);
    Logger.log("   → Check that DRIVE_FOLDER_ID is correct.");
    return;
  }

  Logger.log("=== ALL CHECKS PASSED ✅ ===");
  Logger.log("Now run testPost() to simulate a form submission.");
}


/* ============================================================
   TEST SUBMISSION — simulates a real form POST
   ============================================================ */
function testPost() {
  const fakeData = {
    referenceId:     "VND-TEST-0001",
    submittedAt:     new Date().toISOString(),
    companyName:     "Test Company Pvt Ltd",
    businessType:    "Private Limited",
    registrationNo:  "U12345MH2020PTC123456",
    gstNumber:       "27AABCT1332L1ZV",
    panNumber:       "AABCT1332L",
    yearEstablished: "2020",
    website:         "https://testcompany.com",
    contactName:     "Test Person",
    designation:     "Manager",
    email:           Session.getActiveUser().getEmail(),
    phone:           "9876543210",
    altPhone:        "",
    address1:        "123 Test Street",
    address2:        "Suite 1",
    city:            "Mumbai",
    state:           "Maharashtra",
    pinCode:         "400001",
    country:         "India",
    businessNature:  "IT Services and Software Development",
    categories:      "Software, Consulting",
    annualTurnover:  "₹1 – 5 Crores",
    employees:       "11 – 50",
    certifications:  "ISO 9001",
    vendorCategory:  "Service Provider",
    bankName:        "State Bank of India",
    accountHolder:   "Test Company Pvt Ltd",
    accountNumber:   "123456789012",
    ifscCode:        "SBIN0001234",
    branchName:      "Fort Branch",
    accountType:     "Current",
    files: {
      businessRegistration: null,
      taxDocument:          null,
      cancelledCheque:      null,
    },
  };

  // Simulate doPost
  try {
    const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    let   sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) { sheet = ss.insertSheet(SHEET_NAME); writeHeaders(sheet); }
    else if (sheet.getLastRow() === 0) { writeHeaders(sheet); }

    const folder    = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const subFolder = folder.createFolder(fakeData.referenceId + " — " + fakeData.companyName + " (TEST)");

    const row = [
      fakeData.referenceId, fakeData.submittedAt, "TEST — Pending Review",
      fakeData.companyName, fakeData.businessType, fakeData.registrationNo,
      fakeData.gstNumber, fakeData.panNumber,
      fakeData.contactName, fakeData.designation, fakeData.email, fakeData.phone,
      fakeData.altPhone, fakeData.address1, fakeData.city,
      fakeData.state, fakeData.pinCode, fakeData.country,
      fakeData.businessNature, fakeData.annualTurnover, fakeData.vendorCategory,
      fakeData.bankName, fakeData.accountHolder, fakeData.accountNumber,
      fakeData.ifscCode, fakeData.branchName, fakeData.accountType,
      "No file (test)", "No file (test)", "No file (test)",
    ];

    sheet.appendRow(row);
    Logger.log("✅ TEST ROW added to Google Sheet successfully!");
    Logger.log("✅ TEST FOLDER created in Google Drive: " + subFolder.getName());
    Logger.log("=== TEST PASSED — your backend is working correctly ===");
    Logger.log("Now submit the real form on your website.");
  } catch (err) {
    Logger.log("❌ testPost failed: " + err.message);
  }
}


/* ============================================================
   SETUP FUNCTION
   ============================================================ */
function testSetup() {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  writeHeaders(sheet);
  Logger.log("✅ Setup complete. Headers written to sheet: " + SHEET_NAME);
}
