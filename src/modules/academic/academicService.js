// Academic service — teaching-hospital registries: training programmes,
// clinical logbooks, CME activities, research projects, ethics submissions.
// In-memory now; async API shaped for a later D1 swap.

import { record, AUDIT_ACTIONS } from "../../lib/audit";

const delay = (ms = 90) => new Promise((r) => setTimeout(r, ms));

/* -------- Training programmes -------- */
const _training = [
  { id: "tr1", programme: "Internal Medicine Residency", level: "Residency", trainees: 14, lead: "Prof. Adeyemi" },
  { id: "tr2", programme: "Surgery Residency", level: "Residency", trainees: 11, lead: "Mr. Okonkwo" },
  { id: "tr3", programme: "House Officer Rotation", level: "Internship", trainees: 28, lead: "Dr. Umeh" },
  { id: "tr4", programme: "Medical Student Clerkship", level: "Undergraduate", trainees: 46, lead: "Dr. Ogun" },
];
export async function listTraining() { await delay(); return [..._training]; }
export async function addTrainingProgramme({ programme, level, lead, actor }) {
  await delay();
  if (!programme || !programme.trim()) throw new Error("Enter the programme name.");
  if (!lead || !lead.trim()) throw new Error("Enter the programme lead.");
  const t = { id: "tr" + Date.now(), programme: programme.trim(), level: level || "Residency", trainees: 0, lead: lead.trim() };
  _training.unshift(t);
  record({ actor, action: AUDIT_ACTIONS.CREATE, entity: "training-programme", entityId: t.id, detail: `${t.programme} created \u2014 lead ${t.lead}`, severity: "info" });
  return t;
}
export async function enrollTrainee(programmeId, actor) {
  await delay(70);
  const t = _training.find((x) => x.id === programmeId);
  if (!t) throw new Error("Programme not found.");
  t.trainees += 1;
  record({ actor, action: AUDIT_ACTIONS.UPDATE, entity: "training-programme", entityId: t.id, detail: `Trainee enrolled \u2014 ${t.programme}, now ${t.trainees}`, severity: "info" });
  return t;
}

/* -------- Clinical logbooks -------- */
let _logSeq = 0;
const _logs = [
  { id: "lg1", trainee: "Dr. Bola Adé (HO)", procedure: "Lumbar puncture", supervisor: "Dr. Umeh", date: "2026-07-13" },
  { id: "lg2", trainee: "Dr. Kunle Sanni (R2)", procedure: "Appendectomy (assist)", supervisor: "Mr. Okonkwo", date: "2026-07-12" },
];
export async function listLogs() { await delay(); return [..._logs].sort((a, b) => b.date.localeCompare(a.date)); }
export async function addLog({ trainee, procedure, supervisor }) {
  await delay();
  if (!trainee || !trainee.trim()) throw new Error("Enter the trainee.");
  if (!procedure || !procedure.trim()) throw new Error("Enter the procedure.");
  _logSeq += 1;
  const log = { id: "lg" + Date.now(), trainee: trainee.trim(), procedure: procedure.trim(), supervisor: supervisor || "—", date: new Date().toISOString().slice(0, 10) };
  _logs.unshift(log);
  return log;
}

/* -------- CME activities -------- */
const _cme = [
  { id: "cme1", title: "Grand Round: Sepsis management", date: "2026-07-16", credits: 2, category: "Clinical" },
  { id: "cme2", title: "Workshop: Neonatal resuscitation", date: "2026-07-20", credits: 4, category: "Skills" },
  { id: "cme3", title: "Seminar: Antimicrobial stewardship", date: "2026-07-24", credits: 2, category: "Clinical" },
];
export async function listCME() { await delay(); return [..._cme].sort((a, b) => a.date.localeCompare(b.date)); }
export async function addCmeActivity({ title, date, credits, category, actor }) {
  await delay();
  if (!title || !title.trim()) throw new Error("Enter the activity title.");
  if (!date) throw new Error("Choose a date.");
  const c = { id: "cme" + Date.now(), title: title.trim(), date, credits: Number(credits) || 1, category: category || "Clinical", attendees: 0 };
  _cme.push(c);
  record({ actor, action: AUDIT_ACTIONS.CREATE, entity: "cme-activity", entityId: c.id, detail: `${c.title} scheduled \u2014 ${c.credits} credit(s)`, severity: "info" });
  return c;
}
export async function recordCmeAttendance(cmeId, actor) {
  await delay(70);
  const c = _cme.find((x) => x.id === cmeId);
  if (!c) throw new Error("Activity not found.");
  c.attendees = (c.attendees || 0) + 1;
  record({ actor, action: AUDIT_ACTIONS.UPDATE, entity: "cme-activity", entityId: c.id, detail: `Attendance recorded \u2014 ${c.title}, now ${c.attendees}`, severity: "info" });
  return c;
}

