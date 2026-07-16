// Medical Social Services.
// Discharge planning and indigent patient welfare — a real department at
// most Nigerian teaching hospitals, distinct from clinical discharge itself.
// A social work referral tracks the non-clinical barriers to a safe
// discharge: no caregiver at home, no funds to settle a bill, no transport.
// In-memory now; async API shaped for a later D1 swap.

import { record, AUDIT_ACTIONS } from "../../lib/audit";

const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));

export const REFERRAL_REASONS = [
  "Discharge planning — no caregiver at home", "Indigent patient — unable to settle bill",
  "Safeguarding concern", "Transport/logistics support", "Long-term care placement", "Other psychosocial support",
];
export const CASE_STATUS = ["open", "in-progress", "resolved", "referred-out"];
export const STATUS_TONE = { open: "warn", "in-progress": "info", resolved: "good", "referred-out": "muted" };

let _seq = 700;
function ref() { _seq += 1; return "SWK-" + String(_seq).padStart(5, "0"); }

const _cases = [
  {
    id: "sw1", ref: "SWK-00701", patientName: "Yusuf, Kabiru", hospitalNo: "H001007",
    reason: "Indigent patient — unable to settle bill", status: "in-progress",
    openedAt: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10),
    assignedTo: "Social Worker C. Nwosu", notes: "Applying for hospital indigent fund support; awaiting committee review.",
  },
];

export async function listCases({ status = "all", query = "" } = {}) {
  await delay();
  const q = query.trim().toLowerCase();
  return _cases
    .filter((c) => (status === "all" ? true : c.status === status))
    .filter((c) => !q || c.patientName.toLowerCase().includes(q) || c.ref.toLowerCase().includes(q))
    .sort((a, b) => b.openedAt.localeCompare(a.openedAt));
}

export async function openCase({ patientName, hospitalNo, reason, notes, actor }) {
  await delay();
  if (!patientName || !patientName.trim()) throw new Error("Enter the patient.");
  if (!REFERRAL_REASONS.includes(reason)) throw new Error("Choose a reason.");
  const c = {
    id: "sw" + Date.now(), ref: ref(), patientName: patientName.trim(), hospitalNo: hospitalNo || "\u2014",
    reason, status: "open", openedAt: new Date().toISOString().slice(0, 10),
    assignedTo: actor?.name || "Unassigned", notes: notes || "",
  };
  _cases.unshift(c);
  record({ actor, action: AUDIT_ACTIONS.CREATE, entity: "social-work-case", entityId: c.ref, detail: `Opened \u2014 ${c.patientName}: ${reason}`, severity: "info" });
  return c;
}

export async function updateCase(id, { status, notes, actor }) {
  await delay(80);
  const c = _cases.find((x) => x.id === id);
  if (!c) throw new Error("Case not found");
  if (status && !CASE_STATUS.includes(status)) throw new Error("Unknown status.");
  if (status) c.status = status;
  if (notes != null) c.notes = notes;
  record({ actor, action: AUDIT_ACTIONS.UPDATE, entity: "social-work-case", entityId: c.ref, detail: `${status || "updated"} \u2014 ${c.patientName}`, severity: "info" });
  return c;
}

export async function socialWorkSummary() {
  await delay(60);
  return {
    open: _cases.filter((c) => c.status === "open").length,
    inProgress: _cases.filter((c) => c.status === "in-progress").length,
    resolved: _cases.filter((c) => c.status === "resolved").length,
  };
}
