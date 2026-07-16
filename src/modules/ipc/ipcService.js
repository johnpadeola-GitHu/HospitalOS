// Infection Prevention & Control (IPC).
// Distinct from Public Health's disease surveillance: that is community-
// facing (national reporting of notifiable disease), this is internal —
// hospital-acquired infections, isolation precautions on the wards, and
// outbreak thresholds within the facility itself.
// In-memory now; async API shaped for a later D1 swap.

import { record, AUDIT_ACTIONS } from "../../lib/audit";

const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));

export const HAI_TYPES = [
  "Surgical site infection", "Catheter-associated UTI", "Central line-associated bloodstream infection",
  "Ventilator-associated pneumonia", "Clostridioides difficile", "MRSA colonisation/infection", "Other HAI",
];
export const PRECAUTION_TYPES = ["Standard", "Contact", "Droplet", "Airborne", "Contact + Droplet"];
export const HAI_STATUS = ["open", "under-investigation", "resolved"];
export const STATUS_TONE = { open: "warn", "under-investigation": "info", resolved: "good" };

let _haiSeq = 500;
function haiRef() { _haiSeq += 1; return "HAI-" + String(_haiSeq).padStart(5, "0"); }

const _cases = [
  {
    id: "h1", ref: "HAI-00501", patientName: "Bello, Fatima", hospitalNo: "H001003",
    type: "Surgical site infection", ward: "Surgical Ward A", bed: "SA-03",
    reportedAt: new Date(Date.now() - 2 * 86400000).toISOString(), status: "under-investigation",
    reportedBy: "Dr. Ngozi Umeh", notes: "Wound erythema and discharge noted day 5 post-op; wound swab sent.",
  },
];

const _isolations = [
  { id: "iso1", patientName: "Okonkwo, Emeka", hospitalNo: "H001005", ward: "Isolation Unit", bed: "ISO-01", precaution: "Contact + Droplet", reason: "Suspected multidrug-resistant organism", startedAt: new Date(Date.now() - 86400000).toISOString(), endedAt: null },
];

export async function listHaiCases({ status = "all", query = "" } = {}) {
  await delay();
  const q = query.trim().toLowerCase();
  return _cases
    .filter((c) => (status === "all" ? true : c.status === status))
    .filter((c) => !q || c.patientName.toLowerCase().includes(q) || c.ref.toLowerCase().includes(q))
    .sort((a, b) => new Date(b.reportedAt) - new Date(a.reportedAt));
}

export async function reportHai({ patientName, hospitalNo, type, ward, bed, notes, actor }) {
  await delay();
  if (!patientName || !patientName.trim()) throw new Error("Enter the patient.");
  if (!HAI_TYPES.includes(type)) throw new Error("Choose an infection type.");
  const c = {
    id: "h" + Date.now(), ref: haiRef(), patientName: patientName.trim(), hospitalNo: hospitalNo || "\u2014",
    type, ward: ward || "\u2014", bed: bed || "\u2014", reportedAt: new Date().toISOString(),
    status: "open", reportedBy: actor?.name || "Unknown", notes: notes || "",
  };
  _cases.unshift(c);
  record({ actor, action: AUDIT_ACTIONS.CLINICAL, entity: "hai-case", entityId: c.ref, detail: `Reported ${type} \u2014 ${c.patientName}`, severity: "warn" });
  return c;
}

export async function updateHaiStatus(id, status, actor) {
  await delay(80);
  const c = _cases.find((x) => x.id === id);
  if (!c) throw new Error("Case not found");
  if (!HAI_STATUS.includes(status)) throw new Error("Unknown status.");
  c.status = status;
  record({ actor, action: AUDIT_ACTIONS.UPDATE, entity: "hai-case", entityId: c.ref, detail: `${status} \u2014 ${c.patientName}`, severity: "info" });
  return c;
}

export async function listIsolations({ activeOnly = true } = {}) {
  await delay();
  return _isolations.filter((i) => !activeOnly || !i.endedAt);
}

export async function startIsolation({ patientName, hospitalNo, ward, bed, precaution, reason, actor }) {
  await delay();
  if (!patientName || !patientName.trim()) throw new Error("Enter the patient.");
  if (!PRECAUTION_TYPES.includes(precaution)) throw new Error("Choose a precaution type.");
  const iso = {
    id: "iso" + Date.now(), patientName: patientName.trim(), hospitalNo: hospitalNo || "\u2014",
    ward: ward || "\u2014", bed: bed || "\u2014", precaution, reason: reason || "",
    startedAt: new Date().toISOString(), endedAt: null,
  };
  _isolations.unshift(iso);
  record({ actor, action: AUDIT_ACTIONS.CLINICAL, entity: "isolation", entityId: iso.id, detail: `${precaution} precautions started \u2014 ${iso.patientName}`, severity: "info" });
  return iso;
}

export async function endIsolation(id, actor) {
  await delay(80);
  const iso = _isolations.find((x) => x.id === id);
  if (!iso) throw new Error("Isolation record not found");
  iso.endedAt = new Date().toISOString();
  record({ actor, action: AUDIT_ACTIONS.CLINICAL, entity: "isolation", entityId: iso.id, detail: `Isolation ended \u2014 ${iso.patientName}`, severity: "info" });
  return iso;
}

/** Three or more open HAI cases of the SAME type within the facility is the
 * operational outbreak threshold this module watches for. */
export async function checkOutbreakThreshold() {
  await delay(60);
  const open = _cases.filter((c) => c.status !== "resolved");
  const byType = {};
  for (const c of open) byType[c.type] = (byType[c.type] || 0) + 1;
  return Object.entries(byType)
    .filter(([, n]) => n >= 3)
    .map(([type, count]) => ({ type, count }));
}

export async function ipcSummary() {
  await delay(60);
  const outbreaks = await checkOutbreakThreshold();
  return {
    openCases: _cases.filter((c) => c.status !== "resolved").length,
    activeIsolations: _isolations.filter((i) => !i.endedAt).length,
    outbreakSignals: outbreaks.length,
  };
}
