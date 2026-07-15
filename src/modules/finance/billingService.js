// Billing service.
// Aggregates charges raised across HospitalOS (lab orders, pharmacy dispenses)
// into one account per patient. Payments are recorded here and net against the
// charge total to give an outstanding balance. Source-agnostic like Alerts:
// add a billable feed and it rolls into accounts automatically.
// In-memory now; async API shaped for a later D1 swap.

import { listBillableOrders } from "../lab/labService";
import { listBillableDispenses } from "../pharmacy/pharmacyService";
import { listBillableStudies } from "../radiology/radiologyService";
import { listBillableProcedures } from "../theatre/theatreService";
import { listBillableBedNights } from "../wards/bedService";

const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));

// Payments recorded, keyed by patientId -> array of { amount, at, method }.
const _payments = {};
let _receiptSeq = 0;

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
  await delay();
  const charges = await allCharges();
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

  const accounts = [];
  for (const acc of byPatient.values()) {
    const paid = (_payments[acc.patientId] || []).reduce((s, p) => s + p.amount, 0);
    acc.charges.sort((a, b) => new Date(b.at) - new Date(a.at));
    accounts.push({ ...acc, paid, balance: acc.chargeTotal - paid });
  }

  return accounts.sort((a, b) => b.balance - a.balance);
}

export async function getAccount(patientId) {
  await delay(60);
  const accounts = await listAccounts();
  return accounts.find((a) => a.patientId === patientId) || null;
}

export async function recordPayment(patientId, amount, method = "Cash") {
  await delay();
  const amt = parseFloat(amount);
  if (!amt || amt <= 0) throw new Error("Enter a payment amount greater than zero.");
  const account = await getAccount(patientId);
  if (!account) throw new Error("No account for this patient.");
  if (amt > account.balance + 0.001) {
    throw new Error(`Payment exceeds the outstanding balance of \u20a6${account.balance.toLocaleString()}.`);
  }
  _receiptSeq += 1;
  const payment = {
    receipt: "RCT-" + String(_receiptSeq).padStart(5, "0"),
    patientId,
    patientName: account.patientName,
    hospitalNo: account.hospitalNo,
    amount: amt,
    method,
    at: new Date().toISOString(),
  };
  if (!_payments[patientId]) _payments[patientId] = [];
  _payments[patientId].push(payment);
  return payment;
}

// Flat ledger of all payments across patients, most recent first.
export async function listPayments() {
  await delay(60);
  const all = [];
  for (const list of Object.values(_payments)) all.push(...list);
  return all.sort((a, b) => new Date(b.at) - new Date(a.at));
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
