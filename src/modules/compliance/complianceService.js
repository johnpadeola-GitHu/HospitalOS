// Compliance & Accreditation.
// A genuine gap flagged in an earlier "nationally acceptable" audit and
// never actually built until now: a Nigerian hospital's legal right to
// operate rests on facility accreditation (state ministry of health /
// HEFAMAA-style licensing) and on every clinical practitioner holding a
// current professional license (MDCN for doctors, NMCN for nurses/midwives,
// PCN for pharmacists, MLSCN for lab scientists). Neither existed anywhere
// in this build \u2014 staff accounts had no license field at all, and there
// was no facility-level accreditation record.
// In-memory now; async API shaped for a later D1 swap.

import { record, AUDIT_ACTIONS } from "../../lib/audit";

const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));

export const LICENSE_BODIES = {
  doctor: "MDCN (Medical and Dental Council of Nigeria)",
  nurse: "NMCN (Nursing and Midwifery Council of Nigeria)",
  "lab-scientist": "MLSCN (Medical Laboratory Science Council of Nigeria)",
  radiographer: "RRBN (Radiographers Registration Board of Nigeria)",
  pharmacist: "PCN (Pharmacists Council of Nigeria)",
};

export const ACCREDITATION_TYPES = [
  "State Ministry of Health facility license",
  "HEFAMAA registration",
  "NHIA facility accreditation",
  "ISO 15189 (laboratory)",
  "Other regulatory registration",
];

export const INSPECTION_OUTCOMES = ["Passed", "Passed with conditions", "Failed", "Scheduled"];
export const OUTCOME_TONE = { Passed: "good", "Passed with conditions": "warn", Failed: "bad", Scheduled: "info" };

let _licSeq = 100;
function licRef() { _licSeq += 1; return "LIC-" + String(_licSeq).padStart(5, "0"); }
let _accSeq = 200;
function accRef() { _accSeq += 1; return "ACC-" + String(_accSeq).padStart(5, "0"); }
let _inspSeq = 300;
function inspRef() { _inspSeq += 1; return "INSP-" + String(_inspSeq).padStart(5, "0"); }

const _practitionerLicenses = [
  {
    id: "l1", ref: "LIC-00101", staffName: "Dr. Ngozi Umeh", role: "doctor",
    body: LICENSE_BODIES.doctor, licenseNumber: "MDCN/12345/2019",
    issuedAt: "2019-06-01", expiresAt: new Date(Date.now() + 200 * 86400000).toISOString().slice(0, 10),
  },
  {
    id: "l2", ref: "LIC-00102", staffName: "Sr. Blessing Ade", role: "nurse",
    body: LICENSE_BODIES.nurse, licenseNumber: "NMCN/88213",
    issuedAt: "2021-03-15", expiresAt: new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10),
  },
];

const _accreditations = [
  {
    id: "a1", ref: "ACC-00201", type: "State Ministry of Health facility license",
    certificateNumber: "OYSMOH/HL/0442", issuedAt: "2024-01-10",
    expiresAt: new Date(Date.now() + 300 * 86400000).toISOString().slice(0, 10), notes: "Renewed annually with the Oyo State Ministry of Health.",
  },
];

const _inspections = [
  {
    id: "i1", ref: "INSP-00301", body: "Oyo State Ministry of Health", scheduledAt: new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10),
    outcome: "Passed", notes: "Routine annual facility inspection. No corrective actions required.",
  },
];

/* ---------------- Practitioner licenses ---------------- */

