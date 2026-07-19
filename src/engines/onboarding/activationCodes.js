// Activation codes — invite-only tenant provisioning.
//
// ARCHITECTURE NOTE, stated plainly: HospitalOS runs on Cloudflare Pages
// with no backend yet (see the Production Readiness Plan) — there is no
// Supabase here, and this file is not a Supabase client. What follows is
// the same invite-only PATTERN LabOS uses on Supabase, adapted to
// HospitalOS's actual architecture: an in-memory store shaped exactly like
// the target table, so the eventual move to Cloudflare D1 is a storage
// swap, not a redesign. Every field below maps 1:1 onto the requested
// schema:
//
//   code                 unique, indexed              -> Map key, enforced unique at generation
//   status               unredeemed/redeemed/revoked   -> stored; "expired" is DERIVED from expires_at,
//                                                          never stored, so it can't drift out of sync
//   tenant_name          ->  tenantName
//   plan_tier            ->  planTier
//   issued_by            ->  issuedBy
//   issued_at            ->  issuedAt
//   redeemed_at          ->  redeemedAt
//   redeemed_by_user_id  ->  redeemedByUserId
//   expires_at           ->  expiresAt (nullable)
//
// ATOMICITY NOTE: a real Postgres RPC wraps validate+mark-redeemed+
// provision in one transaction so two simultaneous redemptions of the same
// code can't both succeed. JavaScript in a browser tab is single-threaded,
// so the equivalent race (two redemptions of the same code) cannot
// interleave here the way concurrent Postgres transactions could — but
// redeemActivationCode() is still written as a single, non-yielding
// critical section (no `await` between the validity check and marking the
// code redeemed) specifically so this same logic transfers unchanged into
// a real transaction later. Marking the code redeemed happens BEFORE any
// async tenant/account creation call, so even a thrown error partway
// through provisioning cannot leave a code re-redeemable.

import { getTier } from "./index";
import { addTenant } from "../../modules/platform/platformService";
import { addAccount, emailTaken } from "../../auth/accountsStore";
import { record, AUDIT_ACTIONS } from "../../lib/audit";

const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));

export const CODE_STATUS = ["unredeemed", "redeemed", "revoked"]; // stored values only — "expired" is computed
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I — avoids transcription errors on a printed/read-aloud code

let _seq = 0;
function generateCode() {
  _seq += 1;
  let s = "";
  for (let i = 0; i < 10; i++) s += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return `HOS-${s.slice(0, 5)}-${s.slice(5, 10)}`;
}

const _codes = new Map(); // code -> record

// A couple of seeded codes so the flow is testable without generating one first.
(function seed() {
  const now = Date.now();
  _codes.set("HOS-DEMO1-ALPHA", {
    code: "HOS-DEMO1-ALPHA", status: "unredeemed", tenantName: "New Horizon Clinic",
    planTier: "starter", issuedBy: "support@agorox.africa", issuedAt: new Date(now - 3 * 86400000).toISOString(),
    redeemedAt: null, redeemedByUserId: null, expiresAt: new Date(now + 27 * 86400000).toISOString(),
  });
  _codes.set("HOS-DEMO2-BRAVO", {
    code: "HOS-DEMO2-BRAVO", status: "unredeemed", tenantName: "Crestview Medical Centre",
    planTier: "scale", issuedBy: "support@agorox.africa", issuedAt: new Date(now - 10 * 86400000).toISOString(),
    redeemedAt: null, redeemedByUserId: null, expiresAt: null,
  });
})();

function effectiveStatus(rec) {
  if (rec.status === "unredeemed" && rec.expiresAt && new Date(rec.expiresAt) < new Date()) return "expired";
  return rec.status;
}

export async function listActivationCodes() {
  await delay();
  return [..._codes.values()]
    .map((r) => ({ ...r, effectiveStatus: effectiveStatus(r) }))
    .sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt));
}

/**
 * Issued only by the platform admin — the UI enforces this by only
 * rendering the generator inside the Platform view, which is itself
 * gated to the platform admin account; a real deployment re-checks this
 * server-side, the same principle already documented for every other
 * platform-admin action in this codebase.
 */
