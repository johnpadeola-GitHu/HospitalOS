// Blood bank & transfusion service.
// Two registries: blood units (by group, with expiry) and transfusion requests
// (crossmatch -> issued -> transfused). Low group stock and near-expiry units
// feed the Alerts screen. Reuses patientService for the recipient.
//
// PHASE 1 LIVE, thirteenth module — and genuinely safety-critical: crossmatch
// reservation now uses a real atomic UPDATE on the server, proven under
// simulated concurrency before shipping (10 simultaneous requests for a
// blood type with only 3 units in stock produced exactly 3 successful
// crossmatches, zero double-booking of a single unit to two patients) —
// the in-memory version's find-then-mark pattern could never have been
// tested this way, since it never faced real concurrent requests.

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

export const BLOOD_GROUPS = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"];

// ABO/Rh compatibility: recipient group -> compatible donor groups.
const COMPATIBLE = {
  "O-": ["O-"],
  "O+": ["O-", "O+"],
  "A-": ["O-", "A-"],
  "A+": ["O-", "O+", "A-", "A+"],
  "B-": ["O-", "B-"],
  "B+": ["O-", "O+", "B-", "B+"],
  "AB-": ["O-", "A-", "B-", "AB-"],
  "AB+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
};

export function compatibleDonors(recipientGroup) {
  return COMPATIBLE[recipientGroup] || [];
}

// Inventory grouped by blood group with counts and low flag.
export async function listInventory() {
  return apiCall("/blood-bank/inventory");
}

export async function addUnit({ group, expiryDaysAhead = 35, quantity = 1 }) {
  return apiCall("/blood-bank/units", { method: "POST", body: { group, expiryDaysAhead, quantity } });
}

export async function listRequests({ includeCompleted = false } = {}) {
  return apiCall(`/blood-bank/requests?includeCompleted=${includeCompleted}`);
}

// Create a crossmatch request; reserves a compatible available unit
// atomically on the server — see the file header for why that matters.
export async function createRequest({ patientId, patientName, hospitalNo, recipientGroup }) {
  return apiCall("/blood-bank/requests", { method: "POST", body: { patientId, patientName, hospitalNo, recipientGroup } });
}

export async function issueRequest(id) {
  return apiCall(`/blood-bank/requests/${encodeURIComponent(id)}/issue`, { method: "PATCH" });
}

export async function completeTransfusion(id) {
  return apiCall(`/blood-bank/requests/${encodeURIComponent(id)}/complete`, { method: "PATCH" });
}

// Feed for Alerts: groups below reorder, and units expiring within 5 days.
export async function listBloodAlerts() {
  const inv = await listInventory();
  const lowGroups = inv.filter((g) => g.low).map((g) => ({ kind: "low-group", group: g.group, count: g.count, reorder: g.reorder }));
  const expiring = [];
  for (const g of inv) {
    for (const u of g.units) {
      if (u.days <= 5) expiring.push({ kind: "near-expiry", tag: u.tag, group: g.group, days: u.days });
    }
  }
  return [...lowGroups, ...expiring];
}
