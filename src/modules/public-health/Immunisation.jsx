import { useEffect, useState, useCallback } from "react";
import {
  NPI_SCHEDULE, listChildren, registerChild, recordDose, coverageBySeries, immunisationSummary,
} from "./immunizationService";
import { PageHeader, StatCard, Card, Pill, Button, Modal, Field, inputStyle, EmptyState } from "../../lib/ui";
import { useAuth } from "../../auth/AuthContext";

export default function Immunisation() {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [coverage, setCoverage] = useState([]);
  const [summary, setSummary] = useState(null);
  const [query, setQuery] = useState("");
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [doseFor, setDoseFor] = useState(null);
  const [err, setErr] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [c, cov, s] = await Promise.all([listChildren({ query, onlyOverdue }), coverageBySeries(), immunisationSummary()]);
      setChildren(c); setCoverage(cov); setSummary(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [query, onlyOverdue]);

  useEffect(() => { const t = setTimeout(refresh, 150); return () => clearTimeout(t); }, [refresh]);

  return (
    <div>
      <PageHeader group="Public health" title="Immunisation" icon="Syringe"
        subtitle="NPHCDA Routine Immunization Schedule — tracked per child, not just coverage bars"
        actions={<Button variant="primary" icon="Plus" onClick={() => setShowRegister(true)}>Register child</Button>} />

      {err && <div style={errBanner}>{err}</div>}

      {summary && (
        <div style={statGrid}>
          <StatCard label="Children tracked" value={summary.totalChildren} />
          <StatCard label="Fully immunised" value={summary.fullyImmunised} tone="good" />
          <StatCard label="With overdue doses" value={summary.withOverdue} tone={summary.withOverdue ? "bad" : "default"} />
          <StatCard label="Doses given (total)" value={summary.dosesGivenTotal} tone="accent" />
        </div>
      )}

      <Card title="Coverage by antigen (NHMIS reporting figure)" pad={false}>
        <div style={{ padding: "14px 16px" }}>
          {coverage.map((c) => (
            <div key={c.series} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                <span style={{ fontWeight: 500, color: "var(--ink)" }}>{c.antigen}</span>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>{c.completed}/{c.eligible} &middot; {c.coveragePct}%</span>
              </div>
              <div style={track}><div style={{ ...fill, width: `${c.coveragePct}%`, background: c.coveragePct >= 80 ? "var(--good)" : c.coveragePct >= 50 ? "var(--warn)" : "var(--bad)" }} /></div>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ ...toolbar, marginTop: 16 }}>
        <input style={{ ...inputStyle, maxWidth: 240 }} placeholder="Search child or mother's name…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <button onClick={() => setOnlyOverdue((v) => !v)} style={{ ...chip, ...(onlyOverdue ? chipActive : null) }}>Overdue only</button>
      </div>

      <Card title="Children" pad={false}>
        {loading ? <div style={{ padding: 20, color: "var(--muted)", fontSize: 13 }}>Loading…</div> : children.length === 0 ? (
          <div style={{ padding: 22 }}><EmptyState icon="Syringe" title="No children match" /></div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {children.map((c, i) => (
              <div key={c.id} style={{ ...row, borderTop: i ? "1px solid var(--border)" : "none" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink-strong)" }}>{c.childName}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>{c.ref}</span>
                    {c.overdue.length > 0 && <Pill tone="bad">{c.overdue.length} overdue</Pill>}
                    {c.due.length > 0 && c.overdue.length === 0 && <Pill tone="warn">{c.due.length} due</Pill>}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3 }}>
                    Mother: {c.motherName} &middot; Age: {Math.floor(c.ageDays / 30)} months &middot; {c.completedCount}/{c.totalScheduled} doses given
                  </div>
                  {(c.due.length > 0 || c.overdue.length > 0) && (
                    <div style={{ fontSize: 11.5, color: "var(--ink)", marginTop: 4 }}>
                      Due: {[...c.overdue, ...c.due.filter((d) => !c.overdue.includes(d))].slice(0, 4).map((d) => `${d.antigen} ${d.doseLabel}`).join(", ")}
                    </div>
                  )}
                </div>
                {(c.due.length > 0 || c.overdue.length > 0) && (
                  <Button variant="primary" onClick={() => setDoseFor(c)}>Record dose</Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {showRegister && <RegisterModal actor={user} onClose={() => setShowRegister(false)} onDone={async () => { setShowRegister(false); await refresh(); }} />}
      {doseFor && <DoseModal child={doseFor} actor={user} onClose={() => setDoseFor(null)} onDone={async () => { setDoseFor(null); await refresh(); }} />}
    </div>
  );
}

function RegisterModal({ actor, onClose, onDone }) {
  const [form, setForm] = useState({ childName: "", motherName: "", hospitalNo: "", dob: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true); setErr("");
    try { await registerChild({ ...form, actor }); await onDone(); } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title="Register child for immunisation" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Registering…" : "Register"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="Child's name"><input style={inputStyle} value={form.childName} onChange={set("childName")} /></Field>
      <Field label="Mother's name"><input style={inputStyle} value={form.motherName} onChange={set("motherName")} /></Field>
      <Field label="Hospital no. (mother's, if applicable)"><input style={inputStyle} value={form.hospitalNo} onChange={set("hospitalNo")} /></Field>
      <Field label="Date of birth"><input type="date" style={inputStyle} value={form.dob} onChange={set("dob")} /></Field>
    </Modal>
  );
}

function DoseModal({ child, actor, onClose, onDone }) {
  const outstanding = [...child.overdue, ...child.due.filter((d) => !child.overdue.some((o) => o.code === d.code))];
  const [code, setCode] = useState(outstanding[0]?.code || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setBusy(true); setErr("");
    try { await recordDose(child.id, code, actor); await onDone(); } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title={`Record dose — ${child.childName}`} onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy || !code}>{busy ? "Saving…" : "Record dose"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="Antigen / dose">
        <select style={inputStyle} value={code} onChange={(e) => setCode(e.target.value)}>
          {outstanding.map((d) => <option key={d.code} value={d.code}>{d.antigen} — {d.doseLabel}{child.overdue.some((o) => o.code === d.code) ? " (overdue)" : ""}</option>)}
        </select>
      </Field>
    </Modal>
  );
}

const statGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 16 };
const toolbar = { display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" };
const chip = { font: "inherit", fontSize: 12, fontWeight: 500, padding: "6px 12px", borderRadius: 0, border: "1px solid var(--border-strong)", background: "var(--surface-2)", color: "var(--muted)", cursor: "pointer" };
const chipActive = { background: "var(--charcoal)", color: "#fff", borderColor: "var(--charcoal)" };
const row = { display: "flex", gap: 14, padding: "13px 16px", alignItems: "center" };
const track = { height: 7, borderRadius: 0, background: "var(--surface)", overflow: "hidden" };
const fill = { height: "100%", borderRadius: 0 };
const errBanner = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 13, padding: "10px 14px", borderRadius: 0, marginBottom: 14 };
const errBox = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12, padding: "8px 11px", borderRadius: 0, marginBottom: 14 };
