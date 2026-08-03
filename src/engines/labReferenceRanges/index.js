// Laboratory reference range engine — tenant-configurable reference
// ranges, same architecture as engines/pricing/index.js.
//
// Every test in the catalogue ships with default reference ranges. This
// engine lets a hospital override any analyte's low/high/critLow/critHigh
// without touching the catalogue file itself. flagValue() and any screen
// displaying a range reads through rangeFor() — override if one exists,
// catalogue default otherwise.
//
// Kept SYNCHRONOUS on purpose, same reasoning as priceFor(): flagValue()
// is called inline wherever a result is displayed or auto-flagged, and
// converting that to async would mean touching every one of those call
// sites. The cache is loaded once after sign-in (see App.jsx) and kept
// current on every mutation.

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

// override key = `${testCode}:${analyteKey}` -> { low, high, critLow, critHigh, updatedAt, updatedBy }
const _overrides = new Map();
let _cacheLoaded = false;

function key(testCode, analyteKey) {
  return `${testCode}:${analyteKey}`;
}

/**
 * The seam flagValue() and any range-displaying screen calls. Returns a
 * merged analyte: the override's fields where set, the catalogue
 * default's fields otherwise. Never throws — same fail-safe behaviour as
 * priceFor(); a missing/invalid override silently falls back rather than
 * breaking result flagging.
 */
export function rangeFor(testCode, analyteKey, defaultAnalyte) {
  const o = _overrides.get(key(testCode, analyteKey));
  if (!o) return defaultAnalyte;
  return {
    ...defaultAnalyte,
    low: o.low ?? defaultAnalyte.low,
    high: o.high ?? defaultAnalyte.high,
    critLow: o.critLow ?? defaultAnalyte.critLow,
    critHigh: o.critHigh ?? defaultAnalyte.critHigh,
  };
}

/**
 * Loads every real override for the signed-in hospital from the backend
 * into the local cache. Called once, right after sign-in, alongside
 * loadPriceCache() in App.jsx's Shell component.
 */
export async function loadReferenceRangeCache() {
  try {
    const rows = await apiCall("/lab/reference-overrides");
    _overrides.clear();
    for (const r of rows) {
      _overrides.set(key(r.testCode, r.analyteKey), {
        low: r.low, high: r.high, critLow: r.critLow, critHigh: r.critHigh,
        updatedAt: r.updatedAt, updatedBy: r.updatedBy,
      });
    }
    _cacheLoaded = true;
  } catch (e) {
    // Failed load leaves the cache empty — rangeFor() falls back to
    // catalogue defaults, same honest-fallback behaviour as pricing.
    console.error("Failed to load reference range overrides:", e);
  }
}

export function referenceRangeCacheReady() {
  return _cacheLoaded;
}

export async function listReferenceOverrides(testCode) {
  const rows = await apiCall(`/lab/reference-overrides${testCode ? `?testCode=${encodeURIComponent(testCode)}` : ""}`);
  return rows;
}

export async function setReferenceRange({ testCode, analyteKey, label, low, high, critLow, critHigh, actor }) {
  const saved = await apiCall("/lab/reference-overrides", {
    method: "POST",
    body: { testCode, analyteKey, low, high, critLow, critHigh },
  });
  _overrides.set(key(testCode, analyteKey), {
    low: saved.low, high: saved.high, critLow: saved.critLow, critHigh: saved.critHigh,
    updatedAt: saved.updatedAt, updatedBy: saved.updatedBy,
  });
  record({
    actor, action: AUDIT_ACTIONS.CLINICAL, entity: "lab-reference-override", entityId: `${testCode}:${analyteKey}`,
    detail: `Updated reference range for ${label || analyteKey} (${testCode})`, severity: "info",
  });
  return saved;
}

export async function clearReferenceRange({ testCode, analyteKey, label, actor }) {
  const existed = _overrides.has(key(testCode, analyteKey));
  await apiCall("/lab/reference-overrides", { method: "DELETE", body: { testCode, analyteKey } });
  _overrides.delete(key(testCode, analyteKey));
  if (existed) {
    record({
      actor, action: AUDIT_ACTIONS.CLINICAL, entity: "lab-reference-override", entityId: `${testCode}:${analyteKey}`,
      detail: `Reset ${label || analyteKey} (${testCode}) to catalogue default`, severity: "info",
    });
  }
  return true;
}
