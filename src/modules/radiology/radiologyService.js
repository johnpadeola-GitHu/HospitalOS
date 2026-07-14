// Radiology service.
// Lifecycle: requested -> scheduled -> performed -> reported.
// A report can be flagged with an urgent finding, which feeds the Alerts screen.
// Each modality is priced, so completed studies become billable charges.
// In-memory now; async API shaped for a later D1 swap.

const delay = (ms = 110) => new Promise((r) => setTimeout(r, ms));

export const MODALITIES = [
  { code: "CXR", name: "Chest X-ray", modality: "General Radiography", price: 4000 },
  { code: "AXR", name: "Abdominal X-ray", modality: "General Radiography", price: 4500 },
  { code: "USG-ABD", name: "Abdominal Ultrasound", modality: "Ultrasound", price: 8000 },
  { code: "USG-OBS", name: "Obstetric Ultrasound", modality: "Ultrasound", price: 9000 },
  { code: "CT-HEAD", name: "CT Head", modality: "CT", price: 35000 },
  { code: "CT-CHEST", name: "CT Chest", modality: "CT", price: 45000 },
  { code: "MRI-BRAIN", name: "MRI Brain", modality: "MRI", price: 90000 },
  { code: "MAMMO", name: "Mammography", modality: "Mammography", price: 15000 },
];

export const STATUSES = ["requested", "scheduled", "performed", "reported"];
export const STATUS_LABELS = {
  requested: "Requested",
  scheduled: "Scheduled",
  performed: "Performed",
  reported: "Reported",
};

let _accession = 500;
const _studies = [
  {
    id: "r1",
    accession: "RAD-000501",
    patientId: "p1",
    patientName: "Okafor, Adaeze",
    hospitalNo: "H001001",
    code: "CXR",
    name: "Chest X-ray",
    modality: "General Radiography",
    status: "requested",
    priority: "routine",
    requestedAt: new Date(Date.now() - 55 * 60000).toISOString(),
    report: null,
    urgentFinding: false,
  },
];

export function getModality(code) {
  return MODALITIES.find((m) => m.code === code) || null;
}

function accessionNo() {
  _accession += 1;
  return "RAD-" + String(_accession).padStart(6, "0");
}

export async function listStudies({ status = "all", query = "" } = {}) {
  await delay();
  const q = query.trim().toLowerCase();
  return _studies
    .filter((s) => (status === "all" ? true : s.status === status))
    .filter((s) => {
      if (!q) return true;
      return (
        s.patientName.toLowerCase().includes(q) ||
        s.hospitalNo.toLowerCase().includes(q) ||
        s.accession.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
}

export async function createStudy({ patientId, patientName, hospitalNo, code, priority = "routine" }) {
  await delay();
  const m = getModality(code);
  if (!m) throw new Error("Unknown study.");
  const study = {
    id: "r" + Date.now(),
    accession: accessionNo(),
    patientId,
    patientName,
    hospitalNo,
    code: m.code,
    name: m.name,
    modality: m.modality,
    status: "requested",
    priority,
    requestedAt: new Date().toISOString(),
    report: null,
    urgentFinding: false,
  };
  _studies.unshift(study);
  return study;
}

export async function scheduleStudy(id) {
  await delay(80);
  const s = _studies.find((x) => x.id === id);
  if (!s) throw new Error("Study not found");
  if (s.status !== "requested") throw new Error("Study already scheduled.");
  s.status = "scheduled";
  return s;
}

export async function markPerformed(id) {
  await delay(80);
  const s = _studies.find((x) => x.id === id);
  if (!s) throw new Error("Study not found");
  if (s.status !== "scheduled") throw new Error("Schedule the study first.");
  s.status = "performed";
  return s;
}

export async function fileReport(id, { report, urgentFinding }) {
  await delay();
  const s = _studies.find((x) => x.id === id);
  if (!s) throw new Error("Study not found");
  if (s.status !== "performed" && s.status !== "reported") {
    throw new Error("Study must be performed before reporting.");
  }
  if (!report || !report.trim()) throw new Error("Enter a report.");
  s.report = report.trim();
  s.urgentFinding = !!urgentFinding;
  s.status = "reported";
  s.reportedAt = new Date().toISOString();
  return s;
}

// Feed for Alerts: reported studies with an urgent finding.
export async function listUrgentStudies() {
  await delay(60);
  return _studies.filter((s) => s.status === "reported" && s.urgentFinding);
}

// Feed for Billing: performed or reported studies are billable.
export async function listBillableStudies() {
  await delay(60);
  return _studies
    .filter((s) => s.status === "performed" || s.status === "reported")
    .map((s) => {
      const m = getModality(s.code);
      return {
        patientId: s.patientId,
        patientName: s.patientName,
        hospitalNo: s.hospitalNo,
        source: "Radiology",
        description: s.name,
        reference: s.accession,
        amount: m ? m.price : 0,
        at: s.requestedAt,
      };
    });
}
