import { useEffect, useState } from "react";
import { getSettings } from "../modules/system/sysAdminService";

// The topbar's top-left corner belongs entirely to the tenant now — their
// own logo and their own name, nothing else. HospitalOS product branding
// does not appear here at all; it lives in the sidebar and the footer,
// which is where a platform identity belongs, not on every tenant's own
// working screen. Reads live from Administration -> Settings, so a tenant
// admin changing their logo or name updates immediately, no reload needed.
export default function TenantBrand() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    let alive = true;
    const load = () => getSettings().then((s) => alive && setSettings(s));
    load();
    const t = setInterval(load, 4000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  if (!settings) return null;
  const initials = settings.hospitalName
    .split(" ")
    .filter((w) => w.length > 2 || /^[A-Z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "H";

  return (
    <div style={wrap} title={settings.hospitalName}>
      {settings.logoUrl ? (
        <img src={settings.logoUrl} alt={settings.hospitalName} style={logoImg} />
      ) : (
        <div style={logoFallback}>{initials}</div>
      )}
      <span style={name}>{settings.hospitalName}</span>
    </div>
  );
}

const wrap = { display: "flex", alignItems: "center", gap: 9, flexShrink: 0, minWidth: 0 };
const logoImg = { width: 28, height: 28, borderRadius: 7, objectFit: "cover", flexShrink: 0, border: "1px solid var(--border)" };
const logoFallback = {
  width: 28, height: 28, borderRadius: 7, background: "var(--accent-bg)", color: "var(--accent)",
  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0,
};
const name = { fontSize: 13.5, fontWeight: 700, color: "var(--ink-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
