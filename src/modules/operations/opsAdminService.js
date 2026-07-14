// Operations admin service — theatre/roster scheduling, facility & waste,
// support services (catering/laundry/mortuary), and visitor management.
// Lightweight registries to complete the Operations group.
// In-memory now; async API shaped for a later D1 swap.

const delay = (ms = 90) => new Promise((r) => setTimeout(r, ms));
const iso = (m) => new Date(Date.now() + m * 60000).toISOString();

/* -------- Scheduling & rosters -------- */
const _shifts = [
  { id: "sh1", unit: "Emergency Department", shift: "Morning (07:00–15:00)", staff: "Dr. Umeh, Sr. Ade", date: "today" },
  { id: "sh2", unit: "ICU", shift: "Morning (07:00–15:00)", staff: "Dr. Ogun, 3 nurses", date: "today" },
  { id: "sh3", unit: "Labour Ward", shift: "Afternoon (15:00–23:00)", staff: "Miss Balogun, 2 midwives", date: "today" },
  { id: "sh4", unit: "Theatre 1", shift: "Morning (07:00–15:00)", staff: "Mr. Okonkwo + team", date: "today" },
];
export async function listShifts() { await delay(); return [..._shifts]; }
export async function addShift(s) {
  await delay();
  if (!s.unit || !s.shift) throw new Error("Enter unit and shift.");
  const shift = { id: "sh" + Date.now(), date: "today", ...s };
  _shifts.push(shift);
  return shift;
}

/* -------- Facility & waste -------- */
const _facility = [
  { id: "fac1", area: "Water supply", status: "operational", note: "Both tanks full" },
  { id: "fac2", area: "Backup generator", status: "operational", note: "Fuel 78%" },
  { id: "fac3", area: "Medical waste", status: "attention", note: "Sharps bins at Theatre 2 full — collection due" },
  { id: "fac4", area: "Oxygen plant", status: "operational", note: "Pressure nominal" },
  { id: "fac5", area: "HVAC — ICU", status: "operational", note: "" },
];
export async function listFacility() { await delay(); return [..._facility]; }
export async function setFacilityStatus(id, status) {
  await delay(60);
  const f = _facility.find((x) => x.id === id);
  if (!f) throw new Error("Not found");
  f.status = status;
  return f;
}

/* -------- Support services -------- */
const _support = [
  { id: "sup1", service: "Catering", metric: "Meals served today", value: "412" },
  { id: "sup2", service: "Laundry", metric: "Linen sets processed", value: "260" },
  { id: "sup3", service: "Mortuary", metric: "Current occupancy", value: "7 / 20" },
  { id: "sup4", service: "Cleaning", metric: "Zones cleaned (of 14)", value: "11" },
];
export async function listSupport() { await delay(); return [..._support]; }

/* -------- Visitor management -------- */
let _visSeq = 0;
const _visitors = [
  { id: "v1", name: "Mrs. Okafor", visiting: "Adaeze Okafor (MA-04)", pass: "VP-0001", in: iso(-45), out: null },
];
export async function listVisitors({ activeOnly = true } = {}) {
  await delay();
  return _visitors.filter((v) => (activeOnly ? !v.out : true)).sort((a, b) => new Date(b.in) - new Date(a.in));
}
export async function checkInVisitor({ name, visiting }) {
  await delay();
  if (!name || !name.trim()) throw new Error("Enter visitor name.");
  if (!visiting || !visiting.trim()) throw new Error("Enter who they're visiting.");
  _visSeq += 1;
  const v = { id: "v" + Date.now(), name: name.trim(), visiting: visiting.trim(), pass: "VP-" + String(_visSeq + 1).padStart(4, "0"), in: new Date().toISOString(), out: null };
  _visitors.unshift(v);
  return v;
}
export async function checkOutVisitor(id) {
  await delay(60);
  const v = _visitors.find((x) => x.id === id);
  if (!v) throw new Error("Not found");
  v.out = new Date().toISOString();
  return v;
}
