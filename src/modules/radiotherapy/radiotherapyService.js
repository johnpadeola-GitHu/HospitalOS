// Radiotherapy service.
// A radiotherapy course delivers a number of fractions on a linear accelerator.
// Tracks fractions delivered vs prescribed. In-memory now; async API shaped for
// a later D1 swap.

const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));

export const INTENT = ["Curative", "Palliative", "Adjuvant"];

let _seq = 0;
const _courses = [
  { id: "rt1", ref: "RT-0001", patientName: "Eze, Chibuike", hospitalNo: "H001002", site: "Prostate", intent: "Curative", dosePerFraction: 2, fractionsPlanned: 37, fractionsDone: 12, machine: "LINAC-1" },
  { id: "rt2", ref: "RT-0002", patientName: "Okafor, Adaeze", hospitalNo: "H001001", site: "Breast", intent: "Adjuvant", dosePerFraction: 2.67, fractionsPlanned: 15, fractionsDone: 15, machine: "LINAC-1" },
];

function ref() { _seq += 1; return "RT-" + String(_seq + 2).padStart(4, "0"); }

export async function listCourses() {
  await delay();
  return _courses.map((c) => ({
    ...c,
    complete: c.fractionsDone >= c.fractionsPlanned,
    totalDose: (c.dosePerFraction * c.fractionsPlanned).toFixed(1),
  }));
}

export async function createCourse({ patientName, hospitalNo, site, intent, dosePerFraction, fractionsPlanned, machine }) {
  await delay();
  if (!patientName || !patientName.trim()) throw new Error("Enter the patient.");
  if (!site || !site.trim()) throw new Error("Enter the treatment site.");
  const fx = parseInt(fractionsPlanned, 10);
  if (!fx || fx < 1) throw new Error("Enter planned fractions.");
  _seq++;
  const c = {
    id: "rt" + Date.now(), ref: ref(), patientName: patientName.trim(), hospitalNo: hospitalNo || "\u2014",
    site: site.trim(), intent: intent || "Curative", dosePerFraction: parseFloat(dosePerFraction) || 2,
    fractionsPlanned: fx, fractionsDone: 0, machine: machine || "LINAC-1",
  };
  _courses.unshift(c);
  return c;
}

export async function deliverFraction(id) {
  await delay(80);
  const c = _courses.find((x) => x.id === id);
  if (!c) throw new Error("Course not found");
  if (c.fractionsDone >= c.fractionsPlanned) throw new Error("Course already complete.");
  c.fractionsDone += 1;
  return c;
}
