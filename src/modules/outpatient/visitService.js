// Outpatient (GOPD) visit queue.
// A visit is a patient's attendance at a clinic on a given day, moving through
// queue states. Reuses patientService for patient identity. In-memory now,
// async API shaped for a later D1 swap.

const delay = (ms = 110) => new Promise((r) => setTimeout(r, ms));

export const CLINICS = [
  "General Outpatient (GOPD)",
  "Family Medicine",
  "Internal Medicine",
  "Paediatrics",
  "Obstetrics & Gynaecology",
  "Surgical Outpatient",
  "Specialist Clinics",
];

// Visit lifecycle. Order matters — advance() steps through this sequence.
export const STAGES = ["waiting", "vitals", "with-doctor", "completed"];

export const STAGE_LABELS = {
  waiting: "Waiting",
  vitals: "Vitals",
  "with-doctor": "With doctor",
  completed: "Completed",
};

let _ticket = 0;
const _visits = [
  {
    id: "v1",
    patientId: "p2",
    patientName: "Eze, Chibuike",
    hospitalNo: "H001002",
    clinic: "General Outpatient (GOPD)",
    stage: "waiting",
    ticket: "G-001",
    checkedInAt: new Date(Date.now() - 26 * 60000).toISOString(),
  },
];

function ticketFor(clinic) {
  _ticket += 1;
  const letter = clinic.charAt(0).toUpperCase();
  return `${letter}-${String(_ticket).padStart(3, "0")}`;
}

export async function listVisits({ clinic = "all", includeCompleted = false } = {}) {
  await delay();
  return _visits
    .filter((v) => (clinic === "all" ? true : v.clinic === clinic))
    .filter((v) => (includeCompleted ? true : v.stage !== "completed"))
    .sort((a, b) => new Date(a.checkedInAt) - new Date(b.checkedInAt));
}

export async function checkInVisit({ patientId, patientName, hospitalNo, clinic }) {
  await delay();
  if (!patientId) throw new Error("Select a patient to check in.");
  const already = _visits.find(
    (v) => v.patientId === patientId && v.stage !== "completed"
  );
  if (already) throw new Error("This patient already has an open visit today.");
  const visit = {
    id: "v" + Date.now(),
    patientId,
    patientName,
    hospitalNo,
    clinic,
    stage: "waiting",
    ticket: ticketFor(clinic),
    checkedInAt: new Date().toISOString(),
  };
  _visits.push(visit);
  return visit;
}

export async function advanceVisit(id) {
  await delay(80);
  const v = _visits.find((x) => x.id === id);
  if (!v) throw new Error("Visit not found");
  const i = STAGES.indexOf(v.stage);
  if (i < STAGES.length - 1) v.stage = STAGES[i + 1];
  return v;
}

export async function setVisitStage(id, stage) {
  await delay(80);
  const v = _visits.find((x) => x.id === id);
  if (!v) throw new Error("Visit not found");
  if (!STAGES.includes(stage)) throw new Error("Unknown stage");
  v.stage = stage;
  return v;
}

export function waitMinutes(checkedInAt) {
  return Math.max(0, Math.round((Date.now() - new Date(checkedInAt)) / 60000));
}
