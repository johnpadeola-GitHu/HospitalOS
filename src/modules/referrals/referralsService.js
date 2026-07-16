// Referral system — the structural gap for a tertiary/teaching referral
// hospital. UCH-Ibadan-scale institutions exist within a referral network:
// primary and secondary facilities refer patients UP for specialist care,
// and this hospital refers patients DOWN or ACROSS for follow-up, step-down
// care, or a service it does not offer. Neither direction previously had a
// structured record.
//
// Two flows:
//   INBOUND  — another facility refers a patient to us
//   OUTBOUND — we refer a patient to another facility
//
// An accepted inbound referral checks the patient into today's Outpatient
// queue through the same checkInVisit() Online Bookings uses — a real
// integration, not a parallel list.
//
// In-memory now; async API shaped for a later D1 swap.

import { record, AUDIT_ACTIONS } from "../../lib/audit";
import { checkInVisit, CLINICS } from "../outpatient/visitService";
import { listPatients } from "../patients/patientService";

const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));
const iso = (m) => new Date(Date.now() + m * 60000).toISOString();

export { CLINICS };

export const REFERRAL_STATUS = ["received", "accepted", "declined", "checked-in", "sent", "acknowledged"];
export const STATUS_TONE = {
  received: "warn", sent: "warn", accepted: "info", acknowledged: "good",
  declined: "bad", "checked-in": "good",
};

// Nigerian facility tiers — matters for triage: a referral from a PHC with no
// diagnostic capacity reads differently from one already worked up at a
// secondary facility.
export const FACILITY_TIERS = [
  "Primary Health Centre (PHC)",
  "Secondary — General Hospital",
  "Secondary — Specialist Clinic",
  "Tertiary — Teaching/Referral Hospital",
  "Private Hospital/Clinic",
];

export const URGENCY = ["Routine", "Urgent", "Emergency"];

let _seq = 100;
function ref() { _seq += 1; return "REF-" + String(_seq).padStart(5, "0"); }

const _inbound = [
  {
    id: "in1", ref: "REF-00101", direction: "inbound",
    fromFacility: "Eleyele Primary Health Centre", fromTier: "Primary Health Centre (PHC)",
    patientName: "Yusuf, Kabiru", patientPhone: "0805 555 0142", age: 34, sex: "M",
    reason: "Suspected acute appendicitis \u2014 no theatre capacity at referring facility",
    urgency: "Urgent", clinic: "General Surgery", status: "received",
    receivedAt: iso(-120), patientId: null,
  },
  {
    id: "in2", ref: "REF-00102", direction: "inbound",
    fromFacility: "Oyo State Hospital, Ring Road", fromTier: "Secondary — General Hospital",
    patientName: "Eze, Chibuike", patientPhone: "0806 555 0198", age: 41, sex: "M",
    reason: "Persistent hyperglycaemia despite management \u2014 endocrinology referral",
    urgency: "Routine", clinic: "Internal Medicine", status: "accepted",
    receivedAt: iso(-2880), patientId: "p2",
  },
];

const _outbound = [
  {
    id: "out1", ref: "REF-00088", direction: "outbound",
    toFacility: "Jericho Nursing Home (step-down)", toTier: "Private Hospital/Clinic",
    patientName: "Okafor, Adaeze", patientPhone: "\u2014",
    reason: "Post-operative wound care and physiotherapy \u2014 stepping down from surgical ward",
    urgency: "Routine", status: "sent", sentAt: iso(-4320), patientId: "p1",
  },
];

export async function listReferrals({ direction = "all", status = "all", query = "" } = {}) {
  await delay();
  const all = [..._inbound, ..._outbound];
  const q = query.trim().toLowerCase();
  return all
    .filter((r) => (direction === "all" ? true : r.direction === direction))
    .filter((r) => (status === "all" ? true : r.status === status))
    .filter((r) => !q || r.patientName.toLowerCase().includes(q) || r.ref.toLowerCase().includes(q) ||
      (r.fromFacility || r.toFacility || "").toLowerCase().includes(q))
    .sort((a, b) => new Date(b.receivedAt || b.sentAt) - new Date(a.receivedAt || a.sentAt));
}

/** A facility outside our network refers a patient to us. */
export async function receiveReferral({ fromFacility, fromTier, patientName, patientPhone, age, sex, reason, urgency, clinic, actor }) {
  await delay();
  if (!fromFacility || !fromFacility.trim()) throw new Error("Enter the referring facility.");
  if (!patientName || !patientName.trim()) throw new Error("Enter the patient's name.");
  if (!reason || !reason.trim()) throw new Error("Enter the reason for referral.");
  if (!CLINICS.includes(clinic)) throw new Error("Choose a receiving clinic.");
  const existing = await listPatients({ query: patientName, status: "all" });
  const r = {
    id: "in" + Date.now(), ref: ref(), direction: "inbound",
    fromFacility: fromFacility.trim(), fromTier: fromTier || FACILITY_TIERS[0],
    patientName: patientName.trim(), patientPhone: patientPhone || "\u2014",
    age: age || null, sex: sex || "\u2014", reason: reason.trim(),
    urgency: urgency || "Routine", clinic, status: "received",
    receivedAt: new Date().toISOString(), patientId: existing[0]?.id || null,
  };
  _inbound.unshift(r);
  record({ actor, action: AUDIT_ACTIONS.CREATE, entity: "referral-inbound", entityId: r.ref, detail: `Referral received from ${r.fromFacility} \u2014 ${r.patientName}`, severity: "info" });
  return r;
}

