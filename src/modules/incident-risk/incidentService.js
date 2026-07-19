// Incident & Risk Management.
// A genuine patient-safety gap: nothing in the system before this tracked
// adverse events, near-misses, or sentinel events as their own real
// records. The general audit trail logs WHO did WHAT for security purposes
// — it was never meant to carry a root-cause analysis or a corrective
// action with an owner and a due date, which is what real clinical
// incident reporting actually requires.
// In-memory now; async API shaped for a later D1 swap.

import { record, AUDIT_ACTIONS } from "../../lib/audit";

const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));

export const INCIDENT_TYPES = [
  "Medication error", "Patient fall", "Wrong-site/wrong-patient near-miss",
  "Equipment failure", "Healthcare-associated infection", "Communication failure",
  "Diagnostic error", "Other",
];

export const SEVERITY_LEVELS = ["Near-miss (no harm)", "Minor harm", "Moderate harm", "Severe harm", "Sentinel event"];
export const SEVERITY_TONE = {
  "Near-miss (no harm)": "muted", "Minor harm": "info", "Moderate harm": "warn",
  "Severe harm": "bad", "Sentinel event": "bad",
};
export const INCIDENT_STATUS = ["Reported", "Under investigation", "Corrective action", "Closed"];
export const STATUS_TONE = { Reported: "warn", "Under investigation": "info", "Corrective action": "info", Closed: "good" };

let _seq = 500;
function incRef() { _seq += 1; return "INC-" + String(_seq).padStart(5, "0"); }

const _incidents = [
  {
    id: "inc1", ref: "INC-00501", type: "Patient fall", severity: "Minor harm", status: "Under investigation",
    patientName: "Adewale, Tunde", hospitalNo: "H001004", ward: "Surgical Ward A",
    reportedBy: "Sr. Blessing Ade", reportedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    description: "Patient found on floor beside bed during night round; no rails raised. Minor bruising, no fracture on examination.",
    rootCause: "", correctiveAction: "", actionOwner: "", actionDueDate: null, closedAt: null,
  },
];

export async function listIncidents({ status = "all", severity = "all", query = "" } = {}) {
  await delay();
  const q = query.trim().toLowerCase();
  return _incidents
    .filter((i) => (status === "all" ? true : i.status === status))
    .filter((i) => (severity === "all" ? true : i.severity === severity))
    .filter((i) => !q || i.patientName.toLowerCase().includes(q) || i.ref.toLowerCase().includes(q) || i.type.toLowerCase().includes(q))
    .sort((a, b) => new Date(b.reportedAt) - new Date(a.reportedAt));
}

export async function reportIncident({ type, severity, patientName, hospitalNo, ward, description, actor }) {
  await delay();
  if (!INCIDENT_TYPES.includes(type)) throw new Error("Choose an incident type.");
  if (!SEVERITY_LEVELS.includes(severity)) throw new Error("Choose a severity level.");
  if (!description || !description.trim()) throw new Error("Describe what happened.");
  const inc = {
    id: "inc" + Date.now(), ref: incRef(), type, severity, status: "Reported",
    patientName: patientName || "\u2014", hospitalNo: hospitalNo || "\u2014", ward: ward || "\u2014",
    reportedBy: actor?.name || "Unknown", reportedAt: new Date().toISOString(),
    description: description.trim(), rootCause: "", correctiveAction: "", actionOwner: "", actionDueDate: null, closedAt: null,
  };
  _incidents.unshift(inc);
  const isSerious = severity === "Severe harm" || severity === "Sentinel event";
  record({
    actor, action: AUDIT_ACTIONS.CREATE, entity: "incident", entityId: inc.ref,
    detail: `${type} reported \u2014 ${severity}${inc.patientName !== "\u2014" ? `, ${inc.patientName}` : ""}`,
    severity: isSerious ? "warn" : "info",
  });
  return inc;
}

export async function updateInvestigation(id, { rootCause, correctiveAction, actionOwner, actionDueDate, actor }) {
  await delay(80);
  const inc = _incidents.find((x) => x.id === id);
  if (!inc) throw new Error("Incident not found");
  inc.rootCause = rootCause || inc.rootCause;
  inc.correctiveAction = correctiveAction || inc.correctiveAction;
  inc.actionOwner = actionOwner || inc.actionOwner;
  inc.actionDueDate = actionDueDate || inc.actionDueDate;
  inc.status = "Corrective action";
  record({ actor, action: AUDIT_ACTIONS.UPDATE, entity: "incident", entityId: inc.ref, detail: `Root cause and corrective action recorded \u2014 owner ${inc.actionOwner}`, severity: "info" });
  return inc;
}

export async function advanceStatus(id, status, actor) {
  await delay(80);
  const inc = _incidents.find((x) => x.id === id);
  if (!inc) throw new Error("Incident not found");
  if (!INCIDENT_STATUS.includes(status)) throw new Error("Unknown status.");
  if (status === "Closed" && !inc.correctiveAction) {
    throw new Error("A corrective action must be recorded before an incident can be closed.");
  }
  inc.status = status;
  if (status === "Closed") inc.closedAt = new Date().toISOString();
  record({ actor, action: AUDIT_ACTIONS.UPDATE, entity: "incident", entityId: inc.ref, detail: `${status} \u2014 ${inc.type}`, severity: "info" });
  return inc;
}

/** Severe harm and sentinel events feed the hospital-wide alert system \u2014
 * these are the two severities where a delay in review is itself a risk. */
export async function listSeriousOpenIncidents() {
  await delay(60);
  return _incidents.filter((i) => (i.severity === "Severe harm" || i.severity === "Sentinel event") && i.status !== "Closed");
}

export async function incidentSummary() {
  await delay(60);
  return {
    total: _incidents.length,
    open: _incidents.filter((i) => i.status !== "Closed").length,
    seriousOpen: _incidents.filter((i) => (i.severity === "Severe harm" || i.severity === "Sentinel event") && i.status !== "Closed").length,
    closedThisPeriod: _incidents.filter((i) => i.status === "Closed").length,
  };
}
