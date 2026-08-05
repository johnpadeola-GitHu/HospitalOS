import { useEffect, useRef, useState } from "react";
import { getSettings, updateSettings, uploadLogo } from "./sysAdminService";
import { inputStyle, PageHeader } from "../../lib/ui";
import * as Icons from "lucide-react";

export default function Settings() {
  const [s, setS] = useState(null);
  const [err, setErr] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    let alive = true;
    getSettings().then((v) => { if (alive) setS(v); }).catch(console.error);
    return () => { alive = false; };
  }, []);

  const patch = async (p) => {
    setErr("");
    try { const next = await updateSettings(p); setS(next); }
    catch (e) { setErr(e.message); }
  };

  const handleLogoFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setErr("");
    try {
      const { logoUrl } = await uploadLogo(file);
      const next = await updateSettings({ logoUrl });
      setS(next);
    } catch (e) { setErr(e.message); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  if (!s) return (<div><Head /><div style={{ color: "var(--muted)", fontSize: 13 }}>Loading settings…</div></div>);

  return (
    <div>
      <Head />
      {err && <div style={errBox}>{err}</div>}

      <div style={section}>
        <div style={sectionTitle}>Hospital identity</div>

        <Field label="Hospital name — shown top-right on every screen">
          <input style={{ ...inputStyle, maxWidth: 320 }} value={s.hospitalName || ""} onChange={(e) => patch({ hospitalName: e.target.value })} />
        </Field>

        <Field label="Logo">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {s.logoUrl ? (
              <img src={s.logoUrl} alt="Hospital logo" style={logoImg} onError={(e) => { e.target.style.display = "none"; }} />
            ) : (
              <div style={logoPlaceholder}>No logo</div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={uploadBtn} onClick={() => fileRef.current?.click()} disabled={uploading}>
                  <Icons.Upload size={13} />
                  {uploading ? "Uploading…" : "Upload file"}
                </button>
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>PNG, JPEG, SVG or WebP · max 2 MB</div>
              <Field label="Or paste a URL">
                <input style={{ ...inputStyle, maxWidth: 320 }} value={s.logoUrl || ""} onChange={(e) => patch({ logoUrl: e.target.value })} placeholder="https://…/logo.png" />
              </Field>
            </div>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" style={{ display: "none" }} onChange={handleLogoFile} />
          </div>
        </Field>

        <div style={note}>Address, phone, and email appear on every released result, invoice, and receipt — this is what identifies the document as genuinely yours.</div>
        <Field label="Address">
          <input style={{ ...inputStyle, maxWidth: 420 }} value={s.address || ""} onChange={(e) => patch({ address: e.target.value })} />
        </Field>
        <Field label="Phone">
          <input style={{ ...inputStyle, maxWidth: 280 }} value={s.phone || ""} onChange={(e) => patch({ phone: e.target.value })} />
        </Field>
        <Field label="Email">
          <input style={{ ...inputStyle, maxWidth: 320 }} value={s.email || ""} onChange={(e) => patch({ email: e.target.value })} />
        </Field>
      </div>

      <div style={{ ...section, marginTop: 20 }}>
        <div style={sectionTitle}>Regulatory & compliance identifiers</div>
        <div style={note}>These identifiers appear on official hospital documents and are used for regulatory filings. Enter only numbers that apply to your facility.</div>

        <Field label="HEFAMAA number — Hospital & Facilities Management Authority (Lagos)">
          <input style={{ ...inputStyle, maxWidth: 320 }} value={s.hefamaaNumber || ""} onChange={(e) => patch({ hefamaaNumber: e.target.value })} placeholder="e.g. HFM/0001/2020" />
        </Field>
        <Field label="NHIA facility code — National Health Insurance Authority">
          <input style={{ ...inputStyle, maxWidth: 320 }} value={s.nhiaFacilityCode || ""} onChange={(e) => patch({ nhiaFacilityCode: e.target.value })} placeholder="e.g. NHIA/FAC/LG/0001" />
        </Field>
        <Field label="MDCN facility certification number — Medical & Dental Council of Nigeria">
          <input style={{ ...inputStyle, maxWidth: 320 }} value={s.mdcnCertNumber || ""} onChange={(e) => patch({ mdcnCertNumber: e.target.value })} placeholder="e.g. MDCN/C/0001" />
        </Field>
        <Field label="CAC / RC number — Corporate Affairs Commission">
          <input style={{ ...inputStyle, maxWidth: 280 }} value={s.cacRcNumber || ""} onChange={(e) => patch({ cacRcNumber: e.target.value })} placeholder="e.g. RC 123456" />
        </Field>
        <Field label="TIN — Tax Identification Number (FIRS)">
          <input style={{ ...inputStyle, maxWidth: 280 }} value={s.tin || ""} onChange={(e) => patch({ tin: e.target.value })} placeholder="e.g. 12345678-0001" />
        </Field>
        <Field label="State Ministry of Health license number">
          <input style={{ ...inputStyle, maxWidth: 320 }} value={s.stateMohLicense || ""} onChange={(e) => patch({ stateMohLicense: e.target.value })} placeholder="e.g. OY/MoH/PHL/0001" />
        </Field>
      </div>

      <div style={{ ...section, marginTop: 20 }}>
        <div style={sectionTitle}>System preferences</div>
        <Field label="Currency"><div style={{ fontSize: 13, color: "var(--ink-strong)" }}>{s.currency}</div></Field>
        <Field label="Timezone"><div style={{ fontSize: 13, color: "var(--ink-strong)" }}>{s.timezone}</div></Field>
        <Toggle label="NHIA integration enabled" on={s.nhisEnabled} onChange={() => patch({ nhisEnabled: !s.nhisEnabled })} />
        <Toggle label="Critical alert sound" on={s.criticalAlertSound} onChange={() => patch({ criticalAlertSound: !s.criticalAlertSound })} />
      </div>
    </div>
  );
}

function Head() { return <PageHeader group="Administration" title={<>Settings</>} icon="Settings" />; }

function Field({ label, children }) {
  return (
    <div style={{ padding: "10px 0", borderTop: "1px solid var(--border)" }}>
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

const section = { background: "var(--surface-2)", border: "1px solid var(--border)", padding: "6px 20px 16px", maxWidth: 560 };
const sectionTitle = { fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", padding: "12px 0 4px" };
const note = { fontSize: 11.5, color: "var(--muted)", background: "var(--surface)", border: "1px solid var(--border)", padding: "8px 11px", margin: "4px 0 10px", lineHeight: 1.5, maxWidth: 440 };
const errBox = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12, padding: "8px 11px", marginBottom: 14 };
const logoImg = { width: 48, height: 48, objectFit: "cover", border: "1px solid var(--border)", flexShrink: 0 };
const logoPlaceholder = { width: 48, height: 48, background: "var(--surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "var(--muted)", flexShrink: 0 };
const uploadBtn = { display: "flex", alignItems: "center", gap: 6, font: "inherit", fontSize: 12.5, fontWeight: 600, padding: "6px 12px", border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--ink-strong)", cursor: "pointer" };
const track = { width: 40, height: 22, borderRadius: 999, border: "none", cursor: "pointer", padding: 2, display: "flex", alignItems: "center" };
const knob = { width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "transform 0.15s" };
