/* ============================================================
   VENDOR REGISTRATION — FORM LOGIC & GOOGLE SHEETS INTEGRATION
   ============================================================
   ⚠️  IMPORTANT: Replace the GOOGLE_SCRIPT_URL value below
       with your deployed Google Apps Script Web App URL.
   ============================================================ */

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz0tVyhpB6HRBj-kIMYFR9c9exxPwypuSA8l9yQsAIyPe1j0v9Uac3XRfzvN5z7a0_A/exec";

/* ── FILE STORAGE (base64 encoded) ── */
const uploadedFiles = {
  businessRegFile: null,
  taxDocFile:      null,
  chequeFile:      null,
};

/* ── FILE SIZE LIMIT ── */
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/* ============================================================
   INITIALISATION
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  setupFileUpload("businessRegFile", "preview-businessReg", "card-businessReg");
  setupFileUpload("taxDocFile",      "preview-taxDoc",      "card-taxDoc");
  setupFileUpload("chequeFile",      "preview-cheque",      "card-cheque");

  document.getElementById("vendorForm").addEventListener("submit", handleSubmit);

  /* Live scroll → update step progress dots */
  const sections = [1, 2, 3, 4, 5].map(n => document.getElementById(`section-${n}`));
  const dots     = [1, 2, 3, 4, 5].map(n => document.getElementById(`step-dot-${n}`));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const idx = sections.indexOf(entry.target);
        dots.forEach((dot, i) => {
          dot.classList.remove("active", "done");
          if (i < idx)       dot.classList.add("done");
          else if (i === idx) dot.classList.add("active");
        });
      }
    });
  }, { rootMargin: "-40% 0px -55% 0px" });

  sections.forEach(s => s && observer.observe(s));

  /* PAN — uppercase */
  const panInput = document.getElementById("panNumber");
  if (panInput) panInput.addEventListener("input", () => panInput.value = panInput.value.toUpperCase());

  /* GST — uppercase */
  const gstInput = document.getElementById("gstNumber");
  if (gstInput) gstInput.addEventListener("input", () => gstInput.value = gstInput.value.toUpperCase());

  /* IFSC — uppercase */
  const ifscInput = document.getElementById("ifscCode");
  if (ifscInput) ifscInput.addEventListener("input", () => ifscInput.value = ifscInput.value.toUpperCase());

  /* PIN — digits only */
  const pinInput = document.getElementById("pinCode");
  if (pinInput) pinInput.addEventListener("input", () => pinInput.value = pinInput.value.replace(/\D/g, ""));
});

/* ============================================================
   FILE UPLOAD SETUP
   ============================================================ */
function setupFileUpload(inputId, previewId, cardId) {
  const input   = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  const card    = document.getElementById(cardId);
  if (!input) return;

  input.addEventListener("change", () => {
    const file = input.files[0];
    if (!file) return;

    /* Size check */
    if (file.size > MAX_FILE_SIZE) {
      showFileError(card, preview, "File exceeds 5 MB limit. Please choose a smaller file.");
      input.value = "";
      uploadedFiles[inputId] = null;
      return;
    }

    /* Convert to base64 */
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedFiles[inputId] = {
        name:    file.name,
        type:    file.type,
        size:    file.size,
        base64:  e.target.result.split(",")[1], // strip data URI prefix
      };
      showFileSuccess(card, preview, file.name, file.size);
    };
    reader.readAsDataURL(file);
  });
}

