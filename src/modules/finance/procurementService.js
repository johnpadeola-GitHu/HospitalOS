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

export async function createPO({ supplier, items, amount }) {
  return apiCall("/finance/purchase-orders", { method: "POST", body: { supplier, items, amount } });
}

export async function advancePO(id) {
  return apiCall(`/finance/purchase-orders/${encodeURIComponent(id)}/advance`, { method: "PATCH" });
}

export async function listStores() {
  return apiCall("/finance/stores");
}
