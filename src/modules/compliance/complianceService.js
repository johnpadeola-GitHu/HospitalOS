// Compliance & Accreditation.
// A Nigerian hospital's legal right to operate rests on facility
// accreditation (state ministry of health / HEFAMAA-style licensing) and
// on every clinical practitioner holding a current professional license
// (MDCN for doctors, NMCN for nurses/midwives, PCN for pharmacists,
// MLSCN for lab scientists).
//
// PHASE 1 LIVE, module 14. Compliance area is super-admin-only, matching
// the existing RBAC model exactly — same reasoning as real hospital
// practice, where regulatory oversight typically sits with administration.

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

export const LICENSE_BODIES = {
  doctor: "MDCN (Medical and Dental Council of Nigeria)",
  nurse: "NMCN (Nursing and Midwifery Council of Nigeria)",
  "lab-scientist": "MLSCN (Medical Laboratory Science Council of Nigeria)",
  radiographer: "RRBN (Radiographers Registration Board of Nigeria)",
  pharmacist: "PCN (Pharmacists Council of Nigeria)",
};

export const ACCREDITATION_TYPES = [
  "State Ministry of Health facility license",
  "HEFAMAA registration",
  "NHIA facility accreditation",
  "ISO 15189 (laboratory)",
  "Other regulatory registration",
];

export const INSPECTION_OUTCOMES = ["Passed", "Passed with conditions", "Failed", "Scheduled"];
export const OUTCOME_TONE = { Passed: "good", "Passed with conditions": "warn", Failed: "bad", Scheduled: "info" };

/* ---------------- Practitioner licenses ---------------- */

export async function listLicenses({ query = "" } = {}) {
  return apiCall(`/compliance/licenses${query ? `?query=${encodeURIComponent(query)}` : ""}`);
}

export async function addLicense({ staffName, role, licenseNumber, issuedAt, expiresAt }) {
  return apiCall("/compliance/licenses", { method: "POST", body: { staffName, role, licenseNumber, issuedAt, expiresAt } });
}

export async function renewLicense(id, { licenseNumber, expiresAt }) {
  return apiCall(`/compliance/licenses/${encodeURIComponent(id)}/renew`, { method: "PATCH", body: { licenseNumber, expiresAt } });
}

export async function listExpiringLicenses() {
  const all = await listLicenses({});
  return all.filter((l) => l.status === "expiring-soon" || l.status === "expired");
}

/* ---------------- Facility accreditation ---------------- */

export async function listAccreditations() {
  return apiCall("/compliance/accreditations");
}

export async function addAccreditation({ type, certificateNumber, issuedAt, expiresAt, notes }) {
  return apiCall("/compliance/accreditations", { method: "POST", body: { type, certificateNumber, issuedAt, expiresAt, notes } });
}

/* ---------------- Inspections ---------------- */

export async function listInspections() {
  return apiCall("/compliance/inspections");
}

export async function logInspection({ body, scheduledAt, outcome, notes }) {
  return apiCall("/compliance/inspections", { method: "POST", body: { body, scheduledAt, outcome, notes } });
}

export async function complianceSummary() {
  const [licenses, accreditations] = await Promise.all([listLicenses({}), listAccreditations()]);
  return {
    licensesExpiringSoon: licenses.filter((l) => l.status === "expiring-soon").length,
    licensesExpired: licenses.filter((l) => l.status === "expired").length,
    accreditationsExpiringSoon: accreditations.filter((a) => a.status === "expiring-soon").length,
    accreditationsExpired: accreditations.filter((a) => a.status === "expired").length,
    totalLicenses: licenses.length,
    totalAccreditations: accreditations.length,
  };
}
