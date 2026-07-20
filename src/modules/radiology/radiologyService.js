import { priceFor } from "../../engines/pricing";
// Radiology service.
// Lifecycle: requested -> scheduled -> performed -> reported.
// A report can be flagged with an urgent finding, which feeds the Alerts screen.
// Each modality is priced, so completed studies become billable charges.
//
// PHASE 1 LIVE: fourth module migrated to the real deployed Worker, after
// patients, lab, and pharmacy. MODALITIES/TECH_FIELDS stay entirely
// client-side — static reference data, not tenant data, same reasoning as
// the lab test catalogue.

const API_URL = "https://hospitalos-api.johnpadeola.workers.dev";

function authHeaders() {
  const token = localStorage.getItem("hospitalos_session_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiCall(path, { method = "GET", body } = {}) {
  let res, data;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: body ? JSON.stringify(body) : undefined,
    });
    data = await res.json();
  } catch {
    throw new Error("Couldn't reach the server. Check your connection and try again.");
  }
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

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

export function getModality(code) {
  return MODALITIES.find((m) => m.code === code) || null;
}

export function modalitiesIn(group) {
  return MODALITIES.filter((m) => m.modality === group);
}

export async function listStudies({ status = "all", query = "" } = {}) {
  const params = new URLSearchParams();
  if (status !== "all") params.set("status", status);
  if (query.trim()) params.set("query", query.trim());
  const qs = params.toString();
  return apiCall(`/radiology/studies${qs ? `?${qs}` : ""}`);
}

export async function createStudy({ patientId, code, priority = "routine" }) {
  const m = getModality(code);
  if (!m) throw new Error("Unknown study.");
  return apiCall("/radiology/studies", {
    method: "POST",
    body: { patientId, code: m.code, name: m.name, modality: m.modality, priority },
  });
}

export async function scheduleStudy(id) {
  return apiCall(`/radiology/studies/${encodeURIComponent(id)}/schedule`, { method: "PATCH" });
}

export async function markPerformed(id, tech = {}) {
  return apiCall(`/radiology/studies/${encodeURIComponent(id)}/perform`, { method: "PATCH", body: tech });
}

export async function fileReport(id, { report, urgentFinding }) {
  return apiCall(`/radiology/studies/${encodeURIComponent(id)}/report`, { method: "PATCH", body: { report, urgentFinding } });
}

// Feed for Alerts: reported studies with an urgent finding.
export async function listUrgentStudies() {
  const studies = await listStudies({ status: "reported" });
  return studies.filter((s) => s.urgentFinding);
}

// Feed for Billing: performed or reported studies are billable.
export async function listBillableStudies() {
  const [performed, reported] = await Promise.all([listStudies({ status: "performed" }), listStudies({ status: "reported" })]);
  return [...performed, ...reported]
    .map((s) => {
      const m = getModality(s.code);
      return {
        patientId: s.patientId,
        patientName: s.patientName,
        hospitalNo: s.hospitalNo,
        source: "Radiology",
        description: s.name,
        reference: s.accession,
        amount: m ? priceFor("radiology", s.code, m.price) : 0,
        at: s.requestedAt,
      };
    });
}
