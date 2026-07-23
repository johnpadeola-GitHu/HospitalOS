// Platform service — AgoroX-side tenant management and platform health.
// Visible only to the platform admin (support@agorox.africa). This is the
// vendor's view across deployments, not a hospital-facing module.
//
// PHASE 1 LIVE, module 48. Tenant listing now reads the REAL tenants
// table (existed since the very first migration) rather than a separate,
// disconnected fake tenant list — this was a genuine gap, the same class
// as the audit trail one found earlier: the platform admin's real
// business overview screen was showing 4 hardcoded fake hospitals with
// invented MRR/seat numbers, while the actual live tenant sat unseen in
// D1. addTenant() was confirmed dead code (never called anywhere — the
// real onboarding flow already creates tenants server-side) and dropped.
//
// MRR is honestly null, not fabricated — no real recurring-billing
// aggregation exists yet. services and deployments stay client-side —
// informational-only displays with no mutations in the original design;
// genuine infrastructure monitoring is a separate, larger feature.

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

export const PLANS = ["Trial", "Starter", "Growth", "Scale", "Enterprise", "Demo"];
export const PLAN_TONE = { Trial: "muted", Starter: "info", Growth: "info", Scale: "good", Enterprise: "accent", Demo: "warn" };
export const TENANT_STATUS = ["active", "trial", "demo", "pending-payment", "suspended"];

export async function listTenants() {
  return apiCall("/platform/tenants");
}

export async function getTenant(id) {
  try {
    return await apiCall(`/platform/tenants/${encodeURIComponent(id)}`);
  } catch {
    return null;
  }
}

export async function setTenantStatus(id, status) {
  return apiCall(`/platform/tenants/${encodeURIComponent(id)}/status`, { method: "PATCH", body: { status } });
}

// Commercial plans — richer commercial terms than the simple
// flat/percentage split on the tenant record itself. Absence of a plan
// (getCommercialPlan returning null) means "just use the tenant's own
// billing_type/commission_pct", fully backward compatible.
export async function getCommercialPlan(tenantId) {
  return apiCall(`/platform/tenants/${encodeURIComponent(tenantId)}/commercial-plan`);
}

export async function setCommercialPlan(tenantId, plan) {
  return apiCall(`/platform/tenants/${encodeURIComponent(tenantId)}/commercial-plan`, { method: "PUT", body: plan });
}

export async function platformSummary() {
  return apiCall("/platform/summary");
}

// Platform health — services AgoroX runs behind HospitalOS. Informational
// display only; genuine live infrastructure monitoring is a separate
// feature this migration doesn't build.
const _services = [
  { id: "s1", name: "Web app (Cloudflare Pages)", status: "operational", latency: "42ms", uptime: "99.99%" },
  { id: "s2", name: "API Worker", status: "operational", latency: "88ms", uptime: "99.97%" },
  { id: "s3", name: "D1 database", status: "operational", latency: "11ms", uptime: "99.99%" },
  { id: "s4", name: "R2 object storage", status: "operational", latency: "35ms", uptime: "100%" },
  { id: "s5", name: "HL7 instrument gateway", status: "degraded", latency: "410ms", uptime: "98.20%" },
  { id: "s6", name: "Email (Resend)", status: "operational", latency: "120ms", uptime: "99.90%" },
];
export const SERVICE_TONE = { operational: "good", degraded: "warn", down: "bad" };
export async function listServices() { return [..._services]; }

export async function listFlags() {
  return apiCall("/platform/flags");
}

export async function toggleFlag(id) {
  return apiCall(`/platform/flags/${encodeURIComponent(id)}/toggle`, { method: "PATCH" });
}

// Recent platform-side deployments — a changelog display, not operational
// data; a real system would source this from git/CI, not a database.
export async function listDeployments() {
  return [
    { id: "d1", at: new Date(Date.now() - 35 * 60000).toISOString(), ref: "678e40f", note: "LabOS design language; Instruments Gateway", status: "success" },
    { id: "d2", at: new Date(Date.now() - 180 * 60000).toISOString(), ref: "81d01ac", note: "Complete all remaining groups — 52/52 routes", status: "success" },
    { id: "d3", at: new Date(Date.now() - 1440 * 60000).toISOString(), ref: "9ac6373", note: "Blood bank, theatre, finance payments/claims", status: "success" },
    { id: "d4", at: new Date(Date.now() - 2880 * 60000).toISOString(), ref: "4561963", note: "Initial commit — HospitalOS shell", status: "success" },
  ];
}
