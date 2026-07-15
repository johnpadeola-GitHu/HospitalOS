// Blood bank & transfusion service.
// Two registries: blood units (by group, with expiry) and transfusion requests
// (crossmatch -> issued -> transfused). Low group stock and near-expiry units
// feed the Alerts screen. Reuses patientService for the recipient.
// In-memory now; async API shaped for a later D1 swap.

const delay = (ms = 110) => new Promise((r) => setTimeout(r, ms));

export const BLOOD_GROUPS = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"];

// Reorder threshold per group (units). Universal/rare groups kept higher.
const REORDER = { "O-": 6, "O+": 8, "A-": 3, "A+": 6, "B-": 3, "B+": 5, "AB-": 2, "AB+": 3 };

// ABO/Rh compatibility: recipient group -> compatible donor groups.
const COMPATIBLE = {
  "O-": ["O-"],
  "O+": ["O-", "O+"],
  "A-": ["O-", "A-"],
  "A+": ["O-", "O+", "A-", "A+"],
  "B-": ["O-", "B-"],
  "B+": ["O-", "O+", "B-", "B+"],
  "AB-": ["O-", "A-", "B-", "AB-"],
  "AB+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
};

function daysFromNow(d) {
  return new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);
}

let _unitSeq = 100;
const _units = [];
// Seed realistic stock: comfortably above reorder for common groups, with O-
// left low (below its reorder of 6) and one near-expiry unit, so alerts
// demonstrate without flooding. Rare groups kept modest but adequate.
const SEED_STOCK = { "O-": 4, "O+": 12, "A-": 5, "A+": 10, "B-": 4, "B+": 7, "AB-": 3, "AB+": 4 };
(function seedUnits() {
  for (const g of BLOOD_GROUPS) {
    const n = SEED_STOCK[g] || 4;
    for (let i = 0; i < n; i++) {
      _unitSeq += 1;
      // Give O+ one near-expiry unit; everything else 14–35 days out.
      const exp = g === "O+" && i === 0 ? 2 : 14 + ((i * 7) % 21);
      _units.push({ id: `bs${_unitSeq}`, tag: "U-" + String(_unitSeq).padStart(4, "0"), group: g, expiry: daysFromNow(exp), status: "available" });
    }
  }
})();

let _reqSeq = 300;
const _requests = [];

function expiryDays(expiry) {
  return Math.round((new Date(expiry) - Date.now()) / 86400000);
}

export function compatibleDonors(recipientGroup) {
  return COMPATIBLE[recipientGroup] || [];
}

// Inventory grouped by blood group with counts and low flag.
export async function listInventory() {
  await delay();
  const avail = _units.filter((u) => u.status === "available");
  return BLOOD_GROUPS.map((g) => {
    const units = avail.filter((u) => u.group === g);
    const reorder = REORDER[g];
    return {
      group: g,
      count: units.length,
      reorder,
      low: units.length < reorder,
      nearExpiry: units.filter((u) => expiryDays(u.expiry) <= 5).length,
      units: units.map((u) => ({ ...u, days: expiryDays(u.expiry) })).sort((a, b) => a.days - b.days),
    };
  });
}

export async function addUnit({ group, expiryDaysAhead = 35 }) {
  await delay();
  if (!BLOOD_GROUPS.includes(group)) throw new Error("Choose a valid blood group.");
  _unitSeq += 1;
  const unit = { id: "b" + Date.now(), tag: "U-" + String(_unitSeq).padStart(4, "0"), group, expiry: daysFromNow(expiryDaysAhead), status: "available" };
  _units.push(unit);
  return unit;
}

export async function listRequests({ includeCompleted = false } = {}) {
  await delay();
  return _requests
    .filter((r) => (includeCompleted ? true : r.status !== "transfused"))
    .sort((a, b) => new Date(b.at) - new Date(a.at));
}

// Create a crossmatch request; reserves a compatible available unit.
export async function createRequest({ patientId, patientName, hospitalNo, recipientGroup }) {
  await delay();
  if (!BLOOD_GROUPS.includes(recipientGroup)) throw new Error("Select the recipient's blood group.");
  const donors = compatibleDonors(recipientGroup);
  const unit = _units.find((u) => u.status === "available" && donors.includes(u.group));
  if (!unit) throw new Error(`No compatible unit available for ${recipientGroup}.`);
  unit.status = "crossmatched";
  _reqSeq += 1;
  const req = {
    id: "req" + Date.now(),
    ref: "XM-" + String(_reqSeq).padStart(4, "0"),
    patientId,
    patientName,
    hospitalNo,
    recipientGroup,
    unitId: unit.id,
    unitTag: unit.tag,
    unitGroup: unit.group,
    status: "crossmatched",
    at: new Date().toISOString(),
  };
  _requests.unshift(req);
  return req;
}

export async function issueRequest(id) {
  await delay(80);
  const r = _requests.find((x) => x.id === id);
  if (!r) throw new Error("Request not found");
  if (r.status !== "crossmatched") throw new Error("Only crossmatched requests can be issued.");
  const unit = _units.find((u) => u.id === r.unitId);
  if (unit) unit.status = "issued";
  r.status = "issued";
  return r;
}

export async function completeTransfusion(id) {
  await delay(80);
  const r = _requests.find((x) => x.id === id);
  if (!r) throw new Error("Request not found");
  if (r.status !== "issued") throw new Error("Issue the unit before recording transfusion.");
  const unit = _units.find((u) => u.id === r.unitId);
  if (unit) unit.status = "transfused";
  r.status = "transfused";
  r.completedAt = new Date().toISOString();
  return r;
}

// Feed for Alerts: groups below reorder, and units expiring within 5 days.
export async function listBloodAlerts() {
  await delay(60);
  const inv = await listInventory();
  const lowGroups = inv.filter((g) => g.low).map((g) => ({ kind: "low-group", group: g.group, count: g.count, reorder: g.reorder }));
  const expiring = [];
  for (const g of inv) {
    for (const u of g.units) {
      if (u.days <= 5) expiring.push({ kind: "near-expiry", tag: u.tag, group: g.group, days: u.days });
    }
  }
  return [...lowGroups, ...expiring];
}
