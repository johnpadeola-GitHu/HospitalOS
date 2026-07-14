// Specialist clinics service.
// Backs the single "Specialist clinics" nav item with a department registry
// (the 11 medical + 10 surgical specialties from the architecture) and a
// referral flow: a patient is referred to a department, then seen. This is the
// home for Geriatrics, Cardiology, Neurosurgery, etc. as filterable departments
// rather than separate nav items.
// In-memory now; async API shaped for a later D1 swap.

const delay = (ms = 110) => new Promise((r) => setTimeout(r, ms));

export const DEPARTMENTS = [
  // Medical specialties
  { code: "CARD", name: "Cardiology", kind: "Medical" },
  { code: "ENDO", name: "Endocrinology", kind: "Medical" },
  { code: "GAST", name: "Gastroenterology", kind: "Medical" },
  { code: "NEPH", name: "Nephrology", kind: "Medical" },
  { code: "NEUR", name: "Neurology", kind: "Medical" },
  { code: "PULM", name: "Pulmonology", kind: "Medical" },
  { code: "RHEU", name: "Rheumatology", kind: "Medical" },
  { code: "DERM", name: "Dermatology", kind: "Medical" },
  { code: "INFD", name: "Infectious Diseases", kind: "Medical" },
  { code: "PSYC", name: "Psychiatry", kind: "Medical" },
  { code: "GERI", name: "Geriatrics", kind: "Medical" },
  // Surgical specialties
  { code: "NSUR", name: "Neurosurgery", kind: "Surgical" },
  { code: "CTSU", name: "Cardiothoracic Surgery", kind: "Surgical" },
  { code: "ORTH", name: "Orthopaedics", kind: "Surgical" },
  { code: "PLAS", name: "Plastic Surgery", kind: "Surgical" },
  { code: "UROL", name: "Urology", kind: "Surgical" },
  { code: "ENT", name: "ENT", kind: "Surgical" },
  { code: "MAXF", name: "Maxillofacial Surgery", kind: "Surgical" },
  { code: "OPHT", name: "Ophthalmology", kind: "Surgical" },
  { code: "VASC", name: "Vascular Surgery", kind: "Surgical" },
  { code: "PSUR", name: "Paediatric Surgery", kind: "Surgical" },
];

export const REFERRAL_STATUSES = ["referred", "scheduled", "seen"];
export const STATUS_LABELS = { referred: "Referred", scheduled: "Scheduled", seen: "Seen" };

export function getDepartment(code) {
  return DEPARTMENTS.find((d) => d.code === code) || null;
}

let _refSeq = 0;
const _referrals = [
  {
    id: "s1",
    ref: "REF-0001",
    patientName: "Eze, Chibuike",
    hospitalNo: "H001002",
    deptCode: "CARD",
    reason: "Exertional chest pain, for review",
    status: "referred",
    at: new Date(Date.now() - 120 * 60000).toISOString(),
  },
  {
    id: "s2",
    ref: "REF-0002",
    patientName: "Okafor, Adaeze",
    hospitalNo: "H001001",
    deptCode: "GERI",
    reason: "Falls assessment",
    status: "scheduled",
    at: new Date(Date.now() - 300 * 60000).toISOString(),
  },
];

function refNo() {
  _refSeq += 1;
  return "REF-" + String(_refSeq + 2).padStart(4, "0");
}

// Registry with a live count of open referrals per department.
export async function listDepartments() {
  await delay();
  const open = {};
  for (const r of _referrals) {
    if (r.status !== "seen") open[r.deptCode] = (open[r.deptCode] || 0) + 1;
  }
  return DEPARTMENTS.map((d) => ({ ...d, openReferrals: open[d.code] || 0 }));
}

export async function listReferrals({ deptCode = "all", status = "all" } = {}) {
  await delay();
  return _referrals
    .filter((r) => (deptCode === "all" ? true : r.deptCode === deptCode))
    .filter((r) => (status === "all" ? true : r.status === status))
    .map((r) => ({ ...r, deptName: getDepartment(r.deptCode)?.name || r.deptCode }))
    .sort((a, b) => new Date(b.at) - new Date(a.at));
}

export async function createReferral({ patientName, hospitalNo, deptCode, reason }) {
  await delay();
  if (!patientName || !patientName.trim()) throw new Error("Enter the patient.");
  if (!getDepartment(deptCode)) throw new Error("Choose a department.");
  if (!reason || !reason.trim()) throw new Error("Enter a reason for referral.");
  _refSeq++;
  const r = {
    id: "s" + Date.now(),
    ref: refNo(),
    patientName: patientName.trim(),
    hospitalNo: hospitalNo || "\u2014",
    deptCode,
    reason: reason.trim(),
    status: "referred",
    at: new Date().toISOString(),
  };
  _referrals.unshift(r);
  return r;
}

export async function advanceReferral(id) {
  await delay(80);
  const r = _referrals.find((x) => x.id === id);
  if (!r) throw new Error("Referral not found");
  const i = REFERRAL_STATUSES.indexOf(r.status);
  if (i < REFERRAL_STATUSES.length - 1) r.status = REFERRAL_STATUSES[i + 1];
  return r;
}
