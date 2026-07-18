import { useState, useEffect, useCallback } from "react";
import * as Icons from "lucide-react";
import { validateActivationCode, redeemActivationCode } from "../engines/onboarding/activationCodes";
import { inputStyle } from "../lib/ui";

// ============================== STATE MACHINE ==============================
// ONB_STATE is the wizard's whole world: which step it's on, every field
// collected so far, and per-step validity. It persists to localStorage on
// every change, keyed by a session ID generated once per wizard attempt, so
// a refresh mid-flow resumes exactly where the person left off instead of
// losing everything back to Step 1. Nothing here is submitted to the
// tenant/account stores until Step 8's final submit calls
// redeemActivationCode() \u2014 everything before that is purely local state.

const STORAGE_KEY = "hospitalos_onboarding_wizard";
const TOTAL_STEPS = 8;

const STEP_TITLES = [
  "Activation code", "Hospital identity", "Administrator account", "Facility details",
  "Staff roles", "Branding", "Plan confirmation", "Review & confirm",
];

const DEPARTMENT_OPTIONS = [
  { key: "patient-care", label: "Patient care" },
  { key: "diagnostics", label: "Diagnostics" },
  { key: "pharmacy", label: "Pharmacy" },
  { key: "operations", label: "Operations" },
  { key: "academic", label: "Academic" },
  { key: "specialty-services", label: "Specialty services" },
  { key: "public-health", label: "Public health" },
];

const ROLE_OPTIONS = [
  { key: "doctor", label: "Doctor" },
  { key: "nurse", label: "Nurse" },
  { key: "lab-scientist", label: "Lab Scientist" },
  { key: "radiographer", label: "Radiographer" },
  { key: "pharmacist", label: "Pharmacist" },
  { key: "cashier", label: "Cashier" },
  { key: "records-officer", label: "Records Officer" },
];

const HOSPITAL_TYPES = ["Teaching / Referral Hospital", "General Hospital", "Specialist Clinic", "Primary / Community Health Centre"];

function newSessionId() {
  return "onb_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function emptyState() {
  return {
    sessionId: newSessionId(),
    step: 1,
    data: {
      activationCode: "", validatedCode: null,
      hospitalName: "", hospitalType: HOSPITAL_TYPES[0], address: "",
      adminName: "", adminEmail: "", adminPassword: "", adminPasswordConfirm: "",
      bedCount: "", centresCount: "1", departments: DEPARTMENT_OPTIONS.map((d) => d.key),
      roles: ["doctor", "nurse"],
      logoUrl: "", phone: "", registrationNumber: "",
    },
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.sessionId || !parsed?.data) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* storage unavailable — wizard still works, just won't resume after refresh */ }
}

function clearSavedState() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* no-op */ }
}

// ============================== WIZARD ROOT ==============================

export default function OnboardingWizard({ onBack, onDone }) {
  const [state, setState] = useState(() => loadState() || emptyState());
  const [resumed] = useState(() => !!loadState());
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => { saveState(state); }, [state]);

  const patch = useCallback((fields) => {
    setState((s) => ({ ...s, data: { ...s.data, ...fields } }));
  }, []);

  const goTo = (step) => { setErr(""); setState((s) => ({ ...s, step })); };
  const next = () => goTo(Math.min(TOTAL_STEPS, state.step + 1));
  const back = () => goTo(Math.max(1, state.step - 1));

  const startOver = () => {
    clearSavedState();
    setState(emptyState());
    setErr("");
  };

  const submit = async () => {
    setBusy(true); setErr("");
    try {
      const r = await redeemActivationCode({
        code: state.data.activationCode,
        adminName: state.data.adminName,
        adminEmail: state.data.adminEmail,
        adminPassword: state.data.adminPassword,
        hospitalDetails: {
          hospitalName: state.data.hospitalName,
          address: state.data.address,
          phone: state.data.phone,
          logoUrl: state.data.logoUrl,
          registrationNumber: state.data.registrationNumber,
          bedCount: state.data.bedCount,
        },
      });
      clearSavedState();
      setResult(r);
    } catch (e) {
      setErr(e.message);
    }
    setBusy(false);
  };

  if (result) return <WizardResult result={result} onDone={onDone} />;

  return (
    <div>
      <button onClick={state.step === 1 ? onBack : back} style={backLink}>
        <Icons.ChevronLeft size={14} /> {state.step === 1 ? "Back to sign in" : "Back"}
      </button>

      {resumed && state.step === 1 && (
        <div style={resumeNote}>
          <Icons.RotateCcw size={13} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>Resumed from where you left off. <button onClick={startOver} style={inlineLink}>Start over instead</button></span>
        </div>
      )}

      <ProgressBar step={state.step} />
      <h1 style={title}>{STEP_TITLES[state.step - 1]}</h1>
      <p style={subtitle}>Step {state.step} of {TOTAL_STEPS}</p>

      {err && <div style={errBox}><Icons.AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />{err}</div>}

      {state.step === 1 && <Step1Code data={state.data} patch={patch} onValid={next} setErr={setErr} />}
      {state.step === 2 && <Step2Identity data={state.data} patch={patch} onNext={next} setErr={setErr} />}
      {state.step === 3 && <Step3Admin data={state.data} patch={patch} onNext={next} setErr={setErr} />}
      {state.step === 4 && <Step4Facility data={state.data} patch={patch} onNext={next} />}
      {state.step === 5 && <Step5Roles data={state.data} patch={patch} onNext={next} />}
      {state.step === 6 && <Step6Branding data={state.data} patch={patch} onNext={next} />}
      {state.step === 7 && <Step7Plan data={state.data} onNext={next} />}
      {state.step === 8 && <Step8Review data={state.data} onSubmit={submit} busy={busy} onEdit={goTo} />}
    </div>
  );
}

