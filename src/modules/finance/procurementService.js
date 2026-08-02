// Finance — procurement & stores service.
// Purchase orders to suppliers, and general (non-drug) store inventory.
//
// PHASE 1 LIVE, module 42.

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

export const PO_STATUS = ["draft", "ordered", "received"];
export const PO_TINT = {
  draft: { bg: "#E3ECF7", fg: "#3A5170", label: "Draft" },
  ordered: { bg: "#FBF0DC", fg: "#8A5A17", label: "Ordered" },
  received: { bg: "#E6EFDF", fg: "#4A6329", label: "Received" },
};

export async function listPOs() {
  return apiCall("/finance/purchase-orders");
}

export async function createPO({ supplier, items, amount, lines }) {
  return apiCall("/finance/purchase-orders", { method: "POST", body: { supplier, items, amount, lines } });
}

export async function advancePO(id) {
  return apiCall(`/finance/purchase-orders/${encodeURIComponent(id)}/advance`, { method: "PATCH" });
}

export async function listStores() {
  return apiCall("/finance/stores");
}

// Feed for Alerts: store items at or below their reorder threshold.
// Mirrors pharmacy's listLowStock() \u2014 same shape of signal, different
// source. Filtered client-side since the dataset is small and the backend
// already returns each item's computed `low` flag.
export async function listLowStores() {
  const all = await apiCall("/finance/stores");
  return all.filter((s) => s.low);
}

// Register a new general (non-drug) store item.
export async function createStoreItem({ item, category, qty, reorder }) {
  return apiCall("/finance/stores", { method: "POST", body: { item, category, qty, reorder } });
}

// Manual restock of a store item (top-up outside the PO-receipt flow).
export async function restockStoreItem(itemId, quantity) {
  return apiCall(`/finance/stores/${encodeURIComponent(itemId)}/restock`, { method: "PATCH", body: { quantity } });
}
