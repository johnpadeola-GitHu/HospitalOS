// System admin service — facilities/sites, settings, security audit log,
// document templates, and integration endpoints. Lightweight registries to
// complete the System group. In-memory now; async API shaped for a later D1 swap.

const delay = (ms = 90) => new Promise((r) => setTimeout(r, ms));
const iso = (m) => new Date(Date.now() + m * 60000).toISOString();

/* -------- Facilities / sites -------- */
const _sites = [
  { id: "site1", name: "Main Hospital", type: "Tertiary Referral", beds: 56, active: true },
  { id: "site2", name: "Annexe Clinic — Moniya", type: "Outpatient", beds: 0, active: true },
  { id: "site3", name: "Community Health Post — Ijaye", type: "Primary", beds: 6, active: true },
];
export async function listSites() { await delay(); return [..._sites]; }
export async function toggleSite(id) {
  await delay(60);
  const s = _sites.find((x) => x.id === id);
  if (!s) throw new Error("Not found");
  s.active = !s.active;
  return s;
}

/* -------- Settings -------- */
const _settings = {
  hospitalName: "Ibadan Teaching Hospital",
  logoUrl: "",  // tenant-supplied logo; falls back to initials badge when empty
  address: "Ring Road, Ibadan, Oyo State, Nigeria",
  phone: "+234 803 000 0000",
  email: "info@hospitalos-teaching.ng",
  currency: "NGN (\u20a6)",
  timezone: "Africa/Lagos (WAT)",
  nhisEnabled: true,
  criticalAlertSound: true,
};
export async function getSettings() { await delay(); return { ..._settings }; }
export async function updateSettings(patch) {
  await delay();
  Object.assign(_settings, patch);
  return { ..._settings };
}

/* -------- Security audit log -------- */
const _audit = [
  { id: "a1", at: iso(-12), actor: "Dr. Adewale Ogun", action: "Verified lab result", ref: "LAB-000241" },
  { id: "a2", at: iso(-40), actor: "Amaka (Cashier)", action: "Recorded payment", ref: "RCT-00001" },
  { id: "a3", at: iso(-95), actor: "Dr. Ngozi Umeh", action: "Admitted patient", ref: "H001001" },
  { id: "a4", at: iso(-140), actor: "System", action: "Critical alert raised", ref: "ICU-01" },
  { id: "a5", at: iso(-200), actor: "Tunde (Pharmacy)", action: "Dispensed medication", ref: "DISP-00001" },
];
export async function listAudit() { await delay(); return [..._audit].sort((a, b) => new Date(b.at) - new Date(a.at)); }

/* -------- Document templates -------- */
const _docs = [
  { id: "d1", name: "Discharge Summary", category: "Clinical", updated: "2026-06-30" },
  { id: "d2", name: "Referral Letter", category: "Clinical", updated: "2026-06-28" },
  { id: "d3", name: "Consent — Surgery", category: "Consent", updated: "2026-07-02" },
  { id: "d4", name: "NHIA Claim Form", category: "Finance", updated: "2026-07-05" },
  { id: "d5", name: "Death Certificate", category: "Statutory", updated: "2026-06-20" },
  { id: "d6", name: "Birth Notification", category: "Statutory", updated: "2026-06-20" },
];
export async function listDocs() { await delay(); return [..._docs]; }

/* -------- Integration endpoints -------- */
const _integrations = [
  { id: "i1", name: "HL7 v2 — Lab analyzers", status: "connected", detail: "3 instruments interfaced" },
  { id: "i2", name: "FHIR API — National eHealth", status: "connected", detail: "R4, patient + encounter" },
  { id: "i3", name: "Paystack — Payments", status: "connected", detail: "Live keys" },
  { id: "i4", name: "NHIA Claims Gateway", status: "pending", detail: "Awaiting credentials" },
  { id: "i5", name: "SMS Gateway — Reminders", status: "connected", detail: "Termii" },
];
export async function listIntegrations() { await delay(); return [..._integrations]; }
