// Billing service.
// Aggregates charges raised across HospitalOS (lab orders, pharmacy dispenses)
// into one account per patient. Payments are recorded here and net against the
// charge total to give an outstanding balance. Source-agnostic like Alerts:
// add a billable feed and it rolls into accounts automatically.
//
// PHASE 1 LIVE: only the payment ledger moved to D1 in this round — the
// charge-aggregation logic below (allCharges()) is UNCHANGED, since it's
// already source-agnostic and doesn't care that lab/pharmacy/radiology are
// now real HTTP calls while theatre/bed-nights are still in-memory. See
// routes/billing.js for why the balance-exceeded check stays client-side
// for now: it genuinely can't be validated server-side until every charge
// source is migrated.

import { listBillableOrders } from "../lab/labService";
import { listBillableDispenses } from "../pharmacy/pharmacyService";
import { listBillableStudies } from "../radiology/radiologyService";
import { listBillableProcedures } from "../theatre/theatreService";
import { listBillableBedNights } from "../wards/bedService";

const API_URL = "https://hospitalos-api.johnpadeola.workers.dev";

function authHeaders() {
  const token = localStorage.getItem("hospitalos_session_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiCall(path, { method = "GET", body } = {}) {
  let res, data;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: body ? JSON.stringify(body) : undefined,
    });
    data = await res.json();
  } catch {
    throw new Error("Couldn't reach the server. Check your connection and try again.");
  }
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

async function allCharges() {
  const [lab, pharmacy, radiology, theatre, accommodation] = await Promise.all([
    listBillableOrders(),
    listBillableDispenses(),
    listBillableStudies(),
    listBillableProcedures(),
    listBillableBedNights(),
  ]);
  return [...lab, ...pharmacy, ...radiology, ...theatre, ...accommodation];
}

// Build one account per patient with charges, paid total, and balance.
export async function listAccounts() {
  const [charges, payments] = await Promise.all([allCharges(), listPayments()]);
  const byPatient = new Map();

  for (const c of charges) {
    if (!byPatient.has(c.patientId)) {
      byPatient.set(c.patientId, {
        patientId: c.patientId,
        patientName: c.patientName,
        hospitalNo: c.hospitalNo,
        charges: [],
        chargeTotal: 0,
      });
    }
    const acc = byPatient.get(c.patientId);
    acc.charges.push(c);
    acc.chargeTotal += c.amount;
  }

  const paidByPatient = new Map();
  for (const p of payments) {
    paidByPatient.set(p.patientId, (paidByPatient.get(p.patientId) || 0) + p.amount);
  }

  const accounts = [];
  for (const acc of byPatient.values()) {
    const paid = paidByPatient.get(acc.patientId) || 0;
    acc.charges.sort((a, b) => new Date(b.at) - new Date(a.at));
    accounts.push({ ...acc, paid, balance: acc.chargeTotal - paid });
  }

  return accounts.sort((a, b) => b.balance - a.balance);
}

export async function getAccount(patientId) {
  const accounts = await listAccounts();
  return accounts.find((a) => a.patientId === patientId) || null;
}

// Balance-exceeded validation stays client-side as a first check (fast,
// no round-trip) but is now ALSO genuinely re-validated server-side —
// see routes/billing.js's recordPayment and lib/balance.js. This client
// check catches the common case immediately; the server is the actual
// authority now, not just a trusting pass-through.
export async function recordPayment(patientId, amount, method = "Cash", invoiceId = null) {
  const amt = parseFloat(amount);
  if (!amt || amt <= 0) throw new Error("Enter a payment amount greater than zero.");
  const account = await getAccount(patientId);
  if (!account) throw new Error("No account for this patient.");
  if (!invoiceId && amt > account.balance + 0.001) {
    throw new Error(`Payment exceeds the outstanding balance of \u20a6${account.balance.toLocaleString()}.`);
  }
  return apiCall("/billing/payments", { method: "POST", body: { patientId, amount: amt, method, invoiceId } });
}

// Maps a charge's display source ("Laboratory", "Pharmacy", etc.) to the
// lowercase category key the backend's invoice_items/pricing catalogue
// use — the one place this mapping lives, so a new billable source only
// needs updating here, not everywhere an invoice gets built.
const SOURCE_TO_CATEGORY = {
  Laboratory: "lab", Pharmacy: "pharmacy", Radiology: "radiology", Theatre: "theatre", Accommodation: "accommodation",
};

// Finalizes an account's current charges into a real, persisted,
// immutable invoice (Phase 3) — a genuine snapshot the server keeps
// forever, not the live-recomputed balance this screen shows day to
// day. Once generated, payments taken against this account should link
// to the invoice (see PaymentModal) so the amount is treated as
// already-agreed rather than re-validated against a balance that may
// have moved since.
export async function createInvoice(patientId, charges) {
  const items = charges.map((c) => ({
    source: SOURCE_TO_CATEGORY[c.source] || "other",
    description: c.description,
    amount: c.amount,
    sourceRef: c.reference,
  }));
  return apiCall("/billing/invoices", { method: "POST", body: { patientId, items } });
}