function WizardResult({ result, onDone }) {
  const { tenant, account, tier, requiresPayment } = result;
  return (
    <div>
      <div style={successIcon}><Icons.CheckCircle2 size={26} color="#fff" /></div>
      <h1 style={title}>{tenant.name} is activated</h1>
      <p style={subtitle}>{tier.label} plan \u2014 your administrator account is ready.</p>
      {requiresPayment && (
        <div style={pendingBox}>
          <Icons.Clock size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>Enterprise is a flat annual plan \u2014 your account is marked <b>pending payment</b> until AgoroX confirms billing.</span>
        </div>
      )}
      <div style={credBox}>
        <div style={credLabel}>Sign-in email</div>
        <div style={credValue}>{account.email}</div>
      </div>
      <button style={primaryBtn} onClick={() => onDone(account.email)}>
        Continue to sign in <Icons.ArrowRight size={15} strokeWidth={2.2} />
      </button>
    </div>
  );
}

// ============================== PROGRESS ==============================

function ProgressBar({ step }) {
  return (
    <div style={progressWrap}>
      {STEP_TITLES.map((t, i) => {
        const n = i + 1;
        const state = n < step ? "done" : n === step ? "current" : "pending";
        return (
          <div key={t} style={{ ...progressSeg, ...(state === "done" ? progressSegDone : state === "current" ? progressSegCurrent : null) }} title={t} />
        );
      })}
    </div>
  );
}

// ============================== STEPS ==============================

