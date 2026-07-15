// Settlement & metering service — the AgoroX revenue side.
//
// Two things a SaaS operator needs that a hospital user never sees:
//   1. SETTLEMENT — money the hospital collected flows to AgoroX minus the
//      platform fee, on a cycle, with a payout record.
//   2. METERING — what each tenant actually consumed, which is what justifies
//      the invoice and informs plan sizing.
//
// The platform fee is 3.25%, consistent with the AgoroX standard.
// In-memory now; async API shaped for a later D1 swap.

const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));

export const PLATFORM_FEE_RATE = 0.0325; // 3.25%

export const SETTLEMENT_STATUS = ["pending", "processing", "settled", "failed"];
export const STATUS_TONE = { pending: "warn", processing: "info", settled: "good", failed: "bad" };

/* ---------------- Settlement cycles ---------------- */

function cycle(id, month, gross, status, paidAt = null) {
  const fee = Math.round(gross * PLATFORM_FEE_RATE);
  return { id, month, gross, fee, net: gross - fee, status, paidAt, ref: "STL-" + id.toUpperCase() };
}

const _settlements = [
  cycle("s2607", "July 2026", 4820000, "pending"),
  cycle("s2606", "June 2026", 6140000, "settled", "2026-07-02"),
  cycle("s2605", "May 2026", 5390000, "settled", "2026-06-02"),
  cycle("s2604", "April 2026", 4970000, "settled", "2026-05-02"),
  cycle("s2603", "March 2026", 3820000, "settled", "2026-04-02"),
  cycle("s2602", "February 2026", 2450000, "failed", null),
];

export async function listSettlements() {
  await delay();
  return _settlements.map((s) => ({ ...s }));
}

export async function advanceSettlement(id) {
  await delay(80);
  const s = _settlements.find((x) => x.id === id);
  if (!s) throw new Error("Settlement not found");
  if (s.status === "settled") throw new Error("Already settled.");
  if (s.status === "pending") s.status = "processing";
  else if (s.status === "processing" || s.status === "failed") {
    s.status = "settled";
    s.paidAt = new Date().toISOString().slice(0, 10);
  }
  return s;
}

export async function settlementSummary() {
  await delay(60);
  const settled = _settlements.filter((s) => s.status === "settled");
  const pending = _settlements.filter((s) => s.status !== "settled");
  return {
    lifetimeGross: _settlements.reduce((a, s) => a + s.gross, 0),
    lifetimeFees: settled.reduce((a, s) => a + s.fee, 0),
    pendingFees: pending.reduce((a, s) => a + s.fee, 0),
    settledCount: settled.length,
    pendingCount: pending.length,
    feeRate: PLATFORM_FEE_RATE,
    // Six-month fee trend for the chart.
    trend: [..._settlements].reverse().map((s) => ({ month: s.month.split(" ")[0].slice(0, 3), fee: s.fee, gross: s.gross })),
  };
}

/* ---------------- Payout destination ---------------- */

const _payout = {
  bank: "Guaranty Trust Bank",
  accountName: "AgoroX Technologies Ltd",
  accountNumber: "0123456789",
  schedule: "Monthly, 2nd working day",
  processor: "Paystack",
};

export async function payoutAccount() {
  await delay(50);
  return { ..._payout };
}

/* ---------------- Usage metering ---------------- */

// What each tenant consumed this cycle. This is the evidence behind the invoice.
const _usage = [
  { tenant: "Ibadan Teaching Hospital", plan: "Enterprise", seats: 240, activeUsers: 186, encounters: 4820, labOrders: 3140, imaging: 610, prescriptions: 2890, storageGb: 84, apiCalls: 412000 },
  { tenant: "Lagoon Specialist Clinic", plan: "Standard", seats: 40, activeUsers: 31, encounters: 940, labOrders: 720, imaging: 88, prescriptions: 610, storageGb: 12, apiCalls: 64000 },
  { tenant: "Jos Community Hospital", plan: "Trial", seats: 15, activeUsers: 9, encounters: 120, labOrders: 74, imaging: 6, prescriptions: 65, storageGb: 2, apiCalls: 9100 },
  { tenant: "Kano Medical Centre", plan: "Standard", seats: 60, activeUsers: 0, encounters: 0, labOrders: 0, imaging: 0, prescriptions: 0, storageGb: 7, apiCalls: 0 },
  { tenant: "AgoroX Demo", plan: "Lifetime", seats: 5, activeUsers: 2, encounters: 40, labOrders: 22, imaging: 4, prescriptions: 18, storageGb: 1, apiCalls: 2400 },
];

export async function listUsage() {
  await delay();
  return _usage.map((u) => ({
    ...u,
    seatUtilisation: u.seats ? Math.round((u.activeUsers / u.seats) * 100) : 0,
  }));
}

export async function usageSummary() {
  await delay(60);
  const t = (k) => _usage.reduce((a, u) => a + u[k], 0);
  const seats = t("seats");
  const active = t("activeUsers");
  return {
    tenants: _usage.length,
    seats,
    activeUsers: active,
    seatUtilisation: seats ? Math.round((active / seats) * 100) : 0,
    encounters: t("encounters"),
    labOrders: t("labOrders"),
    imaging: t("imaging"),
    prescriptions: t("prescriptions"),
    storageGb: t("storageGb"),
    apiCalls: t("apiCalls"),
    // Which tenants are underusing their seats — the churn signal worth watching.
    underused: _usage
      .filter((u) => u.seats >= 15 && u.activeUsers / u.seats < 0.5)
      .map((u) => ({ tenant: u.tenant, seats: u.seats, activeUsers: u.activeUsers })),
  };
}

/**
 * Revenue mix by module — what the hospital is billing its patients for.
 * Informs which modules justify their existence commercially.
 */
export async function revenueMix() {
  await delay(60);
  return [
    { source: "Theatre", amount: 1840000 },
    { source: "Accommodation", amount: 1220000 },
    { source: "Radiology", amount: 780000 },
    { source: "Laboratory", amount: 590000 },
    { source: "Pharmacy", amount: 390000 },
  ];
}
