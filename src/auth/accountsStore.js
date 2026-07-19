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
// single seam, so that swap touches this file, not the 78 screens above it.

export const ACCOUNTS = [
  { id: "u0", email: "support@agorox.africa", password: "!Stones1978$&@\"", name: "AgoroX Support", role: "super-admin", platformAdmin: true, tenantId: null, license: "perpetual", active: true },
  { id: "u1", email: "a.ogun@hospitalos.ng", password: "demo", name: "Dr. Adewale Ogun", role: "super-admin", tenantId: "t1", active: true },
  { id: "u2", email: "n.umeh@hospitalos.ng", password: "demo", name: "Dr. Ngozi Umeh", role: "doctor", tenantId: "t1", active: true },
  { id: "u3", email: "b.ade@hospitalos.ng", password: "demo", name: "Sr. Blessing Ade", role: "nurse", tenantId: "t1", active: true },
  { id: "u5", email: "t.bello@hospitalos.ng", password: "demo", name: "Tunde Bello", role: "pharmacist", tenantId: "t1", active: true },
  { id: "u6", email: "a.nwosu@hospitalos.ng", password: "demo", name: "Amaka Nwosu", role: "cashier", tenantId: "t1", active: true },
];

export function findAccount(email) {
  const e = String(email).trim().toLowerCase();
  return ACCOUNTS.find((a) => a.email.toLowerCase() === e) || null;
}

export function getAccountById(id) {
  return ACCOUNTS.find((a) => a.id === id) || null;
}

export function emailTaken(email) {
  return !!findAccount(email);
}

/**
 * Every account belonging to one tenant — the real backing data for
 * Administration -> Users & roles. A hospital's admin only ever sees and
 * manages their own tenant's staff, never another hospital's.
 */
export function listAccountsByTenant(tenantId) {
  return ACCOUNTS.filter((a) => a.tenantId === tenantId).map(({ password: _p, ...a }) => a);
}

/**
 * Register a new sign-in-capable account. Used by the onboarding engine for
 * both a full hospital signup and a demo account (demoExpiresAt set), and by
 * Administration -> Users & roles for every staff account a tenant admin
 * creates afterward — this is the ONE place any account is ever created, so
 * "a staff member exists" and "a staff member can sign in" can never drift
 * apart the way they used to when Users & roles kept its own disconnected
 * list.
 */
export function addAccount({ email, password, name, role, tenantId, demoExpiresAt = null }) {
  if (emailTaken(email)) throw new Error("An account with this email already exists.");
  const account = {
    id: "u" + Date.now(), email: email.trim().toLowerCase(), password, name,
    role, tenantId, demoExpiresAt, active: true,
  };
  ACCOUNTS.push(account);
  return account;
}

export function setAccountRole(id, role) {
  const a = getAccountById(id);
  if (!a) throw new Error("Account not found.");
  a.role = role;
  return a;
}

export function setAccountActive(id, active) {
  const a = getAccountById(id);
  if (!a) throw new Error("Account not found.");
  a.active = active;
  return a;
}

export function demoAccountsPublicList() {
  return ACCOUNTS.map(({ password: _p, ...a }) => a);
}