export async function generateActivationCode({ tenantName, planTier, expiresInDays, issuedBy }) {
  await delay(120);
  if (!tenantName || !tenantName.trim()) throw new Error("Enter the tenant's hospital name.");
  if (!getTier(planTier)) throw new Error("Choose a plan tier.");

  let code = generateCode();
  while (_codes.has(code)) code = generateCode(); // enforce uniqueness, matching a unique index

  const rec = {
    code, status: "unredeemed", tenantName: tenantName.trim(), planTier,
    issuedBy: issuedBy || "support@agorox.africa", issuedAt: new Date().toISOString(),
    redeemedAt: null, redeemedByUserId: null,
    expiresAt: expiresInDays ? new Date(Date.now() + Number(expiresInDays) * 86400000).toISOString() : null,
  };
  _codes.set(code, rec);

  record({
    actor: { email: rec.issuedBy, name: "Platform Admin", role: "super-admin" },
    action: AUDIT_ACTIONS.CREATE, entity: "activation-code", entityId: code,
    detail: `Issued for ${rec.tenantName} \u2014 ${getTier(planTier).label}${rec.expiresAt ? `, expires ${new Date(rec.expiresAt).toLocaleDateString()}` : ", no expiry"}`,
    severity: "info",
  });

  return { ...rec, effectiveStatus: effectiveStatus(rec) };
}

export async function revokeActivationCode(code, issuedBy) {
  await delay(80);
  const rec = _codes.get(code);
  if (!rec) throw new Error("Code not found.");
  if (rec.status === "redeemed") throw new Error("This code has already been redeemed and cannot be revoked.");
  rec.status = "revoked";
  record({
    actor: { email: issuedBy || "support@agorox.africa", name: "Platform Admin", role: "super-admin" },
    action: AUDIT_ACTIONS.UPDATE, entity: "activation-code", entityId: code,
    detail: `Revoked \u2014 was issued for ${rec.tenantName}`, severity: "warn",
  });
  return { ...rec, effectiveStatus: effectiveStatus(rec) };
}

/**
 * Read-only check used by Step 1 of the wizard — validates and returns the
 * code's tenant name / plan tier for preview, WITHOUT redeeming it. A code
 * can be looked up this way any number of times without consequence.
 */
export async function validateActivationCode(codeInput) {
  await delay(150);
  const code = String(codeInput || "").trim().toUpperCase();
  if (!code) throw new Error("Enter an activation code.");
  const rec = _codes.get(code);
  if (!rec) throw new Error("This activation code was not recognised. Check for typos, or contact your AgoroX representative.");
  const status = effectiveStatus(rec);
  if (status === "redeemed") throw new Error("This activation code has already been used.");
  if (status === "revoked") throw new Error("This activation code has been revoked. Contact your AgoroX representative for a new one.");
  if (status === "expired") throw new Error("This activation code has expired. Contact your AgoroX representative for a new one.");
  const tier = getTier(rec.planTier);
  return { code: rec.code, tenantName: rec.tenantName, planTier: rec.planTier, tier, expiresAt: rec.expiresAt };
}

/**
 * The atomic step: re-validates the code, marks it redeemed, provisions the
 * tenant, and creates the admin account \u2014 reusing the exact same
 * addTenant()/addAccount() calls the rest of onboarding already uses, so
 * there is one tenant/account model in this codebase, not two. See the
 * ATOMICITY NOTE at the top of this file for why the check and the
 * redeemed-marking happen back to back with no `await` in between.
 */
