// Online bookings — patient-facing appointment requests arriving from the
// hospital website. An accepted booking checks the patient into today's
// outpatient queue through the same entry point staff use, so the queue
// board and this list never disagree about who is expected.
// In-memory now; async API shaped for a later D1 swap.

import { CLINICS, checkInVisit } from "../outpatient/visitService";
import { listPatients } from "../patients/patientService";

export { CLINICS };

const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));
const iso = (m) => new Date(Date.now() + m * 60000).toISOString();

export const BOOKING_STATUS = ["requested", "confirmed", "declined", "checked-in"];
export const STATUS_TONE = { requested: "warn", confirmed: "info", declined: "bad", "checked-in": "good" };

let _seq = 200;
const _bookings = [
  { id: "bk1", ref: "BKG-0201", name: "Funmilayo Adeyemi", phone: "0803 555 0177", clinic: "General Outpatient (GOPD)", requestedDate: new Date().toISOString().slice(0, 10), note: "Persistent cough for 2 weeks", status: "requested", at: iso(-40), patientId: null },
  { id: "bk2", ref: "BKG-0202", name: "Chinelo Eze", phone: "0806 555 0212", clinic: "Obstetrics & Gynaecology", requestedDate: new Date().toISOString().slice(0, 10), note: "Antenatal booking", status: "confirmed", at: iso(-190), patientId: null },
  { id: "bk3", ref: "BKG-0203", name: "Eze, Chibuike", phone: "0806 555 0198", clinic: "Internal Medicine", requestedDate: new Date().toISOString().slice(0, 10), note: "Follow-up review", status: "requested", at: iso(-15), patientId: "p2" },
];

function ref() { _seq += 1; return "BKG-" + String(_seq).padStart(4, "0"); }

export async function listBookings({ status = "all" } = {}) {
  await delay();
  return _bookings
    .filter((b) => (status === "all" ? true : b.status === status))
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .map((b) => ({ ...b }));
}

// Public-facing request — no auth, matches a patient by phone/name if possible.
export async function requestBooking({ name, phone, clinic, requestedDate, note }) {
  await delay();
  if (!name || !name.trim()) throw new Error("Enter your name.");
  if (!phone || !phone.trim()) throw new Error("Enter a phone number.");
  if (!CLINICS.includes(clinic)) throw new Error("Choose a clinic.");
  const existing = await listPatients({ query: name, status: "all" });
  const b = {
    id: "bk" + Date.now(), ref: ref(), name: name.trim(), phone: phone.trim(),
    clinic, requestedDate: requestedDate || new Date().toISOString().slice(0, 10),
    note: (note || "").trim(), status: "requested", at: new Date().toISOString(),
    patientId: existing[0]?.id || null,
  };
  _bookings.unshift(b);
  return b;
}

export async function confirmBooking(id) {
  await delay(80);
  const b = _bookings.find((x) => x.id === id);
  if (!b) throw new Error("Not found");
  if (b.status !== "requested") throw new Error("Only requested bookings can be confirmed.");
  b.status = "confirmed";
  return b;
}

export async function declineBooking(id) {
  await delay(80);
  const b = _bookings.find((x) => x.id === id);
  if (!b) throw new Error("Not found");
  b.status = "declined";
  return b;
}

// Check in — the seam into Outpatient. Requires a matched patient record.
export async function checkInBooking(id) {
  await delay();
  const b = _bookings.find((x) => x.id === id);
  if (!b) throw new Error("Not found");
  if (b.status !== "confirmed") throw new Error("Confirm the booking before checking in.");
  if (!b.patientId) throw new Error("No matching patient record — register the patient first.");
  const patients = await listPatients({ status: "all" });
  const p = patients.find((x) => x.id === b.patientId);
  if (!p) throw new Error("Matched patient record not found.");
  await checkInVisit({ patientId: p.id, patientName: `${p.lastName}, ${p.firstName}`, hospitalNo: p.hospitalNo, clinic: b.clinic });
  b.status = "checked-in";
  return b;
}

export async function bookingsSummary() {
  await delay(60);
  return {
    total: _bookings.length,
    requested: _bookings.filter((b) => b.status === "requested").length,
    confirmed: _bookings.filter((b) => b.status === "confirmed").length,
    checkedIn: _bookings.filter((b) => b.status === "checked-in").length,
    today: _bookings.filter((b) => b.requestedDate === new Date().toISOString().slice(0, 10)).length,
  };
}
