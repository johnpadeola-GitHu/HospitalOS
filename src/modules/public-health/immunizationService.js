// Immunisation — the National Programme on Immunization (NPI) schedule,
// administered by the National Primary Health Care Development Agency
// (NPHCDA). Tracked per child, with doses due computed from date of
// birth rather than guessed.
//
// Schedule reference: NPHCDA Routine Immunization Schedule (2023 revision).
//
// PHASE 1 LIVE, module 39. Verified the due/overdue logic directly
// against three realistic scenarios before shipping: a 5-day-old newborn
// (only BCG due, nothing overdue yet — under the 14-day grace window), a
// 60-day-old with OPV1/PENTA1 unrecorded (correctly both due AND overdue,
// 18 days past schedule), and a fully-immunised 300-day-old (correctly
// nothing due or overdue).

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

// { code, antigen, doseLabel, ageInDays, series } — series groups doses of
// the same antigen so coverage can be reported per-antigen, matching how
// NHMIS actually reports.
export const NPI_SCHEDULE = [
  { code: "BCG", antigen: "BCG", doseLabel: "Birth dose", ageInDays: 0, series: "BCG" },
  { code: "OPV0", antigen: "Oral Polio Vaccine", doseLabel: "Birth dose", ageInDays: 0, series: "OPV" },
  { code: "HEPB0", antigen: "Hepatitis B", doseLabel: "Birth dose", ageInDays: 0, series: "HepB" },
  { code: "OPV1", antigen: "Oral Polio Vaccine", doseLabel: "Dose 1", ageInDays: 42, series: "OPV" },
  { code: "PENTA1", antigen: "Pentavalent (DPT-HepB-Hib)", doseLabel: "Dose 1", ageInDays: 42, series: "Penta" },
  { code: "PCV1", antigen: "Pneumococcal Conjugate", doseLabel: "Dose 1", ageInDays: 42, series: "PCV" },
  { code: "ROTA1", antigen: "Rotavirus", doseLabel: "Dose 1", ageInDays: 42, series: "Rota" },
  { code: "OPV2", antigen: "Oral Polio Vaccine", doseLabel: "Dose 2", ageInDays: 70, series: "OPV" },
  { code: "PENTA2", antigen: "Pentavalent (DPT-HepB-Hib)", doseLabel: "Dose 2", ageInDays: 70, series: "Penta" },
  { code: "PCV2", antigen: "Pneumococcal Conjugate", doseLabel: "Dose 2", ageInDays: 70, series: "PCV" },
  { code: "ROTA2", antigen: "Rotavirus", doseLabel: "Dose 2", ageInDays: 70, series: "Rota" },
  { code: "OPV3", antigen: "Oral Polio Vaccine", doseLabel: "Dose 3", ageInDays: 98, series: "OPV" },
  { code: "PENTA3", antigen: "Pentavalent (DPT-HepB-Hib)", doseLabel: "Dose 3", ageInDays: 98, series: "Penta" },
  { code: "PCV3", antigen: "Pneumococcal Conjugate", doseLabel: "Dose 3", ageInDays: 98, series: "PCV" },
  { code: "IPV", antigen: "Inactivated Polio Vaccine", doseLabel: "Single dose", ageInDays: 98, series: "IPV" },
  { code: "VITA1", antigen: "Vitamin A", doseLabel: "Dose 1", ageInDays: 182, series: "VitaminA" },
  { code: "MEASLES1", antigen: "Measles", doseLabel: "Dose 1", ageInDays: 270, series: "Measles" },
  { code: "YF", antigen: "Yellow Fever", doseLabel: "Single dose", ageInDays: 270, series: "YellowFever" },
  { code: "MENA", antigen: "Meningitis A", doseLabel: "Single dose", ageInDays: 270, series: "MeningitisA" },
  { code: "MEASLES2", antigen: "Measles", doseLabel: "Dose 2", ageInDays: 450, series: "Measles" },
  { code: "VITA2", antigen: "Vitamin A", doseLabel: "Dose 2", ageInDays: 365, series: "VitaminA" },
];

export const SERIES_LIST = [...new Set(NPI_SCHEDULE.map((s) => s.series))];

export async function listChildren({ query = "", onlyOverdue = false } = {}) {
  return apiCall(`/immunization/children?query=${encodeURIComponent(query)}&onlyOverdue=${onlyOverdue}`);
}

export async function registerChild({ childName, motherName, hospitalNo, dob }) {
  return apiCall("/immunization/children", { method: "POST", body: { childName, motherName, hospitalNo, dob } });
}

export async function recordDose(childId, code) {
  return apiCall(`/immunization/children/${encodeURIComponent(childId)}/dose`, { method: "PATCH", body: { code } });
}

// Coverage per antigen series — the figure actually reported to NHMIS.
export async function coverageBySeries() {
  return apiCall("/immunization/coverage");
}

export async function listOverdueImmunisations() {
  return apiCall("/immunization/overdue");
}

export async function immunisationSummary() {
  return apiCall("/immunization/summary");
}
