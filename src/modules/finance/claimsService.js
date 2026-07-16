// Insurance & NHIA claims service.
// NHIA: National Health Insurance Authority (formerly NHIS), per the
// National Health Insurance Authority Act 2022.
// A claim is raised against a patient's charges to an insurer and moves:
// submitted -> approved | rejected -> paid (approved only).
// In-memory now; async API shaped for a later D1 swap.

const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));

export const INSURERS = ["NHIA", "Hygeia HMO", "AXA Mansard", "Reliance HMO", "Avon HMO"];

export const CLAIM_STATUSES = ["submitted", "approved", "rejected", "paid"];
export const STATUS_LABELS = {
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
  paid: "Paid",
};

let _claimSeq = 900;
const _claims = [
  {
    id: "cl1",
    ref: "CLM-0901",
    patientName: "Eze, Chibuike",
    hospitalNo: "H001002",
    insurer: "NHIA",
    amount: 42000,
    status: "submitted",
    at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

function claimRef() {
  _claimSeq += 1;
  return "CLM-" + String(_claimSeq).padStart(4, "0");
}

export async function listClaims({ status = "all" } = {}) {
  await delay();
  return _claims
    .filter((c) => (status === "all" ? true : c.status === status))
    .sort((a, b) => new Date(b.at) - new Date(a.at));
}

export async function createClaim({ patientName, hospitalNo, insurer, amount }) {
  await delay();
  const amt = parseFloat(amount);
  if (!patientName || !patientName.trim()) throw new Error("Enter the patient.");
  if (!INSURERS.includes(insurer)) throw new Error("Choose an insurer.");
  if (!amt || amt <= 0) throw new Error("Enter a claim amount.");
  const claim = {
    id: "cl" + Date.now(),
    ref: claimRef(),
    patientName: patientName.trim(),
    hospitalNo: hospitalNo || "\u2014",
    insurer,
    amount: amt,
    status: "submitted",
    at: new Date().toISOString(),
  };
  _claims.unshift(claim);
  return claim;
}

export async function setClaimStatus(id, status) {
  await delay(80);
  const c = _claims.find((x) => x.id === id);
  if (!c) throw new Error("Claim not found");
  if (!CLAIM_STATUSES.includes(status)) throw new Error("Unknown status");
  // Guard the lifecycle: can only pay an approved claim.
  if (status === "paid" && c.status !== "approved") throw new Error("Only approved claims can be marked paid.");
  if ((status === "approved" || status === "rejected") && c.status !== "submitted") {
    throw new Error("Only submitted claims can be approved or rejected.");
  }
  c.status = status;
  return c;
}

export async function claimsSummary() {
  await delay(60);
  const sum = (pred) => _claims.filter(pred).reduce((s, c) => s + c.amount, 0);
  return {
    total: _claims.length,
    submittedValue: sum((c) => c.status === "submitted"),
    approvedValue: sum((c) => c.status === "approved"),
    paidValue: sum((c) => c.status === "paid"),
    rejectedValue: sum((c) => c.status === "rejected"),
  };
}
