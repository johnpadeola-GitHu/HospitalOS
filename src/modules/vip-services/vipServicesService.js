// VIP Services.
// Private Suite, VIP Suite, and Executive Suite already exist as
// accommodation tiers (bedService.js) with differential nightly rates —
// that is billing, not care. This is the actual service differentiation a
// VIP patient expects: a named consultant of choice, a concierge contact,
// dietary preferences, and a privacy flag, tracked per admission rather
// than assumed from the room they are paying for.
// In-memory now; async API shaped for a later D1 swap.

import { record, AUDIT_ACTIONS } from "../../lib/audit";

const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));

export const VIP_TIERS = ["Private Suite", "VIP Suite", "Executive Suite"];
export const SERVICE_STATUS = ["active", "discharged"];

let _seq = 500;
function ref() { _seq += 1; return "VIP-" + String(_seq).padStart(5, "0"); }

const _profiles = [
  {
    id: "v1", ref: "VIP-00501", patientName: "Chief Adebayo, Olumide", hospitalNo: "H001010",
    tier: "Executive Suite", bed: "EXE-01", consultantOfChoice: "Prof. Adeyemi",
    conciergeContact: "Front Desk \u2014 Adaeze T., ext. 220", dietaryPreference: "Low-sodium, no red meat",
    privacyFlag: true, status: "active", admittedAt: new Date(Date.now() - 86400000).toISOString(), notes: "Requests all visits coordinated through concierge; media/press access strictly barred.",
  },
];

export async function listProfiles({ activeOnly = true } = {}) {
  await delay();
  return _profiles.filter((p) => !activeOnly || p.status === "active").map((p) => ({ ...p }));
}

export async function createProfile({ patientName, hospitalNo, tier, bed, consultantOfChoice, conciergeContact, dietaryPreference, privacyFlag, notes, actor }) {
  await delay();
  if (!patientName || !patientName.trim()) throw new Error("Enter the patient.");
  if (!VIP_TIERS.includes(tier)) throw new Error("Choose an accommodation tier.");
  const p = {
    id: "v" + Date.now(), ref: ref(), patientName: patientName.trim(), hospitalNo: hospitalNo || "\u2014",
    tier, bed: bed || "\u2014", consultantOfChoice: consultantOfChoice || "\u2014",
    conciergeContact: conciergeContact || "\u2014", dietaryPreference: dietaryPreference || "\u2014",
    privacyFlag: !!privacyFlag, status: "active", admittedAt: new Date().toISOString(), notes: notes || "",
  };
  _profiles.unshift(p);
  record({ actor, action: AUDIT_ACTIONS.CREATE, entity: "vip-profile", entityId: p.ref, detail: `VIP service profile created \u2014 ${p.patientName} (${tier})`, severity: "info" });
  return p;
}

export async function updateProfile(id, patch, actor) {
  await delay(80);
  const p = _profiles.find((x) => x.id === id);
  if (!p) throw new Error("Profile not found");
  Object.assign(p, patch);
  record({ actor, action: AUDIT_ACTIONS.UPDATE, entity: "vip-profile", entityId: p.ref, detail: `Profile updated \u2014 ${p.patientName}`, severity: "info" });
  return p;
}

export async function closeProfile(id, actor) {
  await delay(80);
  const p = _profiles.find((x) => x.id === id);
  if (!p) throw new Error("Profile not found");
  p.status = "discharged";
  record({ actor, action: AUDIT_ACTIONS.UPDATE, entity: "vip-profile", entityId: p.ref, detail: `Discharged \u2014 ${p.patientName}`, severity: "info" });
  return p;
}

export async function vipSummary() {
  await delay(60);
  const active = _profiles.filter((p) => p.status === "active");
  return {
    active: active.length,
    withPrivacyFlag: active.filter((p) => p.privacyFlag).length,
    byTier: VIP_TIERS.map((t) => ({ tier: t, count: active.filter((p) => p.tier === t).length })),
  };
}
