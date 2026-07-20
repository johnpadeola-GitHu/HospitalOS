// Patient data service — the Master Patient Index every other clinical
// module resolves against via PatientPicker.
//
// PHASE 1 LIVE, and a real gap closed here: this file was still fully
// in-memory even after lab, pharmacy, radiology, and billing had all been
// migrated and were correctly expecting patients to exist in the real
// database — a patient "registered" through the UI was never actually
// written anywhere those modules could see it. Fixed now: every function
// here calls the real deployed Worker.

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

export async function listPatients({ query = "", status = "all" } = {}) {
  const params = new URLSearchParams();
  if (status !== "all") params.set("status", status);
  if (query.trim()) params.set("query", query.trim());
  const qs = params.toString();
  return apiCall(`/patients${qs ? `?${qs}` : ""}`);
}

export async function getPatient(id) {
  const all = await listPatients({});
  return all.find((p) => p.id === id) || null;
}

export async function registerPatient(input) {
  return apiCall("/patients", {
    method: "POST",
    body: {
      firstName: input.firstName?.trim(), lastName: input.lastName?.trim(),
      sex: input.sex, dob: input.dob, phone: (input.phone || "").trim(),
    },
  });
}

export async function admitPatient(id, { ward, bed }) {
  return apiCall(`/patients/${encodeURIComponent(id)}/admit`, { method: "PATCH", body: { ward, bed } });
}

export async function transferPatient(id, { ward, bed }) {
  return apiCall(`/patients/${encodeURIComponent(id)}/transfer`, { method: "PATCH", body: { ward, bed } });
}

export async function dischargePatient(id) {
  return apiCall(`/patients/${encodeURIComponent(id)}/discharge`, { method: "PATCH" });
}

export const WARDS = [
  "Medical Ward A",
  "Medical Ward B",
  "Surgical Ward A",
  "Surgical Ward B",
  "ICU",
  "HDU",
  "Paediatric Ward",
  "Maternity Ward",
  "Private Suite",
  "Isolation Unit",
];

export function ageFromDob(dob) {
  if (!dob) return "";
  const d = new Date(dob);
  const diff = Date.now() - d.getTime();
  return Math.abs(new Date(diff).getUTCFullYear() - 1970);
}
