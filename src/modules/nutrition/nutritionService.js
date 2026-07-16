// Nutrition & Dietetics.
// A referral-driven service: Renal, Oncology, ICU, Paediatrics, and Geriatrics
// all send patients here for nutritional assessment and a therapeutic diet
// plan. This is deliberately NOT folded into any one of those modules,
// because dietetics is its own discipline with its own referral queue and
// its own follow-up cadence, the same reasoning that kept Renal separate
// from Lab Utilities.
// In-memory now; async API shaped for a later D1 swap.

import { record, AUDIT_ACTIONS } from "../../lib/audit";

const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));

export const DIET_TYPES = [
  "Regular", "Diabetic", "Renal (low potassium/phosphate)", "Low sodium (cardiac)",
  "High protein (wound/oncology)", "Low residue (GI)", "Soft/dysphagia", "Enteral (tube feed)", "Parenteral (IV nutrition)",
];

export const REFERRAL_SOURCES = ["Renal & dialysis", "Oncology", "ICU/HDU", "Paediatric ward", "Geriatric unit", "Self / ward request", "Other"];
export const NUTRITION_STATUS = ["Well-nourished", "At risk", "Malnourished (moderate)", "Malnourished (severe)"];
export const STATUS_TONE = { "Well-nourished": "good", "At risk": "warn", "Malnourished (moderate)": "warn", "Malnourished (severe)": "bad" };

let _seq = 200;
function ref() { _seq += 1; return "NUT-" + String(_seq).padStart(5, "0"); }

const _cases = [
  {
    id: "n1", ref: "NUT-00201", patientName: "Eze, Chibuike", hospitalNo: "H001002",
    source: "Renal & dialysis", dietType: "Renal (low potassium/phosphate)",
    weightKg: 68, heightCm: 172, status: "At risk", assessedBy: "Dietitian A. Fashola",
    assessedAt: new Date(Date.now() - 3 * 86400000).toISOString(), notes: "Restrict potassium and phosphate intake; monitor fluid allowance around dialysis days.",
    reviewDue: new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10),
  },
];

function bmi(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  const h = heightCm / 100;
  return Math.round((weightKg / (h * h)) * 10) / 10;
}

export async function listCases({ query = "", status = "all" } = {}) {
  await delay();
  const q = query.trim().toLowerCase();
  return _cases
    .filter((c) => (status === "all" ? true : c.status === status))
    .filter((c) => !q || c.patientName.toLowerCase().includes(q) || c.ref.toLowerCase().includes(q))
    .map((c) => ({ ...c, bmi: bmi(c.weightKg, c.heightCm) }))
    .sort((a, b) => new Date(b.assessedAt) - new Date(a.assessedAt));
}

export async function referForAssessment({ patientName, hospitalNo, source, weightKg, heightCm, status, dietType, notes, actor }) {
  await delay();
  if (!patientName || !patientName.trim()) throw new Error("Enter the patient.");
  if (!REFERRAL_SOURCES.includes(source)) throw new Error("Choose a referral source.");
  if (!NUTRITION_STATUS.includes(status)) throw new Error("Choose a nutritional status.");
  if (!DIET_TYPES.includes(dietType)) throw new Error("Choose a diet type.");
  const c = {
    id: "n" + Date.now(), ref: ref(), patientName: patientName.trim(), hospitalNo: hospitalNo || "\u2014",
    source, dietType, weightKg: parseFloat(weightKg) || null, heightCm: parseFloat(heightCm) || null,
    status, assessedBy: actor?.name || "Unknown", assessedAt: new Date().toISOString(),
    notes: notes || "", reviewDue: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  };
  _cases.unshift(c);
  const severity = status === "Malnourished (severe)" ? "warn" : "info";
  record({ actor, action: AUDIT_ACTIONS.CLINICAL, entity: "nutrition-case", entityId: c.ref, detail: `Assessed ${c.patientName} \u2014 ${status}, ${dietType}`, severity });
  return c;
}

export async function updatePlan(id, { dietType, status, notes, actor }) {
  await delay(80);
  const c = _cases.find((x) => x.id === id);
  if (!c) throw new Error("Case not found");
  if (dietType) c.dietType = dietType;
  if (status) c.status = status;
  if (notes != null) c.notes = notes;
  c.reviewDue = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  record({ actor, action: AUDIT_ACTIONS.UPDATE, entity: "nutrition-case", entityId: c.ref, detail: `Diet plan updated \u2014 ${c.patientName}`, severity: "info" });
  return c;
}

export async function listOverdueReviews() {
  await delay(60);
  const today = new Date().toISOString().slice(0, 10);
  return _cases.filter((c) => c.reviewDue < today && (c.status === "Malnourished (moderate)" || c.status === "Malnourished (severe)"));
}

export async function nutritionSummary() {
  await delay(60);
  return {
    total: _cases.length,
    atRisk: _cases.filter((c) => c.status === "At risk").length,
    malnourished: _cases.filter((c) => c.status.startsWith("Malnourished")).length,
    severeCases: _cases.filter((c) => c.status === "Malnourished (severe)").length,
  };
}
