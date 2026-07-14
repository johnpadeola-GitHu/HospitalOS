// Rehabilitation & therapy service — physiotherapy, occupational, speech.
// Tracks therapy referrals and sessions completed vs planned.
// In-memory now; async API shaped for a later D1 swap.

const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));

export const THERAPIES = ["Physiotherapy", "Occupational Therapy", "Speech Therapy"];

const _referrals = [
  { id: "rh1", patientName: "Okafor, Adaeze", hospitalNo: "H001001", therapy: "Physiotherapy", reason: "Post-op mobilisation", sessionsDone: 3, sessionsPlanned: 10 },
  { id: "rh2", patientName: "Eze, Chibuike", hospitalNo: "H001002", therapy: "Occupational Therapy", reason: "ADL retraining", sessionsDone: 1, sessionsPlanned: 8 },
];

export async function listRehab() {
  await delay();
  return _referrals.map((r) => ({ ...r, complete: r.sessionsDone >= r.sessionsPlanned }));
}

export async function logSession(id) {
  await delay(80);
  const r = _referrals.find((x) => x.id === id);
  if (!r) throw new Error("Referral not found");
  if (r.sessionsDone >= r.sessionsPlanned) throw new Error("Course already complete.");
  r.sessionsDone += 1;
  return r;
}

export async function addRehab({ patientName, hospitalNo, therapy, reason, sessionsPlanned }) {
  await delay();
  if (!patientName || !patientName.trim()) throw new Error("Enter the patient.");
  const n = parseInt(sessionsPlanned, 10);
  if (!n || n < 1) throw new Error("Enter planned sessions.");
  const r = { id: "rh" + Date.now(), patientName: patientName.trim(), hospitalNo: hospitalNo || "\u2014", therapy: therapy || THERAPIES[0], reason: reason || "", sessionsDone: 0, sessionsPlanned: n };
  _referrals.unshift(r);
  return r;
}
