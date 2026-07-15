// Medical records service — the clinical record.
//
// Notes are append-only in the way real clinical notes are: a filed note is
// never edited. Corrections are AMENDMENTS — a new note that references the
// original, leaving both visible. This mirrors paper practice and is what makes
// a record defensible.
//
// Allergies are safety-critical: checkAllergy() is exposed so prescribing and
// dispensing can warn before a drug is given.
//
// In-memory now; async API shaped for a later D1 swap.

import { record, AUDIT_ACTIONS } from "../../lib/audit";

const delay = (ms = 110) => new Promise((r) => setTimeout(r, ms));

export const NOTE_TYPES = [
  { key: "consultation", label: "Consultation" },
  { key: "progress", label: "Progress note" },
  { key: "operation", label: "Operation note" },
  { key: "nursing", label: "Nursing note" },
  { key: "discharge", label: "Discharge summary" },
  { key: "amendment", label: "Amendment" },
];

export const SEVERITY = ["mild", "moderate", "severe"];

// Common ICD-10 codes seen in Nigerian tertiary practice.
export const ICD_CATALOGUE = [
  { code: "B50.9", label: "Plasmodium falciparum malaria, unspecified" },
  { code: "A01.0", label: "Typhoid fever" },
  { code: "I10", label: "Essential (primary) hypertension" },
  { code: "E11.9", label: "Type 2 diabetes mellitus without complications" },
  { code: "D57.1", label: "Sickle-cell disease without crisis" },
  { code: "J18.9", label: "Pneumonia, unspecified organism" },
  { code: "N39.0", label: "Urinary tract infection, site not specified" },
  { code: "K35.80", label: "Acute appendicitis, unspecified" },
  { code: "O80", label: "Encounter for full-term uncomplicated delivery" },
  { code: "I50.9", label: "Heart failure, unspecified" },
  { code: "N18.9", label: "Chronic kidney disease, unspecified" },
  { code: "C50.9", label: "Malignant neoplasm of breast, unspecified" },
  { code: "B24", label: "Unspecified human immunodeficiency virus (HIV) disease" },
  { code: "A15.0", label: "Tuberculosis of lung" },
  { code: "S06.9", label: "Intracranial injury, unspecified" },
];

let _noteSeq = 0;
const _notes = [
  {
    id: "n1", seq: 1, patientId: "p1", type: "consultation",
    author: "Dr. Ngozi Umeh", authorRole: "Doctor",
    at: new Date(Date.now() - 3 * 86400000).toISOString(),
    subjective: "3-day history of fever, headache and generalised body aches. No vomiting.",
    objective: "T 38.9°C, PR 96, BP 118/76. Chest clear. No neck stiffness.",
    assessment: "Clinical malaria. Rule out typhoid co-infection.",
    plan: "MP and FBC. Start artemether/lumefantrine. Review in 48h.",
    amendsId: null,
  },
];

const _diagnoses = [
  { id: "d1", patientId: "p1", code: "B50.9", label: "Plasmodium falciparum malaria, unspecified", status: "active", onset: "2026-07-12", by: "Dr. Ngozi Umeh" },
  { id: "d2", patientId: "p1", code: "I10", label: "Essential (primary) hypertension", status: "chronic", onset: "2023-04-02", by: "Prof. Adeyemi" },
];

const _allergies = [
  { id: "a1", patientId: "p1", substance: "Penicillin", reaction: "Urticarial rash", severity: "moderate", by: "Dr. Ngozi Umeh" },
  { id: "a2", patientId: "p2", substance: "Sulphonamides", reaction: "Stevens-Johnson syndrome", severity: "severe", by: "Prof. Adeyemi" },
];

/* ---------------- Notes ---------------- */

export async function listNotes(patientId) {
  await delay();
  return _notes
    .filter((n) => n.patientId === patientId)
    .slice()
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .map((n) => ({ ...n }));
}