export async function listLicenses({ query = "" } = {}) {
  await delay();
  const q = query.trim().toLowerCase();
  const today = new Date().toISOString().slice(0, 10);
  return _practitionerLicenses
    .filter((l) => !q || l.staffName.toLowerCase().includes(q) || l.licenseNumber.toLowerCase().includes(q))
    .map((l) => {
      const daysLeft = Math.ceil((new Date(l.expiresAt) - new Date(today)) / 86400000);
      const status = daysLeft < 0 ? "expired" : daysLeft <= 60 ? "expiring-soon" : "current";
      return { ...l, daysLeft, status };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

export async function addLicense({ staffName, role, licenseNumber, issuedAt, expiresAt, actor }) {
  await delay();
  if (!staffName || !staffName.trim()) throw new Error("Enter the staff member's name.");
  if (!LICENSE_BODIES[role]) throw new Error("Choose a role with a recognised licensing body.");
  if (!licenseNumber || !licenseNumber.trim()) throw new Error("Enter the license number.");
  if (!expiresAt) throw new Error("Enter the expiry date.");
  const lic = {
    id: "l" + Date.now(), ref: licRef(), staffName: staffName.trim(), role, body: LICENSE_BODIES[role],
    licenseNumber: licenseNumber.trim(), issuedAt: issuedAt || new Date().toISOString().slice(0, 10), expiresAt,
  };
  _practitionerLicenses.unshift(lic);
  record({ actor, action: AUDIT_ACTIONS.CREATE, entity: "practitioner-license", entityId: lic.ref, detail: `${lic.body} license recorded \u2014 ${lic.staffName} (${lic.licenseNumber})`, severity: "info" });
  return lic;
}

export async function renewLicense(id, { licenseNumber, expiresAt, actor }) {
  await delay(80);
  const lic = _practitionerLicenses.find((x) => x.id === id);
  if (!lic) throw new Error("License record not found");
  if (!expiresAt) throw new Error("Enter the new expiry date.");
  lic.licenseNumber = licenseNumber || lic.licenseNumber;
  lic.issuedAt = new Date().toISOString().slice(0, 10);
  lic.expiresAt = expiresAt;
  record({ actor, action: AUDIT_ACTIONS.UPDATE, entity: "practitioner-license", entityId: lic.ref, detail: `Renewed \u2014 ${lic.staffName}, new expiry ${expiresAt}`, severity: "info" });
  return lic;
}

export async function listExpiringLicenses() {
  await delay(60);
  const all = await listLicenses({});
  return all.filter((l) => l.status === "expiring-soon" || l.status === "expired");
}

/* ---------------- Facility accreditation ---------------- */

export async function listAccreditations() {
  await delay();
  const today = new Date().toISOString().slice(0, 10);
  return _accreditations.map((a) => {
    const daysLeft = Math.ceil((new Date(a.expiresAt) - new Date(today)) / 86400000);
    const status = daysLeft < 0 ? "expired" : daysLeft <= 60 ? "expiring-soon" : "current";
    return { ...a, daysLeft, status };
  }).sort((a, b) => a.daysLeft - b.daysLeft);
}

export async function addAccreditation({ type, certificateNumber, issuedAt, expiresAt, notes, actor }) {
  await delay();
  if (!ACCREDITATION_TYPES.includes(type)) throw new Error("Choose an accreditation type.");
  if (!certificateNumber || !certificateNumber.trim()) throw new Error("Enter the certificate number.");
  if (!expiresAt) throw new Error("Enter the expiry date.");
  const acc = {
    id: "a" + Date.now(), ref: accRef(), type, certificateNumber: certificateNumber.trim(),
    issuedAt: issuedAt || new Date().toISOString().slice(0, 10), expiresAt, notes: notes || "",
  };
  _accreditations.unshift(acc);
  record({ actor, action: AUDIT_ACTIONS.CREATE, entity: "accreditation", entityId: acc.ref, detail: `${type} recorded \u2014 ${acc.certificateNumber}`, severity: "info" });
  return acc;
}

/* ---------------- Inspections ---------------- */

export async function listInspections() {
  await delay();
  return [..._inspections].sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));
}

export async function logInspection({ body, scheduledAt, outcome, notes, actor }) {
  await delay();
  if (!body || !body.trim()) throw new Error("Enter the inspecting body.");
  if (!scheduledAt) throw new Error("Enter the inspection date.");
  if (!INSPECTION_OUTCOMES.includes(outcome)) throw new Error("Choose an outcome.");
  const insp = { id: "i" + Date.now(), ref: inspRef(), body: body.trim(), scheduledAt, outcome, notes: notes || "" };
  _inspections.unshift(insp);
  record({
    actor, action: AUDIT_ACTIONS.CREATE, entity: "inspection", entityId: insp.ref,
    detail: `${body.trim()} inspection \u2014 ${outcome}`, severity: outcome === "Failed" ? "warn" : "info",
  });
  return insp;
}

export async function complianceSummary() {
  await delay(60);
  const licenses = await listLicenses({});
  const accreditations = await listAccreditations();
  return {
    licensesExpiringSoon: licenses.filter((l) => l.status === "expiring-soon").length,
    licensesExpired: licenses.filter((l) => l.status === "expired").length,
    accreditationsExpiringSoon: accreditations.filter((a) => a.status === "expiring-soon").length,
    accreditationsExpired: accreditations.filter((a) => a.status === "expired").length,
    totalLicenses: licenses.length,
    totalAccreditations: accreditations.length,
  };
}
