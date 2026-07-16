import { useEffect, useState } from "react";
import { getSettings, updateSettings } from "./sysAdminService";
import { inputStyle, PageHeader } from "../../lib/ui";

export default function Settings() {
  const [s, setS] = useState(null);

  useEffect(() => {
    let alive = true;
    getSettings().then((v) => alive && setS(v));
    return () => { alive = false; };
  }, []);

  const patch = async (p) => {
    const next = await updateSettings(p);
    setS(next);
  };

  if (!s) {
    return (<div><Head /><div style={{ color: "var(--muted)", fontSize: 13 }}>Loading settings…</div></div>);
  }

  return (
    <div>
      <Head />
      <div style={sheet}>
        <Field label="Hospital name — shown top-right on every screen">
          <input style={{ ...inputStyle, maxWidth: 320 }} value={s.hospitalName} onChange={(e) => patch({ hospitalName: e.target.value })} />
        </Field>
        <Field label="Logo URL — shown beside the hospital name">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input style={{ ...inputStyle, maxWidth: 320 }} value={s.logoUrl} onChange={(e) => patch({ logoUrl: e.target.value })} placeholder="https://…/logo.png" />
            {s.logoUrl ? (
              <img src={s.logoUrl} alt="" style={logoPreview} onError={(e) => { e.target.style.display = "none"; }} />
            ) : (
              <div style={logoPreviewFallback}>No logo set — initials shown instead</div>
            )}
          </div>
        </Field>

        <div style={sectionNote}>
          Address, phone and email appear on every released result and every invoice/receipt
          this hospital generates — this is what identifies the document as genuinely yours.
        </div>
        <Field label="Address">
          <input style={{ ...inputStyle, maxWidth: 420 }} value={s.address} onChange={(e) => patch({ address: e.target.value })} />
        </Field>
        <Field label="Phone">
          <input style={{ ...inputStyle, maxWidth: 280 }} value={s.phone} onChange={(e) => patch({ phone: e.target.value })} />
        </Field>
        <Field label="Email">
          <input style={{ ...inputStyle, maxWidth: 320 }} value={s.email} onChange={(e) => patch({ email: e.target.value })} />
        </Field>

        <Field label="Currency">
          <div style={valueText}>{s.currency}</div>
        </Field>
        <Field label="Timezone">
          <div style={valueText}>{s.timezone}</div>
        </Field>
        <Toggle label="NHIA integration enabled" on={s.nhisEnabled} onChange={() => patch({ nhisEnabled: !s.nhisEnabled })} />
        <Toggle label="Critical alert sound" on={s.criticalAlertSound} onChange={() => patch({ criticalAlertSound: !s.criticalAlertSound })} />
      </div>
    </div>
  );
}

function Head() {
  return (
    <PageHeader group="Administration" title={<>Settings</>} icon="Settings" />
  );
}

function Field({ label, children }) {
  return (
    <div style={{ padding: "12px 0", borderTop: "1px solid var(--border)" }}>
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

function Toggle({ label, on, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderTop: "1px solid var(--border)" }}>
      <span style={{ fontSize: 13, color: "var(--ink)" }}>{label}</span>
      <button onClick={onChange} style={{ ...track, background: on ? "var(--ink-strong)" : "var(--border-strong)" }} aria-pressed={on}>
        <span style={{ ...knob, transform: on ? "translateX(18px)" : "translateX(0)" }} />
      </button>
    </div>
  );
}

const sheet = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "6px 20px 16px", maxWidth: 520 };
const valueText = { fontSize: 13, color: "var(--ink-strong)" };
const logoPreview = { width: 32, height: 32, borderRadius: 8, objectFit: "cover", border: "1px solid var(--border)" };
const logoPreviewFallback = { fontSize: 11.5, color: "var(--muted)" };
const sectionNote = { fontSize: 11.5, color: "var(--muted)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 11px", margin: "4px 0 14px", lineHeight: 1.5, maxWidth: 420 };
const track = { width: 40, height: 22, borderRadius: 999, border: "none", cursor: "pointer", padding: 2, display: "flex", alignItems: "center" };
const knob = { width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "transform 0.15s" };
