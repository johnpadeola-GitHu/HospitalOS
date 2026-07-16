import { useEffect, useState } from "react";
import { getSettings } from "../modules/system/sysAdminService";

// Tenant branding — each hospital's own logo and name, distinct from the
// HospitalOS/AgoroX product branding in the sidebar. Reads live from
// Administration -> Settings, so a tenant admin changing it updates every
// screen immediately, with no rebuild.
export default function TenantBrand() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    let alive = true;
    const load = () => getSettings().then((s) => alive && setSettings(s));
    load();
    // Settings can change from another tab/screen; poll lightly so the badge
    // stays current without needing a global settings context.
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

const wrap = { display: "flex", alignItems: "center", gap: 8, paddingLeft: 12, marginLeft: 4, borderLeft: "1px solid var(--border)" };
const logoImg = { width: 26, height: 26, borderRadius: 7, objectFit: "cover", flexShrink: 0, border: "1px solid var(--border)" };
const logoFallback = {
  width: 26, height: 26, borderRadius: 7, background: "var(--accent-bg)", color: "var(--accent)",
  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 700, flexShrink: 0,
};
const name = { fontSize: 12, fontWeight: 700, color: "var(--ink-strong)", whiteSpace: "nowrap", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis" };
