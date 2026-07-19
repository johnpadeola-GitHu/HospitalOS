// Instruments & devices gateway.
//
// The single interoperability hub for every machine the hospital connects:
// laboratory analyzers (HL7 v2/MLLP), imaging modalities (DICOM), printers
// (label/wristband/report — IPP, raw socket, or legacy serial), and
// radiotherapy delivery systems. Old and new equipment sit side by side
// deliberately — a hospital's real fleet spans two decades of purchase dates,
// and a gateway that only speaks to brand-new machines is not a gateway.
//
// SCOPE: a production gateway needs real network listeners (MLLP sockets,
// a DICOM SCP, an IPP/socket printer daemon) — Worker/backend territory, not a
// browser. What runs here is the management + monitoring layer plus a
// faithful simulation of each protocol's message flow. Every "receive"
// action calls the SAME functions a live listener would call, so nothing
// downstream (Lab, Radiology, Radiotherapy, Alerts) knows the difference
// between a simulated message and a real one.

import { listOrders, enterResults, getTest } from "../lab/labService";
import { listStudies, scheduleStudy, markPerformed as markStudyPerformed } from "../radiology/radiologyService";
import { listCourses, deliverFraction } from "../radiotherapy/radiotherapyService";
import { record, AUDIT_ACTIONS } from "../../lib/audit";

const delay = (ms = 110) => new Promise((r) => setTimeout(r, ms));
const iso = (m) => new Date(Date.now() + m * 60000).toISOString();

export const DEVICE_CATEGORIES = [
  { key: "analyzer", label: "Laboratory analyzer", protocol: "HL7 v2 / MLLP" },
  { key: "imaging", label: "Imaging modality", protocol: "DICOM" },
  { key: "radiotherapy", label: "Radiotherapy system", protocol: "DICOM-RT / proprietary" },
  { key: "printer", label: "Printer", protocol: "IPP / raw socket / serial" },
];

export const INSTRUMENT_STATUS = ["online", "idle", "offline", "error"];
export const STATUS_TONE = { online: "good", idle: "info", offline: "muted", error: "bad" };

