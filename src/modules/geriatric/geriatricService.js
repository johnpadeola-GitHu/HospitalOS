// Geriatric Unit — a dedicated inpatient ward, distinct from the Geriatrics
// outpatient clinic tag under Specialist Clinics. What makes geriatric care
// different from general admission is the Comprehensive Geriatric
// Assessment (CGA): falls risk, polypharmacy, cognitive screening, and
// frailty — captured on admission, not folded into a generic vitals chart.
// In-memory now; async API shaped for a later D1 swap.

import { record, AUDIT_ACTIONS } from "../../lib/audit";

const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));

export const FRAILTY_LEVELS = ["Very fit", "Well", "Managing well", "Vulnerable", "Mildly frail", "Moderately frail", "Severely frail"];
export const FRAILTY_TONE = {
  "Very fit": "good", Well: "good", "Managing well": "good",
  Vulnerable: "warn", "Mildly frail": "warn", "Moderately frail": "bad", "Severely frail": "bad",
};
export const COGNITIVE_SCREEN = ["Normal", "Mild impairment suspected", "Moderate-severe impairment suspected", "Not assessed"];

let _seq = 300;
function ref() { _seq += 1; return "GER-" + String(_seq).padStart(5, "0"); }

const _patients = [
  {
    id: "g1", ref: "GER-00301", patientName: "Fasanya, Deborah", hospitalNo: "H001008", age: 78,
    admittedAt: new Date(Date.now() - 2 * 86400000).toISOString(), bed: "GER-02",
    fallsRiskScore: 3, medicationCount: 7, cognitiveScreen: "Mild impairment suspected", frailty: "Mildly frail",
    notes: "Admitted following a fall at home. On 7 regular medications \u2014 pharmacy review requested.",
  },
];

function fallsRiskLevel(score) {
  if (score >= 4) return { label: "High risk", tone: "bad" };
  if (score >= 2) return { label: "Moderate risk", tone: "warn" };
  return { label: "Low risk", tone: "good" };
}

export async function listPatients() {
  await delay();
  return _patients.map((p) => ({ ...p, fallsRisk: fallsRiskLevel(p.fallsRiskScore) }));
}

export async function admitPatient({ patientName, hospitalNo, age, bed, fallsRiskScore, medicationCount, cognitiveScreen, frailty, notes, actor }) {
  await delay();
  if (!patientName || !patientName.trim()) throw new Error("Enter the patient.");
  if (!FRAILTY_LEVELS.includes(frailty)) throw new Error("Choose a frailty level.");
  const p = {
    id: "g" + Date.now(), ref: ref(), patientName: patientName.trim(), hospitalNo: hospitalNo || "\u2014",
    age: parseInt(age, 10) || null, admittedAt: new Date().toISOString(), bed: bed || "\u2014",
    fallsRiskScore: parseInt(fallsRiskScore, 10) || 0, medicationCount: parseInt(medicationCount, 10) || 0,
    cognitiveScreen: cognitiveScreen || "Not assessed", frailty, notes: notes || "",
  };
  _patients.unshift(p);
  const risk = fallsRiskLevel(p.fallsRiskScore);
  record({
    actor, action: AUDIT_ACTIONS.CLINICAL, entity: "geriatric-admission", entityId: p.ref,
    detail: `Admitted ${p.patientName} \u2014 CGA: ${frailty}, falls ${risk.label}, ${p.medicationCount} meds`,
    severity: risk.tone === "bad" ? "warn" : "info",
  });
  return p;
}

export async function updateAssessment(id, patch, actor) {
  await delay(80);
  const p = _patients.find((x) => x.id === id);
  if (!p) throw new Error("Patient not found");
  Object.assign(p, patch);
  record({ actor, action: AUDIT_ACTIONS.CLINICAL, entity: "geriatric-assessment", entityId: p.ref, detail: `CGA updated \u2014 ${p.patientName}`, severity: "info" });
  return p;
}

/** High falls risk (score >= 4) or 5+ medications (polypharmacy) feed the
 * hospital-wide alert feed \u2014 both are established geriatric risk flags. */
export async function listHighRiskPatients() {
  await delay(60);
  return _patients.filter((p) => p.fallsRiskScore >= 4 || p.medicationCount >= 5);
}

export async function geriatricSummary() {
  await delay(60);
  return {
    admitted: _patients.length,
    highFallsRisk: _patients.filter((p) => p.fallsRiskScore >= 4).length,
    polypharmacy: _patients.filter((p) => p.medicationCount >= 5).length,
    frailOrWorse: _patients.filter((p) => ["Mildly frail", "Moderately frail", "Severely frail"].includes(p.frailty)).length,
  };
}
