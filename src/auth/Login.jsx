import { useState } from "react";
import * as Icons from "lucide-react";
import { useAuth } from "./AuthContext";
import { inputStyle } from "../lib/ui";

export default function Login() {
  const { signIn, demoAccounts } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [showHint, setShowHint] = useState(false);

  const submit = async (e) => {
    e?.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await signIn(email, password);
    } catch (ex) {
      setErr(ex.message);
      setBusy(false);
    }
  };

  return (
    <div style={wrap}>
      <div style={panel}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 22 }}>
          <div style={mark}>
            <Icons.Cross size={19} strokeWidth={2.5} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ink-strong)", letterSpacing: "-0.02em" }}>
              HospitalOS
            </div>
            <div style={{ fontSize: 11.5, color: "var(--muted)" }}>by AgoroX · Ibadan Teaching Hospital</div>
          </div>
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--ink-strong)", letterSpacing: "-0.02em", marginBottom: 4 }}>
          Sign in
        </h1>
        <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>
          Use your hospital account to continue.
        </p>

        {err && (
          <div style={errBox}>
            <Icons.AlertCircle size={14} style={{ flexShrink: 0 }} />
            {err}
          </div>
        )}

        <form onSubmit={submit}>
          <label style={lbl}>Email</label>
          <input
            style={{ ...inputStyle, marginBottom: 14 }}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@hospitalos.ng"
            autoComplete="username"
          />

          <label style={lbl}>Password</label>
          <input
            style={{ ...inputStyle, marginBottom: 18 }}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />

          <button type="submit" style={{ ...signInBtn, opacity: busy ? 0.7 : 1 }} disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
            {!busy && <Icons.ArrowRight size={15} strokeWidth={2.2} />}
          </button>
        </form>

        <button style={hintToggle} onClick={() => setShowHint((v) => !v)}>
          {showHint ? "Hide" : "Show"} demo accounts
        </button>

        {showHint && (
          <div style={hintBox}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
              Demo accounts
            </div>
            {demoAccounts.map((a) => (
              <button
                key={a.id}
                style={hintRow}
                onClick={() => {
                  setEmail(a.email);
                  setPassword(a.platformAdmin ? "agorox" : "demo");
                }}
              >
                <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-strong)" }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>{a.email}</div>
                </div>
                {a.platformAdmin && <span style={platformTag}>Platform</span>}
              </button>
            ))}
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8, lineHeight: 1.5 }}>
              Passwords: <code style={code}>demo</code> for hospital staff,{" "}
              <code style={code}>agorox</code> for platform support.
            </div>
          </div>
        )}

        <div style={footNote}>
          <Icons.ShieldAlert size={13} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            Demo authentication runs in-browser and is not secure. Production sign-in
            verifies credentials server-side.
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
  width: "100%", maxWidth: 400, background: "var(--surface-2)",
  border: "1px solid var(--border)", borderRadius: 16, padding: "28px 28px 22px",
  boxShadow: "0 10px 40px rgba(22,35,59,0.10)",
};
const mark = {
  width: 40, height: 40, borderRadius: 11,
  background: "linear-gradient(135deg, #1E3A6E, #2F5FA8)",
  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
};
const lbl = { display: "block", fontSize: 11.5, fontWeight: 600, color: "var(--muted)", marginBottom: 5 };
const signInBtn = {
  width: "100%", font: "inherit", fontSize: 13.5, fontWeight: 600, padding: "11px 14px",
  borderRadius: 9, cursor: "pointer", border: "none", background: "var(--accent)", color: "#fff",
  display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
};
const hintToggle = {
  font: "inherit", fontSize: 11.5, fontWeight: 600, color: "var(--accent)",
  background: "none", border: "none", cursor: "pointer", padding: "12px 0 0",
};
const hintBox = {
  marginTop: 8, background: "var(--surface)", border: "1px solid var(--border)",
  borderRadius: 10, padding: "12px 13px",
};
const hintRow = {
  width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "6px 7px",
  background: "none", border: "none", borderRadius: 7, cursor: "pointer", font: "inherit",
};
const platformTag = {
  fontSize: 9.5, fontWeight: 700, color: "var(--accent)", background: "var(--accent-bg)",
  padding: "2px 6px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.04em",
};
const code = {
  fontFamily: "var(--font-mono)", fontSize: 10.5, background: "var(--surface-2)",
  border: "1px solid var(--border)", borderRadius: 4, padding: "1px 4px",
};
const errBox = {
  display: "flex", alignItems: "flex-start", gap: 7, background: "var(--bad-bg)",
  color: "var(--bad)", fontSize: 12.5, padding: "9px 11px", borderRadius: 8, marginBottom: 14,
};
const footNote = {
  display: "flex", gap: 7, marginTop: 18, paddingTop: 14,
  borderTop: "1px solid var(--border)", fontSize: 11, color: "var(--muted)", lineHeight: 1.5,
};
