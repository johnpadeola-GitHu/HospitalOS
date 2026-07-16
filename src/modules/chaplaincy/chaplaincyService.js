// Chaplaincy & Pastoral Care.
// Visit requests from patients or their families, logged and routed to a
// chaplain. Deliberately small and simple — this is a support service, not
// a clinical one, and does not need the depth of a clinical workflow.
// In-memory now; async API shaped for a later D1 swap.

import { record, AUDIT_ACTIONS } from "../../lib/audit";

const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));

export const REQUEST_STATUS = ["requested", "scheduled", "completed"];
export const STATUS_TONE = { requested: "warn", scheduled: "info", completed: "good" };

let _seq = 100;
function ref() { _seq += 1; return "CHP-" + String(_seq).padStart(4, "0"); }

const _requests = [
  { id: "c1", ref: "CHP-0101", patientName: "Bello, Fatima", hospitalNo: "H001003", ward: "Surgical Ward A", faithPreference: "Islamic", status: "requested", requestedAt: new Date().toISOString(), notes: "Family requested a visit before surgery tomorrow." },
];

export async function listRequests({ status = "all" } = {}) {
  await delay();
  return _requests
    .filter((r) => (status === "all" ? true : r.status === status))
    .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
}

export async function requestVisit({ patientName, hospitalNo, ward, faithPreference, notes, actor }) {
  await delay();
  if (!patientName || !patientName.trim()) throw new Error("Enter the patient.");
  const r = { id: "c" + Date.now(), ref: ref(), patientName: patientName.trim(), hospitalNo: hospitalNo || "\u2014", ward: ward || "\u2014", faithPreference: faithPreference || "No preference stated", status: "requested", requestedAt: new Date().toISOString(), notes: notes || "" };
  _requests.unshift(r);
  record({ actor, action: AUDIT_ACTIONS.CREATE, entity: "chaplaincy-visit", entityId: r.ref, detail: `Visit requested \u2014 ${r.patientName}`, severity: "info" });
  return r;
}

export async function advanceRequest(id, actor) {
  await delay(80);
  const r = _requests.find((x) => x.id === id);
  if (!r) throw new Error("Request not found");
  const idx = REQUEST_STATUS.indexOf(r.status);
  if (idx >= REQUEST_STATUS.length - 1) throw new Error("Already completed.");
  r.status = REQUEST_STATUS[idx + 1];
  record({ actor, action: AUDIT_ACTIONS.UPDATE, entity: "chaplaincy-visit", entityId: r.ref, detail: `${r.status} \u2014 ${r.patientName}`, severity: "info" });
  return r;
}

export async function chaplaincySummary() {
  await delay(60);
  return {
    requested: _requests.filter((r) => r.status === "requested").length,
    scheduled: _requests.filter((r) => r.status === "scheduled").length,
  };
}