// Deliberately spans old and modern equipment, and all four device
// categories — this is what "robust enough for old and new machines" means
// in the registry, not just a longer list of the same thing.
const _devices = [
  // Laboratory analyzers
  { id: "in1", category: "analyzer", name: "Sysmex XN-1000", vendor: "Sysmex", year: 2021, type: "Haematology analyzer", ae: "XN1000_A", host: "10.20.4.11:6661", protocol: "HL7 v2.5.1 / MLLP", handles: ["FBC"], status: "online", lastSeen: iso(-2), messages: 1284, errors: 3 },
  { id: "in2", category: "analyzer", name: "Cobas c311", vendor: "Roche", year: 2019, type: "Clinical chemistry analyzer", ae: "COBAS_C311", host: "10.20.4.12:6661", protocol: "HL7 v2.5.1 / MLLP", handles: ["UE", "LFT", "GLU"], status: "online", lastSeen: iso(-1), messages: 3120, errors: 11 },
  { id: "in3", category: "analyzer", name: "BD BACTEC FX", vendor: "BD", year: 2020, type: "Blood culture system", ae: "BACTEC_FX", host: "10.20.4.13:6661", protocol: "HL7 v2.5.1 / MLLP", handles: [], status: "idle", lastSeen: iso(-46), messages: 402, errors: 0 },
  { id: "in4", category: "analyzer", name: "Mindray BC-5150", vendor: "Mindray", year: 2016, type: "Haematology analyzer", ae: "BC5150_B", host: "10.20.4.14:6661", protocol: "HL7 v2.4 / MLLP", handles: ["FBC"], status: "error", lastSeen: iso(-180), messages: 640, errors: 27 },
  { id: "in5", category: "analyzer", name: "Abbott Architect", vendor: "Abbott", year: 2014, type: "Immunoassay analyzer", ae: "ARCHITECT_1", host: "10.20.4.15:6661", protocol: "HL7 v2.5.1 / MLLP", handles: [], status: "offline", lastSeen: iso(-1440), messages: 0, errors: 0 },
  { id: "in6", category: "analyzer", name: "Beckman AU480", vendor: "Beckman Coulter", year: 2009, type: "Chemistry analyzer (legacy)", ae: "AU480_LEGACY", host: "10.20.4.16:6661", protocol: "HL7 v2.3 / MLLP", handles: ["GLU"], status: "online", lastSeen: iso(-8), messages: 8920, errors: 140 },

  // Imaging modalities — DICOM
  { id: "im1", category: "imaging", name: "GE Revolution CT", vendor: "GE Healthcare", year: 2022, type: "128-slice CT scanner", ae: "GE_CT_REVO", host: "10.20.5.21:104", protocol: "DICOM 3.0", handles: ["CT-HEAD", "CT-CHEST", "CT-ABD", "CT-SPINE", "CT-ANGIO", "CT-KUB"], status: "online", lastSeen: iso(-3), messages: 512, errors: 1 },
  { id: "im2", category: "imaging", name: "Siemens Magnetom 1.5T", vendor: "Siemens Healthineers", year: 2018, type: "MRI scanner", ae: "SIEMENS_MRI", host: "10.20.5.22:104", protocol: "DICOM 3.0", handles: ["MRI-BRAIN", "MRI-SPINE", "MRI-KNEE", "MRI-ABD", "MRI-PELV", "MRCP"], status: "online", lastSeen: iso(-11), messages: 340, errors: 0 },
  { id: "im3", category: "imaging", name: "Philips Lumify Portable US", vendor: "Philips", year: 2023, type: "Point-of-care ultrasound", ae: "LUMIFY_POC", host: "10.20.5.23:104", protocol: "DICOM 3.0", handles: ["USG-ABD", "USG-OBS", "USG-PEL", "USG-THY", "USG-DOP", "USG-ECHO", "USG-FAST", "USG-BRST"], status: "idle", lastSeen: iso(-70), messages: 890, errors: 4 },
  { id: "im4", category: "imaging", name: "Fujifilm CR Console (legacy)", vendor: "Fujifilm", year: 2007, type: "Computed radiography reader", ae: "FUJI_CR_OLD", host: "10.20.5.24:104", protocol: "DICOM 3.0 (CR)", handles: ["CXR", "AXR", "SKUL", "SPINE", "LIMB", "PELV"], status: "online", lastSeen: iso(-25), messages: 15200, errors: 380 },
  { id: "im5", category: "imaging", name: "Hologic Selenia Mammo", vendor: "Hologic", year: 2020, type: "Digital mammography unit", ae: "HOLOGIC_MMG", host: "10.20.5.25:104", protocol: "DICOM 3.0", handles: ["MAMMO"], status: "offline", lastSeen: iso(-2880), messages: 210, errors: 0 },

  // Radiotherapy
  { id: "rt1", category: "radiotherapy", name: "Varian TrueBeam LINAC", vendor: "Varian (Siemens)", year: 2019, type: "Linear accelerator", ae: "VARIAN_TB1", host: "10.20.6.31:104", protocol: "DICOM-RT", handles: ["fraction-delivery"], status: "online", lastSeen: iso(-40), messages: 1120, errors: 6 },
  { id: "rt2", category: "radiotherapy", name: "Elekta Versa HD LINAC", vendor: "Elekta", year: 2021, type: "Linear accelerator", ae: "ELEKTA_VHD", host: "10.20.6.32:104", protocol: "DICOM-RT", handles: ["fraction-delivery"], status: "idle", lastSeen: iso(-95), messages: 640, errors: 2 },
  { id: "rt3", category: "radiotherapy", name: "Cobalt-60 Teletherapy Unit (legacy)", vendor: "Theratronics", year: 2003, type: "Cobalt unit", ae: "CO60_LEGACY", host: "\u2014 (manual log only)", protocol: "Manual / no network", handles: ["fraction-delivery"], status: "idle", lastSeen: iso(-200), messages: 30, errors: 0 },

  // Printers
  { id: "pr1", category: "printer", name: "Zebra ZD621 (wristbands)", vendor: "Zebra", year: 2022, type: "Thermal label printer", ae: "ZEBRA_ZD621", host: "10.20.7.41:9100", protocol: "Raw socket (ZPL)", handles: ["wristband", "specimen-label"], status: "online", lastSeen: iso(-1), messages: 4210, errors: 5 },
  { id: "pr2", category: "printer", name: "HP LaserJet Enterprise (reports)", vendor: "HP", year: 2020, type: "Network laser printer", ae: "HP_LJ_REPORTS", host: "10.20.7.42:631", protocol: "IPP", handles: ["lab-report", "discharge-summary", "invoice"], status: "online", lastSeen: iso(-5), messages: 2870, errors: 12 },
  { id: "pr3", category: "printer", name: "Epson TM-T88 (receipts)", vendor: "Epson", year: 2017, type: "Thermal receipt printer", ae: "EPSON_TMT88", host: "10.20.7.43:9100", protocol: "Raw socket (ESC/POS)", handles: ["receipt"], status: "online", lastSeen: iso(-2), messages: 6540, errors: 8 },
  { id: "pr4", category: "printer", name: "Dot-matrix Ward Printer (legacy)", vendor: "Epson", year: 2001, type: "Dot-matrix impact printer", ae: "\u2014 (serial/LPT)", host: "COM3 (serial, Medical Ward A)", protocol: "Serial / raw text", handles: ["ward-list"], status: "idle", lastSeen: iso(-300), messages: 1900, errors: 40 },
];

