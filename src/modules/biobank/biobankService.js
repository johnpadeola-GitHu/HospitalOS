// Biobanking service — long-term specimen repository, distinct from the
// active lab worklist. A specimen here has already been through routine
// testing and is retained for research, future testing, or medico-legal
// purposes, with a defined storage location and consent basis.
// In-memory now; async API shaped for a later D1 swap.

const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));

export const SPECIMEN_TYPES = ["Serum", "Plasma", "Whole blood", "Tissue (FFPE)", "DNA extract", "Urine"];
export const STORAGE_UNITS = [
  { key: "F1", label: "Freezer 1 (-20\u00b0C)", capacity: 200 },
  { key: "F2", label: "Freezer 2 (-80\u00b0C)", capacity: 200 },
  { key: "LN2", label: "Liquid Nitrogen Vault", capacity: 100 },
  { key: "RT", label: "Room Temperature Archive", capacity: 500 },
];
export const CONSENT_TYPES = ["Research use", "Future clinical use only", "No further use — retain per policy"];

let _seq = 400;
const _specimens = [
  { id: "bb1", ref: "BB-0401", patientName: "Okafor, Adaeze", hospitalNo: "H001001", type: "Serum", volume: "2 mL", unit: "F2", position: "Rack 3 / Box 1 / A2", consent: "Research use", collected: "2026-03-14", study: "Malaria RDT accuracy" },
  { id: "bb2", ref: "BB-0402", patientName: "Eze, Chibuike", hospitalNo: "H001002", type: "DNA extract", volume: "50 \u00b5L", unit: "F1", position: "Rack 1 / Box 4 / C6", consent: "Future clinical use only", collected: "2026-04-02", study: "" },
  { id: "bb3", ref: "BB-0403", patientName: "Bello, Fatima", hospitalNo: "H001003", type: "Tissue (FFPE)", volume: "Block", unit: "RT", position: "Cabinet 2 / Shelf B", consent: "Research use", collected: "2026-05-20", study: "SSI audit" },
];

function ref() { _seq += 1; return "BB-" + String(_seq).padStart(4, "0"); }

export async function listSpecimens({ query = "", unit = "all" } = {}) {
  await delay();
  const q = query.trim().toLowerCase();
  return _specimens
    .filter((s) => (unit === "all" ? true : s.unit === unit))
    .filter((s) => !q || s.patientName.toLowerCase().includes(q) || s.ref.toLowerCase().includes(q) || (s.study || "").toLowerCase().includes(q))
    .sort((a, b) => b.collected.localeCompare(a.collected));
}

export async function bankSpecimen({ patientName, hospitalNo, type, volume, unit, consent, study }) {
  await delay();
  if (!patientName || !patientName.trim()) throw new Error("Enter the patient.");
  if (!SPECIMEN_TYPES.includes(type)) throw new Error("Choose a specimen type.");
  const u = STORAGE_UNITS.find((x) => x.key === unit);
  if (!u) throw new Error("Choose a storage unit.");
  const inUnit = _specimens.filter((s) => s.unit === unit).length;
  if (inUnit >= u.capacity) throw new Error(`${u.label} is at capacity.`);
  const s = {
    id: "bb" + Date.now(), ref: ref(), patientName: patientName.trim(), hospitalNo: hospitalNo || "\u2014",
    type, volume: volume || "\u2014", unit, position: `Auto-assigned / ${ref()}`,
    consent: consent || CONSENT_TYPES[0], collected: new Date().toISOString().slice(0, 10), study: study || "",
  };
  _specimens.unshift(s);
  return s;
}

export async function storageUtilisation() {
  await delay(60);
  return STORAGE_UNITS.map((u) => {
    const used = _specimens.filter((s) => s.unit === u.key).length;
    return { ...u, used, pct: Math.round((used / u.capacity) * 100) };
  });
}

export async function biobankSummary() {
  await delay(60);
  return {
    total: _specimens.length,
    forResearch: _specimens.filter((s) => s.consent === "Research use").length,
    byType: _specimens.reduce((a, s) => { a[s.type] = (a[s.type] || 0) + 1; return a; }, {}),
  };
}
