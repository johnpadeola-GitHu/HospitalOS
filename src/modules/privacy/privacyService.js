// Privacy & consent — Nigeria Data Protection Act 2023 (NDPA), enforced by
// the Nigeria Data Protection Commission (NDPC), successor to the 2019 NDPR.
// A hospital handling health data (a "special category" under the Act)
// needs two things this module provides: recorded consent for processing,
// and a tracked route for data-subject rights requests.
//
// In-memory now; async API shaped for a later D1 swap.

import { record, AUDIT_ACTIONS } from "../../lib/audit";

const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));

export const CONSENT_PURPOSES = [
  "Clinical care & treatment",
  "Billing & insurance claims",
  "Research (de-identified)",
  "Research (identified, study-specific)",
  "Marketing & appointment reminders",
  "Sharing with a named referral facility",
];

export const CONSENT_STATUS = ["granted", "withdrawn", "expired"];
export const DSAR_TYPES = ["Access request", "Rectification", "Erasure", "Restriction of processing", "Data portability"];
export const DSAR_STATUS = ["received", "in-progress", "fulfilled", "declined"];
export const DSAR_TONE = { received: "warn", "in-progress": "info", fulfilled: "good", declined: "bad" };

const NDPA_RESPONSE_DAYS = 30; // statutory response window under the NDPA

let _consentSeq = 900;
let _dsarSeq = 700;

const _consents = [
  { id: "c1", ref: "CNS-00901", patientName: "Okafor, Adaeze", hospitalNo: "H001001", purpose: "Clinical care & treatment", status: "granted", grantedAt: "2026-03-14", withdrawnAt: null, method: "Signed paper form, scanned" },
  { id: "c2", ref: "CNS-00902", patientName: "Okafor, Adaeze", hospitalNo: "H001001", purpose: "Marketing & appointment reminders", status: "granted", grantedAt: "2026-03-14", withdrawnAt: null, method: "Verbal, recorded by registration staff" },
  { id: "c3", ref: "CNS-00903", patientName: "Eze, Chibuike", hospitalNo: "H001002", purpose: "Research (de-identified)", status: "withdrawn", grantedAt: "2026-01-10", withdrawnAt: "2026-06-02", method: "Signed paper form, scanned" },
];

const _dsars = [
  { id: "d1", ref: "DSR-00701", patientName: "Bello, Fatima", hospitalNo: "H001003", type: "Access request", detail: "Requests a full copy of her medical record for a second opinion.", status: "in-progress", receivedAt: "2026-07-08", dueBy: addDays("2026-07-08", NDPA_RESPONSE_DAYS), fulfilledAt: null, notes: [] },
];

function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function consentRef() { _consentSeq += 1; return "CNS-" + String(_consentSeq).padStart(5, "0"); }
function dsarRef() { _dsarSeq += 1; return "DSR-" + String(_dsarSeq).padStart(5, "0"); }

/* ---------------- Consent ---------------- */

export async function listConsents({ patientQuery = "", status = "all" } = {}) {
  await delay();
  const q = patientQuery.trim().toLowerCase();
  return _consents
    .filter((c) => (status === "all" ? true : c.status === status))
    .filter((c) => !q || c.patientName.toLowerCase().includes(q) || c.hospitalNo.toLowerCase().includes(q))
    .sort((a, b) => (b.grantedAt || "").localeCompare(a.grantedAt || ""));
}

export async function recordConsent({ patientName, hospitalNo, purpose, method, actor }) {
  await delay();
  if (!patientName || !patientName.trim()) throw new Error("Enter the patient.");
  if (!CONSENT_PURPOSES.includes(purpose)) throw new Error("Choose a purpose.");
  if (!method || !method.trim()) throw new Error("Record how consent was captured.");
  const c = {
    id: "c" + Date.now(), ref: consentRef(), patientName: patientName.trim(), hospitalNo: hospitalNo || "\u2014",
    purpose, status: "granted", grantedAt: new Date().toISOString().slice(0, 10), withdrawnAt: null, method: method.trim(),
  };
  _consents.unshift(c);
  record({ actor, action: AUDIT_ACTIONS.CREATE, entity: "consent", entityId: c.ref, detail: `Consent granted \u2014 ${c.patientName}: ${purpose}`, severity: "info" });
  return c;
}

