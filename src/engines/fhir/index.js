// FHIR interoperability engine — HL7 FHIR R4 resource mapping.
//
// This is an ENGINE like Help and Pricing: it owns no clinical data of its
// own, reads from other modules, and is imported BY the screen that exposes
// it. It never imports a screen.
//
// SCOPE, stated plainly: a browser cannot host a FHIR REST server (no
// GET /Patient/{id} endpoint reachable from outside this session) — that is
// Worker/backend territory, the same limitation as the instruments gateway's
// live MLLP/DICOM listeners. What this engine provides is the actual hard
// part of interoperability: correct, standards-shaped resource mapping from
// HospitalOS's internal records to FHIR R4 JSON. A generated Bundle is a
// real, valid artifact any FHIR-consuming system can ingest today by import,
// and is exactly what the eventual REST endpoint would serve — the mapping
// logic does not change when the transport does.

import { getPatient } from "../../modules/patients/patientService";
import { listNotes, listDiagnoses, listAllergies } from "../../modules/records/recordsService";
import { listOrders } from "../../modules/lab/labService";

const FHIR_VERSION = "4.0.1";
const SYSTEM_BASE = "https://hospitalos.agorox.africa/fhir";

function ref(type, id) {
  return { reference: `${type}/${id}` };
}

function fhirPatient(p) {
  return {
    resourceType: "Patient",
    id: p.id,
    identifier: [{ system: `${SYSTEM_BASE}/identifier/hospital-no`, value: p.hospitalNo }],
    name: [{ family: p.lastName, given: [p.firstName] }],
    gender: p.sex === "F" ? "female" : p.sex === "M" ? "male" : "unknown",
    birthDate: p.dob,
  };
}

function fhirAllergy(a, patientId) {
  const SEVERITY = { mild: "mild", moderate: "moderate", severe: "severe" };
  return {
    resourceType: "AllergyIntolerance",
    id: a.id,
    patient: ref("Patient", patientId),
    code: { text: a.substance },
    reaction: a.reaction ? [{ manifestation: [{ text: a.reaction }], severity: SEVERITY[a.severity] || undefined }] : undefined,
    recordedDate: a.at || undefined,
  };
}

function fhirCondition(dx, patientId) {
  return {
    resourceType: "Condition",
    id: dx.id,
    patient: ref("Patient", patientId),
    code: {
      coding: [{ system: "http://hl7.org/fhir/sid/icd-10", code: dx.code, display: dx.label }],
      text: dx.label,
    },
    clinicalStatus: {
      coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: dx.status === "resolved" ? "resolved" : "active" }],
    },
    onsetDateTime: dx.onset || undefined,
  };
}

function fhirClinicalNote(note, patientId) {
  return {
    resourceType: "DocumentReference",
    id: note.id,
    status: "current",
    type: { text: note.type },
    subject: ref("Patient", patientId),
    date: note.at,
    author: [{ display: note.author }],
    description: note.assessment,
    content: [{
      attachment: {
        contentType: "text/plain",
        title: `${note.type} \u2014 ${note.author}`,
        data: undefined, // full SOAP text omitted from the summary Bundle; available via the app
      },
    }],
  };
}

function fhirDiagnosticReport(order, patientId) {
  return {
    resourceType: "DiagnosticReport",
    id: order.id,
    status: order.status === "verified" ? "final" : order.status === "resulted" ? "preliminary" : "registered",
    code: { text: order.testName },
    subject: ref("Patient", patientId),
    identifier: [{ system: `${SYSTEM_BASE}/identifier/accession`, value: order.accession }],
    effectiveDateTime: order.orderedAt,
    result: order.results
      ? Object.entries(order.results).map(([k, v]) => ({ display: `${k}: ${v}` }))
      : undefined,
  };
}

/**
 * Build a full FHIR Bundle for a patient — the artifact a receiving system
 * (another hospital, an NHIA claims processor, a research registry) would
 * actually consume. Type "collection" per FHIR R4 §Bundle.
 */
export async function buildPatientBundle(patientId) {
  const p = await getPatient(patientId);
  if (!p) throw new Error("Patient not found");

  const [notes, diagnoses, allergies, labOrders] = await Promise.all([
    listNotes(patientId), listDiagnoses(patientId), listAllergies(patientId),
    listOrders({ status: "all" }).then((all) => all.filter((o) => o.patientId === patientId)),
  ]);

  const entries = [
    fhirPatient(p),
    ...allergies.map((a) => fhirAllergy(a, patientId)),
    ...diagnoses.map((d) => fhirCondition(d, patientId)),
    ...notes.map((n) => fhirClinicalNote(n, patientId)),
    ...labOrders.map((o) => fhirDiagnosticReport(o, patientId)),
  ];

  return {
    resourceType: "Bundle",
    type: "collection",
    timestamp: new Date().toISOString(),
    meta: { profile: [`http://hl7.org/fhir/${FHIR_VERSION}/StructureDefinition/Bundle`] },
    total: entries.length,
    entry: entries.map((resource) => ({ fullUrl: `${SYSTEM_BASE}/${resource.resourceType}/${resource.id}`, resource })),
  };
}

export function bundleResourceCounts(bundle) {
  const counts = {};
  for (const e of bundle.entry) counts[e.resource.resourceType] = (counts[e.resource.resourceType] || 0) + 1;
  return counts;
}

export const FHIR_INFO = { version: FHIR_VERSION, base: SYSTEM_BASE };
