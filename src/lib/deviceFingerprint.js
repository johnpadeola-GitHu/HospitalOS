// Device fingerprinting — every sign-in is checked against the devices
// already known for that account, and a genuinely new device is flagged.
//
// HONEST SCOPE: a browser cannot generate a cryptographically strong,
// spoof-proof hardware fingerprint — anyone can change their user agent or
// clear storage. What this provides is the same tier of protection most
// consumer apps actually ship: a best-effort signal combining several
// browser characteristics, good enough to notice "this sign-in looks like
// a different device than usual" and log it, not a hard security boundary.
// A real deployment would pair this with IP-based signals server-side,
// which this preview build has no server to provide.

import { record, AUDIT_ACTIONS } from "./audit";

// email -> [{ fingerprint, label, firstSeenAt, lastSeenAt }]
const _knownDevices = new Map();

function simpleHash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
  return (h >>> 0).toString(36);
}

/** A human-readable label parsed from the user agent — "Chrome on Windows", "Safari on iPhone", etc. */
export function deviceLabel() {
  if (typeof navigator === "undefined") return "Unknown device";
  const ua = navigator.userAgent || "";
  const browser =
    /Edg\//.test(ua) ? "Edge" :
    /Chrome\//.test(ua) ? "Chrome" :
    /Firefox\//.test(ua) ? "Firefox" :
    /Safari\//.test(ua) && !/Chrome/.test(ua) ? "Safari" : "Browser";
  const os =
    /iPhone|iPad/.test(ua) ? "iOS" :
    /Android/.test(ua) ? "Android" :
    /Mac OS X/.test(ua) ? "macOS" :
    /Windows/.test(ua) ? "Windows" :
    /Linux/.test(ua) ? "Linux" : "Unknown OS";
  return `${browser} on ${os}`;
}

/**
 * Best-effort device fingerprint from characteristics available without any
 * permission prompt: user agent, screen geometry, timezone, language,
 * logical CPU count. Stable across sign-ins on the same real device;
 * different across genuinely different devices/browsers.
 */
export function currentFingerprint() {
  if (typeof navigator === "undefined") return "server";
  const parts = [
    navigator.userAgent || "",
    navigator.language || "",
    String(navigator.hardwareConcurrency || ""),
    typeof screen !== "undefined" ? `${screen.width}x${screen.height}x${screen.colorDepth}` : "",
    Intl.DateTimeFormat().resolvedOptions().timeZone || "",
  ];
  return simpleHash(parts.join("|"));
}

/**
 * Checks the current device against an account's known devices. Returns
 * whether this is a new device, and records it either way (first sight, or
 * updates lastSeenAt for a recognised one). Called once per sign-in from
 * AuthContext \u2014 never on every request, since that would just be noise.
 */
export function checkAndRecordDevice(account) {
  const fp = currentFingerprint();
  const label = deviceLabel();
  const devices = _knownDevices.get(account.email) || [];
  const existing = devices.find((d) => d.fingerprint === fp);
  const now = new Date().toISOString();

  if (existing) {
    existing.lastSeenAt = now;
    return { isNew: false, label };
  }

  const isFirstEver = devices.length === 0;
  devices.push({ fingerprint: fp, label, firstSeenAt: now, lastSeenAt: now });
  _knownDevices.set(account.email, devices);

  // The very first device an account ever signs in from is not "new" in any
  // alarming sense — it's just where the account started. Every device
  // after that genuinely is new and worth a note in the audit trail.
  if (!isFirstEver) {
    record({
      actor: account, action: AUDIT_ACTIONS.SIGN_IN, entity: "new-device", entityId: account.email,
      detail: `New device signed in \u2014 ${label}`, severity: "warn",
    });
  }

  return { isNew: !isFirstEver, label };
}

/** For Administration -> Security & audit: every known device for accounts on one tenant. */
export function listKnownDevices(accountEmails) {
  const rows = [];
  for (const email of accountEmails) {
    for (const d of _knownDevices.get(email) || []) rows.push({ email, ...d });
  }
  return rows.sort((a, b) => new Date(b.lastSeenAt) - new Date(a.lastSeenAt));
}
