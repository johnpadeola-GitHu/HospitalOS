// Communication hub — SMS, WhatsApp, email and in-app notification delivery.
// A delivery queue and log, matching the pattern of a real notifications
// engine: template-driven, multi-channel, with delivery status per message.
// In-memory now; async API shaped for a later D1/gateway swap.

const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));
const iso = (m) => new Date(Date.now() + m * 60000).toISOString();

export const CHANNELS = ["SMS", "WhatsApp", "Email", "In-app"];
export const TEMPLATES = [
  { key: "appt-reminder", label: "Appointment reminder", channel: "SMS" },
  { key: "result-ready", label: "Result ready", channel: "WhatsApp" },
  { key: "payment-received", label: "Payment received", channel: "Email" },
  { key: "discharge-summary", label: "Discharge summary", channel: "Email" },
  { key: "new-booking", label: "New online booking", channel: "In-app" },
  { key: "low-stock", label: "Low stock alert", channel: "In-app" },
];

let _seq = 8700;
const _messages = [
  { id: "n1", ref: "NOT-8701", channel: "WhatsApp", recipient: "Chinelo Eze", template: "New online booking", message: "Chinelo Eze requested Full Blood Count via the website.", status: "delivered", sent: iso(-30), delivered: iso(-29) },
  { id: "n2", ref: "NOT-8702", channel: "SMS", recipient: "Ibrahim Bello", template: "Result ready", message: "Your test results are ready for collection.", status: "delivered", sent: iso(-95), delivered: iso(-94) },
  { id: "n3", ref: "NOT-8703", channel: "SMS", recipient: "Adaeze Okafor", template: "Appointment reminder", message: "Reminder: dialysis session tomorrow at 09:00.", status: "delivered", sent: iso(-190), delivered: iso(-189) },
  { id: "n4", ref: "NOT-8704", channel: "Email", recipient: "Funmilayo Adeyemi", template: "Payment received", message: "Payment of \u20a68,500 received. Thank you.", status: "queued", sent: null, delivered: null },
  { id: "n5", ref: "NOT-8705", channel: "Email", recipient: "Joseph Achebe", template: "Discharge summary", message: "Your discharge summary is attached as a PDF.", status: "failed", sent: iso(-320), delivered: null },
  { id: "n6", ref: "NOT-8706", channel: "In-app", recipient: "Pharmacy team", template: "Low stock alert", message: "Amoxicillin below reorder level.", status: "delivered", sent: iso(-15), delivered: iso(-15) },
];

export const STATUS_TONE = { delivered: "good", queued: "info", failed: "bad", sent: "warn" };

function ref() { _seq += 1; return "NOT-" + _seq; }

export async function listMessages({ channel = "all", status = "all", query = "" } = {}) {
  await delay();
  const q = query.trim().toLowerCase();
  return _messages
    .filter((m) => (channel === "all" ? true : m.channel === channel))
    .filter((m) => (status === "all" ? true : m.status === status))
    .filter((m) => !q || m.recipient.toLowerCase().includes(q) || m.message.toLowerCase().includes(q))
    .sort((a, b) => (b.sent || "0").localeCompare(a.sent || "0"));
}

export async function compose({ channel, recipient, templateKey, message }) {
  await delay();
  if (!CHANNELS.includes(channel)) throw new Error("Choose a channel.");
  if (!recipient || !recipient.trim()) throw new Error("Enter a recipient.");
  if (!message || !message.trim()) throw new Error("Enter a message.");
  const tpl = TEMPLATES.find((t) => t.key === templateKey);
  const m = {
    id: "n" + Date.now(), ref: ref(), channel, recipient: recipient.trim(),
    template: tpl?.label || "Custom", message: message.trim(),
    status: "queued", sent: null, delivered: null,
  };
  _messages.unshift(m);
  // Simulate near-immediate delivery for the demo.
  setTimeout(() => { m.status = "delivered"; m.sent = new Date().toISOString(); m.delivered = new Date().toISOString(); }, 1200);
  return m;
}

export async function commsSummary() {
  await delay(60);
  const byChannel = {};
  for (const m of _messages) byChannel[m.channel] = (byChannel[m.channel] || 0) + 1;
  return {
    total: _messages.length,
    delivered: _messages.filter((m) => m.status === "delivered").length,
    queued: _messages.filter((m) => m.status === "queued").length,
    failed: _messages.filter((m) => m.status === "failed").length,
    byChannel: Object.entries(byChannel).map(([channel, n]) => ({ channel, n })),
  };
}