/* -------- Research projects -------- */
const _research = [
  { id: "rs1", title: "Malaria RDT accuracy in paediatric fever", pi: "Dr. Umeh", status: "ongoing", dept: "Paediatrics" },
  { id: "rs2", title: "Hypertension control in rural Oyo", pi: "Prof. Adeyemi", status: "recruiting", dept: "Internal Medicine" },
  { id: "rs3", title: "Surgical site infection audit", pi: "Mr. Okonkwo", status: "analysis", dept: "Surgery" },
];
export async function listResearch() { await delay(); return [..._research]; }
export const RESEARCH_STATUSES = ["recruiting", "ongoing", "analysis", "completed", "suspended"];
export async function registerResearch({ title, pi, dept, actor }) {
  await delay();
  if (!title || !title.trim()) throw new Error("Enter the study title.");
  if (!pi || !pi.trim()) throw new Error("Enter the principal investigator.");
  const r = { id: "rs" + Date.now(), title: title.trim(), pi: pi.trim(), status: "recruiting", dept: dept || "\u2014" };
  _research.unshift(r);
  record({ actor, action: AUDIT_ACTIONS.CREATE, entity: "research-project", entityId: r.id, detail: `${r.title} registered \u2014 PI ${r.pi}`, severity: "info" });
  return r;
}
export async function updateResearchStatus(id, status, actor) {
  await delay(70);
  const r = _research.find((x) => x.id === id);
  if (!r) throw new Error("Study not found.");
  if (!RESEARCH_STATUSES.includes(status)) throw new Error("Unknown status.");
  r.status = status;
  record({ actor, action: AUDIT_ACTIONS.UPDATE, entity: "research-project", entityId: r.id, detail: `${r.title} \u2014 status now ${status}`, severity: "info" });
  return r;
}

/* -------- Ethics committee: real submit -> review -> decision lifecycle -------- */
export const ETHICS_STATUSES = ["submitted", "under-review", "revisions", "approved", "rejected"];
export const ETHICS_TINT = {
  submitted: { bg: "#E3ECF7", fg: "#3A5170", label: "Submitted" },
  "under-review": { bg: "#EDE7F5", fg: "#553A80", label: "Under review" },
  revisions: { bg: "#FBF0DC", fg: "#8A5A17", label: "Revisions requested" },
  approved: { bg: "#E6EFDF", fg: "#4A6329", label: "Approved" },
  rejected: { bg: "#F7E4E2", fg: "#B0281F", label: "Rejected" },
};

export const STUDY_TYPES = ["Observational", "Interventional", "Retrospective chart review", "Survey/Questionnaire", "Clinical trial"];

let _ethicsSeq = 53;
const _ethics = [
  {
    id: "et1", ref: "IRB-0042", title: "Malaria RDT accuracy study", type: "Observational",
    pi: "Dr. Ngozi Umeh", dept: "Paediatrics", status: "approved", submitted: "2026-05-10",
    comments: [
      { by: "Prof. Adeyemi (Chair)", at: "2026-05-14", note: "Protocol sound. Approved for 12 months, renewable." },
    ],
  },
  {
    id: "et2", ref: "IRB-0051", title: "Hypertension control trial", type: "Interventional",
    pi: "Prof. Adeyemi", dept: "Internal Medicine", status: "under-review", submitted: "2026-07-01",
    comments: [
      { by: "Dr. Bello (Reviewer)", at: "2026-07-05", note: "Consent form under review by two committee members." },
    ],
  },
  {
    id: "et3", ref: "IRB-0053", title: "SSI audit protocol", type: "Retrospective chart review",
    pi: "Mr. Okonkwo", dept: "Surgery", status: "revisions", submitted: "2026-06-22",
    comments: [
      { by: "Prof. Adeyemi (Chair)", at: "2026-06-28", note: "Please clarify data anonymisation approach before resubmission." },
    ],
  },
];

function ethicsRef() { _ethicsSeq += 1; return "IRB-" + String(_ethicsSeq).padStart(4, "0"); }

export async function listEthics({ status = "all" } = {}) {
  await delay();
  return _ethics
    .filter((e) => (status === "all" ? true : e.status === status))
    .sort((a, b) => b.submitted.localeCompare(a.submitted))
    .map((e) => ({ ...e }));
}

export async function submitEthics({ title, type, pi, dept, actor }) {
  await delay();
  if (!title || !title.trim()) throw new Error("Enter the study title.");
  if (!STUDY_TYPES.includes(type)) throw new Error("Choose a study type.");
  if (!pi || !pi.trim()) throw new Error("Enter the principal investigator.");
  const e = {
    id: "et" + Date.now(), ref: ethicsRef(), title: title.trim(), type,
    pi: pi.trim(), dept: dept || "\u2014", status: "submitted",
    submitted: new Date().toISOString().slice(0, 10), comments: [],
  };
  _ethics.unshift(e);
  record({ actor, action: AUDIT_ACTIONS.CREATE, entity: "ethics-submission", entityId: e.ref, detail: `Submitted: ${e.title}`, severity: "info" });
  return e;
}

/**
 * Move a submission through the review lifecycle. A decision (approved,
 * rejected, revisions) requires a reviewer comment \u2014 a bare status flip
 * with no reasoning is not how ethics review actually works.
 */
export async function decideEthics(id, { status, comment, actor }) {
  await delay();
  const e = _ethics.find((x) => x.id === id);
  if (!e) throw new Error("Submission not found");
  if (!ETHICS_STATUSES.includes(status)) throw new Error("Unknown status");
  if (["approved", "rejected", "revisions"].includes(status) && (!comment || !comment.trim())) {
    throw new Error("A reviewer comment is required for this decision.");
  }
  if (e.status === "approved" || e.status === "rejected") {
    throw new Error("This submission already has a final decision and cannot be reopened here.");
  }
  e.status = status;
  if (comment && comment.trim()) {
    e.comments.push({ by: actor?.name || "Reviewer", at: new Date().toISOString().slice(0, 10), note: comment.trim() });
  }
  record({ actor, action: AUDIT_ACTIONS.UPDATE, entity: "ethics-submission", entityId: e.ref, detail: `${status} \u2014 ${e.title}`, severity: "info" });
  return e;
}
