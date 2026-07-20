// Theatre & day surgery service.
// A surgical case moves: scheduled -> in-theatre -> recovery -> completed.
// Each procedure is priced, so completed (or in-progress) cases are billable.
//
// PHASE 1 LIVE: eighth module migrated. PROCEDURES/THEATRES/SURGEONS stay
// entirely client-side — static reference data, same reasoning as every
// other catalogue in this app.

import { priceFor } from "../../engines/pricing";

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

export const THEATRES = ["Theatre 1", "Theatre 2", "Theatre 3", "Day Surgery Suite"];

export const PROCEDURES = [
  { code: "APPEND", name: "Appendectomy", price: 180000 },
  { code: "CS", name: "Caesarean Section", price: 250000 },
  { code: "HERNIA", name: "Hernia Repair", price: 160000 },
  { code: "LAPCHOLE", name: "Laparoscopic Cholecystectomy", price: 420000 },
  { code: "ORIF", name: "ORIF (Fracture Fixation)", price: 380000 },
  { code: "CATARACT", name: "Cataract Extraction", price: 120000 },
  { code: "D&C", name: "Dilation & Curettage", price: 90000 },
  { code: "TAH", name: "Total Abdominal Hysterectomy", price: 350000 },
];

export const CASE_STAGES = ["scheduled", "in-theatre", "recovery", "completed"];
export const STAGE_LABELS = {
  scheduled: "Scheduled",
  "in-theatre": "In theatre",
  recovery: "Recovery",
  completed: "Completed",
};

export const SURGEONS = ["Mr. Okonkwo", "Miss Balogun", "Mr. Danjuma", "Prof. Adeyemi"];

export function getProcedure(code) {
  return PROCEDURES.find((p) => p.code === code) || null;
}

export async function listCases({ includeCompleted = false } = {}) {
  return apiCall(`/theatre/cases?includeCompleted=${includeCompleted}`);
}

export async function scheduleCase({ patientId, procCode, theatre, surgeon, scheduledFor }) {
  const proc = getProcedure(procCode);
  if (!proc) throw new Error("Choose a procedure.");
  return apiCall("/theatre/cases", {
    method: "POST",
    body: { patientId, procCode: proc.code, procName: proc.name, theatre, surgeon, scheduledFor },
  });
}

export async function advanceCase(id) {
  return apiCall(`/theatre/cases/${encodeURIComponent(id)}/advance`, { method: "PATCH" });
}

// Feed for Billing: cases that have entered theatre (in-theatre or beyond)
// are billable for the procedure fee.
export async function listBillableProcedures() {
  const cases = await apiCall("/theatre/billable-procedures");
  return cases.map((c) => {
    const proc = getProcedure(c.procCode);
    return {
      patientId: c.patientId,
      patientName: c.patientName,
      hospitalNo: c.hospitalNo,
      source: "Theatre",
      description: proc?.name || c.procName,
      reference: c.reference,
      amount: proc ? priceFor("theatre", c.procCode, proc.price) : 0,
      at: c.at,
    };
  });
}
