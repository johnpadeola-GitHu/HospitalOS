import { createContext, useContext, useState, useCallback } from "react";
import { canAccessArea, canDo, roleLabel as rbacRoleLabel, areasFor } from "../lib/rbac";
import { record, AUDIT_ACTIONS } from "../lib/audit";
import { findAccount, demoAccountsPublicList } from "./accountsStore";

// Auth context — email/password sign-in, session state, and (for the platform
// admin) a Platform/Tenant view switch.
//
// SECURITY NOTE: credentials are checked client-side here, which is fine for a
// demo/preview but is NOT secure — a browser cannot keep a secret. When the
// Workers/D1 backend lands, signIn() posts to an auth endpoint and the returned
// JWT drives this same context. Everything downstream (sidebar, route guards,
// platform gate) is unchanged by that swap.

const AuthContext = createContext(null);

// Platform admin — the only account that can see the platform view.
const PLATFORM_ADMIN_EMAIL = "support@agorox.africa";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("tenant"); // "tenant" | "platform"

  const signIn = useCallback(async (email, password) => {
    const found = findAccount(email);
    if (!found || found.password !== password) {
      record({
        actor: { email: String(email).trim().toLowerCase() || "unknown", name: "Unknown", role: "none" },
        action: AUDIT_ACTIONS.DENY, entity: "session", entityId: "sign-in",
        detail: "Failed sign-in attempt", severity: "warn",
      });
      throw new Error("Incorrect email or password.");
    }
    if (found.demoExpiresAt && new Date(found.demoExpiresAt) < new Date()) {
      record({
        actor: found, action: AUDIT_ACTIONS.DENY, entity: "session", entityId: "sign-in",
        detail: "Blocked sign-in — demo period expired", severity: "warn",
      });
      const err = new Error("Your 7-day demo has ended. Sign up for a full account to keep going — your data will not carry over from the demo.");
      err.demoExpired = true;
      throw err;
    }
    const { password: _pw, ...safe } = found;
    setUser(safe);
    setView("tenant");
    record({ actor: safe, action: AUDIT_ACTIONS.SIGN_IN, entity: "session", entityId: safe.email, detail: `Signed in as ${rbacRoleLabel(safe.role)}` });
    return safe;
  }, []);

  const signOut = useCallback(() => {
    if (user) record({ actor: user, action: AUDIT_ACTIONS.SIGN_OUT, entity: "session", entityId: user.email, detail: "Signed out" });
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
    demoAccounts: demoAccountsPublicList(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { PLATFORM_ADMIN_EMAIL };
