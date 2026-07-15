// Operations service — support services.
// Three domains sharing one service module:
//  - CSSD: sterilization cycles (load -> sterilizing -> ready -> issued)
//  - Biomedical: equipment register with maintenance status
//  - Fleet: vehicles/ambulances with availability and service due
// In-memory now; async API shaped for a later D1 swap.

const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));

// ---------- CSSD ----------
export const CSSD_STAGES = ["loaded", "sterilizing", "ready", "issued"];
export const CSSD_LABELS = {
  loaded: "Loaded",
  sterilizing: "Sterilizing",
  ready: "Ready",
  issued: "Issued",
};

let _cssdSeq = 20;
const _cssd = [
  { id: "c1", batch: "CSSD-0021", contents: "Theatre set A (major)", autoclave: "Autoclave 1", stage: "sterilizing", startedAt: new Date(Date.now() - 25 * 60000).toISOString() },
  { id: "c2", batch: "CSSD-0020", contents: "Delivery pack x6", autoclave: "Autoclave 2", stage: "ready", startedAt: new Date(Date.now() - 70 * 60000).toISOString() },
];

export async function listCssd() {
  await delay();
  return [..._cssd].sort((a, b) => CSSD_STAGES.indexOf(a.stage) - CSSD_STAGES.indexOf(b.stage));
}

export async function createCssdBatch({ contents, autoclave }) {
  await delay();
  if (!contents || !contents.trim()) throw new Error("Enter batch contents.");
  _cssdSeq += 1;
  const batch = {
    id: "c" + Date.now(),
    batch: "CSSD-" + String(_cssdSeq).padStart(4, "0"),
    contents: contents.trim(),
    autoclave: autoclave || "Autoclave 1",
    stage: "loaded",
    startedAt: new Date().toISOString(),
  };
  _cssd.unshift(batch);
  return batch;
}

export async function advanceCssd(id) {
  await delay(80);
  const b = _cssd.find((x) => x.id === id);
  if (!b) throw new Error("Batch not found");
  const i = CSSD_STAGES.indexOf(b.stage);
  if (i < CSSD_STAGES.length - 1) b.stage = CSSD_STAGES[i + 1];
  return b;
}

// ---------- Biomedical ----------
export const EQUIP_STATUS = {
  operational: { label: "Operational", color: "#4A6329", bg: "#E6EFDF" },
  "due-service": { label: "Service due", color: "#8A5A17", bg: "#FBF0DC" },
  "under-repair": { label: "Under repair", color: "#B0281F", bg: "#F7E4E2" },
};

const _equipment = [
  { id: "eq1", tag: "BME-1001", name: "Ventilator", location: "ICU", status: "operational", lastService: "2026-05-10" },
  { id: "eq2", tag: "BME-1002", name: "Defibrillator", location: "Emergency", status: "due-service", lastService: "2025-12-02" },
  { id: "eq3", tag: "BME-1003", name: "Anaesthesia machine", location: "Theatre 1", status: "operational", lastService: "2026-06-01" },
  { id: "eq4", tag: "BME-1004", name: "Dialysis machine", location: "Renal Unit", status: "under-repair", lastService: "2026-04-18" },
  { id: "eq5", tag: "BME-1005", name: "Infusion pump", location: "Medical Ward A", status: "operational", lastService: "2026-06-20" },
];

export async function listEquipment() {
  await delay();
  return [..._equipment];
}

export async function setEquipmentStatus(id, status) {
  await delay(80);
  const e = _equipment.find((x) => x.id === id);
  if (!e) throw new Error("Equipment not found");
  if (!EQUIP_STATUS[status]) throw new Error("Unknown status");
  e.status = status;
  if (status === "operational") e.lastService = new Date().toISOString().slice(0, 10);
  return e;
}

// ---------- Fleet ----------
export const VEHICLE_STATUS = {
  available: { label: "Available", color: "#4A6329", bg: "#E6EFDF" },
  "on-call": { label: "On call", color: "#8A5A17", bg: "#FBF0DC" },
  "out-of-service": { label: "Out of service", color: "#B0281F", bg: "#F7E4E2" },
};

const _fleet = [
  { id: "v1", reg: "LAG-441-XA", type: "Ambulance", model: "Toyota HiAce", status: "available", serviceDue: "2026-09-01" },
  { id: "v2", reg: "LAG-442-XA", type: "Ambulance", model: "Mercedes Sprinter", status: "on-call", serviceDue: "2026-08-14" },
  { id: "v3", reg: "LAG-118-BC", type: "Utility", model: "Toyota Hilux", status: "available", serviceDue: "2026-07-20" },
  { id: "v4", reg: "LAG-119-BC", type: "Ambulance", model: "Toyota HiAce", status: "out-of-service", serviceDue: "2026-07-16" },
];

export async function listFleet() {
  await delay();
  return [..._fleet];
}

export async function setVehicleStatus(id, status) {
  await delay(80);
  const v = _fleet.find((x) => x.id === id);
  if (!v) throw new Error("Vehicle not found");
  if (!VEHICLE_STATUS[status]) throw new Error("Unknown status");
  v.status = status;
  return v;
}

// Feed for Alerts later: equipment under repair or vehicles out of service.
export async function listOpsIssues() {
  await delay(60);
  const eq = _equipment.filter((e) => e.status === "under-repair").map((e) => ({ kind: "equipment", ...e }));
  const veh = _fleet.filter((v) => v.status === "out-of-service").map((v) => ({ kind: "vehicle", ...v }));
  return [...eq, ...veh];
}