function Step1Code({ data, patch, onValid, setErr }) {
  const [busy, setBusy] = useState(false);
  const check = async () => {
    setBusy(true); setErr("");
    try {
      const v = await validateActivationCode(data.activationCode);
      patch({ validatedCode: v, hospitalName: data.hospitalName || v.tenantName });
      onValid();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };
  return (
    <div>
      <p style={helpText}>Enter the activation code you received from your AgoroX representative. Registration is invite-only \u2014 there is no public sign-up.</p>
      <Row><F label="Activation code">
        <input
          style={{ ...inputStyle, fontFamily: "var(--font-mono)", letterSpacing: "0.04em", textTransform: "uppercase" }}
          value={data.activationCode}
          onChange={(e) => patch({ activationCode: e.target.value })}
          placeholder="HOS-XXXXX-XXXXX"
        />
      </F></Row>
      <button style={{ ...primaryBtn, opacity: busy ? 0.7 : 1 }} onClick={check} disabled={busy || !data.activationCode.trim()}>
        {busy ? "Checking\u2026" : "Validate code"}
        {!busy && <Icons.ArrowRight size={15} strokeWidth={2.2} />}
      </button>
    </div>
  );
}

function Step2Identity({ data, patch, onNext, setErr }) {
  const submit = () => {
    if (!data.hospitalName.trim()) { setErr("Enter the hospital's name."); return; }
    if (!data.address.trim()) { setErr("Enter the hospital's address."); return; }
    setErr("");
    onNext();
  };
  return (
    <div>
      {data.validatedCode && (
        <div style={codePreview}>
          <Icons.CheckCircle2 size={13} color="var(--good)" style={{ flexShrink: 0 }} />
          Code valid for <b>{data.validatedCode.tier.label}</b> \u2014 issued for "{data.validatedCode.tenantName}"
        </div>
      )}
      <Row><F label="Hospital name"><input style={inputStyle} value={data.hospitalName} onChange={(e) => patch({ hospitalName: e.target.value })} /></F></Row>
      <Row><F label="Hospital type">
        <select style={inputStyle} value={data.hospitalType} onChange={(e) => patch({ hospitalType: e.target.value })}>
          {HOSPITAL_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
      </F></Row>
      <Row><F label="Address"><input style={inputStyle} value={data.address} onChange={(e) => patch({ address: e.target.value })} /></F></Row>
      <button style={primaryBtn} onClick={submit}>Continue <Icons.ArrowRight size={15} strokeWidth={2.2} /></button>
    </div>
  );
}

function Step3Admin({ data, patch, onNext, setErr }) {
  const submit = () => {
    if (!data.adminName.trim()) { setErr("Enter the administrator's name."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.adminEmail.trim())) { setErr("Enter a valid email address."); return; }
    if (data.adminPassword.length < 8) { setErr("Password must be at least 8 characters."); return; }
    if (data.adminPassword !== data.adminPasswordConfirm) { setErr("Passwords do not match."); return; }
    setErr("");
    onNext();
  };
  return (
    <div>
      <p style={helpText}>This becomes the hospital's first Super Admin account \u2014 able to create every other staff account afterward.</p>
      <Row><F label="Full name"><input style={inputStyle} value={data.adminName} onChange={(e) => patch({ adminName: e.target.value })} /></F></Row>
      <Row><F label="Email"><input type="email" style={inputStyle} value={data.adminEmail} onChange={(e) => patch({ adminEmail: e.target.value })} /></F></Row>
      <Row cols={2}>
        <F label="Password"><input type="password" style={inputStyle} value={data.adminPassword} onChange={(e) => patch({ adminPassword: e.target.value })} /></F>
        <F label="Confirm password"><input type="password" style={inputStyle} value={data.adminPasswordConfirm} onChange={(e) => patch({ adminPasswordConfirm: e.target.value })} /></F>
      </Row>
      <button style={primaryBtn} onClick={submit}>Continue <Icons.ArrowRight size={15} strokeWidth={2.2} /></button>
    </div>
  );
}

function Step4Facility({ data, patch, onNext }) {
  const toggle = (key) => patch({ departments: data.departments.includes(key) ? data.departments.filter((d) => d !== key) : [...data.departments, key] });
  return (
    <div>
      <Row cols={2}>
        <F label="Approx. bed capacity"><input type="number" style={inputStyle} value={data.bedCount} onChange={(e) => patch({ bedCount: e.target.value })} /></F>
        <F label="Number of centres/sites"><input type="number" min="1" style={inputStyle} value={data.centresCount} onChange={(e) => patch({ centresCount: e.target.value })} /></F>
      </Row>
      <F label="Departments to enable">
        <div style={chipGrid}>
          {DEPARTMENT_OPTIONS.map((d) => (
            <button key={d.key} type="button" onClick={() => toggle(d.key)} style={{ ...chip, ...(data.departments.includes(d.key) ? chipActive : null) }}>
              {data.departments.includes(d.key) && <Icons.Check size={12} strokeWidth={3} />} {d.label}
            </button>
          ))}
        </div>
      </F>
      <button style={{ ...primaryBtn, marginTop: 16 }} onClick={onNext}>Continue <Icons.ArrowRight size={15} strokeWidth={2.2} /></button>
    </div>
  );
}

function Step5Roles({ data, patch, onNext }) {
  const toggle = (key) => patch({ roles: data.roles.includes(key) ? data.roles.filter((r) => r !== key) : [...data.roles, key] });
  return (
    <div>
      <p style={helpText}>Which staff roles will you be onboarding? This just pre-shapes Administration \u2192 Users & roles \u2014 any role can be added or removed later.</p>
      <div style={chipGrid}>
        {ROLE_OPTIONS.map((r) => (
          <button key={r.key} type="button" onClick={() => toggle(r.key)} style={{ ...chip, ...(data.roles.includes(r.key) ? chipActive : null) }}>
            {data.roles.includes(r.key) && <Icons.Check size={12} strokeWidth={3} />} {r.label}
          </button>
        ))}
      </div>
      <button style={{ ...primaryBtn, marginTop: 16 }} onClick={onNext}>Continue <Icons.ArrowRight size={15} strokeWidth={2.2} /></button>
    </div>
  );
}

function Step6Branding({ data, patch, onNext }) {
  return (
    <div>
      <p style={helpText}>All of this can be changed later in Administration \u2192 Settings \u2014 nothing here is locked in.</p>
      <Row><F label="Logo URL (optional)"><input style={inputStyle} value={data.logoUrl} onChange={(e) => patch({ logoUrl: e.target.value })} placeholder="https://\u2026/logo.png" /></F></Row>
      <Row cols={2}>
        <F label="Phone"><input style={inputStyle} value={data.phone} onChange={(e) => patch({ phone: e.target.value })} /></F>
        <F label="Registration number"><input style={inputStyle} value={data.registrationNumber} onChange={(e) => patch({ registrationNumber: e.target.value })} placeholder="CAC / state MoH number" /></F>
      </Row>
      <button style={primaryBtn} onClick={onNext}>Continue <Icons.ArrowRight size={15} strokeWidth={2.2} /></button>
    </div>
  );
}

function Step7Plan({ data, onNext }) {
  const tier = data.validatedCode?.tier;
  if (!tier) return <div style={helpText}>No plan on file \u2014 go back to Step 1.</div>;
  const isEnterprise = tier.key === "enterprise";
  return (
    <div>
      <p style={helpText}>Your plan was set when this activation code was issued \u2014 shown here for confirmation, not a choice.</p>
      <div style={planCard}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink-strong)" }}>{tier.label}</div>
        {isEnterprise ? (
          <div style={{ fontSize: 22, fontWeight: 700, color: "var(--accent)", margin: "6px 0 2px" }}>
            {"\u20a6" + tier.priceNaira.toLocaleString()}<span style={{ fontSize: 12, fontWeight: 500, color: "var(--muted)" }}>/year, flat</span>
          </div>
        ) : (
          <div style={{ fontSize: 22, fontWeight: 700, color: "var(--good)", margin: "6px 0 2px" }}>
            {tier.commissionPct}%<span style={{ fontSize: 12, fontWeight: 500, color: "var(--muted)" }}> commission, no upfront cost</span>
          </div>
        )}
        <div style={{ fontSize: 12, color: "var(--ink)", lineHeight: 1.5 }}>{tier.blurb}</div>
      </div>
      <button style={primaryBtn} onClick={onNext}>Continue <Icons.ArrowRight size={15} strokeWidth={2.2} /></button>
    </div>
  );
}

function Step8Review({ data, onSubmit, busy, onEdit }) {
  const tier = data.validatedCode?.tier;
  return (
    <div>
      <ReviewRow label="Activation code" value={data.activationCode.toUpperCase()} onEdit={() => onEdit(1)} />
      <ReviewRow label="Hospital" value={`${data.hospitalName} \u2014 ${data.hospitalType}`} onEdit={() => onEdit(2)} />
      <ReviewRow label="Address" value={data.address} onEdit={() => onEdit(2)} />
      <ReviewRow label="Administrator" value={`${data.adminName} (${data.adminEmail})`} onEdit={() => onEdit(3)} />
      <ReviewRow label="Facility" value={`${data.bedCount || "\u2014"} beds \u00b7 ${data.centresCount} centre(s) \u00b7 ${data.departments.length} department(s) enabled`} onEdit={() => onEdit(4)} />
      <ReviewRow label="Staff roles" value={data.roles.length ? data.roles.join(", ") : "None selected"} onEdit={() => onEdit(5)} />
      <ReviewRow label="Branding" value={data.logoUrl ? "Logo set" : "No logo yet"} onEdit={() => onEdit(6)} />
      <ReviewRow label="Plan" value={tier ? tier.label : "\u2014"} onEdit={() => onEdit(7)} />

      <button style={{ ...primaryBtn, opacity: busy ? 0.7 : 1, marginTop: 8 }} onClick={onSubmit} disabled={busy}>
        {busy ? "Activating your hospital\u2026" : "Confirm & activate"}
        {!busy && <Icons.ArrowRight size={15} strokeWidth={2.2} />}
      </button>
    </div>
  );
}

function ReviewRow({ label, value, onEdit }) {
  return (
    <div style={reviewRow}>
      <div>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
        <div style={{ fontSize: 13, color: "var(--ink-strong)", marginTop: 2 }}>{value || "\u2014"}</div>
      </div>
      <button onClick={onEdit} style={editLink}>Edit</button>
    </div>
  );
}

// ============================== shared bits ==============================

function Row({ children, cols = 1 }) {
  return <div style={{ display: "grid", gridTemplateColumns: cols === 2 ? "1fr 1fr" : "1fr", gap: 12, marginBottom: 14 }}>{children}</div>;
}
function F({ label, children }) {
  return <label style={{ display: "block" }}><span style={lbl}>{label}</span>{children}</label>;
}

const title = { fontSize: 20, fontWeight: 700, color: "var(--ink-strong)", letterSpacing: "-0.02em", marginBottom: 2 };
const subtitle = { fontSize: 12.5, color: "var(--muted)", marginBottom: 16 };
const helpText = { fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6, marginBottom: 16 };
const lbl = { display: "block", fontSize: 11.5, fontWeight: 600, color: "var(--muted)", marginBottom: 5 };
const backLink = { display: "inline-flex", alignItems: "center", gap: 5, font: "inherit", fontSize: 12.5, fontWeight: 600, color: "var(--muted)", background: "none", border: "none", cursor: "pointer", marginBottom: 14, padding: 0 };
const inlineLink = { font: "inherit", fontSize: "inherit", fontWeight: 700, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" };
const resumeNote = { display: "flex", gap: 7, background: "var(--accent-soft)", color: "var(--accent)", fontSize: 12, padding: "8px 11px", borderRadius: 9, marginBottom: 14, lineHeight: 1.5 };
const progressWrap = { display: "flex", gap: 4, marginBottom: 16 };
const progressSeg = { flex: 1, height: 4, borderRadius: 3, background: "var(--border)" };
const progressSegDone = { background: "var(--good)" };
const progressSegCurrent = { background: "var(--charcoal)" };
const primaryBtn = {
  width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  background: "var(--charcoal)", color: "#fff", border: "none", borderRadius: 10,
  padding: "12px 0", fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 6,
};
const errBox = { display: "flex", alignItems: "flex-start", gap: 8, background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12.5, padding: "10px 12px", borderRadius: 9, marginBottom: 16, lineHeight: 1.5 };
const codePreview = { display: "flex", alignItems: "center", gap: 7, background: "var(--good-bg)", color: "var(--good)", fontSize: 12, padding: "9px 12px", borderRadius: 9, marginBottom: 16, lineHeight: 1.5 };
const chipGrid = { display: "flex", flexWrap: "wrap", gap: 7 };
const chip = { display: "inline-flex", alignItems: "center", gap: 5, font: "inherit", fontSize: 12, fontWeight: 500, padding: "7px 12px", borderRadius: 999, border: "1px solid var(--border-strong)", background: "var(--surface-2)", color: "var(--muted)", cursor: "pointer" };
const chipActive = { background: "var(--charcoal)", color: "#fff", borderColor: "var(--charcoal)" };
const planCard = { background: "var(--surface-2)", border: "1.5px solid var(--border-strong)", borderRadius: 12, padding: "16px 16px 14px", marginBottom: 18 };
const reviewRow = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--border)" };
const editLink = { font: "inherit", fontSize: 11.5, fontWeight: 600, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 };
const successIcon = { width: 48, height: 48, borderRadius: "50%", background: "var(--good)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 };
const pendingBox = { display: "flex", gap: 8, background: "var(--warn-bg)", color: "var(--warn)", fontSize: 12.5, padding: "11px 13px", borderRadius: 10, marginBottom: 16, lineHeight: 1.6 };
const credBox = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 18px", marginBottom: 18 };
const credLabel = { fontSize: 10.5, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" };
const credValue = { fontSize: 15, fontWeight: 700, color: "var(--ink-strong)", fontFamily: "var(--font-mono)", marginTop: 2 };
