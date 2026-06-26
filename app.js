"use strict";

const STORAGE_KEY = "ats_applications_v1";
const AUTH_KEY = "ats_auth_v1";
const SESSION_KEY = "ats_session_v1";

const appRoot = document.getElementById("appRoot");
const authGate = document.getElementById("authGate");
const authForm = document.getElementById("authForm");
const authTitle = document.getElementById("authTitle");
const authSubtitle = document.getElementById("authSubtitle");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authConfirm = document.getElementById("authConfirm");
const confirmWrap = document.getElementById("confirmWrap");
const authError = document.getElementById("authError");
const authSubmit = document.getElementById("authSubmit");
const createAccountBtn = document.getElementById("createAccountBtn");
const resetLoginBtn = document.getElementById("resetLoginBtn");
const resetHint = document.getElementById("resetHint");
const logoutBtn = document.getElementById("logoutBtn");

const form = document.getElementById("applicationForm");
const applicationId = document.getElementById("applicationId");
const companyInput = document.getElementById("company");
const positionInput = document.getElementById("position");
const appliedDateInput = document.getElementById("appliedDate");
const statusInput = document.getElementById("status");
const stageInput = document.getElementById("stage");
const cvUsedInput = document.getElementById("cvUsed");
const sourceInput = document.getElementById("source");
const salaryRangeInput = document.getElementById("salaryRange");
const notesInput = document.getElementById("notes");
const rejectionFields = document.getElementById("rejectionFields");
const rejectionStageInput = document.getElementById("rejectionStage");
const rejectionReasonInput = document.getElementById("rejectionReason");

const searchInput = document.getElementById("searchInput");
const statusFilterInput = document.getElementById("statusFilter");
const cvFilterInput = document.getElementById("cvFilter");

const applicationsTable = document.getElementById("applicationsTable");
const kpiGrid = document.getElementById("kpiGrid");
const rejectionChart = document.getElementById("rejectionChart");
const cvChart = document.getElementById("cvChart");
const trendChart = document.getElementById("trendChart");

const resetBtn = document.getElementById("resetBtn");
const exportBtn = document.getElementById("exportBtn");
const importFile = document.getElementById("importFile");
const clearDataBtn = document.getElementById("clearDataBtn");
const sampleBtn = document.getElementById("sampleBtn");

let applications = readApplications();
let authMode = "signin";

boot();

function boot() {
  const auth = readAuth();
  const session = readSession();

  document.body.classList.add("auth-locked");
  appRoot.classList.add("is-hidden");
  authGate.classList.remove("is-hidden");

  setupAuthMode(!auth);

  if (auth && session && session.email === auth.email) {
    unlockApp();
    initApp();
    return;
  }

  authForm.addEventListener("submit", handleAuthSubmit);
  createAccountBtn.addEventListener("click", handleCreateAccountClick);
  resetLoginBtn.addEventListener("click", handleResetLogin);
}

let appInitialized = false;

