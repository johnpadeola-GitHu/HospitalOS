// Bed registry.
// Source of truth for wards, beds, and occupancy. Both the bed board and the
// ADT admit/transfer flows read and write here, so a bed cannot be assigned to
// two patients. In-memory for now; async API shaped for a later D1 swap.

const delay = (ms = 110) => new Promise((r) => setTimeout(r, ms));

// Accommodation tiers — the six categories from the architecture, each with a
// nightly rate. The tier drives bed charges, so a VIP suite bills differently
// from a general bed.
export const TIERS = {
  general:     { key: "general",     label: "General Ward",     rate: 15000 },
  "semi-private": { key: "semi-private", label: "Semi-Private",  rate: 35000 },
  private:     { key: "private",     label: "Private Room",     rate: 60000 },
  suite:       { key: "suite",       label: "Private Suite",    rate: 120000 },
  vip:         { key: "vip",         label: "VIP Suite",        rate: 220000 },
  executive:   { key: "executive",   label: "Executive Suite",  rate: 350000 },
  critical:    { key: "critical",    label: "Critical Care",    rate: 180000 },
};

export const TIER_LIST = Object.values(TIERS);

// Each ward has a fixed set of bed codes and an accommodation tier.
const WARD_DEFS = [
  { name: "Medical Ward A", code: "MA", beds: 8, tier: "general" },
  { name: "Medical Ward B", code: "MB", beds: 8, tier: "general" },
  { name: "Surgical Ward A", code: "SA", beds: 6, tier: "general" },
  { name: "Surgical Ward B", code: "SB", beds: 6, tier: "general" },
  { name: "Semi-Private Wing", code: "SPW", beds: 6, tier: "semi-private" },
  { name: "Private Rooms", code: "PR", beds: 6, tier: "private" },
  { name: "Private Suite", code: "PS", beds: 5, tier: "suite" },
  { name: "VIP Suite", code: "VIP", beds: 3, tier: "vip" },
  { name: "Executive Suite", code: "EXE", beds: 2, tier: "executive" },
  { name: "ICU", code: "ICU", beds: 4, tier: "critical" },
  { name: "HDU", code: "HDU", beds: 4, tier: "critical" },
  { name: "Paediatric Ward", code: "PED", beds: 6, tier: "general" },
  { name: "Maternity Ward", code: "MAT", beds: 6, tier: "general" },
  { name: "Isolation Unit", code: "ISO", beds: 3, tier: "private" },
];

// Build the bed table.
const _beds = [];
for (const w of WARD_DEFS) {
  for (let i = 1; i <= w.beds; i++) {
    _beds.push({
      id: `${w.code}-${String(i).padStart(2, "0")}`,
      ward: w.name,
      tier: w.tier,
      occupantId: null,
      occupantName: null,
      since: null,
    });
  }
}

// Seed occupancy to match the two admitted sample patients in patientService.
function seed(bedId, occupantId, occupantName) {
  const b = _beds.find((x) => x.id === bedId);
  if (b) {
    b.occupantId = occupantId;
    b.occupantName = occupantName;
  }
}
seed("MA-04", "p1", "Okafor, Adaeze");
seed("ICU-01", "p2", "Eze, Chibuike");

export const WARD_NAMES = WARD_DEFS.map((w) => w.name);

export async function listWards() {
  await delay();
  return WARD_DEFS.map((w) => {
    const beds = _beds.filter((b) => b.ward === w.name);
    const occupied = beds.filter((b) => b.occupantId).length;
    return {
      name: w.name,
      code: w.code,
      tier: w.tier,
      tierLabel: TIERS[w.tier].label,
      rate: TIERS[w.tier].rate,
      total: beds.length,
      occupied,
      free: beds.length - occupied,
      beds: beds.map((b) => ({ ...b })),
    };
  });
}

export async function freeBedsForWard(wardName) {
  await delay(60);
  return _beds.filter((b) => b.ward === wardName && !b.occupantId).map((b) => b.id);
}

// Assign a patient to a bed. Throws if the bed is taken by someone else.
// Releases any bed the patient previously held (handles transfers cleanly).
export async function assignBed(bedId, occupantId, occupantName) {
  await delay();
  const target = _beds.find((b) => b.id === bedId);
  if (!target) throw new Error("That bed does not exist.");
  if (target.occupantId && target.occupantId !== occupantId) {
    throw new Error(`Bed ${bedId} is already occupied.`);
  }
  for (const b of _beds) {
    if (b.occupantId === occupantId) {
      b.occupantId = null;
      b.occupantName = null;
      b.since = null;
    }
  }
  target.occupantId = occupantId;
  target.occupantName = occupantName;
  target.since = new Date().toISOString();
  return { ...target };
}

export async function releaseBedFor(occupantId) {
  await delay(60);
  for (const b of _beds) {
    if (b.occupantId === occupantId) {
      b.occupantId = null;
      b.occupantName = null;
      b.since = null;
    }
  }
}

// Feed for Billing: accommodation charges for currently occupied beds.
// Bills whole nights, minimum one, at the tier rate for that ward.
export async function listBillableBedNights() {
  await delay(60);
  return _beds
    .filter((b) => b.occupantId && b.since)
    .map((b) => {
      const nights = Math.max(1, Math.ceil((Date.now() - new Date(b.since)) / 86400000));
      const tier = TIERS[b.tier];
      return {
        patientId: b.occupantId,
        patientName: b.occupantName,
        hospitalNo: "\u2014",
        source: "Accommodation",
        description: `${tier.label} — ${b.ward} ${b.id} (${nights} night${nights > 1 ? "s" : ""})`,
        reference: b.id,
        amount: tier.rate * nights,
        at: b.since,
      };
    });
}
