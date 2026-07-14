// Maternity & neonatology service.
// Tracks mothers through labour -> delivered, records the delivery outcome and
// newborn(s). A newborn with a low Apgar score feeds the Alerts screen.
// Reuses patientService for the mother. In-memory now; async API shaped for a
// later D1 swap.

const delay = (ms = 110) => new Promise((r) => setTimeout(r, ms));

export const LABOUR_STAGES = ["admitted", "first-stage", "second-stage", "delivered"];
export const STAGE_LABELS = {
  admitted: "Admitted",
  "first-stage": "First stage",
  "second-stage": "Second stage",
  delivered: "Delivered",
};

export const DELIVERY_MODES = ["Spontaneous vaginal", "Assisted vaginal", "Caesarean section"];

let _admSeq = 0;
const _admissions = [
  {
    id: "m1",
    ref: "MAT-0001",
    motherName: "Adaeze Okafor",
    hospitalNo: "H001001",
    gestation: 39,
    stage: "first-stage",
    admittedAt: new Date(Date.now() - 140 * 60000).toISOString(),
    delivery: null,
    newborns: [],
  },
];

function admRef() {
  _admSeq += 1;
  return "MAT-" + String(_admSeq + 1).padStart(4, "0");
}

export async function listAdmissions({ includeDelivered = true } = {}) {
  await delay();
  return _admissions
    .filter((a) => (includeDelivered ? true : a.stage !== "delivered"))
    .sort((a, b) => new Date(b.admittedAt) - new Date(a.admittedAt));
}

export async function admitMother({ motherName, hospitalNo, gestation }) {
  await delay();
  if (!motherName || !motherName.trim()) throw new Error("Enter the mother's name.");
  const g = parseInt(gestation, 10);
  if (!g || g < 20 || g > 45) throw new Error("Enter a valid gestation (weeks).");
  const adm = {
    id: "m" + Date.now(),
    ref: admRef(),
    motherName: motherName.trim(),
    hospitalNo: hospitalNo || "\u2014",
    gestation: g,
    stage: "admitted",
    admittedAt: new Date().toISOString(),
    delivery: null,
    newborns: [],
  };
  _admissions.unshift(adm);
  return adm;
}

export async function advanceLabour(id) {
  await delay(80);
  const a = _admissions.find((x) => x.id === id);
  if (!a) throw new Error("Admission not found");
  const i = LABOUR_STAGES.indexOf(a.stage);
  // Don't auto-advance into "delivered" — that happens via recordDelivery.
  if (i < LABOUR_STAGES.length - 2) a.stage = LABOUR_STAGES[i + 1];
  return a;
}

export async function recordDelivery(id, { mode, newborns }) {
  await delay();
  const a = _admissions.find((x) => x.id === id);
  if (!a) throw new Error("Admission not found");
  if (!DELIVERY_MODES.includes(mode)) throw new Error("Select a delivery mode.");
  if (!newborns || newborns.length === 0) throw new Error("Record at least one newborn.");
  for (const n of newborns) {
    const apgar = parseInt(n.apgar, 10);
    const weight = parseFloat(n.weight);
    if (Number.isNaN(apgar) || apgar < 0 || apgar > 10) throw new Error("Apgar must be 0–10.");
    if (Number.isNaN(weight) || weight <= 0) throw new Error("Enter each newborn's weight.");
  }
  a.delivery = { mode, at: new Date().toISOString() };
  a.newborns = newborns.map((n, i) => ({
    id: `${a.id}-nb${i + 1}`,
    sex: n.sex,
    weight: parseFloat(n.weight),
    apgar: parseInt(n.apgar, 10),
  }));
  a.stage = "delivered";
  return a;
}

// Feed for Alerts: newborns with a low 5-minute Apgar (< 7) need attention.
export async function listNeonatalAlerts() {
  await delay(60);
  const out = [];
  for (const a of _admissions) {
    for (const nb of a.newborns) {
      if (nb.apgar < 7) {
        out.push({ motherName: a.motherName, ref: a.ref, sex: nb.sex, apgar: nb.apgar, weight: nb.weight });
      }
    }
  }
  return out;
}
