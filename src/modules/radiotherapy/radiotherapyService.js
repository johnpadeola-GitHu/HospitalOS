// Radiotherapy service.
// A radiotherapy course delivers a number of fractions on a linear
// accelerator. Tracks fractions delivered vs prescribed.
//
// PHASE 1 LIVE, module 33.

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

export const INTENT = ["Curative", "Palliative", "Adjuvant"];

export async function listCourses() {
  return apiCall("/radiotherapy/courses");
}

export async function createCourse({ patientName, hospitalNo, site, intent, dosePerFraction, fractionsPlanned, machine }) {
  return apiCall("/radiotherapy/courses", { method: "POST", body: { patientName, hospitalNo, site, intent, dosePerFraction, fractionsPlanned, machine } });
}

export async function deliverFraction(id) {
  return apiCall(`/radiotherapy/courses/${encodeURIComponent(id)}/fraction`, { method: "PATCH" });
}
