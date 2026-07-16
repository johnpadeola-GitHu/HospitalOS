// Occupational Health — staff health, not patient care.
// Pre-employment screening, staff immunisation status, workplace injury
// logging, and fitness-to-work certification for hospital employees.
// In-memory now; async API shaped for a later D1 swap.

import { record, AUDIT_ACTIONS } from "../../lib/audit";

const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));

export const FITNESS_STATUS = ["Fit for duty", "Fit with restrictions", "Temporarily unfit", "Under review"];
export const STATUS_TONE = { "Fit for duty": "good", "Fit with restrictions": "warn", "Temporarily unfit": "bad", "Under review": "info" };
export const INJURY_TYPES = ["Needlestick injury", "Slip/fall", "Manual handling injury", "Chemical exposure", "Assault", "Other"];

let _staffSeq = 800;
function staffRef() { _staffSeq += 1; return "OCH-" + String(_staffSeq).padStart(5, "0"); }
let _injSeq = 900;
function injRef() { _injSeq += 1; return "INJ-" + String(_injSeq).padStart(5, "0"); }

const _staff = [
  { id: "oh1", ref: "OCH-00801", staffName: "Nurse B. Adeleke", department: "Emergency", fitnessStatus: "Fit for duty", lastScreenedAt: "2026-01-15", hepBImmune: true, tbScreened: true },
];

const _injuries = [
  { id: "inj1", ref: "INJ-00901", staffName: "Lab Tech K. Yusuf", department: "Laboratory", type: "Needlestick injury", reportedAt: new Date(Date.now() - 5 * 86400000).toISOString(), status: "resolved", notes: "Source patient tested negative; PEP not required." },
];

export async function listStaff({ query = "" } = {}) {
  await delay();
  const q = query.trim().toLowerCase();
  return _staff.filter((s) => !q || s.staffName.toLowerCase().includes(q)).map((s) => ({ ...s }));
}

export async function registerStaff({ staffName, department, actor }) {
  await delay();
  if (!staffName || !staffName.trim()) throw new Error("Enter the staff member's name.");
  const s = { id: "oh" + Date.now(), ref: staffRef(), staffName: staffName.trim(), department: department || "\u2014", fitnessStatus: "Under review", lastScreenedAt: new Date().toISOString().slice(0, 10), hepBImmune: false, tbScreened: false };
  _staff.unshift(s);
  record({ actor, action: AUDIT_ACTIONS.CREATE, entity: "occ-health-staff", entityId: s.ref, detail: `Registered ${s.staffName}`, severity: "info" });
  return s;
}

export async function updateFitness(id, status, actor) {
  await delay(80);
  const s = _staff.find((x) => x.id === id);
  if (!s) throw new Error("Staff record not found");
  if (!FITNESS_STATUS.includes(status)) throw new Error("Unknown status.");
  s.fitnessStatus = status;
  s.lastScreenedAt = new Date().toISOString().slice(0, 10);
  record({ actor, action: AUDIT_ACTIONS.UPDATE, entity: "occ-health-staff", entityId: s.ref, detail: `${status} \u2014 ${s.staffName}`, severity: "info" });
  return s;
}

export async function listInjuries() {
  await delay();
  return [..._injuries].sort((a, b) => new Date(b.reportedAt) - new Date(a.reportedAt));
}

export async function reportInjury({ staffName, department, type, notes, actor }) {
  await delay();
  if (!staffName || !staffName.trim()) throw new Error("Enter the staff member's name.");
  if (!INJURY_TYPES.includes(type)) throw new Error("Choose an injury type.");
  const inj = { id: "inj" + Date.now(), ref: injRef(), staffName: staffName.trim(), department: department || "\u2014", type, reportedAt: new Date().toISOString(), status: "open", notes: notes || "" };
  _injuries.unshift(inj);
  record({ actor, action: AUDIT_ACTIONS.CREATE, entity: "occ-health-injury", entityId: inj.ref, detail: `${type} \u2014 ${inj.staffName}`, severity: type === "Needlestick injury" ? "warn" : "info" });
  return inj;
}

export async function occHealthSummary() {
  await delay(60);
  return {
    staffTracked: _staff.length,
    unfitOrRestricted: _staff.filter((s) => s.fitnessStatus === "Temporarily unfit" || s.fitnessStatus === "Fit with restrictions").length,
    openInjuries: _injuries.filter((i) => i.status === "open").length,
  };
}
