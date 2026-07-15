// Radiology service.
// Lifecycle: requested -> scheduled -> performed -> reported.
// A report can be flagged with an urgent finding, which feeds the Alerts screen.
// Each modality is priced, so completed studies become billable charges.
//
// Technical parameters (contrast, sequence, probe, etc.) are captured at the
// "performed" stage via setTechnicalParams() — modality-specific, optional,
// and shown on the modality-dedicated screens (Ultrasound/CT/MRI) without
// forcing every study through the same generic fields.
//
// In-memory now; async API shaped for a later D1 swap.

const delay = (ms = 110) => new Promise((r) => setTimeout(r, ms));

export const MODALITIES = [
  { code: "CXR", name: "Chest X-ray", modality: "General Radiography", price: 4000 },
  { code: "AXR", name: "Abdominal X-ray", modality: "General Radiography", price: 4500 },
  { code: "SKUL", name: "Skull X-ray", modality: "General Radiography", price: 4000 },
  { code: "SPINE", name: "Spine X-ray", modality: "General Radiography", price: 5000 },
  { code: "LIMB", name: "Limb X-ray (extremity)", modality: "General Radiography", price: 3500 },
  { code: "PELV", name: "Pelvis X-ray", modality: "General Radiography", price: 4500 },

  { code: "USG-ABD", name: "Abdominal Ultrasound", modality: "Ultrasound", price: 8000 },
  { code: "USG-OBS", name: "Obstetric Ultrasound", modality: "Ultrasound", price: 9000 },
  { code: "USG-PEL", name: "Pelvic Ultrasound", modality: "Ultrasound", price: 8000 },
  { code: "USG-THY", name: "Thyroid Ultrasound", modality: "Ultrasound", price: 7000 },
  { code: "USG-DOP", name: "Doppler Ultrasound (Vascular)", modality: "Ultrasound", price: 12000 },
  { code: "USG-ECHO", name: "Echocardiogram", modality: "Ultrasound", price: 15000 },
  { code: "USG-FAST", name: "FAST Scan (Trauma)", modality: "Ultrasound", price: 6000 },
  { code: "USG-BRST", name: "Breast Ultrasound", modality: "Ultrasound", price: 8500 },

  { code: "CT-HEAD", name: "CT Head", modality: "CT", price: 35000 },
  { code: "CT-CHEST", name: "CT Chest", modality: "CT", price: 45000 },
  { code: "CT-ABD", name: "CT Abdomen & Pelvis", modality: "CT", price: 55000 },
  { code: "CT-SPINE", name: "CT Spine", modality: "CT", price: 48000 },
  { code: "CT-ANGIO", name: "CT Angiography", modality: "CT", price: 75000 },
  { code: "CT-KUB", name: "CT KUB (Renal Stone Protocol)", modality: "CT", price: 42000 },

  { code: "MRI-BRAIN", name: "MRI Brain", modality: "MRI", price: 90000 },
  { code: "MRI-SPINE", name: "MRI Spine", modality: "MRI", price: 95000 },
  { code: "MRI-KNEE", name: "MRI Knee", modality: "MRI", price: 85000 },
  { code: "MRI-ABD", name: "MRI Abdomen", modality: "MRI", price: 110000 },
  { code: "MRI-PELV", name: "MRI Pelvis", modality: "MRI", price: 105000 },
  { code: "MRCP", name: "MRCP (Biliary/Pancreatic)", modality: "MRI", price: 120000 },

  { code: "MAMMO", name: "Mammography", modality: "Mammography", price: 15000 },
];

// Modality-specific technical parameter fields, captured when a study is
// marked performed. Purely descriptive — informs the report, not billed
// separately.
export const TECH_FIELDS = {
  Ultrasound: [
    { key: "probe", label: "Probe", options: ["Curvilinear 3.5MHz", "Linear 7.5MHz", "Phased array 2.5MHz", "Endocavitary"] },
    { key: "doppler", label: "Doppler used", options: ["None", "Colour Doppler", "Spectral Doppler", "Power Doppler"] },
  ],
  CT: [
    { key: "contrast", label: "Contrast", options: ["None", "Oral", "IV", "Oral + IV"] },
    { key: "slice", label: "Slice thickness", options: ["1mm", "2.5mm", "5mm"] },
  ],
  MRI: [
    { key: "sequence", label: "Sequence protocol", options: ["T1/T2 standard", "T1/T2 + FLAIR", "DWI + ADC", "Contrast-enhanced (Gadolinium)"] },
    { key: "tesla", label: "Field strength", options: ["1.5T", "3T"] },
  ],
};

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
    tech: {},
  },
  {
    id: "r2",
    accession: "RAD-000502",
    patientId: "p2",
    patientName: "Eze, Chibuike",
    hospitalNo: "H001002",
    code: "USG-ABD",
    name: "Abdominal Ultrasound",
    modality: "Ultrasound",
    status: "performed",
    priority: "routine",
    requestedAt: new Date(Date.now() - 200 * 60000).toISOString(),
    report: null,
    urgentFinding: false,
    tech: { probe: "Curvilinear 3.5MHz", doppler: "None" },
  },
  {
    id: "r3",
    accession: "RAD-000503",
    patientId: "p3",
    patientName: "Bello, Fatima",
    hospitalNo: "H001003",
    code: "CT-HEAD",
    name: "CT Head",
    modality: "CT",
    status: "scheduled",
    priority: "urgent",
    requestedAt: new Date(Date.now() - 40 * 60000).toISOString(),
    report: null,
    urgentFinding: false,
    tech: {},
  },
];

export function getModality(code) {
  return MODALITIES.find((m) => m.code === code) || null;
}

export function modalitiesIn(group) {
  return MODALITIES.filter((m) => m.modality === group);
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
    tech: {},
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

export async function markPerformed(id, tech = {}) {
  await delay(80);
  const s = _studies.find((x) => x.id === id);
  if (!s) throw new Error("Study not found");
  if (s.status !== "scheduled") throw new Error("Schedule the study first.");
  s.status = "performed";
  s.tech = { ...s.tech, ...tech };
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
