// Oncology service.
// A cancer patient registry with diagnosis + TNM stage, on a treatment pathway.
// Chemotherapy patients have a cycle count (n of total); a patient overdue for
// their next cycle feeds the Alerts screen. Reuses patientService identity.
// In-memory now; async API shaped for a later D1 swap.

const delay = (ms = 110) => new Promise((r) => setTimeout(r, ms));

export const CANCER_SITES = [
  "Breast", "Cervical", "Prostate", "Colorectal", "Liver",
  "Lung", "Lymphoma", "Leukaemia", "Head & Neck", "Ovarian",
];

export const STAGES = ["I", "II", "III", "IV"];

export const MODALITIES = ["Chemotherapy", "Radiotherapy", "Surgery", "Palliative"];

export const PATHWAY_STATUS = ["active", "remission", "palliative"];
export const STATUS_LABELS = { active: "Active treatment", remission: "Remission", palliative: "Palliative" };

let _seq = 0;
const _patients = [
  {
    id: "onc1",
    ref: "ONC-0001",
    patientName: "Okafor, Adaeze",
    hospitalNo: "H001001",
    site: "Breast",
    stage: "II",
    modality: "Chemotherapy",
    status: "active",
    cyclesDone: 2,
    cyclesTotal: 6,
    nextCycle: daysFromNow(-2), // overdue by 2 days
    at: iso(-40 * 24 * 60),
  },
  {
    id: "onc2",
    ref: "ONC-0002",
    patientName: "Eze, Chibuike",
    hospitalNo: "H001002",
    site: "Prostate",
    stage: "III",
    modality: "Radiotherapy",
    status: "active",
    cyclesDone: 0,
    cyclesTotal: 0,
    nextCycle: null,
    at: iso(-12 * 24 * 60),
  },
];

function iso(minsAgo) {
  return new Date(Date.now() + minsAgo * 60000).toISOString();
}
function daysFromNow(d) {
  return new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);
}
function refNo() {
  _seq += 1;
  return "ONC-" + String(_seq + 2).padStart(4, "0");
}

export async function listOncology({ status = "all" } = {}) {
  await delay();
  return _patients
    .filter((p) => (status === "all" ? true : p.status === status))
    .map((p) => ({ ...p, overdue: isOverdue(p) }))
    .sort((a, b) => Number(b.overdue) - Number(a.overdue));
}

function isOverdue(p) {
  if (p.modality !== "Chemotherapy" || p.status !== "active" || !p.nextCycle) return false;
  if (p.cyclesDone >= p.cyclesTotal) return false;
  return new Date(p.nextCycle) < new Date(new Date().toISOString().slice(0, 10));
}

export async function registerOncology({ patientName, hospitalNo, site, stage, modality, cyclesTotal }) {
  await delay();
  if (!patientName || !patientName.trim()) throw new Error("Enter the patient.");
  if (!CANCER_SITES.includes(site)) throw new Error("Choose a primary site.");
  if (!STAGES.includes(stage)) throw new Error("Choose a stage.");
  if (!MODALITIES.includes(modality)) throw new Error("Choose a treatment modality.");
  const isChemo = modality === "Chemotherapy";
  const total = isChemo ? parseInt(cyclesTotal, 10) || 6 : 0;
  _seq++;
  const p = {
    id: "onc" + Date.now(),
    ref: refNo(),
    patientName: patientName.trim(),
    hospitalNo: hospitalNo || "\u2014",
    site,
    stage,
    modality,
    status: "active",
    cyclesDone: 0,
    cyclesTotal: total,
    nextCycle: isChemo ? daysFromNow(0) : null,
    at: new Date().toISOString(),
  };
  _patients.unshift(p);
  return p;
}

// Record a completed chemo cycle; schedule the next 21 days out.
export async function recordCycle(id) {
  await delay(80);
  const p = _patients.find((x) => x.id === id);
  if (!p) throw new Error("Patient not found");
  if (p.modality !== "Chemotherapy") throw new Error("Only chemotherapy patients have cycles.");
  if (p.cyclesDone >= p.cyclesTotal) throw new Error("All cycles already completed.");
  p.cyclesDone += 1;
  if (p.cyclesDone >= p.cyclesTotal) {
    p.nextCycle = null;
    p.status = "remission";
  } else {
    p.nextCycle = daysFromNow(21);
  }
  return p;
}

export async function setStatus(id, status) {
  await delay(80);
  const p = _patients.find((x) => x.id === id);
  if (!p) throw new Error("Patient not found");
  if (!PATHWAY_STATUS.includes(status)) throw new Error("Unknown status");
  p.status = status;
  if (status !== "active") p.nextCycle = null;
  return p;
}

// Feed for Alerts: chemo patients overdue for their next cycle.
export async function listOverdueChemo() {
  await delay(60);
  return _patients.filter(isOverdue).map((p) => ({
    patientName: p.patientName,
    ref: p.ref,
    site: p.site,
    cyclesDone: p.cyclesDone,
    cyclesTotal: p.cyclesTotal,
    nextCycle: p.nextCycle,
  }));
}