let _msgSeq = 4000;
const _messages = [
  { id: "m1", at: iso(-2), device: "Cobas c311", category: "analyzer", type: "ORU^R01", ref: "LAB-000241", status: "ack", detail: "Result message accepted" },
  { id: "m2", at: iso(-3), device: "GE Revolution CT", category: "imaging", type: "C-STORE", ref: "RAD-000501", status: "ack", detail: "Study images received" },
  { id: "m3", at: iso(-6), device: "Sysmex XN-1000", category: "analyzer", type: "ORU^R01", ref: "LAB-000238", status: "ack", detail: "Result message accepted" },
  { id: "m4", at: iso(-14), device: "Mindray BC-5150", category: "analyzer", type: "ORU^R01", ref: "LAB-000237", status: "nack", detail: "MSH-9 unsupported trigger event" },
  { id: "m5", at: iso(-22), device: "Zebra ZD621 (wristbands)", category: "printer", type: "PRINT", ref: "H001003", status: "ack", detail: "Wristband label printed" },
  { id: "m6", at: iso(-40), device: "Varian TrueBeam LINAC", category: "radiotherapy", type: "RT-DELIVERY", ref: "RT-0001", status: "ack", detail: "Fraction delivery confirmed" },
];

export function listDevices() {
  return _devices;
}

export async function listInstruments({ category = "all" } = {}) {
  await delay();
  return _devices.filter((d) => (category === "all" ? true : d.category === category)).map((d) => ({ ...d }));
}

/**
 * Registers a device the browser genuinely detected (via WebUSB or Web
 * Serial — see deviceDetection.js) into the gateway. The vendor/product ID
 * and connection type are real, read from the browser API when the person
 * picked the device from their OS's own device list; everything else
 * (protocol, host, AE title) is left for the person to fill in, since a
 * browser has no way to know a lab analyzer's network configuration just
 * from its USB identity.
 */
