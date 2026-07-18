import { useState } from "react";
import * as Icons from "lucide-react";
import { startDemo, DEMO_DURATION_DAYS } from "../engines/onboarding";
import { inputStyle } from "../lib/ui";

// Self-serve full registration (SignUpForm) was removed \u2014 registration is
// invite-only via activation codes now (see OnboardingWizard.jsx). Only the
// no-commitment demo stays self-serve here, since it was never a real tenant
// registration to begin with.

/* ============================== DEMO ============================== */

export function DemoForm({ onBack, onDone }) {
  const [form, setForm] = useState({ hospitalName: "", contactName: "", contactEmail: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true); setErr("");
    try { setResult(await startDemo(form)); }
    catch (e) { setErr(e.message); setBusy(false); }
  };

  if (result) {
    return (
      <div>
        <div style={successIcon}><Icons.Sparkles size={24} color="#fff" /></div>
        <h1 style={title}>Your demo is ready</h1>
        <p style={subtitle}>Full access to HospitalOS for {DEMO_DURATION_DAYS} days \u2014 no payment, no commitment.</p>

        <div style={credBox}>
          <div style={credLabel}>Your sign-in email</div>
          <div style={credValue}>{result.account.email}</div>
          <div style={{ ...credLabel, marginTop: 12 }}>Temporary password</div>
          <div style={credValue}>{result.password}</div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 10, lineHeight: 1.5 }}>
            Expires {new Date(result.expiresAt).toLocaleDateString()}. Data entered during the demo does not carry
            over if you sign up for a full account afterward.
          </div>
        </div>

        <button style={primaryBtn} onClick={() => onDone(result.account.email)}>
          Start exploring <Icons.ArrowRight size={15} strokeWidth={2.2} />
        </button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={onBack} style={backLink}><Icons.ChevronLeft size={14} /> Back to sign in</button>
      <h1 style={title}>Try HospitalOS free</h1>
      <p style={subtitle}>{DEMO_DURATION_DAYS} days, full access, nothing to pay. See if it fits before you decide.</p>

      {err && <div style={errBox}><Icons.AlertCircle size={14} style={{ flexShrink: 0 }} />{err}</div>}

      <Row><F label="Hospital / organisation name"><input style={inputStyle} value={form.hospitalName} onChange={set("hospitalName")} /></F></Row>
      <Row><F label="Your name"><input style={inputStyle} value={form.contactName} onChange={set("contactName")} /></F></Row>
      <Row><F label="Your email"><input type="email" style={inputStyle} value={form.contactEmail} onChange={set("contactEmail")} /></F></Row>

      <button style={{ ...primaryBtn, opacity: busy ? 0.7 : 1 }} onClick={submit} disabled={busy}>
        {busy ? "Setting up your demo…" : "Start my free demo"}
        {!busy && <Icons.ArrowRight size={15} strokeWidth={2.2} />}
      </button>
    </div>
  );
}

/* ============================== shared bits ============================== */

function Row({ children, cols = 1 }) {
  return <div style={{ display: "grid", gridTemplateColumns: cols === 2 ? "1fr 1fr" : "1fr", gap: 12, marginBottom: 14 }}>{children}</div>;
}
function F({ label, children }) {
  return <label style={{ display: "block" }}><span style={lbl}>{label}</span>{children}</label>;
}

const title = { fontSize: 20, fontWeight: 700, color: "var(--ink-strong)", letterSpacing: "-0.02em", marginBottom: 4 };
const subtitle = { fontSize: 13, color: "var(--muted)", marginBottom: 18 };
const lbl = { display: "block", fontSize: 11.5, fontWeight: 600, color: "var(--muted)", marginBottom: 5 };
const backLink = { display: "inline-flex", alignItems: "center", gap: 5, font: "inherit", fontSize: 12.5, fontWeight: 600, color: "var(--muted)", background: "none", border: "none", cursor: "pointer", marginBottom: 16, padding: 0 };
const primaryBtn = {
  width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  background: "var(--charcoal)", color: "#fff", border: "none", borderRadius: 10,
  padding: "12px 0", fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 6,
};
const errBox = { display: "flex", alignItems: "flex-start", gap: 8, background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12.5, padding: "10px 12px", borderRadius: 9, marginBottom: 16, lineHeight: 1.5 };
const successIcon = { width: 48, height: 48, borderRadius: "50%", background: "var(--good)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 };
const credBox = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 18px", marginBottom: 18 };
const credLabel = { fontSize: 10.5, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" };
const credValue = { fontSize: 15, fontWeight: 700, color: "var(--ink-strong)", fontFamily: "var(--font-mono)", marginTop: 2 };
