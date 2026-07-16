// Pricing engine — tenant-configurable prices.
//
// Every priceable thing in HospitalOS (lab test, drug, imaging study, theatre
// procedure, ward tier) ships with a catalogue default price. This engine lets
// a hospital override any of those defaults without touching the catalogue
// files themselves. Billing and every price-displaying screen read through
// priceFor() — override if one exists, catalogue default otherwise.
//
// This is an ENGINE like Help: it owns its own state, imports from no module,
// and is imported BY modules. In-memory now; async API shaped for a later
// D1 swap (a real deployment would scope this per-tenant, keyed by hospital).

import { record, AUDIT_ACTIONS } from "../../lib/audit";

const delay = (ms = 80) => new Promise((r) => setTimeout(r, ms));

export const CATEGORIES = [
  { key: "lab", label: "Laboratory tests" },
  { key: "pharmacy", label: "Pharmacy / drugs" },
  { key: "radiology", label: "Imaging studies" },
  { key: "theatre", label: "Theatre procedures" },
  { key: "accommodation", label: "Ward accommodation (per night)" },
];

// override key = `${category}:${code}` -> { price, updatedAt, updatedBy }
const _overrides = new Map();

function key(category, code) {
  return `${category}:${code}`;
}

/**
 * The seam every billing function and price-displaying screen calls.
 * Returns the override if the hospital has set one, otherwise the catalogue
 * default passed in. Never throws — a missing/invalid override silently
 * falls back rather than breaking a bill.
 */
export function priceFor(category, code, defaultPrice) {
  const o = _overrides.get(key(category, code));
  return o && Number.isFinite(o.price) ? o.price : defaultPrice;
}

export async function listOverrides(category = "all") {
  await delay();
  return [..._overrides.entries()]
    .filter(([k]) => category === "all" ? true : k.startsWith(category + ":"))
    .map(([k, v]) => ({ category: k.split(":")[0], code: k.split(":").slice(1).join(":"), ...v }));
}

export async function setPrice({ category, code, label, price, actor }) {
  await delay();
  if (!CATEGORIES.some((c) => c.key === category)) throw new Error("Unknown category.");
  const p = parseFloat(price);
  if (!Number.isFinite(p) || p < 0) throw new Error("Enter a valid price.");
  _overrides.set(key(category, code), {
    label: label || code,
    price: p,
    updatedAt: new Date().toISOString(),
    updatedBy: actor?.name || "Unknown",
  });
  record({
    actor, action: AUDIT_ACTIONS.FINANCIAL, entity: "price-override", entityId: `${category}:${code}`,
    detail: `Set ${label || code} to \u20a6${p.toLocaleString()}`, severity: "info",
  });
  return { category, code, price: p };
}

export async function clearOverride({ category, code, actor }) {
  await delay();
  const k = key(category, code);
  const existed = _overrides.has(k);
  _overrides.delete(k);
  if (existed) {
    record({
      actor, action: AUDIT_ACTIONS.FINANCIAL, entity: "price-override", entityId: `${category}:${code}`,
      detail: `Reset ${code} to catalogue default`, severity: "info",
    });
  }
  return true;
}

export async function overrideCount() {
  await delay(40);
  return _overrides.size;
}
