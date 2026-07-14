// System service — users, roles, permissions.
// Roles carry a set of permission keys; permission keys map to nav groups so a
// future auth layer can gate the sidebar and routes off one source. This module
// manages the directory; enforcement is a later step.
// In-memory now; async API shaped for a later D1 swap.

const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));

// Permission keys align to nav groups (see navGroups.js) plus an admin key.
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

// Built-in roles with sensible default permission sets.
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

let _seq = 3;
const _users = [
  { id: "u1", name: "Dr. Adewale Ogun", email: "a.ogun@hospitalos.ng", role: "super-admin", active: true },
  { id: "u2", name: "Dr. Ngozi Umeh", email: "n.umeh@hospitalos.ng", role: "doctor", active: true },
  { id: "u3", name: "Sr. Blessing Ade", email: "b.ade@hospitalos.ng", role: "nurse", active: true },
];

export function roleLabel(roleKey) {
  return ROLES[roleKey]?.label || roleKey;
}

export function permissionsFor(roleKey) {
  return ROLES[roleKey]?.permissions || [];
}

export async function listUsers({ query = "" } = {}) {
  await delay();
  const q = query.trim().toLowerCase();
  return _users
    .filter((u) => {
      if (!q) return true;
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || roleLabel(u.role).toLowerCase().includes(q);
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function createUser({ name, email, role }) {
  await delay();
  if (!name || !name.trim()) throw new Error("Enter a name.");
  if (!email || !/.+@.+\..+/.test(email)) throw new Error("Enter a valid email.");
  if (!ROLES[role]) throw new Error("Choose a role.");
  if (_users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
    throw new Error("A user with that email already exists.");
  }
  _seq += 1;
  const user = { id: "u" + _seq, name: name.trim(), email: email.trim().toLowerCase(), role, active: true };
  _users.unshift(user);
  return user;
}

export async function updateUserRole(id, role) {
  await delay(80);
  const u = _users.find((x) => x.id === id);
  if (!u) throw new Error("User not found");
  if (!ROLES[role]) throw new Error("Unknown role");
  u.role = role;
  return u;
}

export async function toggleUserActive(id) {
  await delay(80);
  const u = _users.find((x) => x.id === id);
  if (!u) throw new Error("User not found");
  // Guard: never deactivate the last active super-admin.
  if (u.active && u.role === "super-admin") {
    const otherAdmins = _users.filter((x) => x.id !== id && x.role === "super-admin" && x.active).length;
    if (otherAdmins === 0) throw new Error("Cannot deactivate the last active Super Admin.");
  }
  u.active = !u.active;
  return u;
}

export async function roleSummary() {
  await delay(60);
  const counts = {};
  for (const u of _users) counts[u.role] = (counts[u.role] || 0) + 1;
  return Object.entries(ROLES).map(([key, r]) => ({ key, label: r.label, count: counts[key] || 0, permissions: r.permissions }));
}