export async function registerInstrument({ category, name, vendor, connectionType, vendorId, productId, actor }) {
  await delay(150);
  if (!DEVICE_CATEGORIES.some((c) => c.key === category)) throw new Error("Choose a device category.");
  if (!name || !name.trim()) throw new Error("Enter a name for this device.");
  const protocolByCategory = { analyzer: "HL7 v2 / MLLP (configure host)", imaging: "DICOM (configure AE title)", radiotherapy: "DICOM-RT (configure host)", printer: connectionType === "usb" || connectionType === "serial" ? "Direct USB/Serial (no network config needed)" : "IPP / raw socket (configure host)" };
  const d = {
    id: "det" + Date.now(), category, name: name.trim(), vendor: vendor || "Unknown",
    year: new Date().getFullYear(), type: DEVICE_CATEGORIES.find((c) => c.key === category)?.label || category,
    ae: "\u2014", host: connectionType ? `${connectionType.toUpperCase()} ${vendorId || ""}${productId ? "/" + productId : ""}`.trim() : "\u2014",
    protocol: protocolByCategory[category], handles: [], status: "idle", lastSeen: new Date().toISOString(),
    messages: 0, errors: 0, detectedVia: connectionType || null,
  };
  _devices.unshift(d);
  record({ actor, action: AUDIT_ACTIONS.CREATE, entity: "instrument", entityId: d.id, detail: `${d.name} registered${connectionType ? ` (detected via ${connectionType.toUpperCase()})` : " (manual entry)"}`, severity: "info" });
  return d;
}

export async function listMessages({ limit = 30, category = "all" } = {}) {
  await delay(60);
  return [..._messages]
    .filter((m) => (category === "all" ? true : m.category === category))
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, limit);
}

export async function setInstrumentStatus(id, status) {
  await delay(80);
  const d = _devices.find((x) => x.id === id);
  if (!d) throw new Error("Device not found");
  if (!INSTRUMENT_STATUS.includes(status)) throw new Error("Unknown status");
  d.status = status;
  if (status === "online") d.lastSeen = new Date().toISOString();
  return d;
}

function logMessage({ device, category, type, ref, status, detail }) {
  _msgSeq += 1;
  const msg = { id: "m" + _msgSeq, at: new Date().toISOString(), device, category, type, ref, status, detail };
  _messages.unshift(msg);
  return msg;
}

/* ---------------- Analyzers (HL7 ORU^R01) ---------------- */