export async function redeemActivationCode({ code: codeInput, adminName, adminPhone, adminEmail, adminPassword, hospitalDetails = {}, agreement, actor }) {
  const code = String(codeInput || "").trim().toUpperCase();
  const rec = _codes.get(code);

  // --- critical section: validate + mark redeemed, no await in between ---
  if (!rec) throw new Error("This activation code was not recognised.");
  const status = effectiveStatus(rec);
  if (status !== "unredeemed") {
    throw new Error(
      status === "redeemed" ? "This activation code has already been used."
        : status === "revoked" ? "This activation code has been revoked."
        : "This activation code has expired."
    );
  }
  if (!adminName || !adminName.trim()) throw new Error("Enter your full name.");
  if (!adminEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail.trim())) throw new Error("Enter a valid work email address.");
  // The Tenant Service Agreement is a hard gate, enforced here at the
  // service layer, not just by the wizard UI's disabled buttons — no
  // signature record, no tenant. This is the same principle as every other
  // platform-admin-only action in this codebase: the real boundary is
  // server-side (or, in this preview, the one function every redemption
  // path must go through), never just a disabled button.
  if (!agreement || !agreement.signedName || !agreement.signedName.trim()) {
    throw new Error("The Tenant Service Agreement must be signed before activation can complete.");
  }
  if (!adminPassword || adminPassword.length < 12) throw new Error("Password must be at least 12 characters.");
  if (emailTaken(adminEmail)) throw new Error("An account with this email already exists.");
  rec.status = "redeemed";
  rec.redeemedAt = new Date().toISOString();
  // --- end critical section ---

  await delay(150);

  const tier = getTier(rec.planTier);
  const isEnterprise = tier.key === "enterprise";

  let tenant;
  try {
    // The tenant's name and plan come from the activation code itself, set
    // when AgoroX issued it. Everything else about the hospital \u2014
    // address, logo, registration number, bed count \u2014 is still
    // collected, just later in this same wizard (Steps 2 onward), not
    // duplicated on the activation step alongside the person's own details.
    // SECURITY: the tenant's name is taken ONLY from the code record, never
    // from client-supplied input, regardless of what hospitalDetails
    // contains. If this accepted an override, a stolen code could be
    // redeemed under a different hospital's name \u2014 the platform admin's
    // choice of who a code belongs to would mean nothing. Everything else
    // about the hospital (address, type, facility details, branding) is
    // still freely editable; only the identity that makes a code belong to
    // a specific, named hospital is locked.
    tenant = await addTenant({
      name: rec.tenantName,
      plan: tier.label,
      billingType: isEnterprise ? "flat" : "commission",
      commissionPct: isEnterprise ? null : tier.commissionPct,
      status: isEnterprise ? "pending-payment" : "active",
      address: hospitalDetails.address || "",
      phone: hospitalDetails.phone || adminPhone || "",
      email: adminEmail.trim().toLowerCase(),
      logoUrl: hospitalDetails.logoUrl || "",
      registrationNumber: hospitalDetails.registrationNumber || "",
      seats: hospitalDetails.bedCount ? Math.max(10, Math.round(parseInt(hospitalDetails.bedCount, 10) * 1.5)) : 20,
      demoExpiresAt: null,
      agreementVersion: agreement.version,
      agreementSignedName: agreement.signedName.trim(),
      agreementSignedAt: agreement.signedAt || new Date().toISOString(),
    });

    const account = addAccount({
      email: adminEmail.trim().toLowerCase(), password: adminPassword,
      name: adminName.trim(), role: "super-admin", tenantId: tenant.id,
    });
    rec.redeemedByUserId = account.id;

    record({
      actor: actor || account, action: AUDIT_ACTIONS.CREATE, entity: "activation-redemption", entityId: code,
      detail: `${tenant.name} activated via code ${code} \u2014 ${tier.label}`, severity: "info",
    });

    record({
      actor: actor || account, action: AUDIT_ACTIONS.CREATE, entity: "tenant-agreement", entityId: tenant.id,
      detail: `Tenant Service Agreement v${agreement.version} signed by ${agreement.signedName.trim()} for ${tenant.name}`,
      severity: "info",
    });

    return { tenant, account, tier, code: rec.code, requiresPayment: isEnterprise };
  } catch (e) {
    // Provisioning failed after the code was marked redeemed. The code stays
    // consumed rather than silently reopening \u2014 a real deployment logs
    // this for manual reissue, the same failure mode a Postgres transaction
    // rollback would need a compensating action for too, since the tenant
    // row and the code update are not actually in one transaction here.
    record({
      actor: actor || { email: adminEmail, name: adminName, role: "super-admin" },
      action: AUDIT_ACTIONS.UPDATE, entity: "activation-redemption", entityId: code,
      detail: `Provisioning failed after redemption: ${e.message}`, severity: "warn",
    });
    throw e;
  }
}