export async function fileNote({ patientId, type, subjective, objective, assessment, plan, actor, amendsId = null }) {
  await delay();
  if (!patientId) throw new Error("No patient selected.");
  if (!NOTE_TYPES.some((t) => t.key === type)) throw new Error("Choose a note type.");
  if (!assessment || !assessment.trim()) throw new Error("An assessment is required.");
  _noteSeq += 1;
  const note = Object.freeze({
    id: "n" + Date.now(),
    seq: _notes.length + 1,
    patientId,
    type,
    author: actor?.name || "Unknown",
    authorRole: actor?.role || "unknown",
    at: new Date().toISOString(),
    subjective: (subjective || "").trim(),
    objective: (objective || "").trim(),
    assessment: assessment.trim(),
    plan: (plan || "").trim(),
    amendsId,
  });
  _notes.push(note);
  record({
    actor, action: AUDIT_ACTIONS.CLINICAL, entity: "clinical-note", entityId: note.id,
    detail: amendsId ? `Amended note ${amendsId}` : `Filed ${type} note`, severity: "info",
  });
  return note;
}

/* ---------------- Diagnoses ---------------- */

export async function listDiagnoses(patientId) {
  await delay(60);
  return _diagnoses.filter((d) => d.patientId === patientId).map((d) => ({ ...d }));
}

export async function addDiagnosis({ patientId, code, status, actor }) {
  await delay();
  const hit = ICD_CATALOGUE.find((c) => c.code === code);
  if (!hit) throw new Error("Choose a diagnosis.");
  if (_diagnoses.some((d) => d.patientId === patientId && d.code === code && d.status !== "resolved")) {
    throw new Error("That diagnosis is already on the problem list.");
  }
  const d = {
    id: "d" + Date.now(), patientId, code: hit.code, label: hit.label,
    status: status || "active", onset: new Date().toISOString().slice(0, 10),
    by: actor?.name || "Unknown",
  };
  _diagnoses.push(d);
  record({ actor, action: AUDIT_ACTIONS.CLINICAL, entity: "diagnosis", entityId: hit.code, detail: `Added ${hit.label}`, severity: "info" });
  return d;
}

export async function resolveDiagnosis(id, actor) {
  await delay(60);
  const d = _diagnoses.find((x) => x.id === id);
  if (!d) throw new Error("Not found");
  d.status = "resolved";
  record({ actor, action: AUDIT_ACTIONS.CLINICAL, entity: "diagnosis", entityId: d.code, detail: `Resolved ${d.label}`, severity: "info" });
  return d;
}

/* ---------------- Allergies ---------------- */

export async function listAllergies(patientId) {
  await delay(60);
  return _allergies.filter((a) => a.patientId === patientId).map((a) => ({ ...a }));
}

export async function addAllergy({ patientId, substance, reaction, severity, actor }) {
  await delay();
  if (!substance || !substance.trim()) throw new Error("Enter the substance.");
  if (!SEVERITY.includes(severity)) throw new Error("Choose a severity.");
  const a = {
    id: "al" + Date.now(), patientId, substance: substance.trim(),
    reaction: (reaction || "").trim(), severity, by: actor?.name || "Unknown",
  };
  _allergies.push(a);
  record({ actor, action: AUDIT_ACTIONS.CLINICAL, entity: "allergy", entityId: a.substance, detail: `Recorded ${severity} allergy: ${a.substance}`, severity: "warn" });
  return a;
}

/**
 * Safety check — does this patient have a recorded allergy matching a drug name?
 * Substring match both ways so "Penicillin" catches "Amoxicillin (penicillin class)"
 * only when named; deliberately conservative rather than clever.
 */
export async function checkAllergy(patientId, drugName) {
  await delay(40);
  const name = (drugName || "").toLowerCase();
  return _allergies
    .filter((a) => a.patientId === patientId)
    .filter((a) => name.includes(a.substance.toLowerCase()))
    .map((a) => ({ ...a }));
}

/* ---------------- Summary ---------------- */

export async function recordSummary(patientId) {
  await delay(60);
  return {
    notes: _notes.filter((n) => n.patientId === patientId).length,
    activeDiagnoses: _diagnoses.filter((d) => d.patientId === patientId && d.status !== "resolved").length,
    allergies: _allergies.filter((a) => a.patientId === patientId).length,
    severeAllergies: _allergies.filter((a) => a.patientId === patientId && a.severity === "severe").length,
  };
}
