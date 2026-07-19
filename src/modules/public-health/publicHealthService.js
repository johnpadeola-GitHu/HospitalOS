// Public health service — disease surveillance, immunisation programmes,
// community outreach, and national reporting (IDSR-style).
// In-memory now; async API shaped for a later D1 swap.

import { record, AUDIT_ACTIONS } from "../../lib/audit";

const delay = (ms = 90) => new Promise((r) => setTimeout(r, ms));

/* -------- Disease surveillance (weekly notifiable case counts) -------- */
const _surveillance = [
  { id: "sv1", disease: "Malaria", cases: 214, trend: "up", notifiable: false },
  { id: "sv2", disease: "Cholera", cases: 6, trend: "up", notifiable: true },
  { id: "sv3", disease: "Measles", cases: 3, trend: "flat", notifiable: true },
  { id: "sv4", disease: "Lassa fever", cases: 1, trend: "flat", notifiable: true },
  { id: "sv5", disease: "Typhoid", cases: 42, trend: "down", notifiable: false },
  { id: "sv6", disease: "COVID-19", cases: 8, trend: "down", notifiable: true },
];
export async function listSurveillance() { await delay(); return [..._surveillance]; }

export const NOTIFIABLE_DISEASES = ["Cholera", "Measles", "Lassa fever", "COVID-19", "Yellow fever", "Meningitis", "Diphtheria", "Mpox", "Other notifiable disease"];

/**
 * Logs a new case count for a disease this week. If the disease already has
 * a row this period, the case count is added to it and the trend is
 * recomputed from the change; otherwise a new tracked disease is created.
 * A notifiable disease trending up feeds Alerts directly — the same
 * "condition itself is the alert" pattern as every other source.
 */
export async function logCase({ disease, count, notifiable, actor }) {
  await delay();
  if (!disease || !disease.trim()) throw new Error("Enter or choose a disease.");
  const n = parseInt(count, 10);
  if (!n || n < 1) throw new Error("Enter a case count of at least 1.");
  let d = _surveillance.find((x) => x.disease.toLowerCase() === disease.trim().toLowerCase());
  if (d) {
    d.trend = "up";
    d.cases += n;
  } else {
    d = { id: "sv" + Date.now(), disease: disease.trim(), cases: n, trend: "up", notifiable: !!notifiable };
    _surveillance.push(d);
  }
  record({
    actor, action: AUDIT_ACTIONS.CREATE, entity: "surveillance-case", entityId: d.id,
    detail: `${n} case(s) of ${d.disease} logged — running total ${d.cases}`,
    severity: d.notifiable ? "warn" : "info",
  });
  return d;
}

// Feed for Alerts: notifiable diseases with a rising trend.
export async function listOutbreakSignals() {
  await delay(60);
  return _surveillance.filter((d) => d.notifiable && d.trend === "up");
}

/* -------- Immunisation programmes -------- */
const _immunisation = [
  { id: "im1", vaccine: "BCG", target: 320, given: 298 },
  { id: "im2", vaccine: "OPV / IPV", target: 320, given: 305 },
  { id: "im3", vaccine: "Pentavalent", target: 320, given: 276 },
  { id: "im4", vaccine: "Measles", target: 300, given: 241 },
  { id: "im5", vaccine: "Yellow fever", target: 300, given: 233 },
  { id: "im6", vaccine: "HPV (girls 9–14)", target: 180, given: 96 },
];
export async function listImmunisation() {
  await delay();
  return _immunisation.map((v) => ({ ...v, coverage: Math.round((v.given / v.target) * 100) }));
}

/* -------- Community outreach -------- */
const _outreach = [
  { id: "or1", activity: "Rural health screening — Ijaye", date: "2026-07-18", team: "Community Health Team A", reached: 0, status: "planned" },
  { id: "or2", activity: "Antenatal outreach — Moniya", date: "2026-07-10", team: "Maternal Health Unit", reached: 84, status: "completed" },
  { id: "or3", activity: "Hypertension screening — market", date: "2026-07-05", team: "NCD Unit", reached: 213, status: "completed" },
];
export async function listOutreach() { await delay(); return [..._outreach].sort((a, b) => b.date.localeCompare(a.date)); }

export async function planOutreach({ activity, date, team, actor }) {
  await delay();
  if (!activity || !activity.trim()) throw new Error("Describe the activity.");
  if (!date) throw new Error("Choose a date.");
  if (!team || !team.trim()) throw new Error("Enter the team.");
  const o = { id: "or" + Date.now(), activity: activity.trim(), date, team: team.trim(), reached: 0, status: "planned" };
  _outreach.unshift(o);
  record({ actor, action: AUDIT_ACTIONS.CREATE, entity: "outreach", entityId: o.id, detail: `${o.activity} planned for ${o.date}`, severity: "info" });
  return o;
}

export async function completeOutreach(id, reached, actor) {
  await delay(80);
  const o = _outreach.find((x) => x.id === id);
  if (!o) throw new Error("Activity not found.");
  const n = parseInt(reached, 10);
  if (!n && n !== 0) throw new Error("Enter how many people were reached.");
  o.reached = n;
  o.status = "completed";
  record({ actor, action: AUDIT_ACTIONS.UPDATE, entity: "outreach", entityId: o.id, detail: `${o.activity} completed — ${n} reached`, severity: "info" });
  return o;
}

/* -------- National reporting (IDSR / DHIS2 submissions) -------- */
const _reports = [
  { id: "rp1", form: "IDSR Weekly (Form 001)", period: "Week 28, 2026", status: "submitted", due: "2026-07-14" },
  { id: "rp2", form: "Monthly Immunisation (NHMIS)", period: "June 2026", status: "submitted", due: "2026-07-05" },
  { id: "rp3", form: "Maternal Death Review", period: "Q2 2026", status: "pending", due: "2026-07-31" },
  { id: "rp4", form: "IDSR Weekly (Form 001)", period: "Week 29, 2026", status: "pending", due: "2026-07-21" },
];
export const REPORT_TINT = {
  submitted: { bg: "#E6EFDF", fg: "#4A6329", label: "Submitted" },
  pending: { bg: "#FBF0DC", fg: "#8A5A17", label: "Pending" },
  overdue: { bg: "#F7E4E2", fg: "#B0281F", label: "Overdue" },
};
export async function listReports() {
  await delay();
  const today = new Date().toISOString().slice(0, 10);
  return _reports.map((r) => ({ ...r, status: r.status === "pending" && r.due < today ? "overdue" : r.status }));
}
export async function submitReport(id, actor) {
  await delay(90);
  const r = _reports.find((x) => x.id === id);
  if (!r) throw new Error("Report not found.");
  r.status = "submitted";
  record({ actor, action: AUDIT_ACTIONS.UPDATE, entity: "national-report", entityId: r.id, detail: `${r.form} (${r.period}) submitted`, severity: "info" });
  return r;
}
