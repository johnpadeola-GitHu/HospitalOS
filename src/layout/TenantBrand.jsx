import { useEffect, useState } from "react";
import { getSettings } from "../modules/system/sysAdminService";

// The single, unified brand element for the topbar: this tenant's own logo,
// plus "HospitalOS (Tenant Name)" \u2014 product and tenant identity in one
// compact unit instead of three separate, redundant labels scattered across
// the sidebar and topbar (a real inconsistency this replaces: the sidebar
// used to show a hardcoded, wrong tenant name; the topbar repeated
// "HospitalOS" again in the breadcrumb; and this component duplicated the
// tenant name a third time on the far right). Reads live from
// Administration -> Settings, so a tenant admin changing it updates
// immediately, no reload needed.
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
      <span style={name}>
        HospitalOS<span style={tenantPart}> ({settings.hospitalName})</span>
      </span>
    </div>
  );
}

const wrap = { display: "flex", alignItems: "center", gap: 7, flexShrink: 0 };
const logoImg = { width: 22, height: 22, borderRadius: 6, objectFit: "cover", flexShrink: 0, border: "1px solid var(--border)" };
const logoFallback = {
  width: 22, height: 22, borderRadius: 6, background: "var(--accent-bg)", color: "var(--accent)",
  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9.5, fontWeight: 700, flexShrink: 0,
};
const name = { fontSize: 12.5, fontWeight: 700, color: "var(--ink-strong)", whiteSpace: "nowrap" };
const tenantPart = { fontWeight: 500, color: "var(--muted)" };
