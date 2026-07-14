// Bed registry.
// Source of truth for wards, beds, and occupancy. Both the bed board and the
// ADT admit/transfer flows read and write here, so a bed cannot be assigned to
// two patients. In-memory for now; async API shaped for a later D1 swap.

const delay = (ms = 110) => new Promise((r) => setTimeout(r, ms));

// Each ward has a fixed set of bed codes. occupantId links to a patient id
// (from patientService); null means the bed is free.
const WARD_DEFS = [
  { name: "Medical Ward A", code: "MA", beds: 8 },
  { name: "Medical Ward B", code: "MB", beds: 8 },
  { name: "Surgical Ward A", code: "SA", beds: 6 },
  { name: "Surgical Ward B", code: "SB", beds: 6 },
  { name: "ICU", code: "ICU", beds: 4 },
  { name: "HDU", code: "HDU", beds: 4 },
  { name: "Paediatric Ward", code: "PED", beds: 6 },
  { name: "Maternity Ward", code: "MAT", beds: 6 },
  { name: "Private Suite", code: "PS", beds: 5 },
  { name: "Isolation Unit", code: "ISO", beds: 3 },
];

// Build the bed table.
const _beds = [];
for (const w of WARD_DEFS) {
  for (let i = 1; i <= w.beds; i++) {
    _beds.push({
      id: `${w.code}-${String(i).padStart(2, "0")}`,
      ward: w.name,
      occupantId: null,
      occupantName: null,
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

export const WARD_NAMES = WARD_DEFS.map((w) => w.name);

export async function listWards() {
  await delay();
  return WARD_DEFS.map((w) => {
    const beds = _beds.filter((b) => b.ward === w.name);
    const occupied = beds.filter((b) => b.occupantId).length;
    return {
      name: w.name,
      code: w.code,
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
    }
  }
  target.occupantId = occupantId;
  target.occupantName = occupantName;
  return { ...target };
}

export async function releaseBedFor(occupantId) {
  await delay(60);
  for (const b of _beds) {
    if (b.occupantId === occupantId) {
      b.occupantId = null;
      b.occupantName = null;
    }
  }
}