export async function pendingForInstrument(id) {
  await delay(60);
  const inst = _devices.find((x) => x.id === id);
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

// THE ANALYZER SEAM — a real MLLP listener calls this with parsed HL7.
export async function postResultMessage({ instrumentId, orderId, values }) {
  await delay();
  const inst = _devices.find((x) => x.id === instrumentId);
  if (!inst) throw new Error("Device not found");
  if (inst.status === "offline") throw new Error(`${inst.name} is offline.`);

  const orders = await listOrders({ status: "collected" });
  const order = orders.find((o) => o.id === orderId);
  if (!order) throw new Error("Order is not awaiting results.");
  if (!inst.handles.includes(order.testCode)) throw new Error(`${inst.name} does not run ${order.testName}.`);

  const vals = values || simulateLabValues(order.testCode);
  await enterResults(order.id, vals);

  inst.messages += 1;
  inst.lastSeen = new Date().toISOString();
  if (inst.status !== "online") inst.status = "online";

  const msg = logMessage({ device: inst.name, category: "analyzer", type: "ORU^R01", ref: order.accession, status: "ack", detail: "Result message accepted" });
  return { order, values: vals, hl7: buildHl7(order, vals), message: msg };
}

/* ---------------- Imaging modalities (DICOM C-STORE) ---------------- */

export async function pendingForModality(id) {
  await delay(60);
  const inst = _devices.find((x) => x.id === id);
  if (!inst) throw new Error("Device not found");
  const studies = await listStudies({ status: "all" });
  return studies.filter((s) => inst.handles.includes(s.code) && (s.status === "requested" || s.status === "scheduled"));
}

// THE IMAGING SEAM — a real DICOM SCP calls this on C-STORE completion.
export async function receiveDicomStudy({ instrumentId, studyId, seriesCount, imageCount }) {
  await delay();
  const inst = _devices.find((x) => x.id === instrumentId);
  if (!inst) throw new Error("Device not found");
  if (inst.status === "offline") throw new Error(`${inst.name} is offline.`);

  const studies = await listStudies({ status: "all" });
  const study = studies.find((s) => s.id === studyId);
  if (!study) throw new Error("Study not found.");
  if (!inst.handles.includes(study.code)) throw new Error(`${inst.name} does not perform ${study.name}.`);

  if (study.status === "requested") await scheduleStudy(study.id);
  await markStudyPerformed(study.id, {});

  inst.messages += 1;
  inst.lastSeen = new Date().toISOString();
  if (inst.status !== "online") inst.status = "online";

  const series = seriesCount || Math.ceil(Math.random() * 3) + 1;
  const images = imageCount || series * (20 + Math.floor(Math.random() * 200));
  const msg = logMessage({
    device: inst.name, category: "imaging", type: "C-STORE", ref: study.accession, status: "ack",
    detail: `${series} series / ${images} images received`,
  });
  return { study, series, images, message: msg };
}

/* ---------------- Radiotherapy (DICOM-RT) ---------------- */

export async function pendingForRtMachine() {
  await delay(60);
  const courses = await listCourses();
  return courses.filter((c) => !c.complete);
}

// THE RADIOTHERAPY SEAM — the LINAC console calls this after beam-off.
export async function confirmFractionDelivery({ instrumentId, courseId }) {
  await delay();
  const inst = _devices.find((x) => x.id === instrumentId);
  if (!inst) throw new Error("Device not found");
  if (inst.status === "offline") throw new Error(`${inst.name} is offline.`);

  const course = await deliverFraction(courseId);

  inst.messages += 1;
  inst.lastSeen = new Date().toISOString();
  if (inst.status !== "online") inst.status = "online";

  const msg = logMessage({
    device: inst.name, category: "radiotherapy", type: "RT-DELIVERY", ref: course.ref, status: "ack",
    detail: `Fraction ${course.fractionsDone}/${course.fractionsPlanned} delivered`,
  });
  return { course, message: msg };
}

/* ---------------- Printers ---------------- */

export const PRINT_JOB_TYPES = ["wristband", "specimen-label", "lab-report", "discharge-summary", "invoice", "receipt", "ward-list"];

// THE PRINTER SEAM — a real print daemon calls this on job completion.
export async function sendPrintJob({ instrumentId, jobType, reference, copies = 1 }) {
  await delay(90);
  const inst = _devices.find((x) => x.id === instrumentId);
  if (!inst) throw new Error("Device not found");
  if (inst.status === "offline") throw new Error(`${inst.name} is offline.`);
  if (!inst.handles.includes(jobType)) throw new Error(`${inst.name} does not handle ${jobType} jobs.`);

  inst.messages += 1;
  inst.lastSeen = new Date().toISOString();
  if (inst.status !== "online") inst.status = "online";

  const msg = logMessage({
    device: inst.name, category: "printer", type: "PRINT", ref: reference || "\u2014", status: "ack",
    detail: `${copies} \u00d7 ${jobType} printed`,
  });
  return { message: msg };
}

/* ---------------- Summary + Alerts feed ---------------- */

export async function gatewaySummary() {
  await delay(60);
  const byCategory = {};
  for (const c of DEVICE_CATEGORIES) byCategory[c.key] = _devices.filter((d) => d.category === c.key).length;
  return {
    total: _devices.length,
    online: _devices.filter((d) => d.status === "online").length,
    errored: _devices.filter((d) => d.status === "error").length,
    offline: _devices.filter((d) => d.status === "offline").length,
    messages24h: _devices.reduce((s, d) => s + d.messages, 0),
    errors24h: _devices.reduce((s, d) => s + d.errors, 0),
    byCategory,
  };
}

export async function listInstrumentIssues() {
  await delay(60);
  return _devices
    .filter((d) => d.status === "error" || d.status === "offline")
    .map((d) => ({ id: d.id, name: d.name, category: d.category, ae: d.ae, status: d.status, errors: d.errors }));
}
