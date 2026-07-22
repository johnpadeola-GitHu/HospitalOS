import { useEffect, useState, useCallback } from "react";
import * as Icons from "lucide-react";
import { generateActivationCode, revokeActivationCode, listActivationCodes } from "../../engines/onboarding/activationCodes";
import { ALL_TIERS } from "../../engines/onboarding";
import { StatCard, Card, Pill, Button, Modal, Field, inputStyle } from "../../lib/ui";
import { useAuth } from "../../auth/AuthContext";

const STATUS_TONE = { unredeemed: "info", redeemed: "good", revoked: "bad", expired: "muted" };

function ago(iso) {
  const m = Math.round((Date.now() - new Date(iso)) / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

export default function ActivationCodes() {
  const { user } = useAuth();
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [err, setErr] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setCodes(await listActivationCodes());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const revoke = async (code) => {
    setErr("");
    try { await revokeActivationCode(code, user.email); await refresh(); } catch (e) { setErr(e.message); }
  };

  const summary = {
    unredeemed: codes.filter((c) => c.effectiveStatus === "unredeemed").length,
    redeemed: codes.filter((c) => c.effectiveStatus === "redeemed").length,
    revoked: codes.filter((c) => c.effectiveStatus === "revoked").length,
    expired: codes.filter((c) => c.effectiveStatus === "expired").length,
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={note}>
          <Icons.KeyRound size={14} style={{ color: "var(--muted)", flexShrink: 0, marginTop: 1 }} />
          <span>Registration is invite-only \u2014 a hospital cannot sign up without one of these codes. Issue one per new tenant, with the plan already decided.</span>
        </div>
        <Button variant="primary" icon="Plus" onClick={() => setShowGenerate(true)}>Generate code</Button>
      </div>

      {err && <div style={errBanner}>{err}</div>}

      <div style={statGrid}>
        <StatCard label="Unredeemed" value={summary.unredeemed} tone="info" />
        <StatCard label="Redeemed" value={summary.redeemed} tone="good" />
        <StatCard label="Revoked" value={summary.revoked} />
        <StatCard label="Expired" value={summary.expired} tone={summary.expired ? "warn" : "default"} />
      </div>

      <Card title="All activation codes" pad={false}>
        {loading ? <div style={{ padding: 20, color: "var(--muted)", fontSize: 13 }}>Loading\u2026</div> : codes.length === 0 ? (
          <div style={{ padding: 22, color: "var(--muted)", fontSize: 13 }}>No codes issued yet.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Code", "Tenant", "Plan", "Issued", "Expires", "Status", ""].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c.code} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 11.5 }}>{c.code}</td>
                  <td style={{ ...td, fontWeight: 600, color: "var(--ink-strong)" }}>{c.tenantName}</td>
                  <td style={td}>{ALL_TIERS.find((t) => t.key === c.planTier)?.label || c.planTier}</td>
                  <td style={{ ...td, fontSize: 11.5, color: "var(--muted)" }}>{ago(c.issuedAt)}</td>
                  <td style={{ ...td, fontSize: 11.5, color: "var(--muted)" }}>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "Never"}</td>
                  <td style={td}><Pill tone={STATUS_TONE[c.effectiveStatus]}>{c.effectiveStatus}</Pill></td>
                  <td style={{ ...td, textAlign: "right" }}>
                    {c.effectiveStatus === "unredeemed" && <Button onClick={() => revoke(c.code)}>Revoke</Button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {showGenerate && (
        <GenerateModal actor={user} onClose={() => setShowGenerate(false)} onDone={async () => { setShowGenerate(false); await refresh(); }} />
      )}
    </div>
  );
}

function GenerateModal({ actor, onClose, onDone }) {
  const [tenantName, setTenantName] = useState("");
  const [planTier, setPlanTier] = useState(ALL_TIERS[0].key);
  const [expiresInDays, setExpiresInDays] = useState("30");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [created, setCreated] = useState(null);

  const submit = async () => {
    setBusy(true); setErr("");
    try {
      const c = await generateActivationCode({ tenantName, planTier, expiresInDays: expiresInDays || null, issuedBy: actor.email });
      setCreated(c);
    } catch (e) { setErr(e.message); setBusy(false); }
  };

  if (created) {
    return (
      <Modal title="Code generated" onClose={onDone} footer={<Button variant="primary" onClick={onDone}>Done</Button>}>
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          <Icons.CheckCircle2 size={28} color="var(--good)" style={{ marginBottom: 10 }} />
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, color: "var(--ink-strong)", letterSpacing: "0.03em" }}>{created.code}</div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 6 }}>
            For {created.tenantName} \u2014 send this code directly to the hospital's administrator.
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Generate an activation code" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Generating\u2026" : "Generate"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="Tenant hospital name"><input style={inputStyle} value={tenantName} onChange={(e) => setTenantName(e.target.value)} /></Field>
      <Field label="Plan tier">
        <select style={inputStyle} value={planTier} onChange={(e) => setPlanTier(e.target.value)}>
          {ALL_TIERS.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label} \u2014 {t.key === "enterprise" ? `\u20a6${t.priceNaira.toLocaleString()}/yr flat` : `${t.commissionPct}% commission`}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Expires in (days, blank = never)">
        <input type="number" style={inputStyle} value={expiresInDays} onChange={(e) => setExpiresInDays(e.target.value)} placeholder="30" />
      </Field>
    </Modal>
  );
}

const note = { display: "flex", gap: 8, background: "var(--accent-soft)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 13px", fontSize: 12, color: "var(--muted)", lineHeight: 1.55, flex: 1, marginRight: 14 };
const statGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: 16 };
const th = { textAlign: "left", fontSize: 10.5, fontWeight: 700, color: "var(--muted)", padding: "10px 14px", background: "var(--surface)", textTransform: "uppercase", letterSpacing: "0.05em" };
const td = { padding: "9px 14px", fontSize: 12.5, verticalAlign: "middle" };
const errBanner = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 13, padding: "10px 14px", borderRadius: 10, marginBottom: 14 };
const errBox = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12, padding: "8px 11px", borderRadius: 8, marginBottom: 14 };
