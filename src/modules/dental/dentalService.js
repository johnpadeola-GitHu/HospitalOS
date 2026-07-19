// Dental & Oral Health.
// Most Nigerian teaching hospitals, UCH included, run a dedicated dental
// centre. This is a clinic queue (like Outpatient) plus a procedure log per
// visit, since dental care is procedure-driven rather than diagnosis-driven
// the way a medical specialty clinic is.
// In-memory now; async API shaped for a later D1 swap.

import { record, AUDIT_ACTIONS } from "../../lib/audit";

const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));

export const PROCEDURES = [
  { code: "EXAM", name: "Oral examination", price: 3000 },
  { code: "SCALE", name: "Scaling & polishing", price: 8000 },
  { code: "FILL", name: "Filling (restoration)", price: 12000 },
  { code: "EXTR", name: "Extraction", price: 10000 },
  { code: "RCT", name: "Root canal treatment", price: 35000 },
  { code: "XRAY", name: "Dental X-ray", price: 5000 },
  { code: "CROWN", name: "Crown fitting", price: 60000 },
  { code: "DENT", name: "Denture fitting", price: 45000 },
];

export const QUEUE_STAGES = ["waiting", "in-chair", "completed"];

let _visitSeq = 600;
function visitRef() { _visitSeq += 1; return "DEN-" + String(_visitSeq).padStart(5, "0"); }

const _queue = [
  { id: "d1", ref: "DEN-00601", patientName: "Adeyemi, Folake", hospitalNo: "H001006", stage: "waiting", checkedInAt: new Date().toISOString(), procedures: [] },
];

export async function listQueue({ includeCompleted = false } = {}) {
  await delay();
  return _queue
    .filter((v) => includeCompleted || v.stage !== "completed")
    .sort((a, b) => new Date(a.checkedInAt) - new Date(b.checkedInAt));
}

export async function checkIn({ patientId, patientName, hospitalNo, actor }) {
  await delay();
  if (!patientId) throw new Error("Select a registered patient — search by name or hospital number.");
  const v = { id: "d" + Date.now(), ref: visitRef(), patientId, patientName: patientName.trim(), hospitalNo: hospitalNo || "\u2014", stage: "waiting", checkedInAt: new Date().toISOString(), procedures: [] };
  _queue.unshift(v);
  record({ actor, action: AUDIT_ACTIONS.CREATE, entity: "dental-visit", entityId: v.ref, detail: `Checked in ${v.patientName}`, severity: "info" });
  return v;
}

export async function advanceStage(id, actor) {
  await delay(80);
  const v = _queue.find((x) => x.id === id);
  if (!v) throw new Error("Visit not found");
  const idx = QUEUE_STAGES.indexOf(v.stage);
  if (idx >= QUEUE_STAGES.length - 1) throw new Error("Already completed.");
  v.stage = QUEUE_STAGES[idx + 1];
  record({ actor, action: AUDIT_ACTIONS.UPDATE, entity: "dental-visit", entityId: v.ref, detail: `Stage: ${v.stage} \u2014 ${v.patientName}`, severity: "info" });
  return v;
}

export async function addProcedure(id, code, actor) {
  await delay(80);
  const v = _queue.find((x) => x.id === id);
  if (!v) throw new Error("Visit not found");
  const proc = PROCEDURES.find((p) => p.code === code);
  if (!proc) throw new Error("Unknown procedure.");
  v.procedures.push({ ...proc, at: new Date().toISOString() });
  record({ actor, action: AUDIT_ACTIONS.CLINICAL, entity: "dental-procedure", entityId: v.ref, detail: `${proc.name} \u2014 ${v.patientName}`, severity: "info" });
  return v;
}

export async function dentalSummary() {
  await delay(60);
  const active = _queue.filter((v) => v.stage !== "completed");
  return {
    waiting: active.filter((v) => v.stage === "waiting").length,
    inChair: active.filter((v) => v.stage === "in-chair").length,
    completedToday: _queue.filter((v) => v.stage === "completed").length,
  };
}
