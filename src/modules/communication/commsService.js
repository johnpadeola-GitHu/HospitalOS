// Communication hub — SMS, WhatsApp, email and in-app notification
// delivery. A message queue and log, matching the pattern of a real
// notifications engine: template-driven, multi-channel, with delivery
// status per message.
//
// PHASE 1 LIVE, module 40. HONEST LIMITATION, not new: there's no real
// SMS/WhatsApp/email gateway wired up — that's a separate, already-known
// open item. The old version faked a "delivered" status via a client-side
// timer 1.2 seconds after composing; that trick doesn't translate to a
// real backend (a Worker doesn't keep running after it returns a
// response). Messages persist for real now, but genuinely stay "queued"
// until a real gateway exists to report actual delivery status — more
// honest than simulating success.

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

export const CHANNELS = ["SMS", "WhatsApp", "Email", "In-app"];
export const TEMPLATES = [
  { key: "appt-reminder", label: "Appointment reminder", channel: "SMS" },
  { key: "result-ready", label: "Result ready", channel: "WhatsApp" },
  { key: "payment-received", label: "Payment received", channel: "Email" },
  { key: "discharge-summary", label: "Discharge summary", channel: "Email" },
  { key: "new-booking", label: "New online booking", channel: "In-app" },
  { key: "low-stock", label: "Low stock alert", channel: "In-app" },
];
export const STATUS_TONE = { delivered: "good", queued: "info", failed: "bad", sent: "warn" };

export async function listMessages({ channel = "all", status = "all", query = "" } = {}) {
  const params = new URLSearchParams();
  if (channel !== "all") params.set("channel", channel);
  if (status !== "all") params.set("status", status);
  if (query.trim()) params.set("query", query.trim());
  const qs = params.toString();
  return apiCall(`/communication/messages${qs ? `?${qs}` : ""}`);
}

export async function compose({ channel, recipient, templateKey, message }) {
  return apiCall("/communication/messages", { method: "POST", body: { channel, recipient, templateKey, message } });
}

export async function commsSummary() {
  return apiCall("/communication/summary");
}