export async function withdrawConsent(id, actor) {
  await delay(80);
  const c = _consents.find((x) => x.id === id);
  if (!c) throw new Error("Consent record not found");
  if (c.status !== "granted") throw new Error("Only a granted consent can be withdrawn.");
  c.status = "withdrawn";
  c.withdrawnAt = new Date().toISOString().slice(0, 10);
  record({ actor, action: AUDIT_ACTIONS.UPDATE, entity: "consent", entityId: c.ref, detail: `Consent withdrawn \u2014 ${c.patientName}: ${c.purpose}`, severity: "warn" });
  return c;
}

/* ---------------- Data Subject Access Requests (DSARs) ---------------- */

export async function listDsars({ status = "all", query = "" } = {}) {
  await delay();
  const q = query.trim().toLowerCase();
  const today = new Date().toISOString().slice(0, 10);
  return _dsars
    .filter((d) => (status === "all" ? true : d.status === status))
    .filter((r) => !q || r.patientName.toLowerCase().includes(q) || r.ref.toLowerCase().includes(q))
    .map((d) => ({ ...d, overdue: d.status !== "fulfilled" && d.status !== "declined" && d.dueBy < today }))
    .sort((a, b) => a.dueBy.localeCompare(b.dueBy));
}

export async function fileDsar({ patientName, hospitalNo, type, detail, actor }) {
  await delay();
  if (!patientName || !patientName.trim()) throw new Error("Enter the patient.");
  if (!DSAR_TYPES.includes(type)) throw new Error("Choose a request type.");
  if (!detail || !detail.trim()) throw new Error("Describe the request.");
  const today = new Date().toISOString().slice(0, 10);
  const d = {
    id: "d" + Date.now(), ref: dsarRef(), patientName: patientName.trim(), hospitalNo: hospitalNo || "\u2014",
    type, detail: detail.trim(), status: "received", receivedAt: today, dueBy: addDays(today, NDPA_RESPONSE_DAYS),
    fulfilledAt: null, notes: [],
  };
  _dsars.unshift(d);
  record({ actor, action: AUDIT_ACTIONS.CREATE, entity: "dsar", entityId: d.ref, detail: `${type} filed \u2014 ${d.patientName}`, severity: "info" });
  return d;
}

export async function updateDsar(id, { status, note, actor }) {
  await delay(80);
  const d = _dsars.find((x) => x.id === id);
  if (!d) throw new Error("Request not found");
  if (!DSAR_STATUS.includes(status)) throw new Error("Unknown status.");
  if ((status === "fulfilled" || status === "declined") && (!note || !note.trim())) {
    throw new Error("A closing note is required to fulfil or decline a data-subject request.");
  }
  d.status = status;
  if (status === "fulfilled") d.fulfilledAt = new Date().toISOString().slice(0, 10);
  if (note && note.trim()) d.notes.push({ at: new Date().toISOString().slice(0, 10), by: actor?.name || "Unknown", note: note.trim() });
  record({ actor, action: AUDIT_ACTIONS.UPDATE, entity: "dsar", entityId: d.ref, detail: `${status} \u2014 ${d.patientName}`, severity: status === "declined" ? "warn" : "info" });
  return d;
}

export async function listOverdueDsars() {
  await delay(60);
  const today = new Date().toISOString().slice(0, 10);
  return _dsars.filter((d) => d.status !== "fulfilled" && d.status !== "declined" && d.dueBy < today);
}

export async function privacySummary() {
  await delay(60);
  const today = new Date().toISOString().slice(0, 10);
  return {
    consentsActive: _consents.filter((c) => c.status === "granted").length,
    consentsWithdrawn: _consents.filter((c) => c.status === "withdrawn").length,
    dsarsOpen: _dsars.filter((d) => d.status !== "fulfilled" && d.status !== "declined").length,
    dsarsOverdue: _dsars.filter((d) => d.status !== "fulfilled" && d.status !== "declined" && d.dueBy < today).length,
    responseWindowDays: NDPA_RESPONSE_DAYS,
  };
}