function initApp() {
  if (appInitialized) return;
  appInitialized = true;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const payload = normalizePayload(new FormData(form));

    const existingIndex = applications.findIndex((item) => item.id === payload.id);
    if (existingIndex >= 0) {
      applications[existingIndex] = payload;
    } else {
      applications.push(payload);
    }

    writeApplications();
    renderAll();
    resetForm();
  });

  statusInput.addEventListener("change", toggleRejectionFields);
  resetBtn.addEventListener("click", resetForm);

  applicationsTable.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;

    const id = target.dataset.id;
    const action = target.dataset.action;
    if (!id || !action) return;

    const app = applications.find((item) => item.id === id);
    if (!app) return;

    if (action === "delete") {
      const ok = window.confirm(`Delete application for ${app.company} - ${app.position}?`);
      if (!ok) return;

      applications = applications.filter((item) => item.id !== id);
      writeApplications();
      renderAll();
      return;
    }

    if (action === "edit") {
      applicationId.value = app.id;
      companyInput.value = app.company;
      positionInput.value = app.position;
      appliedDateInput.value = app.appliedDate;
      statusInput.value = app.status;
      stageInput.value = app.stage;
      cvUsedInput.value = app.cvUsed;
      sourceInput.value = app.source;
      salaryRangeInput.value = app.salaryRange || "";
      notesInput.value = app.notes || "";
      rejectionStageInput.value = app.rejectionStage || "";
      rejectionReasonInput.value = app.rejectionReason || "";
      toggleRejectionFields();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  [searchInput, statusFilterInput, cvFilterInput].forEach((input) => {
    input.addEventListener("input", renderTable);
    input.addEventListener("change", renderTable);
  });

  clearDataBtn.addEventListener("click", () => {
    const ok = window.confirm("Clear all stored ATS data? This cannot be undone.");
    if (!ok) return;

    applications = [];
    writeApplications();
    resetForm();
    renderAll();
  });

  exportBtn.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(applications, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ats-applications.json";
    link.click();
    URL.revokeObjectURL(url);
  });

  importFile.addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || "[]"));
        if (!Array.isArray(parsed)) {
          throw new Error("Invalid JSON shape");
        }
        applications = parsed;
        writeApplications();
        renderAll();
        resetForm();
        importFile.value = "";
      } catch {
        window.alert("Could not import file. Please select a valid JSON export.");
      }
    };
    reader.readAsText(file);
  });

  sampleBtn.addEventListener("click", () => {
    if (applications.length) {
      const ok = window.confirm("Sample data will replace existing data. Continue?");
      if (!ok) return;
    }

    applications = [
      {
        id: uid(),
        company: "Hey Holy",
        position: "Customer Success Team Lead",
        appliedDate: isoDateDaysAgo(21),
        status: "in-progress",
        stage: "hiring-manager",
        cvUsed: "cv-team-lead.html",
        source: "linkedin",
        salaryRange: "58k-68k EUR",
        notes: "Strong match on people leadership and KPI ownership.",
        rejectionStage: "",
        rejectionReason: "",
        updatedAt: new Date().toISOString(),
      },
      {
        id: uid(),
        company: "PawSure",
        position: "Customer Operations Lead",
        appliedDate: isoDateDaysAgo(34),
        status: "rejected",
        stage: "final-interview",
        cvUsed: "cv-team-lead.html",
        source: "company-site",
        salaryRange: "60k-70k EUR",
        notes: "Need stronger domain examples in insurance.",
        rejectionStage: "final-interview",
        rejectionReason: "Selected candidate with direct pet-insurance background.",
        updatedAt: new Date().toISOString(),
      },
      {
        id: uid(),
        company: "FinNest",
        position: "Project Manager, Customer Experience",
        appliedDate: isoDateDaysAgo(9),
        status: "applied",
        stage: "screening",
        cvUsed: "cv-en.html",
        source: "referral",
        salaryRange: "62k-72k EUR",
        notes: "Referral from former colleague.",
        rejectionStage: "",
        rejectionReason: "",
        updatedAt: new Date().toISOString(),
      },
    ];

    writeApplications();
    renderAll();
    resetForm();
  });

  logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.reload();
  });

  resetForm();
  renderAll();
}

function readAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setupAuthMode(isFirstSetup) {
  if (isFirstSetup) {
    authMode = "create";
    authTitle.textContent = "Create Your Login";
    authSubtitle.textContent = "Set an email and password to lock your ATS on this browser.";
    confirmWrap.classList.remove("is-hidden");
    authSubmit.textContent = "Create Account";
    createAccountBtn.classList.add("is-hidden");
    resetLoginBtn.classList.remove("is-hidden");
    resetHint.classList.remove("is-hidden");
  } else {
    authMode = "signin";
    authTitle.textContent = "Sign In";
    authSubtitle.textContent = "Use your credentials to access your application tracker.";
    confirmWrap.classList.add("is-hidden");
    authSubmit.textContent = "Sign In";
    createAccountBtn.classList.remove("is-hidden");
    resetLoginBtn.classList.remove("is-hidden");
    resetHint.classList.remove("is-hidden");
  }
}

function handleResetLogin() {
  const ok = window.confirm("Reset login for this browser? You will create a new email and password.");
  if (!ok) return;

  localStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  authForm.reset();
  clearAuthError();
  setupAuthMode(true);
}

function showAuthError(message) {
  authError.textContent = message;
  authError.classList.remove("is-hidden");
}

function clearAuthError() {
  authError.textContent = "";
  authError.classList.add("is-hidden");
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  clearAuthError();

  const email = authEmail.value.trim().toLowerCase();
  const password = authPassword.value;
  const confirmPassword = authConfirm.value;

  if (authMode === "create") {
    await createAccount(email, password, confirmPassword);
    return;
  }

  await signIn(email, password);
}