// PHASE 4 (financial architecture review): cash sessions and refunds.
// A Cash payment requires an open session server-side (routes/billing.js
// enforces this) — these functions are what the UI uses to open, check,
// and close one, and to issue a refund against an existing payment.

export async function getMyCashSession() {
  return apiCall("/finance/cash-sessions/mine");
}

export async function openCashSession(openingBalance, tillLabel = "Main till") {
  const bal = parseFloat(openingBalance);
  if (isNaN(bal) || bal < 0) throw new Error("Enter an opening balance of zero or more.");
  return apiCall("/finance/cash-sessions", { method: "POST", body: { openingBalance: bal, tillLabel } });
}

export async function closeCashSession(sessionId, actualCash) {
  const amt = parseFloat(actualCash);
  if (isNaN(amt) || amt < 0) throw new Error("Enter the actual counted cash amount.");
  return apiCall(`/finance/cash-sessions/${sessionId}/close`, { method: "PATCH", body: { actualCash: amt } });
}

export async function listCashSessions() {
  return apiCall("/finance/cash-sessions");
}

export async function reviewCashSession(sessionId, note = "") {
  return apiCall(`/finance/cash-sessions/${sessionId}/review`, { method: "PATCH", body: { note } });
}

export async function createRefund(paymentId, amount, reason) {
  const amt = parseFloat(amount);
  if (!amt || amt <= 0) throw new Error("Enter a refund amount greater than zero.");
  if (!reason || !reason.trim()) throw new Error("A refund needs a reason on record.");
  return apiCall("/finance/refunds", { method: "POST", body: { paymentId, amount: amt, reason: reason.trim() } });
}

export async function listRefundsForPayment(paymentId) {
  return apiCall(`/finance/refunds/payment/${paymentId}`);
}

// Chargebacks — genuinely distinct from a refund (issuer-initiated,
// adversarial, only affects revenue once resolved). See
// routes/chargebacks.js for the full reasoning.
export async function createChargeback(paymentId, amount, reason) {
  const amt = parseFloat(amount);
  if (!amt || amt <= 0) throw new Error("Enter a chargeback amount greater than zero.");
  if (!reason || !reason.trim()) throw new Error("Record the reason the issuer gave.");
  return apiCall("/finance/chargebacks", { method: "POST", body: { paymentId, amount: amt, reason: reason.trim() } });
}

export async function listChargebacksForPayment(paymentId) {
  return apiCall(`/finance/chargebacks?paymentId=${encodeURIComponent(paymentId)}`);
}

export async function listChargebacks(status = "all") {
  return apiCall(`/finance/chargebacks${status !== "all" ? `?status=${encodeURIComponent(status)}` : ""}`);
}

export async function resolveChargeback(chargebackId, outcome, note = "") {
  return apiCall(`/finance/chargebacks/${encodeURIComponent(chargebackId)}/resolve`, { method: "PATCH", body: { outcome, note } });
}

// PHASE 5: starts an online payment — redirects the browser to the
// provider's own checkout page. The actual confirmation happens
// server-to-server via webhook, never trusted from the redirect alone;
// see PaymentCallback.jsx for how the return trip is handled.
export async function initializeOnlinePayment(patientId, amount, invoiceId = null) {
  const amt = parseFloat(amount);
  if (!amt || amt <= 0) throw new Error("Enter a payment amount greater than zero.");
  const callbackUrl = `${window.location.origin}/finance/payment-callback`;
  return apiCall("/billing/online-payment/initialize", { method: "POST", body: { patientId, amount: amt, invoiceId, callbackUrl } });
}

export async function getOnlinePaymentStatus(reference) {
  return apiCall(`/billing/online-payment/status/${encodeURIComponent(reference)}`);
}

// Flat ledger of all payments across patients, most recent first.
// Also usable as a search: pass query to filter by receipt or patient.
export async function listPayments({ query = "" } = {}) {
  const qs = query.trim() ? `?query=${encodeURIComponent(query.trim())}` : "";
  return apiCall(`/billing/payments${qs}`);
}

// Invoices didn't have a search capability before — every prior call site
// only ever looked one up by its own id.
export async function searchInvoices(query) {
  if (!query?.trim()) return [];
  return apiCall(`/billing/invoices/search?query=${encodeURIComponent(query.trim())}`);
}

export async function billingSummary() {
  const accounts = await listAccounts();
  return {
    accounts: accounts.length,
    billed: accounts.reduce((s, a) => s + a.chargeTotal, 0),
    collected: accounts.reduce((s, a) => s + a.paid, 0),
    outstanding: accounts.reduce((s, a) => s + a.balance, 0),
  };
}
