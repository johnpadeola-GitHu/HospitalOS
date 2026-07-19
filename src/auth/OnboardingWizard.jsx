import { useState, useEffect, useCallback } from "react";
import * as Icons from "lucide-react";
import { validateActivationCode, redeemActivationCode } from "../engines/onboarding/activationCodes";
import { AGREEMENT_SECTIONS, AGREEMENT_VERSION, AGREEMENT_EFFECTIVE_DATE } from "../engines/onboarding/tenantAgreement";
import { inputStyle } from "../lib/ui";
import { useAuth } from "./AuthContext";

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
  "Activate your hospital", "Hospital identity", "Facility details",
  "Staff roles", "Branding", "Plan confirmation", "Service agreement", "Review & confirm",
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
      adminName: "", adminPhone: "", adminEmail: "", adminPassword: "", adminPasswordConfirm: "",
      bedCount: "", centresCount: "1", departments: DEPARTMENT_OPTIONS.map((d) => d.key),
      roles: ["doctor", "nurse"],
      agreementAccepted: false, agreementSignedName: "",
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

export default function OnboardingWizard({ onSwitchToDemo, onDone, prefillEmail }) {
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
    if (!state.data.agreementAccepted || !state.data.agreementSignedName.trim()) {
      setErr("The Tenant Service Agreement must be signed before activation can complete.");
      goTo(7);
      return;
    }
    setBusy(true); setErr("");
    try {
      const r = await redeemActivationCode({
        code: state.data.activationCode,
        adminName: state.data.adminName,
        adminPhone: state.data.adminPhone,
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
        agreement: {
          version: AGREEMENT_VERSION,
          signedName: state.data.agreementSignedName.trim(),
          signedAt: new Date().toISOString(),
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
      {state.step > 1 && (
        <button onClick={back} style={backLink}>
          <Icons.ChevronLeft size={14} /> Back
        </button>
      )}

      {resumed && state.step === 1 && (
        <div style={resumeNote}>
          <Icons.RotateCcw size={13} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>Resumed from where you left off. <button onClick={startOver} style={inlineLink}>Start over instead</button></span>
        </div>
      )}

      <ProgressBar step={state.step} />
      <div style={stepKicker}>Step {state.step} of {TOTAL_STEPS}</div>
      <h1 style={title}>
        {state.step === 1 ? "Activate your hospital" : STEP_TITLES[state.step - 1]}
      </h1>
      <p style={subtitle}>
        {state.step === 1 ? "Enter the activation code sent by your AgoroX administrator." : `${STEP_TITLES[state.step - 1]} \u2014 the rest of your hospital's profile`}
      </p>

      {err && <div style={errBox}><Icons.AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />{err}</div>}

      {state.step === 1 && <Step1Activate data={state.data} patch={patch} onValid={next} setErr={setErr} />}
      {state.step === 2 && <Step2Identity data={state.data} patch={patch} onNext={next} setErr={setErr} />}
      {state.step === 3 && <Step3Facility data={state.data} patch={patch} onNext={next} />}
      {state.step === 4 && <Step4Roles data={state.data} patch={patch} onNext={next} />}
      {state.step === 5 && <Step5Branding data={state.data} patch={patch} onNext={next} />}
      {state.step === 6 && <Step6Plan data={state.data} onNext={next} />}
      {state.step === 7 && <Step7Agreement data={state.data} patch={patch} onNext={next} setErr={setErr} />}
      {state.step === 8 && <Step8Review data={state.data} onSubmit={submit} busy={busy} onEdit={goTo} />}

      {state.step === 1 && <FrontDoorAlternatives onSwitchToDemo={onSwitchToDemo} onSignedIn={onDone} prefillEmail={prefillEmail} />}
    </div>
  );
}

// The two escape hatches that belong ONLY on the very front door (Step 1):
// try the demo, or sign in if you already have an account. Once someone has
// validated a real code and moved into Step 2+, they've committed to
// building a hospital profile — these alternatives would just be noise.
function FrontDoorAlternatives({ onSwitchToDemo, onSignedIn, prefillEmail }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState(prefillEmail || "");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const doSignIn = async (e) => {
    e.preventDefault();
    setBusy(true); setErr("");
    try { await signIn(email, password); }
    catch (ex) { setErr(ex.message); setBusy(false); }
  };

  return (
    <div style={{ marginTop: 6 }}>
      <Divider label="or" />
      <button type="button" onClick={onSwitchToDemo} style={demoLink}>
        <Icons.Sparkles size={14} /> Explore the interactive demo
      </button>
      <p style={demoSub}>No code needed. Loads a sample hospital with demo data you can explore freely.</p>

      <Divider label="or sign in" />
      {err && <div style={errBox}><Icons.AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />{err}</div>}
      <form onSubmit={doSignIn}>
        <input
          style={{ ...inputStyle, marginBottom: 8 }} type="email" value={email}
          onChange={(e) => setEmail(e.target.value)} placeholder="you@hospitalos.ng" autoComplete="username"
        />
        <input
          style={{ ...inputStyle, marginBottom: 12 }} type="password" value={password}
          onChange={(e) => setPassword(e.target.value)} placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" autoComplete="current-password"
        />
        <button type="submit" style={{ ...signInBtn, opacity: busy ? 0.7 : 1 }} disabled={busy}>
          {busy ? "Signing in\u2026" : "Sign in"}
          {!busy && <Icons.ArrowRight size={15} strokeWidth={2.2} />}
        </button>
      </form>
    </div>
  );
}

function Divider({ label }) {
  return (
    <div style={dividerWrap}>
      <span style={dividerLine} /><span style={dividerLabel}>{label}</span><span style={dividerLine} />
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

// Step 1 combines what would otherwise be two separate steps \u2014 activation
// code entry and personal account creation \u2014 into one screen, deliberately
// matching the LabOS activation pattern: a hospital admin does this exactly
// once, ever. Every other sign-in afterward, by them or any other staff
// member, is a plain email/password sign-in \u2014 nothing in this screen runs
// again once the tenant exists.
function Step1Activate({ data, patch, onValid, setErr }) {
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!data.activationCode.trim()) { setErr("Enter your activation code."); return; }
    if (!data.adminName.trim()) { setErr("Enter your full name."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.adminEmail.trim())) { setErr("Enter a valid work email address."); return; }
    if (data.adminPassword.length < 12) { setErr("Password must be at least 12 characters."); return; }
    if (data.adminPassword !== data.adminPasswordConfirm) { setErr("Passwords do not match."); return; }
    setBusy(true); setErr("");
    try {
      const v = await validateActivationCode(data.activationCode);
      patch({ validatedCode: v, hospitalName: v.tenantName });
      onValid();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  return (
    <div>
      <div style={inviteBox}>
        <Icons.Lock size={14} style={{ flexShrink: 0, marginTop: 1, color: "var(--warn)" }} />
        <span>
          HospitalOS is <b>invite-only</b>. Your hospital must be provisioned by an AgoroX
          administrator, who will send you a one-time <b>activation code</b>. Enter it below with
          your details to begin.
        </span>
      </div>

      <Row><F label="Activation code">
        <input
          style={{ ...inputStyle, fontFamily: "var(--font-mono)", letterSpacing: "0.04em", textTransform: "uppercase" }}
          value={data.activationCode}
          onChange={(e) => patch({ activationCode: e.target.value })}
          placeholder="E.G. HOS-7F3KX-2026Y"
        />
      </F></Row>

      <Row cols={2}>
        <F label="Full name"><input style={inputStyle} value={data.adminName} onChange={(e) => patch({ adminName: e.target.value })} placeholder="Dr. Adaeze Okafor" /></F>
        <F label="Phone number"><input style={inputStyle} value={data.adminPhone} onChange={(e) => patch({ adminPhone: e.target.value })} placeholder="+234 803 …" /></F>
      </Row>

      <Row><F label="Work email"><input type="email" style={inputStyle} value={data.adminEmail} onChange={(e) => patch({ adminEmail: e.target.value })} placeholder="you@hospital.ng" /></F></Row>

      <Row cols={2}>
        <F label="Password"><input type="password" style={inputStyle} value={data.adminPassword} onChange={(e) => patch({ adminPassword: e.target.value })} placeholder="Minimum 12 characters" /></F>
        <F label="Confirm password"><input type="password" style={inputStyle} value={data.adminPasswordConfirm} onChange={(e) => patch({ adminPasswordConfirm: e.target.value })} placeholder="Re-enter your password" /></F>
      </Row>

      <p style={{ ...helpText, marginBottom: 18 }}>
        You'll create your hospital's profile over the next few steps. Don't have a code?{" "}
        <a href="mailto:support@agorox.africa?subject=HospitalOS%20activation%20code%20request" style={inlineLink}>Request an invite</a>.
      </p>

      <button style={{ ...primaryBtn, opacity: busy ? 0.7 : 1 }} onClick={submit} disabled={busy}>
        {busy ? "Verifying\u2026" : "Verify activation code"}
        {!busy && <Icons.ArrowRight size={15} strokeWidth={2.2} />}
      </button>
    </div>
  );
}

function Step2Identity({ data, patch, onNext, setErr }) {
  const submit = () => {
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
      <Row><F label="Hospital name">
        <div style={lockedField}>
          <Icons.Lock size={13} style={{ color: "var(--muted)", flexShrink: 0 }} />
          {data.hospitalName}
        </div>
      </F></Row>
      <p style={lockedNote}>
        Set by your activation code, and cannot be changed here \u2014 this stops a stolen code being
        redeemed under a different hospital's name. Contact AgoroX if this is wrong.
      </p>
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

function Step3Facility({ data, patch, onNext }) {
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

function Step4Roles({ data, patch, onNext }) {
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

function Step5Branding({ data, patch, onNext }) {
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

function Step6Plan({ data, onNext }) {
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

// The Agreement must be genuinely read-or-at-least-scrolled before it can
// be signed \u2014 the checkbox and signature field stay disabled until the
// scrollable text has been scrolled to its end, a real (if soft) guard
// against a rubber-stamp "agree" click on text nobody opened.
function Step7Agreement({ data, patch, onNext, setErr }) {
  const [scrolledToEnd, setScrolledToEnd] = useState(false);

  const onScroll = (e) => {
    const el = e.target;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 24) setScrolledToEnd(true);
  };

  const submit = () => {
    if (!scrolledToEnd) { setErr("Please scroll through the agreement before signing."); return; }
    if (!data.agreementSignedName.trim()) { setErr("Type your full legal name to sign."); return; }
    if (!data.agreementAccepted) { setErr("You must check the box confirming you agree before continuing."); return; }
    setErr("");
    onNext();
  };

  return (
    <div>
      <p style={helpText}>
        This becomes a binding agreement between {data.hospitalName || "your hospital"} and AgoroX
        Africa the moment you sign it below. Version {AGREEMENT_VERSION}, effective {AGREEMENT_EFFECTIVE_DATE}.
        {" "}
        <a href="/guides/HospitalOS-Tenant-Service-Agreement.pdf" download style={inlineLink}>Download as PDF</a>.
      </p>

      <div style={agreementScroll} onScroll={onScroll}>
        {AGREEMENT_SECTIONS.map((s) => (
          <div key={s.title} style={{ marginBottom: 16 }}>
            <div style={agreementH}>{s.title}</div>
            {s.body.map((p, i) => <p key={i} style={agreementP}>{p}</p>)}
            {s.table && (
              <table style={agreementTable}>
                <thead><tr>{s.table.head.map((h) => <th key={h} style={agreementTh}>{h}</th>)}</tr></thead>
                <tbody>
                  {s.table.rows.map((row, i) => (
                    <tr key={i}>{row.map((cell, j) => <td key={j} style={agreementTd}>{cell}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            )}
            {s.bodyAfter && s.bodyAfter.map((p, i) => <p key={i} style={agreementP}>{p}</p>)}
            {s.list && (
              <ul style={{ margin: "6px 0 0", paddingLeft: 20 }}>
                {s.list.map((li, i) => <li key={i} style={agreementLi}>{li}</li>)}
              </ul>
            )}
          </div>
        ))}
        <div style={{ fontSize: 11, color: "var(--muted)", textAlign: "center", paddingTop: 10 }}>
          \u2014 End of agreement \u2014
        </div>
      </div>

      {!scrolledToEnd && (
        <div style={scrollHint}><Icons.ArrowDown size={12} /> Scroll to the end to unlock signing</div>
      )}

      <div style={{ marginTop: 16 }}>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 12.5, color: "var(--ink)", cursor: scrolledToEnd ? "pointer" : "not-allowed", marginBottom: 14 }}>
          <input
            type="checkbox" checked={data.agreementAccepted} disabled={!scrolledToEnd}
            onChange={(e) => patch({ agreementAccepted: e.target.checked })}
            style={{ marginTop: 2 }}
          />
          <span>
            I have read and agree to the Tenant Service Agreement on behalf of {data.hospitalName || "this hospital"},
            and I am authorised to accept it.
          </span>
        </label>

        <Row><F label="Type your full legal name to sign">
          <input
            style={inputStyle} value={data.agreementSignedName} disabled={!scrolledToEnd}
            onChange={(e) => patch({ agreementSignedName: e.target.value })}
            placeholder={data.adminName || "Full name"}
          />
        </F></Row>
        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 16 }}>
          Signed and dated automatically at the moment of activation. This record is retained with your tenant's account.
        </div>

        <button style={primaryBtn} onClick={submit} disabled={!scrolledToEnd}>
          Sign &amp; continue <Icons.ArrowRight size={15} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}

function Step8Review({ data, onSubmit, busy, onEdit }) {
  const tier = data.validatedCode?.tier;
  return (
    <div>
      <ReviewRow label="Activation code" value={data.activationCode.toUpperCase()} onEdit={() => onEdit(1)} />
      <ReviewRow label="Administrator" value={`${data.adminName} \u00b7 ${data.adminEmail} \u00b7 ${data.adminPhone || "\u2014"}`} onEdit={() => onEdit(1)} />
      <ReviewRow label="Hospital" value={`${data.hospitalName} \u2014 ${data.hospitalType}`} onEdit={() => onEdit(2)} />
      <ReviewRow label="Address" value={data.address} onEdit={() => onEdit(2)} />
      <ReviewRow label="Facility" value={`${data.bedCount || "\u2014"} beds \u00b7 ${data.centresCount} centre(s) \u00b7 ${data.departments.length} department(s) enabled`} onEdit={() => onEdit(3)} />
      <ReviewRow label="Staff roles" value={data.roles.length ? data.roles.join(", ") : "None selected"} onEdit={() => onEdit(4)} />
      <ReviewRow label="Branding" value={data.logoUrl ? "Logo set" : "No logo yet"} onEdit={() => onEdit(5)} />
      <ReviewRow label="Plan" value={tier ? tier.label : "\u2014"} onEdit={() => onEdit(6)} />
      <ReviewRow label="Service agreement" value={data.agreementSignedName ? `Signed by ${data.agreementSignedName}` : "Not yet signed"} onEdit={() => onEdit(7)} />

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

const stepKicker = { fontSize: 10.5, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 };
const title = { fontSize: 20, fontWeight: 700, color: "var(--ink-strong)", letterSpacing: "-0.02em", marginBottom: 2 };
const subtitle = { fontSize: 12.5, color: "var(--muted)", marginBottom: 16 };
const dividerWrap = { display: "flex", alignItems: "center", gap: 10, margin: "18px 0 14px" };
const dividerLine = { flex: 1, height: 1, background: "var(--border)" };
const dividerLabel = { fontSize: 11, fontWeight: 600, color: "var(--muted)" };
const demoLink = {
  width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
  font: "inherit", fontSize: 13, fontWeight: 600, color: "var(--accent)",
  background: "var(--accent-soft)", border: "1px solid var(--accent-bg)", borderRadius: 10,
  padding: "10px 0", cursor: "pointer",
};
const demoSub = { fontSize: 11, color: "var(--muted)", textAlign: "center", marginTop: 6, lineHeight: 1.5 };
const signInBtn = {
  width: "100%", font: "inherit", fontSize: 13.5, fontWeight: 600, padding: "11px 14px",
  borderRadius: 9, cursor: "pointer", border: "none", background: "var(--charcoal)", color: "#fff",
  display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
};
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
const lockedField = {
  display: "flex", alignItems: "center", gap: 8, ...inputStyle,
  background: "var(--surface)", color: "var(--ink-strong)", fontWeight: 600, cursor: "not-allowed",
};
const lockedNote = { fontSize: 11, color: "var(--muted)", lineHeight: 1.5, margin: "-8px 0 16px" };
const inviteBox = { display: "flex", gap: 9, background: "var(--warn-bg)", color: "var(--ink)", fontSize: 12, padding: "12px 13px", borderRadius: 10, marginBottom: 18, lineHeight: 1.6 };
const chipGrid = { display: "flex", flexWrap: "wrap", gap: 7 };
const chip = { display: "inline-flex", alignItems: "center", gap: 5, font: "inherit", fontSize: 12, fontWeight: 500, padding: "7px 12px", borderRadius: 999, border: "1px solid var(--border-strong)", background: "var(--surface-2)", color: "var(--muted)", cursor: "pointer" };
const chipActive = { background: "var(--charcoal)", color: "#fff", borderColor: "var(--charcoal)" };
const planCard = { background: "var(--surface-2)", border: "1.5px solid var(--border-strong)", borderRadius: 12, padding: "16px 16px 14px", marginBottom: 18 };
const agreementScroll = {
  maxHeight: 340, overflowY: "auto", border: "1px solid var(--border-strong)", borderRadius: 10,
  padding: "16px 18px", background: "var(--surface)",
};
const agreementH = { fontSize: 12.5, fontWeight: 700, color: "var(--ink-strong)", marginBottom: 6 };
const agreementP = { fontSize: 11.5, color: "var(--ink)", lineHeight: 1.6, margin: "0 0 6px" };
const agreementLi = { fontSize: 11.5, color: "var(--ink)", lineHeight: 1.6, marginBottom: 4 };
const agreementTable = { width: "100%", borderCollapse: "collapse", fontSize: 11, margin: "8px 0" };
const agreementTh = { textAlign: "left", padding: "5px 8px", background: "var(--surface-2)", borderBottom: "1.5px solid var(--border-strong)", fontWeight: 700, color: "var(--muted)" };
const agreementTd = { padding: "5px 8px", borderBottom: "1px solid var(--border)", color: "var(--ink)" };
const scrollHint = { display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--warn)", marginTop: 8, fontWeight: 600 };
const reviewRow = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--border)" };
const editLink = { font: "inherit", fontSize: 11.5, fontWeight: 600, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 };
const successIcon = { width: 48, height: 48, borderRadius: "50%", background: "var(--good)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 };
const pendingBox = { display: "flex", gap: 8, background: "var(--warn-bg)", color: "var(--warn)", fontSize: 12.5, padding: "11px 13px", borderRadius: 10, marginBottom: 16, lineHeight: 1.6 };
const credBox = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 18px", marginBottom: 18 };
const credLabel = { fontSize: 10.5, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" };
const credValue = { fontSize: 15, fontWeight: 700, color: "var(--ink-strong)", fontFamily: "var(--font-mono)", marginTop: 2 };
