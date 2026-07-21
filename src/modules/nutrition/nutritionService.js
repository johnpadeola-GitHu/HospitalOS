// Nutrition & Dietetics.
// A referral-driven service: Renal, Oncology, ICU, Paediatrics, and
// Geriatrics all send patients here for nutritional assessment and a
// therapeutic diet plan.
//
// PHASE 1 LIVE, module 23.

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

export const DIET_TYPES = [
  "Regular", "Diabetic", "Renal (low potassium/phosphate)", "Low sodium (cardiac)",
  "High protein (wound/oncology)", "Low residue (GI)", "Soft/dysphagia", "Enteral (tube feed)", "Parenteral (IV nutrition)",
];
export const REFERRAL_SOURCES = ["Renal & dialysis", "Oncology", "ICU/HDU", "Paediatric ward", "Geriatric unit", "Self / ward request", "Other"];
export const NUTRITION_STATUS = ["Well-nourished", "At risk", "Malnourished (moderate)", "Malnourished (severe)"];
export const STATUS_TONE = { "Well-nourished": "good", "At risk": "warn", "Malnourished (moderate)": "warn", "Malnourished (severe)": "bad" };

export async function listCases({ query = "", status = "all" } = {}) {
  const params = new URLSearchParams();
  if (status !== "all") params.set("status", status);
  if (query.trim()) params.set("query", query.trim());
  const qs = params.toString();
  return apiCall(`/nutrition/cases${qs ? `?${qs}` : ""}`);
}

export async function referForAssessment({ patientName, hospitalNo, source, weightKg, heightCm, status, dietType, notes }) {
  return apiCall("/nutrition/cases", { method: "POST", body: { patientName, hospitalNo, source, weightKg, heightCm, status, dietType, notes } });
}

export async function updatePlan(id, { dietType, status, notes }) {
  return apiCall(`/nutrition/cases/${encodeURIComponent(id)}`, { method: "PATCH", body: { dietType, status, notes } });
}

export async function listOverdueReviews() {
  return apiCall("/nutrition/overdue");
}

export async function nutritionSummary() {
  return apiCall("/nutrition/summary");
}
