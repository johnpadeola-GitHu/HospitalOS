// Mental Health Unit — a dedicated psychiatric ward, distinct from the
// Psychiatry outpatient clinic tag under Specialist Clinics. Inpatient
// psychiatric care has safety requirements a general ward record does not:
// admission status (voluntary/involuntary), risk flags, and an observation
// level that can change hour to hour, not just at admission.
// In-memory now; async API shaped for a later D1 swap.

import { record, AUDIT_ACTIONS } from "../../lib/audit";

const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));

export const ADMISSION_STATUS = ["Voluntary", "Involuntary (assessment)", "Involuntary (treatment order)"];
export const OBSERVATION_LEVELS = ["Routine (hourly)", "Close (15-minute)", "Constant (1:1)"];
export const OBS_TONE = { "Routine (hourly)": "good", "Close (15-minute)": "warn", "Constant (1:1)": "bad" };
export const RISK_FLAGS = ["Self-harm risk", "Suicide risk", "Risk to others", "Absconding risk", "Vulnerable to exploitation"];

let _seq = 400;
function ref() { _seq += 1; return "MHU-" + String(_seq).padStart(5, "0"); }

const _patients = [
  {
    id: "m1", ref: "MHU-00401", patientName: "Ibrahim, Zainab", hospitalNo: "H001009", bed: "MHU-01",
    admissionStatus: "Voluntary", observationLevel: "Close (15-minute)", riskFlags: ["Self-harm risk"],
    admittedAt: new Date(Date.now() - 86400000).toISOString(),
    notes: "Admitted for stabilisation following a crisis presentation to Emergency. Care plan under review with the multidisciplinary team.",
  },
];

export async function listPatients() {
  await delay();
  return _patients.map((p) => ({ ...p }));
}

export async function admitPatient({ patientName, hospitalNo, bed, admissionStatus, observationLevel, riskFlags, notes, actor }) {
  await delay();
  if (!patientName || !patientName.trim()) throw new Error("Enter the patient.");
  if (!ADMISSION_STATUS.includes(admissionStatus)) throw new Error("Choose an admission status.");
  if (!OBSERVATION_LEVELS.includes(observationLevel)) throw new Error("Choose an observation level.");
  const p = {
    id: "m" + Date.now(), ref: ref(), patientName: patientName.trim(), hospitalNo: hospitalNo || "\u2014",
    bed: bed || "\u2014", admissionStatus, observationLevel, riskFlags: riskFlags || [],
    admittedAt: new Date().toISOString(), notes: notes || "",
  };
  _patients.unshift(p);
  record({
    actor, action: AUDIT_ACTIONS.CLINICAL, entity: "mhu-admission", entityId: p.ref,
    detail: `Admitted ${p.patientName} \u2014 ${admissionStatus}, ${observationLevel}${riskFlags?.length ? `, flags: ${riskFlags.join(", ")}` : ""}`,
    severity: riskFlags?.length ? "warn" : "info",
  });
  return p;
}

export async function updateObservation(id, observationLevel, actor) {
  await delay(80);
  const p = _patients.find((x) => x.id === id);
  if (!p) throw new Error("Patient not found");
  if (!OBSERVATION_LEVELS.includes(observationLevel)) throw new Error("Unknown observation level.");
  p.observationLevel = observationLevel;
  record({ actor, action: AUDIT_ACTIONS.CLINICAL, entity: "mhu-observation", entityId: p.ref, detail: `Observation level: ${observationLevel} \u2014 ${p.patientName}`, severity: "info" });
  return p;
}

export async function updateRiskFlags(id, riskFlags, actor) {
  await delay(80);
  const p = _patients.find((x) => x.id === id);
  if (!p) throw new Error("Patient not found");
  p.riskFlags = riskFlags;
  record({ actor, action: AUDIT_ACTIONS.CLINICAL, entity: "mhu-risk", entityId: p.ref, detail: `Risk flags updated \u2014 ${p.patientName}: ${riskFlags.join(", ") || "none"}`, severity: riskFlags.length ? "warn" : "info" });
  return p;
}

/** Constant (1:1) observation or any active risk flag feeds the hospital-wide
 * alert feed \u2014 this is the highest-acuity population in the building. */
export async function listHighAcuityPatients() {
  await delay(60);
  return _patients.filter((p) => p.observationLevel === "Constant (1:1)" || p.riskFlags.length > 0);
}

export async function mhuSummary() {
  await delay(60);
  return {
    admitted: _patients.length,
    constantObs: _patients.filter((p) => p.observationLevel === "Constant (1:1)").length,
    withRiskFlags: _patients.filter((p) => p.riskFlags.length > 0).length,
    involuntary: _patients.filter((p) => p.admissionStatus !== "Voluntary").length,
  };
}
