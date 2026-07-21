// Instruments & devices gateway.
//
// The single interoperability hub for every machine the hospital connects:
// laboratory analyzers (HL7 v2/MLLP), imaging modalities (DICOM), printers
// (label/wristband/report — IPP, raw socket, or legacy serial), and
// radiotherapy delivery systems.
//
// PHASE 1 LIVE, module 47. Device configuration and message history now
// genuinely persist. SCOPE unchanged from the original honest
// documentation: a production gateway needs real network listeners
// (MLLP sockets, a DICOM SCP, a print daemon) — that's Worker/network
// territory beyond what a browser (or this migration) can do. What runs
// here is still the management + monitoring layer plus a faithful
// simulation of each protocol's message flow — every "receive" function
// calls the SAME real, already-migrated downstream functions
// (enterResults, scheduleStudy, deliverFraction) a live listener would
// call, alongside the new real device/message-log recording, so nothing
// downstream knows the difference between a simulated message and a real one.

import { listOrders, enterResults, getTest } from "../lab/labService";
import { listStudies, scheduleStudy, markPerformed as markStudyPerformed } from "../radiology/radiologyService";
import { listCourses, deliverFraction } from "../radiotherapy/radiotherapyService";

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

export const DEVICE_CATEGORIES = [
  { key: "analyzer", label: "Laboratory analyzer", protocol: "HL7 v2 / MLLP" },
  { key: "imaging", label: "Imaging modality", protocol: "DICOM" },
  { key: "radiotherapy", label: "Radiotherapy system", protocol: "DICOM-RT / proprietary" },
  { key: "printer", label: "Printer", protocol: "IPP / raw socket / serial" },
];

export const INSTRUMENT_STATUS = ["online", "idle", "offline", "error"];
export const STATUS_TONE = { online: "good", idle: "info", offline: "muted", error: "bad" };
export const PRINT_JOB_TYPES = ["wristband", "specimen-label", "lab-report", "discharge-summary", "invoice", "receipt", "ward-list"];

export async function listInstruments({ category = "all" } = {}) {
  return apiCall(`/instruments/devices?category=${category}`);
}

/**
 * Registers a device the browser genuinely detected (via WebUSB or Web
 * Serial — see deviceDetection.js) into the gateway. The vendor/product ID
 * and connection type are real, read from the browser API; everything else
 * is left for the person to fill in, since a browser can't know an
 * analyzer's network configuration just from its USB identity.
 */
export async function registerInstrument({ category, name, vendor, connectionType, vendorId, productId }) {
  return apiCall("/instruments/devices", { method: "POST", body: { category, name, vendor, connectionType, vendorId, productId } });
}

export async function listMessages({ limit = 30, category = "all" } = {}) {
  return apiCall(`/instruments/messages?limit=${limit}&category=${category}`);
}

export async function setInstrumentStatus(id, status) {
  return apiCall(`/instruments/devices/${encodeURIComponent(id)}/status`, { method: "PATCH", body: { status } });
}

/* ---------------- Analyzers (HL7 ORU^R01) ---------------- */

export async function pendingForInstrument(id) {
  const devices = await listInstruments({});
  const inst = devices.find((d) => d.id === id);
  if (!inst) throw new Error("Device not found");
  const orders = await listOrders({ status: "collected" });
  return orders.filter((o) => inst.handles.includes(o.testCode));
}

