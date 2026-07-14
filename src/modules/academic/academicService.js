// Academic service — teaching-hospital registries: training programmes,
// clinical logbooks, CME activities, research projects, ethics submissions.
// In-memory now; async API shaped for a later D1 swap.

const delay = (ms = 90) => new Promise((r) => setTimeout(r, ms));

/* -------- Training programmes -------- */
const _training = [
  { id: "tr1", programme: "Internal Medicine Residency", level: "Residency", trainees: 14, lead: "Prof. Adeyemi" },
  { id: "tr2", programme: "Surgery Residency", level: "Residency", trainees: 11, lead: "Mr. Okonkwo" },
  { id: "tr3", programme: "House Officer Rotation", level: "Internship", trainees: 28, lead: "Dr. Umeh" },
  { id: "tr4", programme: "Medical Student Clerkship", level: "Undergraduate", trainees: 46, lead: "Dr. Ogun" },
];
export async function listTraining() { await delay(); return [..._training]; }

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

/* -------- Research projects -------- */
const _research = [
  { id: "rs1", title: "Malaria RDT accuracy in paediatric fever", pi: "Dr. Umeh", status: "ongoing", dept: "Paediatrics" },
  { id: "rs2", title: "Hypertension control in rural Oyo", pi: "Prof. Adeyemi", status: "recruiting", dept: "Internal Medicine" },
  { id: "rs3", title: "Surgical site infection audit", pi: "Mr. Okonkwo", status: "analysis", dept: "Surgery" },
];
export async function listResearch() { await delay(); return [..._research]; }

/* -------- Ethics submissions -------- */
const _ethics = [
  { id: "et1", ref: "IRB-0042", title: "Malaria RDT accuracy study", status: "approved", submitted: "2026-05-10" },
  { id: "et2", ref: "IRB-0051", title: "Hypertension control trial", status: "under-review", submitted: "2026-07-01" },
  { id: "et3", ref: "IRB-0053", title: "SSI audit protocol", status: "revisions", submitted: "2026-06-22" },
];
export const ETHICS_TINT = {
  approved: { bg: "#E6EFDF", fg: "#4A6329", label: "Approved" },
  "under-review": { bg: "#E3ECF7", fg: "#3A5170", label: "Under review" },
  revisions: { bg: "#FBF0DC", fg: "#8A5A17", label: "Revisions requested" },
  rejected: { bg: "#F7E4E2", fg: "#B0281F", label: "Rejected" },
};
export async function listEthics() { await delay(); return [..._ethics].sort((a, b) => b.submitted.localeCompare(a.submitted)); }
