// Critical-care service (ICU / HDU).
// Layers vital signs on top of the occupied ICU/HDU beds from bedService. Each
// vital is flagged against critical thresholds; a bed with any critical vital is
// "unstable" and feeds the Alerts screen as a fifth source.
// In-memory now; async API shaped for a later D1 swap.

import { listWards } from "../wards/bedService";

const delay = (ms = 110) => new Promise((r) => setTimeout(r, ms));

export const CC_WARDS = ["ICU", "HDU"];

// Vital definitions with normal + critical ranges.
export const VITALS = [
  { key: "hr", label: "Heart rate", unit: "bpm", low: 60, high: 100, critLow: 40, critHigh: 130 },
  { key: "sbp", label: "Systolic BP", unit: "mmHg", low: 90, high: 140, critLow: 80, critHigh: 180 },
  { key: "spo2", label: "SpO\u2082", unit: "%", low: 94, high: 100, critLow: 88, critHigh: null },
  { key: "rr", label: "Resp. rate", unit: "/min", low: 12, high: 20, critLow: 8, critHigh: 30 },
  { key: "temp", label: "Temp", unit: "\u00b0C", low: 36, high: 37.8, critLow: 35, critHigh: 39.5 },
];

// Vitals keyed by patient/occupant id. Seed the one admitted ICU patient (p1
// sits in MA-04 in the ward seed, but for the demo we place a critical-care
// patient set here keyed to whoever occupies ICU/HDU beds).
const _vitals = {};

// Seed: give any occupant we find a baseline; specific criticals added on read
// if absent so the board is never empty when a bed is occupied.
function seedVitalsFor(occupantId, preset) {
  if (!_vitals[occupantId]) {
    _vitals[occupantId] = preset || { hr: 82, sbp: 118, spo2: 97, rr: 16, temp: 37.0, updatedAt: new Date().toISOString() };
  }
}

// Flag one vital value against its thresholds.
export function flagVital(vital, value) {
  const v = parseFloat(value);
  if (Number.isNaN(v)) return "normal";
  if (vital.critLow != null && v <= vital.critLow) return "critical";
  if (vital.critHigh != null && v >= vital.critHigh) return "critical";
  if (vital.low != null && v < vital.low) return "low";
  if (vital.high != null && v > vital.high) return "high";
  return "normal";
}

export function bedIsUnstable(vitals) {
  if (!vitals) return false;
  return VITALS.some((vd) => flagVital(vd, vitals[vd.key]) === "critical");
}

// Build the board: occupied ICU/HDU beds with their vitals.
export async function listCriticalCare() {
  await delay();
  const wards = await listWards();
  const ccWards = wards.filter((w) => CC_WARDS.includes(w.name));

  const rows = [];
  for (const w of ccWards) {
    for (const bed of w.beds) {
      if (!bed.occupantId) continue;
      // Seed a plausible vital set; give the first ICU occupant a critical SpO2
      // so the board and alerts demonstrate the unstable path.
      if (!_vitals[bed.occupantId]) {
        const preset =
          w.name === "ICU"
            ? { hr: 122, sbp: 86, spo2: 86, rr: 28, temp: 38.4, updatedAt: new Date().toISOString() }
            : null;
        seedVitalsFor(bed.occupantId, preset);
      }
      rows.push({
        ward: w.name,
        bedId: bed.id,
        occupantId: bed.occupantId,
        occupantName: bed.occupantName,
        vitals: { ..._vitals[bed.occupantId] },
        unstable: bedIsUnstable(_vitals[bed.occupantId]),
      });
    }
  }
  return rows.sort((a, b) => Number(b.unstable) - Number(a.unstable));
}

export async function updateVitals(occupantId, vitals) {
  await delay();
  const clean = {};
  for (const vd of VITALS) {
    const val = parseFloat(vitals[vd.key]);
    if (Number.isNaN(val)) throw new Error(`Enter a value for ${vd.label}.`);
    clean[vd.key] = val;
  }
  clean.updatedAt = new Date().toISOString();
  _vitals[occupantId] = clean;
  return { ...clean, unstable: bedIsUnstable(clean) };
}

// Feed for Alerts: unstable critical-care patients.
export async function listUnstablePatients() {
  await delay(60);
  const board = await listCriticalCare();
  return board.filter((r) => r.unstable);
}
