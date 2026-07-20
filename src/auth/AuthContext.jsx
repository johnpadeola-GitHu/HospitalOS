import { createContext, useContext, useState, useCallback } from "react";
import { canAccessArea, canDo, roleLabel as rbacRoleLabel, areasFor } from "../lib/rbac";
import { record, AUDIT_ACTIONS } from "../lib/audit";
import { checkAndRecordDevice, deviceLabel } from "../lib/deviceFingerprint";

// Auth context — email/password sign-in, session state, and (for the platform
// admin) a Platform/Tenant view switch.
//
// PHASE 1 LIVE: signIn() now calls the real deployed Worker
// (hospitalos-api.johnpadeola.workers.dev) instead of checking an in-memory
// array — real PBKDF2 password verification against a real D1 database.
// Everything downstream (sidebar, route guards, platform gate, can()/may())
// is unchanged, since it only ever consumed whatever this context returned.
//
// KNOWN GAP, stated plainly: only auth and patients are migrated so far.
// Every other module (lab, pharmacy, billing, Users & roles, and so on)
// still reads from the old in-memory accountsStore.js/service files, not
// this Worker. A user created via Administration -> Users & roles will NOT
// be able to sign in through this real backend until that module is
// migrated too — it's still writing to the disconnected in-memory array.
// This is the expected, honest state of a partial migration, not a bug.

const API_URL = "https://hospitalos-api.johnpadeola.workers.dev";
const TOKEN_KEY = "hospitalos_session_token";

const AuthContext = createContext(null);

// Platform admin — the only account that can see the platform view.
const PLATFORM_ADMIN_EMAIL = "support@agorox.africa";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("tenant"); // "tenant" | "platform"

  const signIn = useCallback(async (email, password) => {
    let res, data;
    try {
      res = await fetch(`${API_URL}/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, deviceLabel: deviceLabel() }),
      });
      data = await res.json();
    } catch {
      throw new Error("Couldn't reach the sign-in server. Check your connection and try again.");
    }
    if (!res.ok) {
      const err = new Error(data.error || "Sign-in failed.");
      if (data.demoExpired) err.demoExpired = true;
      throw err;
    }
    localStorage.setItem(TOKEN_KEY, data.token);
    // Device fingerprinting stays a client-side, best-effort signal — see
    // deviceFingerprint.js's own honest-scope note — this is unrelated to
    // the server-verified session token and doesn't need a backend change.
    const device = checkAndRecordDevice(data.user);
    setUser({ ...data.user, newDevice: device.isNew, deviceLabel: device.label });
    setView("tenant");
    return data.user;
  }, []);

  const signOut = useCallback(() => {
    if (user) record({ actor: user, action: AUDIT_ACTIONS.SIGN_OUT, entity: "session", entityId: user.email, detail: "Signed out" });
    // NOTE: this clears the local token but does not yet revoke the session
    // row server-side (no POST /auth/signout route exists in Phase 1) — the
    // D1 session simply expires naturally after 12 hours. Real revocation
    // is a small, fast follow-up once needed.
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setView("tenant");
  }, [user]);

  const permissions = user ? areasFor(user.role) : [];

  // Area check — gates nav groups and routes. Accepts a bare area key.
  const can = useCallback((areaKey) => (user ? canAccessArea(user.role, areaKey) : false), [user]);

  // Action check — gates buttons. Accepts "<area>:<action>".
  const may = useCallback((permission) => (user ? canDo(user.role, permission) : false), [user]);

  // Log an attempt that RBAC refused, so denials are auditable too.
  const denied = useCallback((permission, detail) => {
    if (!user) return;
    record({
      actor: user, action: AUDIT_ACTIONS.DENY, entity: "permission",
      entityId: permission, detail: detail || `Denied ${permission}`, severity: "warn",
    });
  }, [user]);

  const isPlatformAdmin = !!user?.platformAdmin;

  const value = {
    user,
    signedIn: !!user,
    signIn,
    signOut,
    role: user?.role,
    roleLabel: user ? rbacRoleLabel(user.role) : "",
    permissions,
    can,
    may,
    denied,
    isPlatformAdmin,
    view,
    setView: (v) => {
      // Only the platform admin may enter the platform view.
      if (v === "platform" && !isPlatformAdmin) return;
      setView(v);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { PLATFORM_ADMIN_EMAIL };
