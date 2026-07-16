// Renal & dialysis service.
// Two things a renal unit runs: a haemodialysis programme (patients on a
// recurring dialysis schedule, with per-session vitals and access-site
// tracking) and a CKD staging registry (patients being followed for chronic
// kidney disease, staged by eGFR, not yet or not on dialysis).
// Reuses recordsService's diagnosis/allergy pattern conceptually but keeps its
// own data — a dialysis session is operational, not a clinical note.
// In-memory now; async API shaped for a later D1 swap.

import { record, AUDIT_ACTIONS } from "../../lib/audit";

const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));

export const ACCESS_TYPES = ["AV Fistula", "AV Graft", "Tunnelled Catheter", "Temporary Catheter"];
export const CKD_STAGES = [
  { stage: "1", label: "Stage 1 — Normal/high eGFR with kidney damage", min: 90 },
  { stage: "2", label: "Stage 2 — Mild decrease", min: 60 },
  { stage: "3a", label: "Stage 3a — Mild-moderate decrease", min: 45 },
  { stage: "3b", label: "Stage 3b — Moderate-severe decrease", min: 30 },
  { stage: "4", label: "Stage 4 — Severe decrease", min: 15 },
  { stage: "5", label: "Stage 5 — Kidney failure (ESRD)", min: 0 },
];

export function stageForEgfr(egfr) {
  const v = parseFloat(egfr);
  if (!Number.isFinite(v)) return null;
  return CKD_STAGES.find((s) => v >= s.min) || CKD_STAGES[CKD_STAGES.length - 1];
}

/* ---------------- Dialysis programme ---------------- */

let _sessSeq = 300;
const _patients = [
  {
    id: "rd1", patientName: "Okafor, Adaeze", hospitalNo: "H001001", access: "AV Fistula",
    schedule: "Mon / Wed / Fri", dryWeight: 62, sessionsTotal: 0, sessionsDone: 0, active: true,
    lastSession: null, nextDue: new Date().toISOString().slice(0, 10),
  },
];

const _sessions = [];

export async function listDialysisPatients() {
  await delay();
  const today = new Date().toISOString().slice(0, 10);
  return _patients.map((p) => ({ ...p, overdue: p.active && p.nextDue && p.nextDue < today }));
}

export async function enrolDialysis({ patientName, hospitalNo, access, schedule, dryWeight, actor }) {
  await delay();
  if (!patientName || !patientName.trim()) throw new Error("Enter the patient.");
  if (!ACCESS_TYPES.includes(access)) throw new Error("Choose a vascular access type.");
  const w = parseFloat(dryWeight);
  if (!w) throw new Error("Enter the dry weight.");
  const p = {
    id: "rd" + Date.now(), patientName: patientName.trim(), hospitalNo: hospitalNo || "\u2014",
    access, schedule: schedule || "Mon / Wed / Fri", dryWeight: w,
    sessionsTotal: 0, sessionsDone: 0, active: true,
    lastSession: null, nextDue: new Date().toISOString().slice(0, 10),
  };
  _patients.unshift(p);
  record({ actor, action: AUDIT_ACTIONS.CLINICAL, entity: "dialysis-enrolment", entityId: p.id, detail: `Enrolled ${p.patientName} — ${access}`, severity: "info" });
  return p;
}

export async function recordSession(patientId, { preWeight, postWeight, duration, ufGoal, bpPre, bpPost, complications, actor }) {
  await delay();
  const p = _patients.find((x) => x.id === patientId);
  if (!p) throw new Error("Patient not found");
  const pre = parseFloat(preWeight), post = parseFloat(postWeight);
  if (!pre || !post) throw new Error("Enter pre and post dialysis weights.");
  _sessSeq += 1;
  const session = {
    id: "ds" + Date.now(), ref: "DS-" + _sessSeq, patientId, patientName: p.patientName,
    at: new Date().toISOString(), preWeight: pre, postWeight: post,
    fluidRemoved: Math.round((pre - post) * 100) / 100,
    duration: duration || "4h", ufGoal: ufGoal || "\u2014",
    bpPre: bpPre || "\u2014", bpPost: bpPost || "\u2014",
    complications: complications || "None",
  };
  _sessions.unshift(session);
  p.sessionsDone += 1;
  p.lastSession = session.at;
  // Next due: 2 days out (Mon/Wed/Fri-style cadence, simplified).
  p.nextDue = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
  record({ actor, action: AUDIT_ACTIONS.CLINICAL, entity: "dialysis-session", entityId: session.ref, detail: `Session for ${p.patientName} — ${session.fluidRemoved}L removed`, severity: "info" });
  return session;
}

export async function listSessions({ patientId } = {}) {
  await delay(60);
  return _sessions.filter((s) => !patientId || s.patientId === patientId);
}

// Feed for Alerts: dialysis overdue (missed a scheduled session).
export async function listOverdueDialysis() {
  await delay(60);
  const today = new Date().toISOString().slice(0, 10);
  return _patients.filter((p) => p.active && p.nextDue && p.nextDue < today);
}

/* ---------------- CKD registry ---------------- */

const _ckd = [
  { id: "ckd1", patientName: "Eze, Chibuike", hospitalNo: "H001002", egfr: 38, followUp: "3-monthly", by: "Dr. Umeh", at: new Date().toISOString().slice(0, 10) },
];

export async function listCkdRegistry() {
  await delay();
  return _ckd.map((c) => ({ ...c, stage: stageForEgfr(c.egfr) }));
}

export async function addCkdEntry({ patientName, hospitalNo, egfr, followUp, actor }) {
  await delay();
  if (!patientName || !patientName.trim()) throw new Error("Enter the patient.");
  const v = parseFloat(egfr);
  if (!Number.isFinite(v)) throw new Error("Enter a valid eGFR.");
  const c = { id: "ckd" + Date.now(), patientName: patientName.trim(), hospitalNo: hospitalNo || "\u2014", egfr: v, followUp: followUp || "3-monthly", by: actor?.name || "Unknown", at: new Date().toISOString().slice(0, 10) };
  _ckd.unshift(c);
  record({ actor, action: AUDIT_ACTIONS.CLINICAL, entity: "ckd-registry", entityId: c.id, detail: `${c.patientName} staged — eGFR ${v}`, severity: "info" });
  return c;
}

export async function renalSummary() {
  await delay(60);
  const dialysis = await listDialysisPatients();
  const ckd = await listCkdRegistry();
  return {
    onDialysis: dialysis.filter((p) => p.active).length,
    overdueDialysis: dialysis.filter((p) => p.overdue).length,
    ckdTotal: ckd.length,
    ckdStage4Plus: ckd.filter((c) => ["4", "5"].includes(c.stage?.stage)).length,
    sessionsThisWeek: _sessions.filter((s) => new Date(s.at) > new Date(Date.now() - 7 * 86400000)).length,
  };
}
