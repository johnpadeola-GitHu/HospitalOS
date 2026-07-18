import { useState } from "react";
import * as Icons from "lucide-react";
import { registerHospital, startDemo, suggestTier, FREE_TIERS, PAID_TIER, DEMO_DURATION_DAYS } from "../engines/onboarding";
import { inputStyle } from "../lib/ui";

const naira = (n) => "\u20a6" + n.toLocaleString();

/* ============================== SIGN UP ============================== */

export function SignUpForm({ onBack, onDone }) {
  const [step, setStep] = useState(1); // 1: details, 2: plan, 3: result
  const [form, setForm] = useState({
    hospitalName: "", address: "", email: "", phone: "", logoUrl: "",
    registrationNumber: "", contactPersonName: "", bedCount: "",
  });
  const [tierKey, setTierKey] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const suggested = suggestTier(form.bedCount);

  const validateStep1 = () => {
    if (!form.hospitalName.trim()) return "Enter the hospital's name.";
    if (!form.address.trim()) return "Enter the hospital's address.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Enter a valid email address.";
    if (!form.phone.trim()) return "Enter a phone number.";
    if (!form.registrationNumber.trim()) return "Enter the hospital's registration number.";
    if (!form.contactPersonName.trim()) return "Enter the name of the person we should contact.";
    return null;
  };

  const goToStep2 = () => {
    const v = validateStep1();
    if (v) { setErr(v); return; }
    setErr("");
    setStep(2);
  };

  const submit = async () => {
    if (!tierKey) { setErr("Choose a plan to continue."); return; }
    setBusy(true); setErr("");
    try {
      const r = await registerHospital({ ...form, tierKey });
      setResult(r);
      setStep(3);
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  if (step === 3 && result) {
    return <SignUpResult result={result} onDone={onDone} />;
  }

  return (
    <div>
      <button onClick={step === 1 ? onBack : () => setStep(1)} style={backLink}>
        <Icons.ChevronLeft size={14} /> {step === 1 ? "Back to sign in" : "Back to hospital details"}
      </button>

      <h1 style={title}>Register your hospital</h1>
      <p style={subtitle}>Step {step} of 2 \u2014 {step === 1 ? "Tell us about your facility" : "Choose your plan"}</p>

      {err && <div style={errBox}><Icons.AlertCircle size={14} style={{ flexShrink: 0 }} />{err}</div>}

      {step === 1 && (
        <div>
          <Row><F label="Hospital name"><input style={inputStyle} value={form.hospitalName} onChange={set("hospitalName")} /></F></Row>
          <Row><F label="Address"><input style={inputStyle} value={form.address} onChange={set("address")} /></F></Row>
          <Row cols={2}>
            <F label="Email"><input type="email" style={inputStyle} value={form.email} onChange={set("email")} placeholder="admin@yourhospital.ng" /></F>
            <F label="Phone"><input style={inputStyle} value={form.phone} onChange={set("phone")} placeholder="+234…" /></F>
          </Row>
          <Row cols={2}>
            <F label="Registration number"><input style={inputStyle} value={form.registrationNumber} onChange={set("registrationNumber")} placeholder="CAC / state MoH number" /></F>
            <F label="Approx. bed count (optional)"><input type="number" style={inputStyle} value={form.bedCount} onChange={set("bedCount")} placeholder="e.g. 80" /></F>
          </Row>
          <Row><F label="Logo URL (optional — you can add this later in Settings)"><input style={inputStyle} value={form.logoUrl} onChange={set("logoUrl")} placeholder="https://…/logo.png" /></F></Row>
          <Row><F label="Contact person"><input style={inputStyle} value={form.contactPersonName} onChange={set("contactPersonName")} placeholder="Who should we reach for this account?" /></F></Row>

          <button style={primaryBtn} onClick={goToStep2}>
            Continue to plan selection <Icons.ArrowRight size={15} strokeWidth={2.2} />
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          {suggested && (
            <div style={suggestBox}>
              <Icons.Sparkles size={13} style={{ flexShrink: 0, marginTop: 1 }} />
              Based on {form.bedCount} beds, we'd suggest <b>{FREE_TIERS.find((t) => t.key === suggested)?.label}</b> \u2014 but pick whichever fits.
            </div>
          )}
          <div style={tierGrid}>
            {FREE_TIERS.map((t) => (
              <TierCard key={t.key} tier={t} selected={tierKey === t.key} suggested={t.key === suggested} onSelect={() => setTierKey(t.key)} />
            ))}
            <TierCard tier={PAID_TIER} selected={tierKey === PAID_TIER.key} onSelect={() => setTierKey(PAID_TIER.key)} paid />
          </div>

          <button style={{ ...primaryBtn, opacity: busy ? 0.7 : 1 }} onClick={submit} disabled={busy}>
            {busy ? "Creating your account…" : "Complete registration"}
            {!busy && <Icons.ArrowRight size={15} strokeWidth={2.2} />}
          </button>
        </div>
      )}
    </div>
  );
}

function TierCard({ tier, selected, suggested, onSelect, paid }) {
  return (
    <button onClick={onSelect} style={{ ...tierCard, ...(selected ? tierCardSelected : null) }}>
      {suggested && <span style={suggestedTag}>Suggested</span>}
      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink-strong)" }}>{tier.label}</div>
      {paid ? (
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--accent)", margin: "6px 0 2px" }}>
          {naira(tier.priceNaira)}<span style={{ fontSize: 11, fontWeight: 500, color: "var(--muted)" }}>/year</span>
        </div>
      ) : (
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--good)", margin: "6px 0 2px" }}>
          {tier.commissionPct}%<span style={{ fontSize: 11, fontWeight: 500, color: "var(--muted)" }}> commission, no upfront cost</span>
        </div>
      )}
      <div style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 6 }}>{tier.sizeLabel || "Any hospital size"}{tier.bedRange ? ` \u00b7 ${tier.bedRange}` : ""}</div>
      <div style={{ fontSize: 11.5, color: "var(--ink)", lineHeight: 1.5 }}>{tier.blurb}</div>
    </button>
  );
}

