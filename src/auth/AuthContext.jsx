import { createContext, useContext, useState, useCallback } from "react";
import { canAccessArea, canDo, roleLabel as rbacRoleLabel, areasFor } from "../lib/rbac";
import { record, AUDIT_ACTIONS } from "../lib/audit";

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

// Account directory. Password is demo-only; real hashing happens server-side.
const ACCOUNTS = [
  { id: "u0", email: PLATFORM_ADMIN_EMAIL, password: "agorox", name: "AgoroX Support", role: "super-admin", platformAdmin: true },
  { id: "u1", email: "a.ogun@hospitalos.ng", password: "demo", name: "Dr. Adewale Ogun", role: "super-admin" },
  { id: "u2", email: "n.umeh@hospitalos.ng", password: "demo", name: "Dr. Ngozi Umeh", role: "doctor" },
  { id: "u3", email: "b.ade@hospitalos.ng", password: "demo", name: "Sr. Blessing Ade", role: "nurse" },
  { id: "u5", email: "t.bello@hospitalos.ng", password: "demo", name: "Tunde Bello", role: "pharmacist" },
  { id: "u6", email: "a.nwosu@hospitalos.ng", password: "demo", name: "Amaka Nwosu", role: "cashier" },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("tenant"); // "tenant" | "platform"

  const signIn = useCallback(async (email, password) => {
    const found = ACCOUNTS.find(
      (a) => a.email.toLowerCase() === String(email).trim().toLowerCase()
    );
    if (!found || found.password !== password) {
      record({
        actor: { email: String(email).trim().toLowerCase() || "unknown", name: "Unknown", role: "none" },
        action: AUDIT_ACTIONS.DENY, entity: "session", entityId: "sign-in",
        detail: "Failed sign-in attempt", severity: "warn",
      });
      throw new Error("Incorrect email or password.");
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
    demoAccounts: ACCOUNTS.map(({ password: _p, ...a }) => a),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { PLATFORM_ADMIN_EMAIL };
