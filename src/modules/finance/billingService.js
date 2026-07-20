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

// Balance-exceeded validation stays client-side (see routes/billing.js's
// header note for exactly why) — genuinely the same check the in-memory
// version always ran, just still computed from all five sources here
// rather than something the server can fully see yet.
export async function recordPayment(patientId, amount, method = "Cash") {
  const amt = parseFloat(amount);
  if (!amt || amt <= 0) throw new Error("Enter a payment amount greater than zero.");
  const account = await getAccount(patientId);
  if (!account) throw new Error("No account for this patient.");
  if (amt > account.balance + 0.001) {
    throw new Error(`Payment exceeds the outstanding balance of \u20a6${account.balance.toLocaleString()}.`);
  }
  return apiCall("/billing/payments", { method: "POST", body: { patientId, amount: amt, method } });
}

// Flat ledger of all payments across patients, most recent first.
export async function listPayments() {
  return apiCall("/billing/payments");
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
