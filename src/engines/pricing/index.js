// Pricing engine — tenant-configurable prices.
//
// Every priceable thing in HospitalOS (lab test, drug, imaging study, theatre
// procedure, ward tier) ships with a catalogue default price. This engine lets
// a hospital override any of those defaults without touching the catalogue
// files themselves. Billing and every price-displaying screen read through
// priceFor() — override if one exists, catalogue default otherwise.
//
// FIXED: this was entirely in-memory client-side before — a genuine,
// severe gap found while working through the financial architecture
// review's remaining items. Every custom price a hospital set was
// silently lost on the next page reload, despite the Tenant Guide
// documenting this as a real, persistent feature. Overrides are now
// genuinely saved to D1, per tenant.
//
// priceFor() stays SYNCHRONOUS on purpose: it's called inline in JSX
// across 13 call sites in 10 files (Dispensing, Formulary, Theatre,
// WardsBoard, ModalityWorkspace, and each area's own service file).
// Converting it to async would mean touching every one of those call
// sites — a large, risky, cascading change for what's really a
// persistence problem, not an API-shape problem. Instead, the cache
// below is loaded once from the real backend right after sign-in (see
// App.jsx's Shell component) and kept current locally on every
// mutation, so priceFor() keeps reading synchronously from memory while
// that memory is now genuinely backed by something real.

import { record, AUDIT_ACTIONS } from "../../lib/audit";

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

export const CATEGORIES = [
  { key: "lab", label: "Laboratory tests" },
  { key: "pharmacy", label: "Pharmacy / drugs" },
  { key: "radiology", label: "Imaging studies" },
  { key: "theatre", label: "Theatre procedures" },
  { key: "accommodation", label: "Ward accommodation (per night)" },
];

// override key = `${category}:${code}` -> { price, updatedAt, updatedBy }
const _overrides = new Map();
let _cacheLoaded = false;

function key(category, code) {
  return `${category}:${code}`;
}

/**
 * The seam every billing function and price-displaying screen calls.
 * Returns the override if the hospital has set one, otherwise the catalogue
 * default passed in. Never throws — a missing/invalid override silently
 * falls back rather than breaking a bill. Reads synchronously from the
 * local cache — see loadPriceCache() for how that cache gets populated.
 */
export function priceFor(category, code, defaultPrice) {
  const o = _overrides.get(key(category, code));
  return o && Number.isFinite(o.price) ? o.price : defaultPrice;
}

/**
 * Loads every real override for the signed-in hospital from the backend
 * into the local cache. Called once, right after sign-in, before any
 * billing screen could call priceFor() — see App.jsx's Shell component.
 * Safe to call again later (e.g. after a role switch); it just refills
 * the same cache from the current source of truth.
 */
export async function loadPriceCache() {
  try {
    const rows = await apiCall("/finance/price-overrides");
    _overrides.clear();
    for (const r of rows) {
      _overrides.set(key(r.category, r.code), { price: r.price, label: r.label, updatedAt: r.updatedAt, updatedBy: r.updatedBy });
    }
    _cacheLoaded = true;
  } catch (e) {
    // A failed load leaves the cache empty (or whatever it was before) —
    // priceFor() falls back to catalogue defaults, which is the honest,
    // safe behaviour: showing a stale/default price is far better than
    // the whole app failing to render because pricing couldn't load.
    console.error("Failed to load price overrides:", e);
  }
}

export function priceCacheReady() {
  return _cacheLoaded;
}

export async function listOverrides(category = "all") {
  const rows = await apiCall(`/finance/price-overrides${category !== "all" ? `?category=${encodeURIComponent(category)}` : ""}`);
  return rows.map((r) => ({ category: r.category, code: r.code, label: r.label, price: r.price, updatedAt: r.updatedAt, updatedBy: r.updatedBy }));
}

export async function setPrice({ category, code, label, price, actor }) {
  const p = parseFloat(price);
  if (!Number.isFinite(p) || p < 0) throw new Error("Enter a valid price.");
  const saved = await apiCall("/finance/price-overrides", { method: "POST", body: { category, code, label, price: p } });
  _overrides.set(key(category, code), { price: saved.price, label: saved.label, updatedAt: saved.updatedAt, updatedBy: saved.updatedBy });
  record({
    actor, action: AUDIT_ACTIONS.FINANCIAL, entity: "price-override", entityId: `${category}:${code}`,
    detail: `Set ${label || code} to \u20a6${p.toLocaleString()}`, severity: "info",
  });
  return { category, code, price: p };
}

export async function clearOverride({ category, code, actor }) {
  const existed = _overrides.has(key(category, code));
  await apiCall("/finance/price-overrides", { method: "DELETE", body: { category, code } });
  _overrides.delete(key(category, code));
  if (existed) {
    record({
      actor, action: AUDIT_ACTIONS.FINANCIAL, entity: "price-override", entityId: `${category}:${code}`,
      detail: `Reset ${code} to catalogue default`, severity: "info",
    });
  }
  return true;
}

export async function overrideCount() {
  return _overrides.size;
}
