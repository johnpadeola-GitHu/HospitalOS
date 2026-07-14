// Emergency & observation service.
// Patients present, are triaged to an acuity level (1 = resuscitation .. 5 =
// non-urgent), and move through: waiting -> in-treatment -> observation ->
// disposition (admitted / discharged / transferred). The board orders by acuity
// first, then arrival time, so the sickest are surfaced.
// In-memory now; async API shaped for a later D1 swap.

const delay = (ms = 110) => new Promise((r) => setTimeout(r, ms));

// ESI-style acuity. Lower number = higher acuity.
export const ACUITY = {
  1: { label: "Resuscitation", color: "#B0281F", bg: "#F7E4E2" },
  2: { label: "Emergent", color: "#A35A2E", bg: "#FBEADB" },
  3: { label: "Urgent", color: "#8A5A17", bg: "#FBF0DC" },
  4: { label: "Less urgent", color: "#4A6329", bg: "#E6EFDF" },
  5: { label: "Non-urgent", color: "#3A5170", bg: "#E3ECF7" },
};

export const ED_STAGES = ["waiting", "in-treatment", "observation"];
export const STAGE_LABELS = {
  waiting: "Waiting",
  "in-treatment": "In treatment",
  observation: "Observation",
};

export const DISPOSITIONS = ["admitted", "discharged", "transferred"];

let _enc = 0;
const _encounters = [
  {
    id: "e1",
    encounterNo: "ED-0001",
    patientId: "p2",
    patientName: "Eze, Chibuike",
    hospitalNo: "H001002",
    complaint: "Chest pain",
    acuity: 2,
    stage: "in-treatment",
    arrivedAt: new Date(Date.now() - 18 * 60000).toISOString(),
    disposition: null,
  },
  {
    id: "e2",
    encounterNo: "ED-0002",
    patientId: null,
    patientName: "Unregistered — trauma",
    hospitalNo: "—",
    complaint: "RTA, multiple injuries",
    acuity: 1,
    stage: "waiting",
    arrivedAt: new Date(Date.now() - 6 * 60000).toISOString(),
    disposition: null,
  },
];

function encNo() {
  _enc += 1;
  return "ED-" + String(_enc + 2).padStart(4, "0");
}

export async function listEncounters({ includeDisposed = false } = {}) {
  await delay();
  return _encounters
    .filter((e) => (includeDisposed ? true : !e.disposition))
    .sort((a, b) => {
      if (a.acuity !== b.acuity) return a.acuity - b.acuity; // sickest first
      return new Date(a.arrivedAt) - new Date(b.arrivedAt); // then earliest
    });
}

export async function presentPatient({ patientId, patientName, hospitalNo, complaint, acuity }) {
  await delay();
  if (!complaint || !complaint.trim()) throw new Error("Enter a presenting complaint.");
  const enc = {
    id: "e" + Date.now(),
    encounterNo: encNo(),
    patientId: patientId || null,
    patientName: patientName || "Unregistered patient",
    hospitalNo: hospitalNo || "\u2014",
    complaint: complaint.trim(),
    acuity: Number(acuity) || 3,
    stage: "waiting",
    arrivedAt: new Date().toISOString(),
    disposition: null,
  };
  _encounters.push(enc);
  return enc;
}

export async function setStage(id, stage) {
  await delay(80);
  const e = _encounters.find((x) => x.id === id);
  if (!e) throw new Error("Encounter not found");
  if (!ED_STAGES.includes(stage)) throw new Error("Unknown stage");
  e.stage = stage;
  return e;
}

export async function setAcuity(id, acuity) {
  await delay(80);
  const e = _encounters.find((x) => x.id === id);
  if (!e) throw new Error("Encounter not found");
  e.acuity = Number(acuity);
  return e;
}

export async function disposePatient(id, disposition) {
  await delay();
  const e = _encounters.find((x) => x.id === id);
  if (!e) throw new Error("Encounter not found");
  if (!DISPOSITIONS.includes(disposition)) throw new Error("Unknown disposition");
  e.disposition = disposition;
  e.disposedAt = new Date().toISOString();
  return e;
}

export function edWaitMinutes(arrivedAt) {
  return Math.max(0, Math.round((Date.now() - new Date(arrivedAt)) / 60000));
}
