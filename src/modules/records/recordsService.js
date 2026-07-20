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

// PHASE 1 LIVE. ICD_CATALOGUE stays client-side (static reference data).
// checkAllergy() is safety-critical (Pharmacy calls it before dispensing) —
// re-derived from real server data every time, never trusted client-side.

const API_URL = "https://hospitalos-api.johnpadeola.workers.dev";

function authHeaders() {
  const token = localStorage.getItem("hospitalos_session_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiCall(path, { method = "GET", body } = {}) {
  let res, data;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: body ? JSON.stringify(body) : undefined,
    });
    data = await res.json();
  } catch {
    throw new Error("Couldn't reach the server. Check your connection and try again.");
  }
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

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

/* ---------------- Notes ---------------- */

export async function listNotes(patientId) {
  return apiCall(`/records/notes/${encodeURIComponent(patientId)}`);
}

export async function fileNote({ patientId, type, subjective, objective, assessment, plan, amendsId = null }) {
  if (!NOTE_TYPES.some((t) => t.key === type)) throw new Error("Choose a note type.");
  return apiCall("/records/notes", {
    method: "POST",
    body: { patientId, type, subjective, objective, assessment, plan, amendsId },
  });
}

/* ---------------- Diagnoses ---------------- */

export async function listDiagnoses(patientId) {
  return apiCall(`/records/diagnoses/${encodeURIComponent(patientId)}`);
}

export async function addDiagnosis({ patientId, code, status }) {
  const hit = ICD_CATALOGUE.find((c) => c.code === code);
  if (!hit) throw new Error("Choose a diagnosis.");
  return apiCall("/records/diagnoses", { method: "POST", body: { patientId, code: hit.code, label: hit.label, status } });
}

export async function resolveDiagnosis(id) {
  return apiCall(`/records/diagnoses/${encodeURIComponent(id)}/resolve`, { method: "PATCH" });
}

/* ---------------- Allergies ---------------- */

export async function listAllergies(patientId) {
  return apiCall(`/records/allergies/${encodeURIComponent(patientId)}`);
}

export async function addAllergy({ patientId, substance, reaction, severity }) {
  if (!SEVERITY.includes(severity)) throw new Error("Choose a severity.");
  return apiCall("/records/allergies", { method: "POST", body: { patientId, substance, reaction, severity } });
}

/**
 * Safety check — does this patient have a recorded allergy matching a drug name?
 * Re-derived from real server data every call, never cached or trusted client-side.
 */
export async function checkAllergy(patientId, drugName) {
  return apiCall(`/records/check-allergy/${encodeURIComponent(patientId)}?drug=${encodeURIComponent(drugName || "")}`);
}

/* ---------------- Summary ---------------- */

export async function recordSummary(patientId) {
  return apiCall(`/records/summary/${encodeURIComponent(patientId)}`);
}
