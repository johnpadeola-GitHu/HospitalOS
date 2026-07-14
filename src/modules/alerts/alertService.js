// Alert aggregator.
// Normalizes signals from across HospitalOS into a single alert feed. Sources
// are independent mappers; adding one (done here for pharmacy) needs no UI
// change. Alerts carry a severity (critical | warning). Patient fields are
// optional — operational alerts (e.g. low stock) have none.
// Acknowledgement state is held here in-memory.

import { listCriticalOrders, getTest, flagValue } from "../lab/labService";
import { listLowStock } from "../pharmacy/pharmacyService";
import { listUrgentStudies } from "../radiology/radiologyService";
import { listOpsIssues } from "../operations/operationsService";

const delay = (ms = 90) => new Promise((r) => setTimeout(r, ms));

// Acknowledged alert ids. Keyed by the stable alert id so an alert stays
// acknowledged across refreshes.
const _acknowledged = new Set();

// Source 1 — lab: one critical order becomes one critical alert.
function alertFromLabOrder(order) {
  const test = getTest(order.testCode);
  const criticalAnalytes = test.analytes
    .filter((a) => flagValue(a, order.results[a.key]) === "critical")
    .map((a) => `${a.label} ${order.results[a.key]}${a.unit ? " " + a.unit : ""}`);
  return {
    id: `lab:${order.id}`,
    source: "Laboratory",
    severity: "critical",
    patientName: order.patientName,
    hospitalNo: order.hospitalNo,
    title: `Critical ${order.testName} result`,
    detail: criticalAnalytes.join(" · "),
    reference: order.accession,
    at: order.resultedAt || order.orderedAt,
  };
}

// Source 2 — pharmacy: a drug at/below reorder level becomes a warning alert.
// Out of stock is escalated to critical. No patient attached.
function alertFromDrug(drug) {
  const out = drug.state === "out";
  return {
    id: `pharmacy:${drug.id}`,
    source: "Pharmacy",
    severity: out ? "critical" : "warning",
    patientName: null,
    hospitalNo: null,
    title: out ? "Out of stock" : "Low stock",
    detail: out
      ? `${drug.name} — 0 remaining (reorder ${drug.reorder})`
      : `${drug.name} — ${drug.stock} left (reorder ${drug.reorder})`,
    reference: drug.nafdac,
    at: new Date().toISOString(),
  };
}

// Source 3 — radiology: a reported study with an urgent finding.
function alertFromStudy(study) {
  return {
    id: `radiology:${study.id}`,
    source: "Radiology",
    severity: "critical",
    patientName: study.patientName,
    hospitalNo: study.hospitalNo,
    title: `Urgent finding — ${study.name}`,
    detail: study.report,
    reference: study.accession,
    at: study.reportedAt,
  };
}

// Source 4 — operations: equipment under repair or vehicle out of service.
function alertFromOpsIssue(issue) {
  const isEquip = issue.kind === "equipment";
  return {
    id: `operations:${issue.kind}:${issue.id}`,
    source: "Operations",
    severity: "warning",
    patientName: null,
    hospitalNo: null,
    title: isEquip ? "Equipment under repair" : "Vehicle out of service",
    detail: isEquip
      ? `${issue.name} (${issue.tag}) — ${issue.location}`
      : `${issue.type} ${issue.reg} (${issue.model})`,
    reference: isEquip ? issue.tag : issue.reg,
    at: new Date().toISOString(),
  };
}

export async function listAlerts({ includeAcknowledged = false } = {}) {
  await delay();

  const [criticalOrders, lowStock, urgentStudies, opsIssues] = await Promise.all([
    listCriticalOrders(),
    listLowStock(),
    listUrgentStudies(),
    listOpsIssues(),
  ]);

  const alerts = [
    ...criticalOrders.map(alertFromLabOrder),
    ...lowStock.map(alertFromDrug),
    ...urgentStudies.map(alertFromStudy),
    ...opsIssues.map(alertFromOpsIssue),
  ];

  const rank = { critical: 0, warning: 1 };
  return alerts
    .map((a) => ({ ...a, acknowledged: _acknowledged.has(a.id) }))
    .filter((a) => (includeAcknowledged ? true : !a.acknowledged))
    .sort((a, b) => {
      // Critical before warning, then most recent first.
      if (rank[a.severity] !== rank[b.severity]) return rank[a.severity] - rank[b.severity];
      return new Date(b.at) - new Date(a.at);
    });
}

export async function acknowledgeAlert(id) {
  await delay(60);
  _acknowledged.add(id);
  return true;
}

export async function alertCount() {
  const active = await listAlerts({ includeAcknowledged: false });
  return active.length;
}
