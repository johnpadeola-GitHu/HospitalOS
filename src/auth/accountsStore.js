// Account directory — extracted from AuthContext so it can be written to
// from outside a React component. The onboarding engine creates real,
// sign-in-capable accounts here when a hospital registers or starts a demo;
// AuthContext reads from the same store. This is the same pattern as every
// other engine (Help, Pricing, FHIR, Results): plain module state, imported
// by whatever needs to read or write it, never the other way round.
//
// Password is demo-only, stored in plaintext for this preview build; real
// hashing happens server-side once the Workers/D1 backend lands (see the
// Production Readiness Plan) — sign-in already goes through signIn() as a
// single seam, so that swap touches this file, not the 77 screens above it.

export const ACCOUNTS = [
  { id: "u0", email: "support@agorox.africa", password: "agorox", name: "AgoroX Support", role: "super-admin", platformAdmin: true, tenantId: null },
  { id: "u1", email: "a.ogun@hospitalos.ng", password: "demo", name: "Dr. Adewale Ogun", role: "super-admin", tenantId: "t1" },
  { id: "u2", email: "n.umeh@hospitalos.ng", password: "demo", name: "Dr. Ngozi Umeh", role: "doctor", tenantId: "t1" },
  { id: "u3", email: "b.ade@hospitalos.ng", password: "demo", name: "Sr. Blessing Ade", role: "nurse", tenantId: "t1" },
  { id: "u5", email: "t.bello@hospitalos.ng", password: "demo", name: "Tunde Bello", role: "pharmacist", tenantId: "t1" },
  { id: "u6", email: "a.nwosu@hospitalos.ng", password: "demo", name: "Amaka Nwosu", role: "cashier", tenantId: "t1" },
];

export function findAccount(email) {
  const e = String(email).trim().toLowerCase();
  return ACCOUNTS.find((a) => a.email.toLowerCase() === e) || null;
}

export function emailTaken(email) {
  return !!findAccount(email);
}

/**
 * Register a new sign-in-capable account. Used by the onboarding engine for
 * both a full hospital signup and a demo account — the only difference is
 * whether demoExpiresAt is set.
 */
export function addAccount({ email, password, name, role, tenantId, demoExpiresAt = null }) {
  if (emailTaken(email)) throw new Error("An account with this email already exists.");
  const account = {
    id: "u" + Date.now(), email: email.trim().toLowerCase(), password, name,
    role, tenantId, demoExpiresAt,
  };
  ACCOUNTS.push(account);
  return account;
}

export function demoAccountsPublicList() {
  return ACCOUNTS.map(({ password: _p, ...a }) => a);
}
