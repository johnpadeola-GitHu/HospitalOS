// Patient data service.
// In-memory for now. The exported async API is deliberately shaped like a
// network layer so this file can later be swapped for D1/Workers calls
// without any change to the module UI.

import { assignBed, releaseBedFor } from "../wards/bedService";

const HOSPITAL_NO_PREFIX = "H";

let _seq = 1004;
const _patients = [
  {
    id: "p1",
    hospitalNo: "H001001",
    firstName: "Adaeze",
    lastName: "Okafor",
    sex: "F",
    dob: "1988-03-12",
    phone: "0803 555 0112",
    status: "admitted",
    ward: "Medical Ward A",
    bed: "MA-04",
    admittedAt: "2026-07-11T08:20:00Z",
  },
  {
    id: "p2",
    hospitalNo: "H001002",
    firstName: "Chibuike",
    lastName: "Eze",
    sex: "M",
    dob: "1975-11-30",
    phone: "0806 555 0198",
    status: "outpatient",
    ward: null,
    bed: null,
    admittedAt: null,
  },
  {
    id: "p3",
    hospitalNo: "H001003",
    firstName: "Fatima",
    lastName: "Bello",
    sex: "F",
    dob: "2001-06-05",
    phone: "0701 555 0143",
    status: "discharged",
    ward: null,
    bed: null,
    admittedAt: null,
  },
];

const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));

function nextHospitalNo() {
  _seq += 1;
  return HOSPITAL_NO_PREFIX + String(_seq).padStart(6, "0");
}

export async function listPatients({ query = "", status = "all" } = {}) {
  await delay();
  const q = query.trim().toLowerCase();
  return _patients
    .filter((p) => (status === "all" ? true : p.status === status))
    .filter((p) => {
      if (!q) return true;
      return (
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
        p.hospitalNo.toLowerCase().includes(q) ||
        (p.phone || "").includes(q)
      );
    })
    .sort((a, b) => a.lastName.localeCompare(b.lastName));
}

export async function getPatient(id) {
  await delay(60);
  return _patients.find((p) => p.id === id) || null;
}

export async function registerPatient(input) {
  await delay();
  const id = "p" + (_patients.length + 1) + "_" + Date.now();
  const patient = {
    id,
    hospitalNo: nextHospitalNo(),
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    sex: input.sex,
    dob: input.dob,
    phone: (input.phone || "").trim(),
    status: "outpatient",
    ward: null,
    bed: null,
    admittedAt: null,
  };
  _patients.unshift(patient);
  return patient;
}

export async function admitPatient(id, { ward, bed }) {
  const p = _patients.find((x) => x.id === id);
  if (!p) throw new Error("Patient not found");
  // Reserve the bed first — if it's taken, this throws and admit aborts.
  await assignBed(bed, p.id, `${p.lastName}, ${p.firstName}`);
  p.status = "admitted";
  p.ward = ward;
  p.bed = bed;
  p.admittedAt = new Date().toISOString();
  return p;
}

export async function transferPatient(id, { ward, bed }) {
  const p = _patients.find((x) => x.id === id);
  if (!p) throw new Error("Patient not found");
  if (p.status !== "admitted") throw new Error("Only admitted patients can transfer");
  // assignBed releases the old bed and claims the new one atomically.
  await assignBed(bed, p.id, `${p.lastName}, ${p.firstName}`);
  p.ward = ward;
  p.bed = bed;
  return p;
}

export async function dischargePatient(id) {
  const p = _patients.find((x) => x.id === id);
  if (!p) throw new Error("Patient not found");
  await releaseBedFor(p.id);
  p.status = "discharged";
  p.ward = null;
  p.bed = null;
  p.admittedAt = null;
  return p;
}

export const WARDS = [
  "Medical Ward A",
  "Medical Ward B",
  "Surgical Ward A",
  "Surgical Ward B",
  "ICU",
  "HDU",
  "Paediatric Ward",
  "Maternity Ward",
  "Private Suite",
  "Isolation Unit",
];

export function ageFromDob(dob) {
  if (!dob) return "";
  const d = new Date(dob);
  const diff = Date.now() - d.getTime();
  return Math.abs(new Date(diff).getUTCFullYear() - 1970);
}
