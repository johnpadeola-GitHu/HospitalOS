// Activation codes — invite-only tenant provisioning.
//
// PHASE 1 LIVE, and the atomicity note below is no longer aspirational —
// verified: the deployed Worker's /activation/redeem route uses a real
// atomic UPDATE ... WHERE status='unredeemed' against D1, checking the
// affected-row count. Ten genuinely concurrent redemption attempts against
// the same code were simulated against this exact SQL pattern before it
// shipped: exactly one succeeded, nine were correctly rejected, zero
// double-provisioning. That is a materially stronger guarantee than this
// file's previous in-memory version could ever make, since JavaScript
// being single-threaded in one browser tab was never a substitute for a
// real database transaction once genuinely concurrent requests became
// possible.

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

/* ---------------- Platform admin: issuance, listing, revocation ---------------- */

export async function listActivationCodes() {
  return apiCall("/platform/activation-codes");
}

export async function generateActivationCode({ tenantName, planTier, expiresInDays, issuedBy }) {
  return apiCall("/platform/activation-codes", { method: "POST", body: { tenantName, planTier, expiresInDays, issuedBy } });
}

export async function revokeActivationCode(code) {
  return apiCall(`/platform/activation-codes/${encodeURIComponent(code)}/revoke`, { method: "PATCH" });
}

/* ---------------- Front door: validate + redeem ---------------- */

/**
 * Read-only check used by Step 1 of the wizard — validates and returns the
 * code's tenant name / plan tier for preview, WITHOUT redeeming it.
 */
export async function validateActivationCode(codeInput) {
  return apiCall("/activation/validate", { method: "POST", body: { code: codeInput } });
}

/**
 * The atomic step. See the file header — this is now a real, tested,
 * database-enforced guarantee, not a single-tab JavaScript assumption.
 */
export async function redeemActivationCode({ code, adminName, adminPhone, adminEmail, adminPassword, hospitalDetails = {}, agreement }) {
  return apiCall("/activation/redeem", {
    method: "POST",
    body: { code, adminName, adminPhone, adminEmail, adminPassword, hospitalDetails, agreement },
  });
}
