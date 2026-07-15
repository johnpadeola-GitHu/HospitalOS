// Immutable audit log.
//
// Append-only by construction: entries are frozen on write, the internal array
// is never exposed by reference, and there is no update or delete API. Each
// entry is hash-chained to its predecessor, so any tampering with an earlier
// record breaks verification of every record after it.
//
// SCOPE: a browser cannot enforce immutability against someone with devtools —
// this is tamper-EVIDENT, not tamper-PROOF. Real immutability needs the record
// written server-side to append-only storage. The chain design is what makes
// that migration meaningful: the same hashing runs in the Worker, and
// verifyChain() detects any row edited directly in the database.

const _entries = [];
let _seq = 0;

// Small synchronous string hash (FNV-1a). Not cryptographic — a real
// implementation uses SHA-256 server-side. Sufficient here to demonstrate
// chain-breakage detection.
function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function digest(entry, prevHash) {
  return hash(
    [prevHash, entry.seq, entry.at, entry.actorEmail, entry.action, entry.entity, entry.entityId, entry.detail].join("|")
  );
}

export const AUDIT_ACTIONS = {
  CREATE: "create", UPDATE: "update", DELETE: "delete",
  VIEW: "view", SIGN_IN: "sign-in", SIGN_OUT: "sign-out",
  DENY: "access-denied", CLINICAL: "clinical", FINANCIAL: "financial",
};

/**
 * Append an entry. Returns a frozen copy. There is deliberately no way to
 * modify or remove an entry once written.
 */
export function record({ actor, action, entity, entityId = "", detail = "", severity = "info" }) {
  _seq += 1;
  const prev = _entries.length ? _entries[_entries.length - 1] : null;
  const prevHash = prev ? prev.hash : "0".repeat(8);

  const base = {
    seq: _seq,
    at: new Date().toISOString(),
    actorEmail: actor?.email || "system",
    actorName: actor?.name || "System",
    actorRole: actor?.role || "system",
    action,
    entity,
    entityId,
    detail,
    severity,
    prevHash,
  };
  const entry = Object.freeze({ ...base, hash: digest(base, prevHash) });
  _entries.push(entry);
  return entry;
}

/** Read-only view. Returns copies, newest first — never the internal array. */
export function listAudit({ limit = 200, action = "all", actor = "all", query = "" } = {}) {
  const q = query.trim().toLowerCase();
  return _entries
    .filter((e) => (action === "all" ? true : e.action === action))
    .filter((e) => (actor === "all" ? true : e.actorEmail === actor))
    .filter((e) =>
      !q ? true :
      e.detail.toLowerCase().includes(q) ||
      e.entity.toLowerCase().includes(q) ||
      e.actorName.toLowerCase().includes(q) ||
      String(e.entityId).toLowerCase().includes(q)
    )
    .slice()
    .reverse()
    .slice(0, limit)
    .map((e) => ({ ...e }));
}

/**
 * Recompute the chain. Returns { valid, brokenAt, length }.
 * If any entry were altered, its hash — and every subsequent link — fails.
 */
export function verifyChain() {
  let prevHash = "0".repeat(8);
  for (const e of _entries) {
    const { hash: h, ...base } = e;
    if (e.prevHash !== prevHash) return { valid: false, brokenAt: e.seq, length: _entries.length };
    if (digest(base, prevHash) !== h) return { valid: false, brokenAt: e.seq, length: _entries.length };
    prevHash = h;
  }
  return { valid: true, brokenAt: null, length: _entries.length };
}

export function auditStats() {
  const byAction = {};
  const actors = new Set();
  for (const e of _entries) {
    byAction[e.action] = (byAction[e.action] || 0) + 1;
    actors.add(e.actorEmail);
  }
  return { total: _entries.length, byAction, actors: actors.size, chain: verifyChain() };
}

export function auditActors() {
  return [...new Set(_entries.map((e) => e.actorEmail))];
}

// Seed a little history so the log isn't empty on first load.
record({ actor: { email: "system", name: "System", role: "system" }, action: AUDIT_ACTIONS.CREATE, entity: "deployment", entityId: "678e40f", detail: "HospitalOS deployed", severity: "info" });
