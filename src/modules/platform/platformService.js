// Platform service — AgoroX-side tenant management and platform health.
// Visible only to the platform admin (support@agorox.africa). This is the
// vendor's view across deployments, not a hospital-facing module.
// In-memory now; async API shaped for a later D1 swap.

const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));
const iso = (m) => new Date(Date.now() + m * 60000).toISOString();

export const PLANS = ["Trial", "Standard", "Enterprise", "Lifetime"];
export const PLAN_TONE = { Trial: "muted", Standard: "info", Enterprise: "good", Lifetime: "accent" };

const _tenants = [
  { id: "t1", name: "Ibadan Teaching Hospital", subdomain: "ibadan", plan: "Enterprise", seats: 240, activeUsers: 186, status: "active", since: "2026-01-14", mrr: 850000, lastSeen: iso(-2) },
  { id: "t2", name: "Lagoon Specialist Clinic", subdomain: "lagoon", plan: "Standard", seats: 40, activeUsers: 31, status: "active", since: "2026-03-02", mrr: 180000, lastSeen: iso(-18) },
  { id: "t3", name: "Jos Community Hospital", subdomain: "jos", plan: "Trial", seats: 15, activeUsers: 9, status: "trial", since: "2026-07-01", mrr: 0, lastSeen: iso(-140) },
  { id: "t4", name: "Kano Medical Centre", subdomain: "kano", plan: "Standard", seats: 60, activeUsers: 0, status: "suspended", since: "2025-11-20", mrr: 0, lastSeen: iso(-14400) },
  { id: "t5", name: "AgoroX Demo", subdomain: "demo", plan: "Lifetime", seats: 5, activeUsers: 2, status: "active", since: "2025-09-01", mrr: 0, lastSeen: iso(-60) },
];

export async function listTenants() { await delay(); return _tenants.map((t) => ({ ...t })); }

export async function setTenantStatus(id, status) {
  await delay(80);
  const t = _tenants.find((x) => x.id === id);
  if (!t) throw new Error("Tenant not found");
  if (!["active", "trial", "suspended"].includes(status)) throw new Error("Unknown status");
  t.status = status;
  return t;
}

export async function platformSummary() {
  await delay(60);
  const active = _tenants.filter((t) => t.status === "active");
  return {
    tenants: _tenants.length,
    active: active.length,
    trials: _tenants.filter((t) => t.status === "trial").length,
    suspended: _tenants.filter((t) => t.status === "suspended").length,
    seats: _tenants.reduce((s, t) => s + t.seats, 0),
    activeUsers: _tenants.reduce((s, t) => s + t.activeUsers, 0),
    mrr: _tenants.reduce((s, t) => s + t.mrr, 0),
  };
}

// Platform health — services AgoroX runs behind HospitalOS.
const _services = [
  { id: "s1", name: "Web app (Cloudflare Pages)", status: "operational", latency: "42ms", uptime: "99.99%" },
  { id: "s2", name: "API Worker", status: "operational", latency: "88ms", uptime: "99.97%" },
  { id: "s3", name: "D1 database", status: "operational", latency: "11ms", uptime: "99.99%" },
  { id: "s4", name: "R2 object storage", status: "operational", latency: "35ms", uptime: "100%" },
  { id: "s5", name: "HL7 instrument gateway", status: "degraded", latency: "410ms", uptime: "98.20%" },
  { id: "s6", name: "Email (Resend)", status: "operational", latency: "120ms", uptime: "99.90%" },
];
export const SERVICE_TONE = { operational: "good", degraded: "warn", down: "bad" };
export async function listServices() { await delay(); return [..._services]; }

// Feature flags per plan tier.
const _flags = [
  { id: "f1", key: "instruments_gateway", label: "Instruments gateway", tiers: ["Enterprise", "Lifetime"], enabled: true },
  { id: "f2", key: "radiotherapy", label: "Radiotherapy module", tiers: ["Enterprise"], enabled: true },
  { id: "f3", key: "academic", label: "Academic / teaching", tiers: ["Enterprise"], enabled: true },
  { id: "f4", key: "public_health", label: "Public health reporting", tiers: ["Enterprise", "Standard"], enabled: true },
  { id: "f5", key: "ai_forecasting", label: "AI forecasting", tiers: ["Enterprise"], enabled: false },
  { id: "f6", key: "multi_site", label: "Multi-site groups", tiers: ["Enterprise"], enabled: true },
];
export async function listFlags() { await delay(); return [..._flags]; }
export async function toggleFlag(id) {
  await delay(60);
  const f = _flags.find((x) => x.id === id);
  if (!f) throw new Error("Flag not found");
  f.enabled = !f.enabled;
  return f;
}

// Recent platform-side deployments.
export async function listDeployments() {
  await delay(60);
  return [
    { id: "d1", at: iso(-35), ref: "678e40f", note: "LabOS design language; Instruments Gateway", status: "success" },
    { id: "d2", at: iso(-180), ref: "81d01ac", note: "Complete all remaining groups — 52/52 routes", status: "success" },
    { id: "d3", at: iso(-1440), ref: "9ac6373", note: "Blood bank, theatre, finance payments/claims", status: "success" },
    { id: "d4", at: iso(-2880), ref: "4561963", note: "Initial commit — HospitalOS shell", status: "success" },
  ];
}