function simulateLabValues(testCode) {
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

// THE ANALYZER SEAM — a real MLLP listener would call this with parsed HL7.
// Records the device event (real, persisted) alongside the existing real
// downstream mutation (enterResults) — see the file header for why these
// are two separate real writes rather than one transaction.
export async function postResultMessage({ instrumentId, orderId, values }) {
  const orders = await listOrders({ status: "collected" });
  const order = orders.find((o) => o.id === orderId);
  if (!order) throw new Error("Order is not awaiting results.");

  const devices = await listInstruments({});
  const inst = devices.find((d) => d.id === instrumentId);
  if (!inst) throw new Error("Device not found");
  if (!inst.handles.includes(order.testCode)) throw new Error(`${inst.name} does not run ${order.testName}.`);

  const vals = values || simulateLabValues(order.testCode);
  await enterResults(order.id, vals);
  const { message } = await apiCall(`/instruments/devices/${encodeURIComponent(instrumentId)}/event`, {
    method: "PATCH", body: { type: "ORU^R01", ref: order.accession, status: "ack", detail: "Result message accepted" },
  });

  return { order, values: vals, hl7: buildHl7(order, vals), message };
}

/* ---------------- Imaging modalities (DICOM C-STORE) ---------------- */

export async function pendingForModality(id) {
  const devices = await listInstruments({});
  const inst = devices.find((d) => d.id === id);
  if (!inst) throw new Error("Device not found");
  const studies = await listStudies({ status: "all" });
  return studies.filter((s) => inst.handles.includes(s.code) && (s.status === "requested" || s.status === "scheduled"));
}

// THE IMAGING SEAM — a real DICOM SCP would call this on C-STORE completion.
export async function receiveDicomStudy({ instrumentId, studyId, seriesCount, imageCount }) {
  const studies = await listStudies({ status: "all" });
  const study = studies.find((s) => s.id === studyId);
  if (!study) throw new Error("Study not found.");

  const devices = await listInstruments({});
  const inst = devices.find((d) => d.id === instrumentId);
  if (!inst) throw new Error("Device not found");
  if (!inst.handles.includes(study.code)) throw new Error(`${inst.name} does not perform ${study.name}.`);

  if (study.status === "requested") await scheduleStudy(study.id);
  await markStudyPerformed(study.id, {});

  const series = seriesCount || Math.ceil(Math.random() * 3) + 1;
  const images = imageCount || series * (20 + Math.floor(Math.random() * 200));
  const { message } = await apiCall(`/instruments/devices/${encodeURIComponent(instrumentId)}/event`, {
    method: "PATCH", body: { type: "C-STORE", ref: study.accession, status: "ack", detail: `${series} series / ${images} images received` },
  });

  return { study, series, images, message };
}

/* ---------------- Radiotherapy (DICOM-RT) ---------------- */

export async function pendingForRtMachine() {
  const courses = await listCourses();
  return courses.filter((c) => !c.complete);
}

// THE RADIOTHERAPY SEAM — the LINAC console would call this after beam-off.
export async function confirmFractionDelivery({ instrumentId, courseId }) {
  const devices = await listInstruments({});
  const inst = devices.find((d) => d.id === instrumentId);
  if (!inst) throw new Error("Device not found");

  const course = await deliverFraction(courseId);
  const { message } = await apiCall(`/instruments/devices/${encodeURIComponent(instrumentId)}/event`, {
    method: "PATCH", body: { type: "RT-DELIVERY", ref: course.ref, status: "ack", detail: `Fraction ${course.fractionsDone}/${course.fractionsPlanned} delivered` },
  });

  return { course, message };
}

/* ---------------- Printers ---------------- */

// THE PRINTER SEAM — a real print daemon would call this on job completion.
export async function sendPrintJob({ instrumentId, jobType, reference, copies = 1 }) {
  const devices = await listInstruments({});
  const inst = devices.find((d) => d.id === instrumentId);
  if (!inst) throw new Error("Device not found");
  if (!inst.handles.includes(jobType)) throw new Error(`${inst.name} does not handle ${jobType} jobs.`);

  const { message } = await apiCall(`/instruments/devices/${encodeURIComponent(instrumentId)}/event`, {
    method: "PATCH", body: { type: "PRINT", ref: reference || "\u2014", status: "ack", detail: `${copies} \u00d7 ${jobType} printed` },
  });

  return { message };
}

/* ---------------- Summary + Alerts feed ---------------- */

export async function gatewaySummary() {
  return apiCall("/instruments/summary");
}

export async function listInstrumentIssues() {
  return apiCall("/instruments/issues");
}
