// Specialist clinics service.
// Backs the single "Specialist clinics" nav item with a department
// registry (11 medical + 10 surgical specialties) and a referral flow:
// a patient is referred to a department, then seen.
//
// PHASE 1 LIVE, module 32. DEPARTMENTS stays client-side — static
// reference data.

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

export const DEPARTMENTS = [
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

export async function listDepartments() {
  return apiCall("/specialties/departments");
}

export async function listReferrals({ deptCode = "all", status = "all" } = {}) {
  const params = new URLSearchParams();
  if (deptCode !== "all") params.set("deptCode", deptCode);
  if (status !== "all") params.set("status", status);
  const qs = params.toString();
  return apiCall(`/specialties/referrals${qs ? `?${qs}` : ""}`);
}

export async function createReferral({ patientName, hospitalNo, deptCode, reason }) {
  return apiCall("/specialties/referrals", { method: "POST", body: { patientName, hospitalNo, deptCode, reason } });
}

export async function advanceReferral(id) {
  return apiCall(`/specialties/referrals/${encodeURIComponent(id)}/advance`, { method: "PATCH" });
}
