import { priceFor } from "../../engines/pricing";
// Theatre & day surgery service.
// A surgical case moves: scheduled -> in-theatre -> recovery -> completed.
// Each procedure is priced, so completed (or in-progress) cases are billable.
// In-memory now; async API shaped for a later D1 swap.

const delay = (ms = 110) => new Promise((r) => setTimeout(r, ms));

export const THEATRES = ["Theatre 1", "Theatre 2", "Theatre 3", "Day Surgery Suite"];

export const PROCEDURES = [
  { code: "APPEND", name: "Appendectomy", price: 180000 },
  { code: "CS", name: "Caesarean Section", price: 250000 },
  { code: "HERNIA", name: "Hernia Repair", price: 160000 },
  { code: "LAPCHOLE", name: "Laparoscopic Cholecystectomy", price: 420000 },
  { code: "ORIF", name: "ORIF (Fracture Fixation)", price: 380000 },
  { code: "CATARACT", name: "Cataract Extraction", price: 120000 },
  { code: "D&C", name: "Dilation & Curettage", price: 90000 },
  { code: "TAH", name: "Total Abdominal Hysterectomy", price: 350000 },
];

export const CASE_STAGES = ["scheduled", "in-theatre", "recovery", "completed"];
export const STAGE_LABELS = {
  scheduled: "Scheduled",
  "in-theatre": "In theatre",
  recovery: "Recovery",
  completed: "Completed",
};

export const SURGEONS = ["Mr. Okonkwo", "Miss Balogun", "Mr. Danjuma", "Prof. Adeyemi"];

export function getProcedure(code) {
  return PROCEDURES.find((p) => p.code === code) || null;
}

let _caseSeq = 700;
const _cases = [
  {
    id: "t1",
    ref: "OT-0701",
    patientId: "p1",
    patientName: "Okafor, Adaeze",
    hospitalNo: "H001001",
    procCode: "APPEND",
    procName: "Appendectomy",
    theatre: "Theatre 1",
    surgeon: "Mr. Okonkwo",
    stage: "scheduled",
    scheduledFor: new Date(Date.now() + 90 * 60000).toISOString(),
    at: new Date(Date.now() - 30 * 60000).toISOString(),
  },
];

function caseRef() {
  _caseSeq += 1;
  return "OT-" + String(_caseSeq).padStart(4, "0");
}

export async function listCases({ includeCompleted = false } = {}) {
  await delay();
  return _cases
    .filter((c) => (includeCompleted ? true : c.stage !== "completed"))
    .sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor));
}

export async function scheduleCase({ patientId, patientName, hospitalNo, procCode, theatre, surgeon, scheduledFor }) {
  await delay();
  const proc = getProcedure(procCode);
  if (!proc) throw new Error("Choose a procedure.");
  if (!theatre) throw new Error("Assign a theatre.");
  const c = {
    id: "t" + Date.now(),
    ref: caseRef(),
    patientId,
    patientName,
    hospitalNo,
    procCode: proc.code,
    procName: proc.name,
    theatre,
    surgeon: surgeon || SURGEONS[0],
    stage: "scheduled",
    scheduledFor: scheduledFor || new Date(Date.now() + 3600000).toISOString(),
    at: new Date().toISOString(),
  };
  _cases.unshift(c);
  return c;
}

export async function advanceCase(id) {
  await delay(80);
  const c = _cases.find((x) => x.id === id);
  if (!c) throw new Error("Case not found");
  const i = CASE_STAGES.indexOf(c.stage);
  if (i < CASE_STAGES.length - 1) c.stage = CASE_STAGES[i + 1];
  if (c.stage === "completed") c.completedAt = new Date().toISOString();
  return c;
}

// Feed for Billing: cases that have entered theatre (in-theatre or beyond)
// are billable for the procedure fee.
export async function listBillableProcedures() {
  await delay(60);
  const billableStages = ["in-theatre", "recovery", "completed"];
  return _cases
    .filter((c) => billableStages.includes(c.stage))
    .map((c) => {
      const proc = getProcedure(c.procCode);
      return {
        patientId: c.patientId,
        patientName: c.patientName,
        hospitalNo: c.hospitalNo,
        source: "Theatre",
        description: c.procName,
        reference: c.ref,
        amount: proc ? priceFor("theatre", c.procCode, proc.price) : 0,
        at: c.at,
      };
    });
}
