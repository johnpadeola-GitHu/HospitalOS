import { useEffect, useState, useCallback } from "react";
import { FITNESS_STATUS, STATUS_TONE, INJURY_TYPES, listStaff, registerStaff, updateFitness, listInjuries, reportInjury, occHealthSummary } from "./occHealthService";
import { PageHeader, StatCard, Card, Pill, Button, Modal, Field, inputStyle, EmptyState } from "../../lib/ui";
import { useAuth } from "../../auth/AuthContext";

export default function OccupationalHealth() {
  const { user } = useAuth();
  const [tab, setTab] = useState("staff");
  const [staff, setStaff] = useState([]);
  const [injuries, setInjuries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [showInjury, setShowInjury] = useState(false);
  const [err, setErr] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [s, i, sum] = await Promise.all([listStaff({}), listInjuries(), occHealthSummary()]);
      setStaff(s); setInjuries(i); setSummary(sum);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const act = async (fn, ...args) => {
    setErr("");
    try { await fn(...args); await refresh(); } catch (e) { setErr(e.message); }
  };

  return (
    <div>
      <PageHeader group="Specialty services" title="Occupational health" icon="ShieldPlus"
        subtitle="Staff fitness-to-work, immunisation status, and workplace injury log"
        actions={
          <>
            <Button icon="Plus" onClick={() => setShowInjury(true)}>Report injury</Button>
            <Button variant="primary" icon="Plus" onClick={() => setShowRegister(true)}>Register staff</Button>
          </>
        } />

      {err && <div style={errBanner}>{err}</div>}

      {summary && (
        <div style={statGrid}>
          <StatCard label="Staff tracked" value={summary.staffTracked} />
          <StatCard label="Unfit / restricted" value={summary.unfitOrRestricted} tone={summary.unfitOrRestricted ? "warn" : "default"} />
          <StatCard label="Open injury reports" value={summary.openInjuries} tone={summary.openInjuries ? "bad" : "default"} />
        </div>
      )}

      <div style={tabs}>
        {[["staff", "Staff health"], ["injuries", "Injury log"]].map(([id, l]) => (
          <button key={id} onClick={() => setTab(id)} style={{ ...tabBtn, ...(tab === id ? tabActive : null) }}>{l}</button>
        ))}
      </div>

      {tab === "staff" && (
        <Card title="Staff health records" pad={false}>
          {loading ? <div style={{ padding: 20, color: "var(--muted)", fontSize: 13 }}>Loading…</div> : staff.length === 0 ? (
            <div style={{ padding: 22 }}><EmptyState icon="ShieldPlus" title="No staff records" /></div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {staff.map((s, i) => (
                <div key={s.id} style={{ ...row, borderTop: i ? "1px solid var(--border)" : "none" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink-strong)" }}>{s.staffName}</span>
                      <Pill tone={STATUS_TONE[s.fitnessStatus]}>{s.fitnessStatus}</Pill>
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3 }}>
                      {s.department} &middot; last screened {s.lastScreenedAt} &middot; Hep B immune: {s.hepBImmune ? "Yes" : "No"} &middot; TB screened: {s.tbScreened ? "Yes" : "No"}
                    </div>
                  </div>
                  <select style={selectSm} value={s.fitnessStatus} onChange={(e) => act(updateFitness, s.id, e.target.value, user)}>
                    {FITNESS_STATUS.map((f) => <option key={f}>{f}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === "injuries" && (
        <Card title="Workplace injury reports" pad={false}>
          {injuries.length === 0 ? (
            <div style={{ padding: 22 }}><EmptyState icon="TriangleAlert" title="No injuries reported" /></div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {injuries.map((inj, i) => (
                <div key={inj.id} style={{ ...row, borderTop: i ? "1px solid var(--border)" : "none" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>{inj.ref}</span>
                      <span style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink-strong)" }}>{inj.staffName}</span>
                      <Pill tone={inj.type === "Needlestick injury" ? "warn" : "muted"}>{inj.type}</Pill>
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3 }}>{inj.department} &middot; {new Date(inj.reportedAt).toLocaleDateString()}</div>
                    {inj.notes && <div style={{ fontSize: 12, color: "var(--ink)", marginTop: 4 }}>{inj.notes}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {showRegister && <RegisterModal actor={user} onClose={() => setShowRegister(false)} onDone={async () => { setShowRegister(false); await refresh(); }} />}
      {showInjury && <InjuryModal actor={user} onClose={() => setShowInjury(false)} onDone={async () => { setShowInjury(false); setTab("injuries"); await refresh(); }} />}
    </div>
  );
}

function RegisterModal({ actor, onClose, onDone }) {
  const [staffName, setStaffName] = useState("");
  const [department, setDepartment] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setBusy(true); setErr("");
    try { await registerStaff({ staffName, department, actor }); await onDone(); } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title="Register staff for occupational health" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Registering…" : "Register"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="Staff name"><input style={inputStyle} value={staffName} onChange={(e) => setStaffName(e.target.value)} /></Field>
      <Field label="Department"><input style={inputStyle} value={department} onChange={(e) => setDepartment(e.target.value)} /></Field>
    </Modal>
  );
}

function InjuryModal({ actor, onClose, onDone }) {
  const [form, setForm] = useState({ staffName: "", department: "", type: INJURY_TYPES[0], notes: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true); setErr("");
    try { await reportInjury({ ...form, actor }); await onDone(); } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title="Report a workplace injury" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Reporting…" : "Report"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="Staff name"><input style={inputStyle} value={form.staffName} onChange={set("staffName")} /></Field>
      <Field label="Department"><input style={inputStyle} value={form.department} onChange={set("department")} /></Field>
      <Field label="Injury type"><select style={inputStyle} value={form.type} onChange={set("type")}>{INJURY_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
      <Field label="Notes"><textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical", fontFamily: "var(--font-sans)" }} value={form.notes} onChange={set("notes")} /></Field>
    </Modal>
  );
}

const statGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 16 };
const tabs = { display: "flex", gap: 6, marginBottom: 16 };
const tabBtn = { font: "inherit", fontSize: 12.5, fontWeight: 600, padding: "6px 13px", borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--surface-2)", color: "var(--muted)", cursor: "pointer" };
const tabActive = { background: "var(--charcoal)", color: "#fff", borderColor: "var(--charcoal)" };
const row = { display: "flex", gap: 14, padding: "13px 16px", alignItems: "center" };
const selectSm = { fontSize: 12, padding: "6px 9px", borderRadius: 7, border: "1px solid var(--border-strong)", background: "var(--surface-2)", color: "var(--ink-strong)" };
const errBanner = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 13, padding: "10px 14px", borderRadius: 10, marginBottom: 14 };
const errBox = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12, padding: "8px 11px", borderRadius: 8, marginBottom: 14 };
