// Instruments gateway service.
//
// Manages the analyzer registry and HL7 message log, and posts analyzer results
// into the Laboratory module.
//
// SCOPE: a production gateway needs a server listening on TCP/MLLP for real HL7
// traffic — Worker/backend territory, not a browser. What runs here is the
// management + monitoring layer plus a faithful simulation of the message flow.
// When a real listener lands it calls postResultMessage() with parsed HL7, and
// everything downstream (log, lab, alerts) is unchanged.

import { listOrders, enterResults, getTest } from "../lab/labService";

const delay = (ms = 110) => new Promise((r) => setTimeout(r, ms));
const iso = (m) => new Date(Date.now() + m * 60000).toISOString();

export const INSTRUMENT_STATUS = ["online", "idle", "offline", "error"];
export const STATUS_TONE = { online: "good", idle: "info", offline: "muted", error: "bad" };

const _instruments = [
  { id: "in1", name: "Sysmex XN-1000", vendor: "Sysmex", type: "Haematology analyzer", ae: "XN1000_A", host: "10.20.4.11:6661", protocol: "HL7 v2.5.1 / MLLP", handles: ["FBC"], status: "online", lastSeen: iso(-2), messages: 1284, errors: 3 },
  { id: "in2", name: "Cobas c311", vendor: "Roche", type: "Clinical chemistry analyzer", ae: "COBAS_C311", host: "10.20.4.12:6661", protocol: "HL7 v2.5.1 / MLLP", handles: ["UE", "LFT", "GLU"], status: "online", lastSeen: iso(-1), messages: 3120, errors: 11 },
  { id: "in3", name: "BD BACTEC FX", vendor: "BD", type: "Blood culture system", ae: "BACTEC_FX", host: "10.20.4.13:6661", protocol: "HL7 v2.5.1 / MLLP", handles: [], status: "idle", lastSeen: iso(-46), messages: 402, errors: 0 },
  { id: "in4", name: "Mindray BC-5150", vendor: "Mindray", type: "Haematology analyzer", ae: "BC5150_B", host: "10.20.4.14:6661", protocol: "HL7 v2.4 / MLLP", handles: ["FBC"], status: "error", lastSeen: iso(-180), messages: 640, errors: 27 },
  { id: "in5", name: "Abbott Architect", vendor: "Abbott", type: "Immunoassay analyzer", ae: "ARCHITECT_1", host: "10.20.4.15:6661", protocol: "HL7 v2.5.1 / MLLP", handles: [], status: "offline", lastSeen: iso(-1440), messages: 0, errors: 0 },
];

let _msgSeq = 4000;
const _messages = [
  { id: "m1", at: iso(-2), instrument: "Cobas c311", type: "ORU^R01", accession: "LAB-000241", status: "ack", detail: "Result message accepted" },
  { id: "m2", at: iso(-6), instrument: "Sysmex XN-1000", type: "ORU^R01", accession: "LAB-000238", status: "ack", detail: "Result message accepted" },
  { id: "m3", at: iso(-14), instrument: "Mindray BC-5150", type: "ORU^R01", accession: "LAB-000237", status: "nack", detail: "MSH-9 unsupported trigger event" },
  { id: "m4", at: iso(-22), instrument: "Cobas c311", type: "QRY^Q02", accession: "\u2014", status: "ack", detail: "Worklist query" },
];

export async function listInstruments() { await delay(); return _instruments.map((i) => ({ ...i })); }
export async function listMessages({ limit = 25 } = {}) {
  await delay(60);
  return [..._messages].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, limit);
}

export async function setInstrumentStatus(id, status) {
  await delay(80);
  const i = _instruments.find((x) => x.id === id);
  if (!i) throw new Error("Instrument not found");
  if (!INSTRUMENT_STATUS.includes(status)) throw new Error("Unknown status");
  i.status = status;
  if (status === "online") i.lastSeen = new Date().toISOString();
  return i;
}

export async function pendingForInstrument(id) {
  await delay(60);
  const inst = _instruments.find((x) => x.id === id);
  if (!inst) throw new Error("Instrument not found");
  const orders = await listOrders({ status: "collected" });
  return orders.filter((o) => inst.handles.includes(o.testCode));
}

function simulateValues(testCode) {
  const test = getTest(testCode);
  if (!test) return null;
  const out = {};
  for (const a of test.analytes) {
    if (a.qualitative) { out[a.key] = Math.random() < 0.3 ? "Positive" : "Negative"; continue; }
    const lo = a.low ?? 1, hi = a.high ?? 10, span = hi - lo;
    const roll = Math.random();
    let v;
    if (roll < 0.12 && a.critHigh != null) v = a.critHigh + span * 0.05;
    else if (roll < 0.2 && a.critLow != null) v = Math.max(0, a.critLow - span * 0.02);
    else if (roll < 0.35) v = hi + span * 0.1;
    else v = lo + Math.random() * span;
    out[a.key] = String(Math.round(v * 10) / 10);
  }
  return out;
}

export function buildHl7(order, values) {
  const test = getTest(order.testCode);
  const ts = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
  const lines = [
    `MSH|^~\\&|${order.department}|HOSPITALOS|LIS|HOSPITALOS|${ts}||ORU^R01|${order.accession}|P|2.5.1`,
    `PID|1||${order.hospitalNo}||${order.patientName.replace(", ", "^")}`,
    `OBR|1||${order.accession}|${test.code}^${test.name}|||${ts}`,
  ];
  test.analytes.forEach((a, i) => {
    lines.push(`OBX|${i + 1}|NM|${a.key.toUpperCase()}^${a.label}||${values[a.key]}|${a.unit}|${a.low}-${a.high}|||F`);
  });
  return lines.join("\n");
}

// THE GATEWAY SEAM — a real MLLP listener calls this with parsed HL7.
export async function postResultMessage({ instrumentId, orderId, values }) {
  await delay();
  const inst = _instruments.find((x) => x.id === instrumentId);
  if (!inst) throw new Error("Instrument not found");
  if (inst.status === "offline") throw new Error(`${inst.name} is offline.`);

  const orders = await listOrders({ status: "collected" });
  const order = orders.find((o) => o.id === orderId);
  if (!order) throw new Error("Order is not awaiting results.");
  if (!inst.handles.includes(order.testCode)) throw new Error(`${inst.name} does not run ${order.testName}.`);

  const vals = values || simulateValues(order.testCode);
  await enterResults(order.id, vals);  // same entry point as manual typing

  inst.messages += 1;
  inst.lastSeen = new Date().toISOString();
  if (inst.status !== "online") inst.status = "online";

  _msgSeq += 1;
  const msg = { id: "m" + _msgSeq, at: new Date().toISOString(), instrument: inst.name, type: "ORU^R01", accession: order.accession, status: "ack", detail: "Result message accepted" };
  _messages.unshift(msg);
  return { order, values: vals, hl7: buildHl7(order, vals), message: msg };
}

export async function gatewaySummary() {
  await delay(60);
  return {
    total: _instruments.length,
    online: _instruments.filter((i) => i.status === "online").length,
    errored: _instruments.filter((i) => i.status === "error").length,
    offline: _instruments.filter((i) => i.status === "offline").length,
    messages24h: _instruments.reduce((s, i) => s + i.messages, 0),
    errors24h: _instruments.reduce((s, i) => s + i.errors, 0),
  };
}

export async function listInstrumentIssues() {
  await delay(60);
  return _instruments.filter((i) => i.status === "error" || i.status === "offline")
    .map((i) => ({ id: i.id, name: i.name, ae: i.ae, status: i.status, errors: i.errors }));
}
