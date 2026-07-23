import { useState } from "react";
import * as Icons from "lucide-react";
import { DemoForm } from "./SignUp";
import OnboardingWizard from "./OnboardingWizard";

// The landing screen is the activation wizard itself, starting on Step 1 —
// matching the LabOS pattern exactly: code entry, a demo link, and inline
// sign-in all live together on one screen, because that IS the front door.
// There is no separate plain "sign in" screen behind a button anymore.
export default function Login() {
  const [mode, setMode] = useState("wizard"); // "wizard" | "demo"
  const [prefillEmail, setPrefillEmail] = useState("");

  const afterOnboarding = (createdEmail) => {
    setPrefillEmail(createdEmail);
    setMode("wizard");
  };

  return (
    <div style={wrap}>
      <div style={panel}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 22 }}>
          <div style={mark}>
            <Icons.Cross size={24} strokeWidth={3} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ink-strong)", letterSpacing: "-0.02em" }}>
              HospitalOS
            </div>
            <div style={{ fontSize: 11.5, color: "var(--muted)" }}>Powered by AgoroX Africa</div>
          </div>
        </div>

        {mode === "demo" ? (
          <DemoForm onBack={() => setMode("wizard")} onDone={afterOnboarding} />
        ) : (
          <OnboardingWizard onSwitchToDemo={() => setMode("demo")} onDone={afterOnboarding} prefillEmail={prefillEmail} />
        )}

        <div style={footNote}>
          <Icons.ShieldCheck size={13} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            Your password is checked server-side against a securely hashed copy — it is never
            stored or transmitted in readable form.
          </span>
        </div>
      </div>
    </div>
  );
}

const wrap = {
  minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
  background: "linear-gradient(160deg, #EEF3FB 0%, #F4F6FA 55%, #E9EFF9 100%)", padding: 24,
};
const panel = {
  width: "75%", maxWidth: 920, minWidth: 320, background: "var(--surface-2)",
  border: "1px solid var(--border)", borderRadius: 16, padding: "32px 40px 26px",
  boxShadow: "0 10px 40px rgba(22,35,59,0.10)", maxHeight: "92vh", overflowY: "auto",
};
const mark = {
  width: 40, height: 40, borderRadius: 11,
  background: "#D6241C",
  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  boxShadow: "0 1px 3px rgba(22,35,59,0.08)",
};
const footNote = {
  display: "flex", gap: 7, marginTop: 18, paddingTop: 14,
  borderTop: "1px solid var(--border)", fontSize: 11, color: "var(--muted)", lineHeight: 1.5,
};
