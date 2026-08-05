// Point of care testing service.
//
// POCT results are generated and read at the bedside (glucometers, urine
// dipsticks, rapid antigen tests) rather than sent to the central lab, so
// there is deliberately no ordered -> collected -> resulted -> verified
// lifecycle here — the result exists the moment the test is performed.

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

export const POCT_FLAGS = [
  { key: "normal", label: "Normal" },
  { key: "low", label: "Low" },
  { key: "high", label: "High" },
  { key: "abnormal", label: "Abnormal" },
];

export async function listPoctResults({ query = "" } = {}) {
  const params = new URLSearchParams();
  if (query.trim()) params.set("query", query.trim());
  const qs = params.toString();
  return apiCall(`/poct/results${qs ? `?${qs}` : ""}`);
}

export async function listPoctTestTypes() {
  return apiCall("/poct/test-types");
}

export async function recordPoctResult({ patientId, testType, value, unit, flag, notes }) {
  return apiCall("/poct/results", {
    method: "POST",
    body: { patientId, testType, value, unit, flag, notes },
  });
}
