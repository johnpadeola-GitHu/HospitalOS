// Lab utilities — calculators, converters, and reference material used at the
// bench and bedside. These are computational tools, not patient records: no
// service call, no persistence, pure functions plus reference tables.

/* ---------------- Clinical calculators ---------------- */

// Creatinine clearance (Cockcroft-Gault).
export function cockcroftGault({ age, weightKg, creatinineUmol, sex }) {
  const a = parseFloat(age), w = parseFloat(weightKg), cr = parseFloat(creatinineUmol);
  if (!a || !w || !cr) return null;
  const base = ((140 - a) * w) / (0.815 * cr);
  return Math.round((sex === "F" ? base * 0.85 : base) * 10) / 10;
}

// Body Mass Index.
export function bmi({ weightKg, heightCm }) {
  const w = parseFloat(weightKg), h = parseFloat(heightCm) / 100;
  if (!w || !h) return null;
  const val = w / (h * h);
  const band = val < 18.5 ? "Underweight" : val < 25 ? "Normal" : val < 30 ? "Overweight" : "Obese";
  return { value: Math.round(val * 10) / 10, band };
}

// Body Surface Area (Mosteller).
export function bsa({ weightKg, heightCm }) {
  const w = parseFloat(weightKg), h = parseFloat(heightCm);
  if (!w || !h) return null;
  return Math.round(Math.sqrt((w * h) / 3600) * 100) / 100;
}

// Maintenance IV fluid rate, Holliday-Segar.
export function maintenanceFluids({ weightKg }) {
  const w = parseFloat(weightKg);
  if (!w) return null;
  let mlPerDay;
  if (w <= 10) mlPerDay = w * 100;
  else if (w <= 20) mlPerDay = 1000 + (w - 10) * 50;
  else mlPerDay = 1500 + (w - 20) * 20;
  return { mlPerDay: Math.round(mlPerDay), mlPerHour: Math.round(mlPerDay / 24) };
}

// Anion gap.
export function anionGap({ na, k, cl, hco3 }) {
  const N = parseFloat(na), K = parseFloat(k) || 0, C = parseFloat(cl), H = parseFloat(hco3);
  if (!N || !C || !H) return null;
  return Math.round((N + K - (C + H)) * 10) / 10;
}

// Corrected calcium for albumin.
export function correctedCalcium({ calciumMmol, albuminGL }) {
  const ca = parseFloat(calciumMmol), alb = parseFloat(albuminGL);
  if (!ca || !alb) return null;
  return Math.round((ca + 0.02 * (40 - alb)) * 100) / 100;
}

// Estimated GFR, CKD-EPI 2021 (race-free), simplified.
export function egfrCkdEpi({ age, creatinineUmol, sex }) {
  const a = parseFloat(age), cr = parseFloat(creatinineUmol) / 88.4; // to mg/dL
  if (!a || !cr) return null;
  const k = sex === "F" ? 0.7 : 0.9;
  const alpha = sex === "F" ? -0.241 : -0.302;
  const minCr = Math.min(cr / k, 1), maxCr = Math.max(cr / k, 1);
  let egfr = 142 * Math.pow(minCr, alpha) * Math.pow(maxCr, -1.2) * Math.pow(0.9938, a);
  if (sex === "F") egfr *= 1.012;
  return Math.round(egfr);
}

export const CALCULATORS = [
  { key: "gfr", label: "eGFR (CKD-EPI)", fields: ["age", "creatinineUmol", "sex"], fn: egfrCkdEpi, unit: "mL/min/1.73m²" },
  { key: "crcl", label: "Creatinine Clearance (Cockcroft-Gault)", fields: ["age", "weightKg", "creatinineUmol", "sex"], fn: cockcroftGault, unit: "mL/min" },
  { key: "bmi", label: "Body Mass Index", fields: ["weightKg", "heightCm"], fn: bmi, unit: "kg/m²" },
  { key: "bsa", label: "Body Surface Area", fields: ["weightKg", "heightCm"], fn: bsa, unit: "m²" },
  { key: "fluids", label: "Maintenance IV Fluids", fields: ["weightKg"], fn: maintenanceFluids, unit: "mL/day" },
  { key: "ag", label: "Anion Gap", fields: ["na", "k", "cl", "hco3"], fn: anionGap, unit: "mmol/L" },
  { key: "cacorr", label: "Corrected Calcium", fields: ["calciumMmol", "albuminGL"], fn: correctedCalcium, unit: "mmol/L" },
];