function SignUpResult({ result, onDone }) {
  const { tenant, account, tier, requiresPayment } = result;
  return (
    <div>
      <div style={successIcon}><Icons.CheckCircle2 size={26} color="#fff" /></div>
      <h1 style={title}>You're registered</h1>
      <p style={subtitle}>{tenant.name} is now on HospitalOS \u2014 {tier.label} plan.</p>

      {requiresPayment && (
        <div style={pendingBox}>
          <Icons.Clock size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            Enterprise is a flat annual plan ({naira(tier.priceNaira)}/year) \u2014 your account is created but
            marked <b>pending payment</b>. AgoroX will reach out to complete billing; full access unlocks once
            payment is confirmed.
          </span>
        </div>
      )}

      <div style={credBox}>
        <div style={credLabel}>Your sign-in email</div>
        <div style={credValue}>{account.email}</div>
        <div style={{ ...credLabel, marginTop: 12 }}>Temporary password</div>
        <div style={credValue}>{account.password || "Set during registration"}</div>
        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 10, lineHeight: 1.5 }}>
          Save this now \u2014 you'll use it to sign in. Change it once inside HospitalOS.
        </div>
      </div>

      <button style={primaryBtn} onClick={() => onDone(account.email)}>
        Continue to sign in <Icons.ArrowRight size={15} strokeWidth={2.2} />
      </button>
    </div>
  );
}

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
const suggestBox = { display: "flex", gap: 7, background: "var(--accent-soft)", color: "var(--accent)", fontSize: 12, padding: "9px 12px", borderRadius: 9, marginBottom: 14, lineHeight: 1.5 };
const tierGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 18 };
const tierCard = {
  position: "relative", textAlign: "left", background: "var(--surface-2)", border: "1.5px solid var(--border-strong)",
  borderRadius: 12, padding: "14px 14px 12px", cursor: "pointer", font: "inherit",
};
const tierCardSelected = { borderColor: "var(--charcoal)", boxShadow: "0 0 0 1px var(--charcoal)", background: "var(--charcoal-bg)" };
const suggestedTag = { position: "absolute", top: -9, left: 12, fontSize: 9.5, fontWeight: 700, color: "#fff", background: "var(--accent)", padding: "2px 8px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.04em" };
const successIcon = { width: 48, height: 48, borderRadius: "50%", background: "var(--good)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 };
const pendingBox = { display: "flex", gap: 8, background: "var(--warn-bg)", color: "var(--warn)", fontSize: 12.5, padding: "11px 13px", borderRadius: 10, marginBottom: 16, lineHeight: 1.6 };
const credBox = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 18px", marginBottom: 18 };
const credLabel = { fontSize: 10.5, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" };
const credValue = { fontSize: 15, fontWeight: 700, color: "var(--ink-strong)", fontFamily: "var(--font-mono)", marginTop: 2 };