export async function acceptReferral(id, actor) {
  await delay(80);
  const r = _inbound.find((x) => x.id === id);
  if (!r) throw new Error("Referral not found");
  if (r.status !== "received") throw new Error("Only a newly received referral can be accepted.");
  r.status = "accepted";
  record({ actor, action: AUDIT_ACTIONS.UPDATE, entity: "referral-inbound", entityId: r.ref, detail: `Accepted \u2014 ${r.patientName}`, severity: "info" });
  return r;
}

export async function declineReferral(id, { reason, actor }) {
  await delay(80);
  const r = _inbound.find((x) => x.id === id);
  if (!r) throw new Error("Referral not found");
  if (r.status !== "received") throw new Error("Only a newly received referral can be declined.");
  if (!reason || !reason.trim()) throw new Error("A decline reason is required \u2014 the referring facility needs to know why.");
  r.status = "declined";
  r.declineReason = reason.trim();
  record({ actor, action: AUDIT_ACTIONS.UPDATE, entity: "referral-inbound", entityId: r.ref, detail: `Declined \u2014 ${reason.trim()}`, severity: "warn" });
  return r;
}

/** Accepted referral, patient physically arrives — checks into today's clinic queue. */
export async function checkInReferral(id, actor) {
  await delay();
  const r = _inbound.find((x) => x.id === id);
  if (!r) throw new Error("Referral not found");
  if (r.status !== "accepted") throw new Error("Accept the referral before checking the patient in.");
  if (!r.patientId) throw new Error("No matching patient record \u2014 register the patient first, then retry.");
  const patients = await listPatients({ status: "all" });
  const p = patients.find((x) => x.id === r.patientId);
  if (!p) throw new Error("Matched patient record not found.");
  await checkInVisit({ patientId: p.id, patientName: `${p.lastName}, ${p.firstName}`, hospitalNo: p.hospitalNo, clinic: r.clinic });
  r.status = "checked-in";
  record({ actor, action: AUDIT_ACTIONS.CLINICAL, entity: "referral-inbound", entityId: r.ref, detail: `Checked in \u2014 ${r.patientName}`, severity: "info" });
  return r;
}

/** We refer a patient out to another facility. */
export async function sendReferral({ toFacility, toTier, patientId, patientName, reason, urgency, actor }) {
  await delay();
  if (!toFacility || !toFacility.trim()) throw new Error("Enter the receiving facility.");
  if (!patientName || !patientName.trim()) throw new Error("Select the patient.");
  if (!reason || !reason.trim()) throw new Error("Enter the reason for referral.");
  const r = {
    id: "out" + Date.now(), ref: ref(), direction: "outbound",
    toFacility: toFacility.trim(), toTier: toTier || FACILITY_TIERS[0],
    patientId, patientName, patientPhone: "\u2014",
    reason: reason.trim(), urgency: urgency || "Routine",
    status: "sent", sentAt: new Date().toISOString(),
  };
  _outbound.unshift(r);
  record({ actor, action: AUDIT_ACTIONS.CREATE, entity: "referral-outbound", entityId: r.ref, detail: `Referred out to ${r.toFacility} \u2014 ${r.patientName}`, severity: "info" });
  return r;
}

export async function acknowledgeOutboundReferral(id, actor) {
  await delay(80);
  const r = _outbound.find((x) => x.id === id);
  if (!r) throw new Error("Referral not found");
  if (r.status !== "sent") throw new Error("Only a sent referral can be acknowledged.");
  r.status = "acknowledged";
  record({ actor, action: AUDIT_ACTIONS.UPDATE, entity: "referral-outbound", entityId: r.ref, detail: `Receiving facility acknowledged \u2014 ${r.patientName}`, severity: "info" });
  return r;
}

export async function referralsSummary() {
  await delay(60);
  return {
    inboundPending: _inbound.filter((r) => r.status === "received").length,
    inboundAccepted: _inbound.filter((r) => r.status === "accepted").length,
    inboundEmergency: _inbound.filter((r) => r.status === "received" && r.urgency === "Emergency").length,
    outboundAwaiting: _outbound.filter((r) => r.status === "sent").length,
    totalThisMonth: _inbound.length + _outbound.length,
  };
}
