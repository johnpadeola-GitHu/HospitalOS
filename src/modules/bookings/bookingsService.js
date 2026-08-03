// Online bookings — patient-facing appointment requests. An accepted
// booking checks the patient into today's outpatient queue through the
// same entry point staff use, so the queue board and this list never
// disagree about who is expected.
//
// PHASE 1 LIVE, module 36. NOTE: requestBooking is authenticated (called
// from the staff Bookings screen) — a genuine public-facing widget with
// no login would need its own tenant-identification design, which this
// migration doesn't build; today's app only ever calls this from within
// the logged-in app, so this matches actual behaviour honestly.

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

export const CLINICS = [
  "General Outpatient (GOPD)", "Family Medicine", "Internal Medicine", "Paediatrics",
  "Obstetrics & Gynaecology", "Surgical Outpatient", "Specialist Clinics",
];
export const BOOKING_STATUS = ["requested", "confirmed", "declined", "checked-in"];
export const STATUS_TONE = { requested: "warn", confirmed: "info", declined: "bad", "checked-in": "good" };

export async function listBookings({ status = "all", query = "" } = {}) {
  const params = new URLSearchParams({ status });
  if (query.trim()) params.set("query", query.trim());
  return apiCall(`/bookings?${params.toString()}`);
}

export async function requestBooking({ name, phone, clinic, requestedDate, note }) {
  return apiCall("/bookings", { method: "POST", body: { name, phone, clinic, requestedDate, note } });
}

export async function confirmBooking(id) {
  return apiCall(`/bookings/${encodeURIComponent(id)}/confirm`, { method: "PATCH" });
}

export async function declineBooking(id) {
  return apiCall(`/bookings/${encodeURIComponent(id)}/decline`, { method: "PATCH" });
}

export async function checkInBooking(id) {
  return apiCall(`/bookings/${encodeURIComponent(id)}/check-in`, { method: "PATCH" });
}

export async function bookingsSummary() {
  return apiCall("/bookings/summary");
}