async function handleCreateAccountClick() {
  clearAuthError();

  if (authMode !== "create") {
    setupAuthMode(true);
  }

  const email = authEmail.value.trim().toLowerCase();
  const password = authPassword.value;
  const confirmPassword = authConfirm.value;

  await createAccount(email, password, confirmPassword);
}

async function createAccount(email, password, confirmPassword) {
  if (!email || !password) {
    showAuthError("Enter email and password to create an account.");
    return;
  }

  if (password.length < 6) {
    showAuthError("Password must be at least 6 characters.");
    return;
  }

  if (!confirmPassword) {
    showAuthError("Please confirm your password.");
    authConfirm.focus();
    return;
  }

  if (password !== confirmPassword) {
    showAuthError("Passwords do not match.");
    return;
  }

  const passwordHash = await hashPassword(password);
  localStorage.setItem(AUTH_KEY, JSON.stringify({ email, passwordHash }));
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ email, loginAt: new Date().toISOString() }));
  unlockApp();
  initApp();
}

async function signIn(email, password) {
  if (!email || !password) {
    showAuthError("Email and password are required.");
    return;
  }

  if (password.length < 6) {
    showAuthError("Password must be at least 6 characters.");
    return;
  }

  const existingAuth = readAuth();
  if (!existingAuth) {
    setupAuthMode(true);
    showAuthError("No account found yet. Create an account first.");
    return;
  }

  const passwordHash = await hashPassword(password);
  if (email !== existingAuth.email || passwordHash !== existingAuth.passwordHash) {
    showAuthError("Invalid email or password.");
    return;
  }

  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ email, loginAt: new Date().toISOString() }));
  unlockApp();
  initApp();
}

async function hashPassword(input) {
  if (!(window.crypto && window.crypto.subtle && window.TextEncoder)) {
    return simpleHash(input);
  }

  const data = new TextEncoder().encode(input);
  try {
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const bytes = Array.from(new Uint8Array(hashBuffer));
    return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return simpleHash(input);
  }
}

function simpleHash(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return `fallback_${Math.abs(hash)}`;
}

function unlockApp() {
  authGate.classList.add("is-hidden");
  appRoot.classList.remove("is-hidden");
  document.body.classList.remove("auth-locked");
}

function readApplications() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeApplications() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
}

function uid() {
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return String(Date.now() + Math.random());
}

function normalizePayload(formData) {
  const status = formData.get("status");
  const isRejected = status === "rejected";

  return {
    id: applicationId.value || uid(),
    company: String(formData.get("company") || "").trim(),
    position: String(formData.get("position") || "").trim(),
    appliedDate: String(formData.get("appliedDate") || ""),
    status,
    stage: String(formData.get("stage") || "application"),
    cvUsed: String(formData.get("cvUsed") || "other"),
    source: String(formData.get("source") || "other"),
    salaryRange: String(formData.get("salaryRange") || "").trim(),
    notes: String(formData.get("notes") || "").trim(),
    rejectionStage: isRejected ? String(formData.get("rejectionStage") || "") : "",
    rejectionReason: isRejected ? String(formData.get("rejectionReason") || "").trim() : "",
    updatedAt: new Date().toISOString(),
  };
}

function toggleRejectionFields() {
  const show = statusInput.value === "rejected";
  rejectionFields.classList.toggle("is-hidden", !show);
}

function resetForm() {
  form.reset();
  applicationId.value = "";
  statusInput.value = "applied";
  stageInput.value = "application";
  sourceInput.value = "linkedin";
  cvUsedInput.value = "cv-team-lead.html";
  toggleRejectionFields();
}

function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB");
}

function toLabel(input) {
  return input
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function filteredApplications() {
  const search = searchInput.value.trim().toLowerCase();
  const statusFilter = statusFilterInput.value;
  const cvFilter = cvFilterInput.value;

  return applications
    .filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (cvFilter !== "all" && item.cvUsed !== cvFilter) return false;
      if (!search) return true;

      const haystack = `${item.company} ${item.position}`.toLowerCase();
      return haystack.includes(search);
    })
    .sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));
}

