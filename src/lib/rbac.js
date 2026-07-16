// RBAC — role-based access control.
//
// Two levels:
//   1. AREA permissions  (nav groups) — can this role reach Pharmacy at all?
//   2. ACTION permissions (verbs)     — within an area, what may they DO?
//
// Area permission gates the sidebar and routes. Action permission gates the
// buttons: a nurse may view the ward board but not discharge; a lab scientist
// may enter results but not verify them.
//
// Permission strings are "<area>:<action>". A role's grant list may use
// "<area>:*" to mean every action in that area.

export const AREAS = [
  { key: "overview", label: "Overview & alerts" },
  { key: "patient-care", label: "Patient care" },
  { key: "diagnostics", label: "Diagnostics" },
  { key: "pharmacy", label: "Pharmacy" },
  { key: "finance", label: "Finance & trade" },
  { key: "operations", label: "Operations" },
  { key: "academic", label: "Academic" },
  { key: "specialty-services", label: "Specialty services" },
  { key: "public-health", label: "Public health" },
  { key: "intelligence", label: "Intelligence" },
  { key: "system", label: "System administration" },
];

// Actions that matter — the ones with clinical, financial or safety weight.
export const ACTIONS = [
  { key: "patient-care:register", label: "Register patients" },
  { key: "patient-care:admit", label: "Admit patients" },
  { key: "patient-care:transfer", label: "Transfer patients" },
  { key: "patient-care:discharge", label: "Discharge patients" },
  { key: "patient-care:record-vitals", label: "Record vitals" },
  { key: "patient-care:note", label: "File clinical notes" },
  { key: "patient-care:record-delivery", label: "Record deliveries" },
  { key: "diagnostics:order", label: "Order tests / imaging" },
  { key: "diagnostics:collect", label: "Collect samples" },
  { key: "diagnostics:result", label: "Enter results" },
  { key: "diagnostics:verify", label: "Verify results" },
  { key: "diagnostics:transfuse", label: "Issue blood" },
  { key: "pharmacy:dispense", label: "Dispense medication" },
  { key: "pharmacy:restock", label: "Restock inventory" },
  { key: "finance:bill", label: "Raise charges" },
  { key: "finance:take-payment", label: "Take payments" },
  { key: "finance:claim", label: "Manage claims" },
  { key: "finance:approve-claim", label: "Approve claims" },
  { key: "system:manage-users", label: "Manage users" },
  { key: "system:configure", label: "Change settings" },
  { key: "system:view-audit", label: "View audit log" },
];

export const ROLES = {
  "super-admin": {
    label: "Super Admin",
    areas: AREAS.map((a) => a.key),
    grants: ["*"],
  },
  doctor: {
    label: "Doctor",
    areas: ["overview", "patient-care", "diagnostics", "pharmacy", "specialty-services"],
    grants: [
      "patient-care:*", "diagnostics:order", "diagnostics:result", "diagnostics:verify",
      "diagnostics:transfuse", "pharmacy:dispense",
    ],
  },
  nurse: {
    label: "Nurse",
    areas: ["overview", "patient-care", "specialty-services"],
    // Nurses admit and record vitals, but do not discharge.
    grants: ["patient-care:register", "patient-care:admit", "patient-care:record-vitals", "patient-care:record-delivery", "patient-care:note"],
  },
  "lab-scientist": {
    label: "Lab Scientist",
    areas: ["overview", "diagnostics"],
    // Can collect and result; verification is a separate responsibility.
    grants: ["diagnostics:collect", "diagnostics:result", "diagnostics:verify"],
  },
  radiographer: {
    label: "Radiographer",
    areas: ["overview", "diagnostics"],
    grants: ["diagnostics:order", "diagnostics:result"],
  },
  pharmacist: {
    label: "Pharmacist",
    areas: ["overview", "pharmacy"],
    grants: ["pharmacy:dispense", "pharmacy:restock"],
  },
  cashier: {
    label: "Cashier",
    areas: ["overview", "finance"],
    // Takes payments and files claims, but cannot approve them (separation of duties).
    grants: ["finance:take-payment", "finance:claim"],
  },
  "records-officer": {
    label: "Records Officer",
    areas: ["overview", "patient-care"],
    grants: ["patient-care:register"],
  },
};

export function areasFor(roleKey) {
  return ROLES[roleKey]?.areas || [];
}

export function grantsFor(roleKey) {
  return ROLES[roleKey]?.grants || [];
}

/** Can this role reach an area (nav group / route)? */
export function canAccessArea(roleKey, areaKey) {
  return areasFor(roleKey).includes(areaKey);
}

/** Can this role perform "<area>:<action>"? */
export function canDo(roleKey, permission) {
  const grants = grantsFor(roleKey);
  if (grants.includes("*")) return true;
  if (grants.includes(permission)) return true;
  const area = permission.split(":")[0];
  return grants.includes(`${area}:*`);
}

/** Expand a role's grants into the concrete action list, for the matrix UI. */
export function effectiveActions(roleKey) {
  return ACTIONS.filter((a) => canDo(roleKey, a.key)).map((a) => a.key);
}

export function roleLabel(roleKey) {
  return ROLES[roleKey]?.label || roleKey;
}
