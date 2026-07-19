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
import { listOverdueDialysis } from "../renal/renalService";
import { listReferrals } from "../referrals/referralsService";
import { listOverdueImmunisations } from "../public-health/immunizationService";
import { listOverdueDsars } from "../privacy/privacyService";
import { listExpiringLicenses, listAccreditations } from "../compliance/complianceService";
import { listActiveSevereCrises } from "../sickle-cell/sickleCellService";
import { checkOutbreakThreshold } from "../ipc/ipcService";
import { listHighRiskPatients as listHighRiskGeriatric } from "../geriatric/geriatricService";
import { listHighAcuityPatients as listHighAcuityMhu } from "../mental-health/mentalHealthService";

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

function alertFromDialysis(p) {
  return {
    id: `renal:${p.id}`,
    source: "Renal",
    severity: "critical",
    patientName: p.patientName,
    hospitalNo: p.hospitalNo,
    title: "Dialysis session overdue",
    detail: `${p.access} · scheduled ${p.schedule} · due ${p.nextDue}`,
    reference: p.hospitalNo,
    at: new Date().toISOString(),
  };
}

function alertFromReferral(r) {
  return {
    id: `referral:${r.id}`,
    source: "Referrals",
    severity: "critical",
    patientName: r.patientName,
    hospitalNo: r.patientId || "\u2014",
    title: "Emergency referral awaiting review",
    detail: `From ${r.fromFacility} \u00b7 ${r.clinic} \u00b7 ${r.reason}`,
    reference: r.ref,
    at: r.receivedAt,
  };
}

function alertFromImmunisation(c) {
  return {
    id: `immun:${c.id}`,
    source: "Public health",
    severity: "warning",
    patientName: c.childName,
    hospitalNo: c.hospitalNo,
    title: "Immunisation overdue",
    detail: `${c.overdue.length} dose(s) overdue \u2014 ${c.overdue.map((d) => d.antigen).join(", ")}`,
    reference: c.ref,
    at: new Date().toISOString(),
  };
}

function alertFromDsar(d) {
  return {
    id: `dsar:${d.id}`,
    source: "Privacy",
    severity: "critical",
    patientName: d.patientName,
    hospitalNo: d.hospitalNo,
    title: "Data-subject request overdue",
    detail: `${d.type} \u2014 due ${d.dueBy} (30-day statutory window)`,
    reference: d.ref,
    at: d.receivedAt,
  };
}

function alertFromCrisis(c) {
  return {
    id: `crisis:${c.id}`, source: "Sickle Cell Centre", severity: "critical",
    patientName: c.patientName, hospitalNo: c.hospitalNo,
    title: "Severe sickle cell crisis \u2014 active",
    detail: `${c.type} \u2014 admitted, unresolved`,
    reference: c.ref, at: c.admittedAt,
  };
}
function alertFromIpcOutbreak(o) {
  return {
    id: `outbreak:${o.type}`, source: "Infection Prevention & Control", severity: "critical",
    patientName: "\u2014", hospitalNo: "\u2014",
    title: "Outbreak signal",
    detail: `${o.count} open cases of ${o.type}`,
    reference: o.type, at: new Date().toISOString(),
  };
}
function alertFromGeriatric(p) {
  const parts = [];
  if (p.fallsRiskScore >= 4) parts.push(`Falls risk score ${p.fallsRiskScore}`);
  if (p.medicationCount >= 5) parts.push(`${p.medicationCount} regular medications`);
  return {
    id: `geri:${p.id}`, source: "Geriatric Unit", severity: "warning",
    patientName: p.patientName, hospitalNo: p.hospitalNo,
    title: p.fallsRiskScore >= 4 ? "High falls risk" : "Polypharmacy",
    detail: parts.join(" \u00b7 "),
    reference: p.ref, at: p.admittedAt,
  };
}
function alertFromMhu(p) {
  return {
    id: `mhu:${p.id}`, source: "Mental Health Unit", severity: "critical",
    patientName: p.patientName, hospitalNo: p.hospitalNo,
    title: p.observationLevel === "Constant (1:1)" ? "Constant observation" : "Active risk flag",
    detail: p.riskFlags.length ? p.riskFlags.join(", ") : p.observationLevel,
    reference: p.ref, at: p.admittedAt,
  };
}

function alertFromLicense(l) {
  return {
    id: `license:${l.id}`, source: "Compliance", severity: l.status === "expired" ? "critical" : "warning",
    patientName: "\u2014", hospitalNo: "\u2014",
    title: l.status === "expired" ? "Practitioner license expired" : "Practitioner license expiring soon",
    detail: `${l.body} \u2014 ${l.staffName}, ${l.status === "expired" ? `expired ${Math.abs(l.daysLeft)}d ago` : `${l.daysLeft}d remaining`}`,
    reference: l.ref, at: new Date().toISOString(),
  };
}
function alertFromAccreditation(a) {
  return {
    id: `accreditation:${a.id}`, source: "Compliance", severity: a.status === "expired" ? "critical" : "warning",
    patientName: "\u2014", hospitalNo: "\u2014",
    title: a.status === "expired" ? "Facility accreditation expired" : "Facility accreditation expiring soon",
    detail: `${a.type} \u2014 ${a.status === "expired" ? `expired ${Math.abs(a.daysLeft)}d ago` : `${a.daysLeft}d remaining`}`,
    reference: a.ref, at: new Date().toISOString(),
  };
}

export async function listAlerts({ includeAcknowledged = false } = {}) {
  await delay();

  const [criticalOrders, lowStock, urgentStudies, opsIssues, unstable, bloodIssues, neonatal, overdueChemo, outbreaks, instrumentIssues, overdueDialysis, pendingReferrals, overdueImmunisations, overdueDsars, severeCrises, ipcOutbreaks, geriatricRisk, mhuAcuity, expiringLicenses, allAccreditations] = await Promise.all([
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
    listOverdueDialysis(),
    listReferrals({ direction: "inbound", status: "received" }),
    listOverdueImmunisations(),
    listOverdueDsars(), listActiveSevereCrises(), checkOutbreakThreshold(),
    listHighRiskGeriatric(), listHighAcuityMhu(), listExpiringLicenses(), listAccreditations(),
  ]);
  // checkOutbreakThreshold() result is bound to ipcOutbreaks above.

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
    ...overdueDialysis.map(alertFromDialysis),
    ...pendingReferrals.filter((r) => r.urgency === "Emergency").map(alertFromReferral),
    ...overdueImmunisations.map(alertFromImmunisation),
    ...overdueDsars.map(alertFromDsar),
    ...severeCrises.map(alertFromCrisis),
    ...ipcOutbreaks.map(alertFromIpcOutbreak),
    ...geriatricRisk.map(alertFromGeriatric),
    ...mhuAcuity.map(alertFromMhu),
    ...expiringLicenses.map(alertFromLicense),
    ...allAccreditations.filter((a) => a.status !== "current").map(alertFromAccreditation),
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
