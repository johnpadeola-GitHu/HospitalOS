// Onboarding engine — sign-up, tier selection, and the 7-day demo.
//
// An ENGINE like Help/Pricing/FHIR/Results: owns its own logic, is imported
// BY the SignUp screen and Login screen, and writes into two other stores —
// the account directory (so a new hospital can actually sign in) and the
// platform's tenant list (so AgoroX can see every signup, the same way it
// already sees every seeded tenant). Nothing downstream needs to know a
// signup happened through a form rather than being seeded at boot.
//
// PRICING MODEL
//   Three free tiers, no upfront payment, AgoroX takes a commission on the
//   hospital's own collections instead — smaller hospitals pay a higher
//   percentage because their absolute volume is lower, the standard SaaS
//   commission curve. One flat annual tier for hospitals that would rather
//   pay a fixed price and keep 100% of what they collect.
//
// In-memory now; async API shaped for a later D1 swap. Real payment
// collection for the Enterprise tier needs Paystack wired server-side (see
// the Production Readiness Plan) — until then, an Enterprise signup is
// created with status "pending-payment" and a platform admin activates it
// from Platform → Tenants once payment is confirmed, the same action already
// used to reactivate a suspended tenant.

// Phase 1 live: startDemo() now calls the real deployed Worker instead of
// writing to the in-memory account/tenant stores directly.
const API_URL = "https://hospitalos-api.johnpadeola.workers.dev";


export const DEMO_DURATION_DAYS = 7;

export const FREE_TIERS = [
  {
    key: "starter", label: "Starter", commissionPct: 2.75,
    sizeLabel: "Small hospitals & clinics", bedRange: "Up to 49 beds",
    blurb: "Everything HospitalOS offers, for a facility just getting started with digital records.",
  },
  {
    key: "growth", label: "Growth", commissionPct: 2.25,
    sizeLabel: "Medium hospitals", bedRange: "50\u2013149 beds",
    blurb: "The same full platform, at a lower commission as your collections grow.",
  },
  {
    key: "scale", label: "Scale", commissionPct: 1.75,
    sizeLabel: "Large hospitals", bedRange: "150+ beds",
    blurb: "Our lowest commission rate, for hospitals running real volume across multiple sites.",
  },
];

export const PAID_TIER = {
  key: "enterprise", label: "Enterprise", priceNaira: 4_500_000, billingPeriod: "annual",
  blurb: "One flat annual price, no commission on your collections \u2014 predictable cost regardless of volume.",
};

export const ALL_TIERS = [...FREE_TIERS, PAID_TIER];

/** Suggests a tier from a self-reported bed count. A starting point, not a lock — the signup form lets the hospital choose any tier regardless. */
export function suggestTier(bedCount) {
  const n = parseInt(bedCount, 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n < 50) return "starter";
  if (n < 150) return "growth";
  return "scale";
}

export function getTier(key) {
  return ALL_TIERS.find((t) => t.key === key) || null;
}
export async function startDemo({ hospitalName, contactName, contactEmail }) {
  let res, data;
  try {
    res = await fetch(`${API_URL}/auth/demo`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hospitalName, contactName, contactEmail }),
    });
    data = await res.json();
  } catch {
    throw new Error("Couldn't reach the server. Check your connection and try again.");
  }
  if (!res.ok) throw new Error(data.error || "Couldn't start the demo.");
  // Client field name kept as "password" (not the server's "tempPassword")
  // so SignUp.jsx's result.password reference needs no change.
  return { tenant: data.tenant, account: data.account, password: data.tempPassword, expiresAt: data.expiresAt };
}

export function daysRemaining(expiresAt) {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86400000));
}
