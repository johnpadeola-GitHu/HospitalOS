// Sickle Cell Centre.
// Nigeria carries among the highest sickle cell disease prevalence in the
// world, and UCH Ibadan specifically runs a well-known dedicated centre.
// This is a registry (genotype, baseline data), a crisis log (vaso-occlusive
// episodes — the actual acute care this disease generates), and a therapy
// tracker (hydroxyurea, routine transfusion programme).
// In-memory now; async API shaped for a later D1 swap.

import { record, AUDIT_ACTIONS } from "../../lib/audit";

const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));

export const GENOTYPES = ["SS", "SC", "S-beta thalassemia", "AS (trait, not disease)"];
export const CRISIS_TYPES = ["Vaso-occlusive (pain)", "Acute chest syndrome", "Splenic sequestration", "Aplastic crisis", "Priapism", "Stroke"];
export const CRISIS_SEVERITY = ["mild", "moderate", "severe"];
export const SEVERITY_TONE = { mild: "info", moderate: "warn", severe: "bad" };

let _regSeq = 300;
function regRef() { _regSeq += 1; return "SCD-" + String(_regSeq).padStart(5, "0"); }
let _crisisSeq = 400;
function crisisRef() { _crisisSeq += 1; return "CRS-" + String(_crisisSeq).padStart(5, "0"); }

const _patients = [
  {
    id: "sc1", ref: "SCD-00301", patientName: "Adewale, Tunde", hospitalNo: "H001004",
    genotype: "SS", registeredAt: new Date(Date.now() - 400 * 86400000).toISOString().slice(0, 10),
    onHydroxyurea: true, hydroxyureaSince: "2025-02-10",
    onTransfusionProgramme: false, lastCrisisAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
];

const _crises = [
  {
    id: "cr1", ref: "CRS-00401", patientId: "sc1", patientName: "Adewale, Tunde", hospitalNo: "H001004",
    type: "Vaso-occlusive (pain)", severity: "moderate", admittedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    resolvedAt: new Date(Date.now() - 17 * 86400000).toISOString(), notes: "Managed with IV fluids and analgesia; discharged well.",
  },
];

export async function listPatients({ query = "" } = {}) {
  await delay();
  const q = query.trim().toLowerCase();
  return _patients
    .filter((p) => !q || p.patientName.toLowerCase().includes(q) || p.ref.toLowerCase().includes(q))
    .map((p) => ({ ...p }));
}

export async function registerPatient({ patientName, hospitalNo, genotype, actor }) {
  await delay();
  if (!patientName || !patientName.trim()) throw new Error("Enter the patient.");
  if (!GENOTYPES.includes(genotype)) throw new Error("Choose a genotype.");
  const p = {
    id: "sc" + Date.now(), ref: regRef(), patientName: patientName.trim(), hospitalNo: hospitalNo || "\u2014",
    genotype, registeredAt: new Date().toISOString().slice(0, 10),
    onHydroxyurea: false, hydroxyureaSince: null, onTransfusionProgramme: false, lastCrisisAt: null,
  };
  _patients.unshift(p);
  record({ actor, action: AUDIT_ACTIONS.CREATE, entity: "scd-registry", entityId: p.ref, detail: `Registered ${p.patientName} \u2014 genotype ${genotype}`, severity: "info" });
  return p;
}

export async function toggleHydroxyurea(id, actor) {
  await delay(80);
  const p = _patients.find((x) => x.id === id);
  if (!p) throw new Error("Patient not found");
  p.onHydroxyurea = !p.onHydroxyurea;
  p.hydroxyureaSince = p.onHydroxyurea ? new Date().toISOString().slice(0, 10) : null;
  record({ actor, action: AUDIT_ACTIONS.CLINICAL, entity: "scd-therapy", entityId: p.ref, detail: `Hydroxyurea ${p.onHydroxyurea ? "started" : "stopped"} \u2014 ${p.patientName}`, severity: "info" });
  return p;
}

export async function toggleTransfusionProgramme(id, actor) {
  await delay(80);
  const p = _patients.find((x) => x.id === id);
  if (!p) throw new Error("Patient not found");
  p.onTransfusionProgramme = !p.onTransfusionProgramme;
  record({ actor, action: AUDIT_ACTIONS.CLINICAL, entity: "scd-therapy", entityId: p.ref, detail: `Transfusion programme ${p.onTransfusionProgramme ? "enrolled" : "stopped"} \u2014 ${p.patientName}`, severity: "info" });
  return p;
}

export async function listCrises({ patientId, query = "" } = {}) {
  await delay();
  const q = query.trim().toLowerCase();
  return _crises
    .filter((c) => !patientId || c.patientId === patientId)
    .filter((c) => !q || c.patientName.toLowerCase().includes(q) || c.ref.toLowerCase().includes(q))
    .sort((a, b) => new Date(b.admittedAt) - new Date(a.admittedAt));
}

export async function logCrisis({ patientId, type, severity, notes, actor }) {
  await delay();
  const p = _patients.find((x) => x.id === patientId);
  if (!p) throw new Error("Patient not found in the registry \u2014 register them first.");
  if (!CRISIS_TYPES.includes(type)) throw new Error("Choose a crisis type.");
  if (!CRISIS_SEVERITY.includes(severity)) throw new Error("Choose a severity.");
  const c = {
    id: "cr" + Date.now(), ref: crisisRef(), patientId, patientName: p.patientName, hospitalNo: p.hospitalNo,
    type, severity, admittedAt: new Date().toISOString(), resolvedAt: null, notes: notes || "",
  };
  _crises.unshift(c);
  p.lastCrisisAt = c.admittedAt;
  record({
    actor, action: AUDIT_ACTIONS.CLINICAL, entity: "scd-crisis", entityId: c.ref,
    detail: `${type} \u2014 ${severity} \u2014 ${p.patientName}`, severity: severity === "severe" ? "warn" : "info",
  });
  return c;
}

export async function resolveCrisis(id, notes, actor) {
  await delay(80);
  const c = _crises.find((x) => x.id === id);
  if (!c) throw new Error("Crisis record not found");
  if (c.resolvedAt) throw new Error("Already resolved.");
  c.resolvedAt = new Date().toISOString();
  if (notes) c.notes = notes;
  record({ actor, action: AUDIT_ACTIONS.CLINICAL, entity: "scd-crisis", entityId: c.ref, detail: `Crisis resolved \u2014 ${c.patientName}`, severity: "info" });
  return c;
}

/** Active (unresolved) severe crises feed the hospital-wide Alerts screen. */
export async function listActiveSevereCrises() {
  await delay(60);
  return _crises.filter((c) => !c.resolvedAt && c.severity === "severe");
}

export async function scdSummary() {
  await delay(60);
  return {
    registered: _patients.length,
    onHydroxyurea: _patients.filter((p) => p.onHydroxyurea).length,
    onTransfusion: _patients.filter((p) => p.onTransfusionProgramme).length,
    activeCrises: _crises.filter((c) => !c.resolvedAt).length,
    severeActive: _crises.filter((c) => !c.resolvedAt && c.severity === "severe").length,
  };
}