function renderTable() {
  const rows = filteredApplications();

  if (!rows.length) {
    applicationsTable.innerHTML = '<tr><td colspan="9" class="empty-state">No applications found. Add your first one above.</td></tr>';
    return;
  }

  applicationsTable.innerHTML = rows
    .map((item) => {
      const rejectionText = item.status === "rejected"
        ? `${toLabel(item.rejectionStage || "unknown")}: ${item.rejectionReason || "No reason provided"}`
        : "-";

      return `
        <tr>
          <td><strong>${escapeHtml(item.company)}</strong></td>
          <td>${escapeHtml(item.position)}</td>
          <td>${formatDate(item.appliedDate)}</td>
          <td><span class="status-pill status-pill--${escapeHtml(item.status)}">${toLabel(item.status)}</span></td>
          <td>${escapeHtml(toLabel(item.stage))}</td>
          <td>${escapeHtml(item.cvUsed)}</td>
          <td>${escapeHtml(toLabel(item.source))}</td>
          <td>${escapeHtml(rejectionText)}</td>
          <td>
            <div class="row-actions">
              <button class="row-btn" data-action="edit" data-id="${escapeHtml(item.id)}">Edit</button>
              <button class="row-btn" data-action="delete" data-id="${escapeHtml(item.id)}">Delete</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

function metricCard(label, value) {
  return `
    <article class="kpi">
      <div class="kpi__label">${label}</div>
      <div class="kpi__value">${value}</div>
    </article>
  `;
}

function renderKpis() {
  const total = applications.length;
  const rejected = applications.filter((item) => item.status === "rejected").length;
  const offers = applications.filter((item) => item.status === "offer").length;
  const active = applications.filter((item) => item.status === "applied" || item.status === "in-progress").length;
  const thisMonth = applications.filter((item) => {
    const d = new Date(item.appliedDate);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const responseCount = applications.filter((item) => item.stage !== "application").length;
  const responseRate = total ? `${Math.round((responseCount / total) * 100)}%` : "0%";
  const offerRate = total ? `${Math.round((offers / total) * 100)}%` : "0%";

  kpiGrid.innerHTML = [
    metricCard("Total Applications", total),
    metricCard("Active Pipeline", active),
    metricCard("Applied This Month", thisMonth),
    metricCard("Offers", offers),
    metricCard("Rejections", rejected),
    metricCard("Response Rate", responseRate),
    metricCard("Offer Rate", offerRate),
  ].join("");
}

function renderBarChart(target, data, altColor = false) {
  const entries = Object.entries(data);

  if (!entries.length) {
    target.innerHTML = '<p class="empty-state">No data yet.</p>';
    return;
  }

  const max = Math.max(...entries.map(([, value]) => value), 1);

  target.innerHTML = entries
    .map(([label, value]) => {
      const width = Math.round((value / max) * 100);
      return `
        <div class="bar-row">
          <span>${escapeHtml(toLabel(label))}</span>
          <div class="bar-track">
            <div class="bar-fill ${altColor ? "bar-fill--alt" : ""}" style="width:${width}%"></div>
          </div>
          <strong>${value}</strong>
        </div>
      `;
    })
    .join("");
}

function renderTrend() {
  const now = new Date();
  const buckets = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-GB", { month: "short" });
    buckets.push({ key, label, count: 0 });
  }

  applications.forEach((item) => {
    if (!item.appliedDate) return;
    const d = new Date(item.appliedDate);
    if (Number.isNaN(d.getTime())) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const bucket = buckets.find((entry) => entry.key === key);
    if (bucket) bucket.count += 1;
  });

  const max = Math.max(...buckets.map((b) => b.count), 1);

  trendChart.innerHTML = buckets
    .map((bucket) => {
      const height = Math.round((bucket.count / max) * 110) + 8;
      return `
        <div class="line-col">
          <div class="line-col__value">${bucket.count}</div>
          <div class="line-col__bar" style="height:${height}px"></div>
          <div class="line-col__label">${bucket.label}</div>
        </div>
      `;
    })
    .join("");
}

function renderAnalytics() {
  renderKpis();

  const rejectionData = {};
  const cvData = {};

  applications.forEach((item) => {
    if (item.status === "rejected") {
      const key = item.rejectionStage || item.stage || "unknown";
      rejectionData[key] = (rejectionData[key] || 0) + 1;
    }
    cvData[item.cvUsed] = (cvData[item.cvUsed] || 0) + 1;
  });

  renderBarChart(rejectionChart, rejectionData, true);
  renderBarChart(cvChart, cvData);
  renderTrend();
}

function renderAll() {
  renderTable();
  renderAnalytics();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isoDateDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}
