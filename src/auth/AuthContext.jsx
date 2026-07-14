import { createContext, useContext, useState, useCallback } from "react";
import { permissionsFor, ROLES } from "../modules/system/systemService";

// Current-user context. No login screen yet — the app runs as a selected user
// and a switcher (in the topbar) lets you see role gating take effect. When a
// real login lands, it sets currentUser here and everything downstream (sidebar,
// routes) enforces off the same permission set.

const AuthContext = createContext(null);

// Seed users mirror systemService's directory so the switcher has real roles.
const DEV_USERS = [
  { id: "u1", name: "Dr. Adewale Ogun", role: "super-admin" },
  { id: "u2", name: "Dr. Ngozi Umeh", role: "doctor" },
  { id: "u3", name: "Sr. Blessing Ade", role: "nurse" },
  { id: "u5", name: "Tunde (Pharmacy)", role: "pharmacist" },
  { id: "u6", name: "Amaka (Cashier)", role: "cashier" },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(DEV_USERS[0]);

  const permissions = permissionsFor(user.role);

  const can = useCallback(
    (permissionKey) => permissions.includes(permissionKey),
    [permissions]
  );

  const value = {
    user,
    role: user.role,
    roleLabel: ROLES[user.role]?.label || user.role,
    permissions,
    can,
    switchUser: (id) => {
      const next = DEV_USERS.find((u) => u.id === id);
      if (next) setUser(next);
    },
    devUsers: DEV_USERS,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
