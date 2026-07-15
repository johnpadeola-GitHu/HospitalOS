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
import { listUnstablePatients } from "../critical-care/criticalCareService";
import { listBloodAlerts } from "../blood-bank/bloodBankService";
import { listNeonatalAlerts } from "../maternity/maternityService";
import { listOverdueChemo } from "../oncology/oncologyService";
import { listOutbreakSignals } from "../public-health/publicHealthService";
import { listInstrumentIssues } from "../instruments/instrumentsService";

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

// Source 5 — critical care: an ICU/HDU patient with a critical vital.
function alertFromUnstable(row) {
  const crit = VITALS_SUMMARY(row.vitals);
  return {
    id: `critical-care:${row.occupantId}`,
    source: "Critical Care",
    severity: "critical",
    patientName: row.occupantName,
    hospitalNo: null,
    title: `Unstable patient — ${row.ward}`,
    detail: crit,
    reference: row.bedId,
    at: row.vitals?.updatedAt || new Date().toISOString(),
  };
}

// Compact critical-vitals summary without importing the flagger's full table.
function VITALS_SUMMARY(vitals) {
  if (!vitals) return "Critical vitals";
  const parts = [];
  if (vitals.spo2 != null && vitals.spo2 <= 88) parts.push(`SpO\u2082 ${vitals.spo2}%`);
  if (vitals.hr != null && (vitals.hr <= 40 || vitals.hr >= 130)) parts.push(`HR ${vitals.hr}`);
  if (vitals.sbp != null && (vitals.sbp <= 80 || vitals.sbp >= 180)) parts.push(`SBP ${vitals.sbp}`);
  if (vitals.rr != null && (vitals.rr <= 8 || vitals.rr >= 30)) parts.push(`RR ${vitals.rr}`);
  if (vitals.temp != null && (vitals.temp <= 35 || vitals.temp >= 39.5)) parts.push(`Temp ${vitals.temp}\u00b0C`);
  return parts.length ? parts.join(" · ") : "Critical vitals";
}

// Source 6 — blood bank: group below reorder, or unit near expiry.
function alertFromBlood(issue) {
  const low = issue.kind === "low-group";
  return {
    id: low ? `blood:low:${issue.group}` : `blood:expiry:${issue.tag}`,
    source: "Blood Bank",
    severity: low ? "critical" : "warning",
    patientName: null,
    hospitalNo: null,
    title: low ? "Blood stock low" : "Unit near expiry",
    detail: low
      ? `${issue.group} — ${issue.count} unit(s), reorder ${issue.reorder}`
      : `${issue.group} unit ${issue.tag} — expires in ${issue.days} day(s)`,
    reference: low ? issue.group : issue.tag,
    at: new Date().toISOString(),
  };
}

// Source 7 — maternity: newborn with a low Apgar score.
function alertFromNeonatal(nb) {
  return {
    id: `maternity:${nb.ref}:${nb.sex}:${nb.apgar}`,
    source: "Maternity",
    severity: "critical",
    patientName: `Newborn of ${nb.motherName}`,
    hospitalNo: null,
    title: "Low Apgar newborn",
    detail: `${nb.sex} · ${nb.weight}kg · Apgar ${nb.apgar}`,
    reference: nb.ref,
    at: new Date().toISOString(),
  };
}

// Source 8 — oncology: chemo patient overdue for their next cycle.
function alertFromChemo(c) {
  return {
    id: `oncology:${c.ref}`,
    source: "Oncology",
    severity: "warning",
    patientName: c.patientName,
    hospitalNo: null,
    title: "Chemo cycle overdue",
    detail: `${c.site} · cycle ${c.cyclesDone}/${c.cyclesTotal} · due ${c.nextCycle}`,
    reference: c.ref,
    at: new Date().toISOString(),
  };
}

// Source 9 — public health: notifiable disease with a rising trend.
function alertFromOutbreak(d) {
  return {
    id: `public-health:${d.id}`,
    source: "Public Health",
    severity: "warning",
    patientName: null,
    hospitalNo: null,
    title: "Notifiable disease rising",
    detail: `${d.disease} — ${d.cases} case(s) this week, trend up`,
    reference: d.disease,
    at: new Date().toISOString(),
  };
}

function alertFromInstrument(i) {
  return {
    id: `instruments:${i.id}`,
    source: "Instruments",
    severity: i.status === "error" ? "critical" : "warning",
    patientName: null,
    hospitalNo: null,
    title: i.status === "error" ? "Analyzer error" : "Analyzer offline",
    detail: `${i.name} (${i.ae})${i.errors ? ` \u2014 ${i.errors} errors` : ""}`,
    reference: i.ae,
    at: new Date().toISOString(),
  };
}

export async function listAlerts({ includeAcknowledged = false } = {}) {
  await delay();

  const [criticalOrders, lowStock, urgentStudies, opsIssues, unstable, bloodIssues, neonatal, overdueChemo, outbreaks, instrumentIssues] = await Promise.all([
    listCriticalOrders(),
    listLowStock(),
    listUrgentStudies(),
    listOpsIssues(),
    listUnstablePatients(),
    listBloodAlerts(),
    listNeonatalAlerts(),
    listOverdueChemo(),
    listOutbreakSignals(),
    listInstrumentIssues(),
  ]);

  const alerts = [
    ...criticalOrders.map(alertFromLabOrder),
    ...lowStock.map(alertFromDrug),
    ...urgentStudies.map(alertFromStudy),
    ...opsIssues.map(alertFromOpsIssue),
    ...unstable.map(alertFromUnstable),
    ...bloodIssues.map(alertFromBlood),
    ...neonatal.map(alertFromNeonatal),
    ...overdueChemo.map(alertFromChemo),
    ...outbreaks.map(alertFromOutbreak),
    ...instrumentIssues.map(alertFromInstrument),
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
