// Analytics service.
// Composes read-only aggregates across modules for the Intelligence layer.
// Like the Dashboard it owns no data — it reads the operational services and
// derives KPIs and breakdowns. In-memory; async like everything else.

import { listPatients } from "../patients/patientService";
import { listWards } from "../wards/bedService";
import { listOrders } from "../lab/labService";
import { listStudies } from "../radiology/radiologyService";
import { listDrugs } from "../pharmacy/pharmacyService";
import { listEncounters } from "../emergency/emergencyService";
import { billingSummary } from "../finance/billingService";

const naira = (n) => Math.round(n);

export async function analytics() {
  const [patients, wards, orders, studies, drugs, edActive, edAll, billing] = await Promise.all([
    listPatients({ status: "all" }),
    listWards(),
    listOrders({ status: "all" }),
    listStudies({}),
    listDrugs({}),
    listEncounters({ includeDisposed: false }),
    listEncounters({ includeDisposed: true }),
    billingSummary(),
  ]);

  const beds = wards.reduce((a, w) => ({ total: a.total + w.total, occupied: a.occupied + w.occupied }), { total: 0, occupied: 0 });

  // Lab: turnaround = verified / total, plus stage breakdown.
  const labByStage = orders.reduce((a, o) => ((a[o.status] = (a[o.status] || 0) + 1), a), {});
  const labVerified = labByStage.verified || 0;
  const labCompletion = orders.length ? Math.round((labVerified / orders.length) * 100) : 0;

  // Radiology by modality.
  const radByModality = studies.reduce((a, s) => ((a[s.modality] = (a[s.modality] || 0) + 1), a), {});

  // Pharmacy stock health.
  const lowStock = drugs.filter((d) => d.state !== "ok").length;

  // ED dispositions from full history.
  const edDispositions = edAll.reduce((a, e) => {
    if (e.disposition) a[e.disposition] = (a[e.disposition] || 0) + 1;
    return a;
  }, {});

  return {
    kpis: {
      patients: patients.length,
      admitted: patients.filter((p) => p.status === "admitted").length,
      occupancy: beds.total ? Math.round((beds.occupied / beds.total) * 100) : 0,
      labCompletion,
      edActive: edActive.length,
      revenue: naira(billing.collected),
      outstanding: naira(billing.outstanding),
      lowStock,
    },
    wards: wards.map((w) => ({ name: w.name, occupied: w.occupied, total: w.total })),
    labByStage,
    radByModality,
    edDispositions,
    billing,
  };
}

// Simple projections for the Forecasting screen. These are deterministic
// illustrative models over current aggregates — not statistical forecasts —
// enough to show trajectory. Each returns a labelled series.
export async function forecasts() {
  const a = await analytics();

  // Bed occupancy projected over 7 days assuming a modest +2%/day drift,
  // clamped to 100%.
  const occ0 = a.kpis.occupancy;
  const occupancy = Array.from({ length: 7 }, (_, i) => ({
    day: `D${i + 1}`,
    value: Math.min(100, occ0 + i * 2),
  }));

  // Revenue run-rate: collected so far projected linearly to a 30-day figure.
  const dailyRevenue = Math.max(1, Math.round(a.kpis.revenue / 7 || a.kpis.revenue));
  const revenue = Array.from({ length: 6 }, (_, i) => ({
    week: `W${i + 1}`,
    value: dailyRevenue * 7 * (i + 1),
  }));

  // Stock depletion: low-stock lines projected to stockout if unaddressed.
  const stockRisk = a.kpis.lowStock;

  return {
    occupancy,
    revenue,
    projectedMonthlyRevenue: dailyRevenue * 30,
    stockRisk,
    edActive: a.kpis.edActive,
    outstanding: a.kpis.outstanding,
  };
}
