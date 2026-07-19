// System service — users, roles, permissions for Administration -> Users &
// roles. This now wraps the SAME account store every sign-in checks
// (accountsStore.js) instead of keeping its own separate directory — a
// staff account created here is immediately, genuinely sign-in capable,
// scoped to the acting admin's own tenant. Enforcement of what a role can
// actually do lives in src/lib/rbac.js; this module manages who holds which
// role and whether their account is active.

import { listAccountsByTenant, addAccount, setAccountRole, setAccountActive, getAccountById } from "../../auth/accountsStore";

const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));

// Permission keys align to nav groups (see navGroups.js) plus an admin key —
// used only for the descriptive "what can this role see" summary on this
// screen, not for enforcement.
export const PERMISSIONS = [
  { key: "overview", label: "Overview & alerts" },
  { key: "patient-care", label: "Patient care" },
  { key: "diagnostics", label: "Diagnostics (lab, radiology)" },
  { key: "pharmacy", label: "Pharmacy" },
  { key: "finance", label: "Finance & billing" },
  { key: "operations", label: "Operations" },
  { key: "academic", label: "Academic" },
  { key: "public-health", label: "Public health" },
  { key: "intelligence", label: "Intelligence" },
  { key: "system", label: "System administration" },
];

const ALL = PERMISSIONS.map((p) => p.key);

export const ROLES = {
  "super-admin": { label: "Super Admin", permissions: [...ALL] },
  doctor: { label: "Doctor", permissions: ["overview", "patient-care", "diagnostics", "pharmacy"] },
  nurse: { label: "Nurse", permissions: ["overview", "patient-care"] },
  "lab-scientist": { label: "Lab Scientist", permissions: ["overview", "diagnostics"] },
  radiographer: { label: "Radiographer", permissions: ["overview", "diagnostics"] },
  pharmacist: { label: "Pharmacist", permissions: ["overview", "pharmacy"] },
  cashier: { label: "Cashier", permissions: ["overview", "finance"] },
  "records-officer": { label: "Records Officer", permissions: ["overview", "patient-care"] },
};

export function roleLabel(roleKey) {
  return ROLES[roleKey]?.label || roleKey;
}

export function permissionsFor(roleKey) {
  return ROLES[roleKey]?.permissions || [];
}

export async function listUsers({ tenantId, query = "" } = {}) {
  await delay();
  const q = query.trim().toLowerCase();
  return listAccountsByTenant(tenantId)
    .filter((u) => {
      if (!q) return true;
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || roleLabel(u.role).toLowerCase().includes(q);
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Creates a REAL, sign-in-capable account — this is the fix for a real gap:
 * staff "created" here used to land in a list-only directory disconnected
 * from the account store sign-in actually checks, meaning no one you added
 * here could ever log in. Now it calls the same addAccount() the
 * activation wizard uses.
 */
export async function createUser({ name, email, password, role, tenantId }) {
  await delay();
  if (!name || !name.trim()) throw new Error("Enter a name.");
  if (!email || !/.+@.+\..+/.test(email)) throw new Error("Enter a valid email.");
  if (!password || password.length < 12) throw new Error("Password must be at least 12 characters.");
  if (!ROLES[role]) throw new Error("Choose a role.");
  return addAccount({ email, password, name, role, tenantId });
}

export async function updateUserRole(id, role) {
  await delay(80);
  if (!ROLES[role]) throw new Error("Unknown role");
  return setAccountRole(id, role);
}

export async function toggleUserActive(id, tenantId) {
  await delay(80);
  const u = getAccountById(id);
  if (!u) throw new Error("User not found");
  // Guard: never deactivate the last active super-admin for this tenant.
  if (u.active !== false && u.role === "super-admin") {
    const otherAdmins = listAccountsByTenant(tenantId).filter((x) => x.id !== id && x.role === "super-admin" && x.active !== false).length;
    if (otherAdmins === 0) throw new Error("Cannot deactivate the last active Super Admin.");
  }
  return setAccountActive(id, u.active === false);
}

export async function roleSummary(tenantId) {
  await delay(60);
  const users = listAccountsByTenant(tenantId);
  const counts = {};
  for (const u of users) counts[u.role] = (counts[u.role] || 0) + 1;
  return Object.entries(ROLES).map(([key, r]) => ({ key, label: r.label, count: counts[key] || 0, permissions: r.permissions }));
}
