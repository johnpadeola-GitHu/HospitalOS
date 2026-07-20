// Policies & SOPs.
// Distinct from Administration -> Documents & templates on purpose: a
// policy has an owner, a version, and a review date it must not silently
// pass, because an out-of-date infection control or medication safety
// policy is itself a compliance risk.
//
// PHASE 1 LIVE, module 16. File attachments are NOT carried forward into
// this migration — the original version only ever created a session-only
// blob URL that never survived a page reload, so persisting that
// specific field in D1 would have created a false impression of real
// file storage. Real document storage is Cloudflare R2, a separate,
// not-yet-done item in the Production Readiness Plan; the UI already
// null-checks fileUrl, so it degrades gracefully to showing no
// attachment link rather than a broken one.

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

export const POLICY_CATEGORIES = ["Clinical", "Infection control", "Medication safety", "Health & safety", "HR & conduct", "Administrative"];
export const REVIEW_CYCLE_MONTHS = [12, 24, 36];

export async function listPolicies({ category = "all", query = "" } = {}) {
  const params = new URLSearchParams();
  if (category !== "all") params.set("category", category);
  if (query.trim()) params.set("query", query.trim());
  const qs = params.toString();
  return apiCall(`/policies${qs ? `?${qs}` : ""}`);
}

export async function addPolicy({ title, category, version, owner, approvedBy, reviewCycleMonths }) {
  return apiCall("/policies", { method: "POST", body: { title, category, version, owner, approvedBy, reviewCycleMonths } });
}

export async function markReviewed(id, { version, approvedBy }) {
  return apiCall(`/policies/${encodeURIComponent(id)}/review`, { method: "PATCH", body: { version, approvedBy } });
}

export async function listOverduePolicies() {
  const all = await listPolicies({});
  return all.filter((p) => p.status === "overdue" || p.status === "due-soon");
}

export async function policiesSummary() {
  const all = await listPolicies({});
  return {
    total: all.length,
    dueSoon: all.filter((p) => p.status === "due-soon").length,
    overdue: all.filter((p) => p.status === "overdue").length,
  };
}
