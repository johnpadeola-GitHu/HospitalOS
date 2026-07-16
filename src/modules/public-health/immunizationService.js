// Immunisation — the National Programme on Immunization (NPI) schedule,
// administered by the National Primary Health Care Development Agency
// (NPHCDA). Previously this screen showed coverage bars with no schedule
// behind them. This is the real routine schedule, tracked per child, with
// doses due computed from date of birth rather than guessed.
//
// Schedule reference: NPHCDA Routine Immunization Schedule (2023 revision) —
// antigen, recommended age, and dose number. In-memory now; async API
// shaped for a later D1 swap.

import { record, AUDIT_ACTIONS } from "../../lib/audit";

const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));
const DAY = 86400000;

// { code, antigen, doseLabel, ageInDays, series } — series groups doses of
// the same antigen so coverage can be reported per-antigen, matching how
// NHMIS (National Health Management Information System) actually reports.
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

let _seq = 500;
function childRef() { _seq += 1; return "IMM-" + String(_seq).padStart(5, "0"); }

const _children = [
  { id: "ch1", ref: "IMM-00501", childName: "Baby Okafor", motherName: "Okafor, Adaeze", hospitalNo: "H001001", dob: daysAgo(75), given: ["BCG", "OPV0", "HEPB0", "OPV1", "PENTA1", "PCV1", "ROTA1"] },
  { id: "ch2", ref: "IMM-00502", childName: "Baby Eze", motherName: "Eze, Chibuike", hospitalNo: "H001002", dob: daysAgo(290), given: ["BCG", "OPV0", "HEPB0", "OPV1", "PENTA1", "PCV1", "ROTA1", "OPV2", "PENTA2", "PCV2", "ROTA2", "OPV3", "PENTA3", "PCV3", "IPV", "VITA1"] },
];

function daysAgo(n) { return new Date(Date.now() - n * DAY).toISOString().slice(0, 10); }

function ageDays(dob) {
  return Math.floor((Date.now() - new Date(dob).getTime()) / DAY);
}

/** Doses due for a child right now: scheduled age has passed, not yet given. */
function dueDoses(child) {
  const age = ageDays(child.dob);
  return NPI_SCHEDULE.filter((s) => s.ageInDays <= age && !child.given.includes(s.code));
}

/** Doses overdue by more than a 14-day grace window — the operational definition NHMIS uses. */
function overdueDoses(child) {
  const age = ageDays(child.dob);
  return NPI_SCHEDULE.filter((s) => age - s.ageInDays > 14 && !child.given.includes(s.code));
}

function withComputed(c) {
  return {
    ...c,
    ageDays: ageDays(c.dob),
    due: dueDoses(c),
    overdue: overdueDoses(c),
    completedCount: c.given.length,
    totalScheduled: NPI_SCHEDULE.length,
  };
}

export async function listChildren({ query = "", onlyOverdue = false } = {}) {
  await delay();
  const q = query.trim().toLowerCase();
  return _children
    .map(withComputed)
    .filter((c) => !q || c.childName.toLowerCase().includes(q) || c.motherName.toLowerCase().includes(q) || c.ref.toLowerCase().includes(q))
    .filter((c) => !onlyOverdue || c.overdue.length > 0)
    .sort((a, b) => b.overdue.length - a.overdue.length);
}

export async function registerChild({ childName, motherName, hospitalNo, dob, actor }) {
  await delay();
  if (!childName || !childName.trim()) throw new Error("Enter the child's name.");
  if (!dob) throw new Error("Enter the date of birth.");
  const c = { id: "ch" + Date.now(), ref: childRef(), childName: childName.trim(), motherName: motherName || "\u2014", hospitalNo: hospitalNo || "\u2014", dob, given: [] };
  _children.unshift(c);
  record({ actor, action: AUDIT_ACTIONS.CREATE, entity: "immunisation-child", entityId: c.ref, detail: `Registered ${c.childName} for immunisation`, severity: "info" });
  return c;
}

export async function recordDose(childId, code, actor) {
  await delay(80);
  const c = _children.find((x) => x.id === childId);
  if (!c) throw new Error("Child not found");
  const dose = NPI_SCHEDULE.find((s) => s.code === code);
  if (!dose) throw new Error("Unknown antigen/dose.");
  if (c.given.includes(code)) throw new Error("This dose is already recorded.");
  c.given.push(code);
  record({ actor, action: AUDIT_ACTIONS.CLINICAL, entity: "immunisation-dose", entityId: c.ref, detail: `${dose.antigen} ${dose.doseLabel} given to ${c.childName}`, severity: "info" });
  return withComputed(c);
}

/** Coverage per antigen series — the figure actually reported to NHMIS. */
export async function coverageBySeries() {
  await delay(80);
  const children = _children.map(withComputed);
  return SERIES_LIST.map((series) => {
    const seriesDoses = NPI_SCHEDULE.filter((s) => s.series === series);
    const finalDose = seriesDoses[seriesDoses.length - 1];
    const eligible = children.filter((c) => c.ageDays >= finalDose.ageInDays);
    const completed = eligible.filter((c) => c.given.includes(finalDose.code));
    return {
      series, antigen: finalDose.antigen,
      eligible: eligible.length, completed: completed.length,
      coveragePct: eligible.length ? Math.round((completed.length / eligible.length) * 100) : 0,
    };
  });
}

export async function listOverdueImmunisations() {
  await delay(60);
  return _children.map(withComputed).filter((c) => c.overdue.length > 0);
}

export async function immunisationSummary() {
  await delay(60);
  const children = _children.map(withComputed);
  return {
    totalChildren: children.length,
    fullyImmunised: children.filter((c) => c.due.length === 0 && c.overdue.length === 0 && c.completedCount === NPI_SCHEDULE.length).length,
    withOverdue: children.filter((c) => c.overdue.length > 0).length,
    dosesGivenTotal: children.reduce((s, c) => s + c.completedCount, 0),
  };
}