function showFileSuccess(card, preview, name, size) {
  card.classList.add("uploaded");
  card.classList.remove("invalid");
  preview.classList.add("visible");
  preview.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
  ${name} (${formatBytes(size)})`;
}

function showFileError(card, preview, msg) {
  card.classList.add("invalid");
  card.classList.remove("uploaded");
  preview.classList.remove("visible");
  const errEl = card.querySelector(".error-msg");
  if (errEl) { errEl.textContent = msg; errEl.style.display = "flex"; }
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

/* ============================================================
   FORM VALIDATION
   ============================================================ */
function validateForm() {
  let valid = true;

  /* Helper: mark field */
  function check(id, condition, errMsg) {
    const el    = document.getElementById(id);
    const group = el ? el.closest(".form-group") || el.closest(".upload-card") : null;
    if (!el) return;
    if (!condition) {
      el.classList.add("invalid");
      if (group) group.classList.add("has-error");
      if (errMsg) {
        const errEl = group ? group.querySelector(".error-msg") : null;
        if (errEl) errEl.textContent = errMsg;
      }
      valid = false;
    } else {
      el.classList.remove("invalid");
      if (group) group.classList.remove("has-error");
    }
  }

  /* Clear previous errors */
  document.querySelectorAll(".invalid").forEach(el => el.classList.remove("invalid"));
  document.querySelectorAll(".has-error").forEach(el => el.classList.remove("has-error"));

  const v = id => (document.getElementById(id) || {}).value?.trim() || "";

  /* Section 1 */
  check("companyName",    v("companyName").length > 0);
  check("businessType",   v("businessType").length > 0);
  check("registrationNo", v("registrationNo").length > 0);
  check("panNumber",      /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v("panNumber")), "Enter a valid 10-character PAN (e.g. ABCDE1234F).");

  /* Section 2 */
  check("contactName",  v("contactName").length > 0);
  check("email",        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v("email")), "Enter a valid email address.");
  check("phone",        v("phone").length >= 7);
  check("address1",     v("address1").length > 0);
  check("city",         v("city").length > 0);
  check("state",        v("state").length > 0);
  check("pinCode",      /^\d{6}$/.test(v("pinCode")), "Enter a valid 6-digit PIN code.");

  /* Section 3 */
  check("businessNature",  v("businessNature").length > 0);
  check("vendorCategory",  v("vendorCategory").length > 0);

  /* Section 4 */
  check("bankName",          v("bankName").length > 0);
  check("accountHolder",     v("accountHolder").length > 0);
  check("accountNumber",     v("accountNumber").length >= 9);
  const accErr = document.getElementById("accNoError");
  if (v("accountNumber") !== v("confirmAccountNumber") || v("confirmAccountNumber").length === 0) {
    document.getElementById("confirmAccountNumber").classList.add("invalid");
    document.getElementById("confirmAccountNumber").closest(".form-group").classList.add("has-error");
    if (accErr) accErr.textContent = "Account numbers do not match.";
    valid = false;
  }
  check("ifscCode", /^[A-Z]{4}0[A-Z0-9]{6}$/.test(v("ifscCode")), "Enter a valid 11-character IFSC code.");

  /* Section 5 — file uploads */
  ["businessRegFile", "taxDocFile", "chequeFile"].forEach(id => {
    const card    = id === "businessRegFile" ? "card-businessReg" : id === "taxDocFile" ? "card-taxDoc" : "card-cheque";
    const cardEl  = document.getElementById(card);
    if (!uploadedFiles[id]) {
      if (cardEl) { cardEl.classList.add("invalid"); cardEl.classList.remove("uploaded"); }
      valid = false;
    }
  });

  /* Declaration */
  const decl    = document.getElementById("declarationCheck");
  const declErr = document.getElementById("declError");
  if (!decl.checked) {
    declErr.classList.add("visible");
    valid = false;
  } else {
    declErr.classList.remove("visible");
  }

  return valid;
}

/* ============================================================
   FORM SUBMIT
   ============================================================ */
async function handleSubmit(e) {
  e.preventDefault();

  /* Validate */
  if (!validateForm()) {
    /* Scroll to first error */
    const firstError = document.querySelector(".invalid, .has-error");
    if (firstError) firstError.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  /* Check Google Script URL */
  if (GOOGLE_SCRIPT_URL === "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE") {
    showError("Google Apps Script URL is not configured. Please follow the README.md to set it up, then paste your Web App URL in js/script.js.");
    return;
  }

  /* Show loading */
  const overlay   = document.getElementById("loadingOverlay");
  const submitBtn = document.getElementById("submitBtn");
  overlay.classList.add("active");
  submitBtn.disabled = true;

  const v = id => (document.getElementById(id) || {}).value?.trim() || "";

  const payload = {
    submittedAt:        new Date().toISOString(),
    referenceId:        generateRefId(),

    /* Company */
    companyName:        v("companyName"),
    businessType:       v("businessType"),
    registrationNo:     v("registrationNo"),
    gstNumber:          v("gstNumber"),
    panNumber:          v("panNumber"),

    /* Contact */
    contactName:        v("contactName"),
    designation:        v("designation"),
    email:              v("email"),
    phone:              v("phone"),
    altPhone:           v("altPhone"),
    address1:           v("address1"),
    city:               v("city"),
    state:              v("state"),
    pinCode:            v("pinCode"),
    country:            v("country"),

    /* Business */
    businessNature:     v("businessNature"),
    annualTurnover:     v("annualTurnover"),
    vendorCategory:     v("vendorCategory"),

    /* Bank */
    bankName:           v("bankName"),
    accountHolder:      v("accountHolder"),
    accountNumber:      v("accountNumber"),
    ifscCode:           v("ifscCode"),
    branchName:         v("branchName"),
    accountType:        v("accountType"),

    /* Files */
    files: {
      businessRegistration: uploadedFiles.businessRegFile,
      taxDocument:          uploadedFiles.taxDocFile,
      cancelledCheque:      uploadedFiles.chequeFile,
    },
  };

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
      mode:    "no-cors", // required for Apps Script
    });

    /* no-cors returns opaque response — treat as success */
    overlay.classList.remove("active");
    submitBtn.disabled = false;
    document.getElementById("refId").textContent = payload.referenceId;
    document.getElementById("successModal").classList.add("active");

    /* Reset form */
    document.getElementById("vendorForm").reset();
    Object.keys(uploadedFiles).forEach(k => uploadedFiles[k] = null);
    document.querySelectorAll(".uploaded").forEach(c => c.classList.remove("uploaded"));
    document.querySelectorAll(".file-preview").forEach(p => { p.classList.remove("visible"); p.innerHTML = ""; });

  } catch (err) {
    overlay.classList.remove("active");
    submitBtn.disabled = false;
    showError("Network error: " + err.message + ". Please check your connection and try again.");
  }
}

/* ============================================================
   HELPERS
   ============================================================ */
function generateRefId() {
  const ts   = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return "VND-" + ts + "-" + rand;
}

function showError(msg) {
  document.getElementById("errorMessage").textContent = msg;
  document.getElementById("errorModal").classList.add("active");
}

function closeModal() {
  document.getElementById("successModal").classList.remove("active");
}

function resetForm() {
  if (!confirm("Are you sure you want to reset all fields?")) return;
  document.getElementById("vendorForm").reset();
  Object.keys(uploadedFiles).forEach(k => uploadedFiles[k] = null);
  document.querySelectorAll(".uploaded,.invalid").forEach(c => { c.classList.remove("uploaded","invalid"); });
  document.querySelectorAll(".file-preview").forEach(p => { p.classList.remove("visible"); p.innerHTML = ""; });
  document.querySelectorAll(".has-error").forEach(g => g.classList.remove("has-error"));
  document.getElementById("declError").classList.remove("visible");
  window.scrollTo({ top: 0, behavior: "smooth" });
}