/* ---------------- Unit converters ---------------- */

export const CONVERSIONS = {
  glucose: { label: "Glucose", from: "mmol/L", to: "mg/dL", factor: 18.0182 },
  creatinine: { label: "Creatinine", from: "\u00b5mol/L", to: "mg/dL", factor: 1 / 88.4 },
  urea: { label: "Urea", from: "mmol/L", to: "mg/dL (BUN)", factor: 2.8 },
  bilirubin: { label: "Bilirubin", from: "\u00b5mol/L", to: "mg/dL", factor: 1 / 17.1 },
  cholesterol: { label: "Cholesterol", from: "mmol/L", to: "mg/dL", factor: 38.67 },
  haemoglobin: { label: "Haemoglobin", from: "g/dL", to: "g/L", factor: 10 },
  calcium: { label: "Calcium", from: "mmol/L", to: "mg/dL", factor: 4.0 },
  weight: { label: "Weight", from: "kg", to: "lb", factor: 2.20462 },
  temperature: { label: "Temperature", from: "\u00b0C", to: "\u00b0F", factor: null }, // special-cased
};

export function convert(key, value) {
  const c = CONVERSIONS[key];
  const v = parseFloat(value);
  if (!c || Number.isNaN(v)) return null;
  if (key === "temperature") return Math.round((v * 9/5 + 32) * 100) / 100;
  return Math.round(v * c.factor * 1000) / 1000;
}

/* ---------------- Critical value reference (bench card) ---------------- */

export const CRITICAL_VALUES = [
  { analyte: "Potassium", low: "\u2264 2.5 mmol/L", high: "\u2265 6.5 mmol/L", action: "Notify physician immediately; risk of arrhythmia" },
  { analyte: "Sodium", low: "\u2264 120 mmol/L", high: "\u2265 160 mmol/L", action: "Notify physician; correct slowly to avoid osmotic demyelination" },
  { analyte: "Glucose", low: "\u2264 2.2 mmol/L", high: "\u2265 25 mmol/L", action: "Immediate treatment; risk of seizure/coma" },
  { analyte: "Haemoglobin", low: "\u2264 7 g/dL", high: "\u2265 20 g/dL", action: "Consider transfusion; assess for hyperviscosity" },
  { analyte: "Platelets", low: "\u2264 20 x10\u2079/L", high: "\u2265 1000 x10\u2079/L", action: "Bleeding risk; consider platelet transfusion" },
  { analyte: "INR", low: "\u2014", high: "\u2265 5", action: "Bleeding risk; consider vitamin K / hold anticoagulant" },
  { analyte: "pH (arterial)", low: "\u2264 7.2", high: "\u2265 7.6", action: "Life-threatening acid-base disturbance" },
  { analyte: "Troponin I", low: "\u2014", high: "\u2265 0.4 ng/mL", action: "Suspected MI; urgent cardiology review" },
  { analyte: "CD4", low: "\u2264 200 cells/\u00b5L", high: "\u2014", action: "AIDS-defining threshold; opportunistic infection risk" },
];

/* ---------------- Specimen reference ---------------- */

export const SPECIMEN_GUIDE = [
  { tube: "EDTA (purple/lavender)", uses: "FBC, HbA1c, genotype, malaria parasite, CD4, viral load" },
  { tube: "Citrate (blue)", uses: "Coagulation studies — PT, INR, APTT" },
  { tube: "Lithium heparin (green)", uses: "U&E, LFT, most chemistry on plasma" },
  { tube: "Plain / SST (red or gold)", uses: "Serology, hormones, cardiac markers, tumour markers" },
  { tube: "Fluoride oxalate (grey)", uses: "Glucose — prevents in-vitro glycolysis" },
  { tube: "Blood culture bottles", uses: "Blood culture — aerobic and anaerobic pair" },
];
