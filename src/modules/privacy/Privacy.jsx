import { useEffect, useState, useCallback } from "react";
import {
  CONSENT_PURPOSES, DSAR_TYPES, DSAR_TONE,
  listConsents, recordConsent, withdrawConsent,
  listDsars, fileDsar, updateDsar, privacySummary,
} from "./privacyService";
import { PageHeader, StatCard, Card, Pill, Button, Modal, Field, inputStyle, EmptyState } from "../../lib/ui";
import { useAuth } from "../../auth/AuthContext";
import PatientPicker from "../patients/PatientPicker";

export default function Privacy() {
  const { user } = useAuth();
  const [tab, setTab] = useState("consent");
  const [consents, setConsents] = useState([]);
  const [dsars, setDsars] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConsent, setShowConsent] = useState(false);
  const [showDsar, setShowDsar] = useState(false);
  const [decideFor, setDecideFor] = useState(null);
  const [err, setErr] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [c, d, s] = await Promise.all([listConsents({}), listDsars({}), privacySummary()]);
      setConsents(c); setDsars(d); setSummary(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const revoke = async (id) => {
    setErr("");
    try { await withdrawConsent(id, user); await refresh(); } catch (e) { setErr(e.message); }
  };

  return (
    <div>
      <PageHeader group="Administration" title="Privacy &amp; consent" icon="ShieldCheck"
        subtitle="Nigeria Data Protection Act 2023 — consent records and data-subject rights requests"
        actions={
          tab === "consent"
            ? <Button variant="primary" icon="Plus" onClick={() => setShowConsent(true)}>Record consent</Button>
            : <Button variant="primary" icon="Plus" onClick={() => setShowDsar(true)}>File a request</Button>
        } />

      {err && <div style={errBanner}>{err}</div>}

      {summary && (
        <div style={statGrid}>
          <StatCard label="Active consents" value={summary.consentsActive} tone="good" />
          <StatCard label="Withdrawn" value={summary.consentsWithdrawn} />
          <StatCard label="Open requests" value={summary.dsarsOpen} tone="info" />
          <StatCard label="Overdue (30-day window)" value={summary.dsarsOverdue} tone={summary.dsarsOverdue ? "bad" : "default"} />
        </div>
      )}

      <div style={tabs}>
        {[["consent", "Consent records"], ["dsar", "Data-subject requests"]].map(([id, l]) => (
          <button key={id} onClick={() => setTab(id)} style={{ ...tabBtn, ...(tab === id ? tabActive : null) }}>{l}</button>
        ))}
      </div>

      {tab === "consent" && (
        <Card title="Consent records" pad={false}>
          {loading ? <div style={{ padding: 20, color: "var(--muted)", fontSize: 13 }}>Loading…</div> : consents.length === 0 ? (
            <div style={{ padding: 22 }}><EmptyState icon="ShieldCheck" title="No consent records yet" /></div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["Patient", "Purpose", "Method", "Status", "Granted", ""].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {consents.map((c) => (
                  <tr key={c.id} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ ...td, fontWeight: 600, color: "var(--ink-strong)" }}>{c.patientName}</td>
                    <td style={{ ...td, fontSize: 12 }}>{c.purpose}</td>
                    <td style={{ ...td, fontSize: 11.5, color: "var(--muted)" }}>{c.method}</td>
                    <td style={td}><Pill tone={c.status === "granted" ? "good" : "muted"}>{c.status}</Pill></td>
                    <td style={{ ...td, fontSize: 12, color: "var(--muted)" }}>{c.grantedAt}</td>
                    <td style={{ ...td, textAlign: "right" }}>
                      {c.status === "granted" && <Button onClick={() => revoke(c.id)}>Withdraw</Button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {tab === "dsar" && (
        <Card title="Data-subject rights requests" pad={false}>
          {loading ? <div style={{ padding: 20, color: "var(--muted)", fontSize: 13 }}>Loading…</div> : dsars.length === 0 ? (
            <div style={{ padding: 22 }}><EmptyState icon="FileSearch" title="No requests filed" /></div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {dsars.map((d, i) => (
                <div key={d.id} style={{ ...row, borderTop: i ? "1px solid var(--border)" : "none" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>{d.ref}</span>
                      <span style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink-strong)" }}>{d.patientName}</span>
                      <Pill tone="muted">{d.type}</Pill>
                      <Pill tone={DSAR_TONE[d.status]}>{d.status}</Pill>
                      {d.overdue && <Pill tone="bad">Overdue</Pill>}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--ink)", marginTop: 4 }}>{d.detail}</div>
                    <div style={{ fontSize: 11.5, color: d.overdue ? "var(--bad)" : "var(--muted)", marginTop: 3 }}>
                      Received {d.receivedAt} &middot; due by {d.dueBy}
                    </div>
                    {d.notes.map((n, ni) => (
                      <div key={ni} style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>{n.by} ({n.at}): {n.note}</div>
                    ))}
                  </div>
                  {d.status !== "fulfilled" && d.status !== "declined" && (
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      {d.status === "received" && <Button onClick={() => setDecideFor({ d, status: "in-progress" })}>Start</Button>}
                      <Button variant="primary" onClick={() => setDecideFor({ d, status: "fulfilled" })}>Fulfil</Button>
                      <Button onClick={() => setDecideFor({ d, status: "declined" })}>Decline</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {showConsent && <ConsentModal actor={user} onClose={() => setShowConsent(false)} onDone={async () => { setShowConsent(false); await refresh(); }} />}
      {showDsar && <DsarModal actor={user} onClose={() => setShowDsar(false)} onDone={async () => { setShowDsar(false); await refresh(); }} />}
      {decideFor && <DecideModal item={decideFor} actor={user} onClose={() => setDecideFor(null)} onDone={async () => { setDecideFor(null); await refresh(); }} />}
    </div>
  );
}

function ConsentModal({ actor, onClose, onDone }) {
  const [form, setForm] = useState({ patientId: null, patientName: "", hospitalNo: "", purpose: CONSENT_PURPOSES[0], method: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true); setErr("");
    try { await recordConsent({ ...form, actor }); await onDone(); } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title="Record consent" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Saving…" : "Record"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="Patient (if applicable)"><PatientPicker value={form} onChange={(p) => setForm((f) => ({ ...f, ...p }))} allowUnregistered /></Field>
      <Field label="Hospital no."><input style={inputStyle} value={form.hospitalNo} onChange={set("hospitalNo")} /></Field>
      <Field label="Purpose"><select style={inputStyle} value={form.purpose} onChange={set("purpose")}>{CONSENT_PURPOSES.map((p) => <option key={p}>{p}</option>)}</select></Field>
      <Field label="How was consent captured?"><input style={inputStyle} value={form.method} onChange={set("method")} placeholder="e.g. Signed paper form, scanned" /></Field>
    </Modal>
  );
}

function DsarModal({ actor, onClose, onDone }) {
  const [form, setForm] = useState({ patientId: null, patientName: "", hospitalNo: "", type: DSAR_TYPES[0], detail: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true); setErr("");
    try { await fileDsar({ ...form, actor }); await onDone(); } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title="File a data-subject request" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Filing…" : "File request"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="Patient (if applicable)"><PatientPicker value={form} onChange={(p) => setForm((f) => ({ ...f, ...p }))} allowUnregistered /></Field>
      <Field label="Hospital no."><input style={inputStyle} value={form.hospitalNo} onChange={set("hospitalNo")} /></Field>
      <Field label="Request type"><select style={inputStyle} value={form.type} onChange={set("type")}>{DSAR_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
      <Field label="Details"><textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical", fontFamily: "var(--font-sans)" }} value={form.detail} onChange={set("detail")} /></Field>
      <div style={{ fontSize: 11.5, color: "var(--muted)" }}>The statutory response window (30 days) is calculated automatically from today.</div>
    </Modal>
  );
}

function DecideModal({ item, actor, onClose, onDone }) {
  const { d, status } = item;
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const needsNote = status === "fulfilled" || status === "declined";
  const label = { "in-progress": "Start work", fulfilled: "Mark fulfilled", declined: "Decline request" }[status];

  const submit = async () => {
    setBusy(true); setErr("");
    try { await updateDsar(d.id, { status, note, actor }); await onDone(); }
    catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title={`${label} — ${d.ref}`} onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy || (needsNote && !note.trim())}>{busy ? "Saving…" : label}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>{d.patientName} &middot; {d.type}</div>
      {needsNote ? (
        <Field label="Closing note (required)">
          <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical", fontFamily: "var(--font-sans)" }} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      ) : (
        <div style={{ fontSize: 13, color: "var(--muted)" }}>Marks this request as actively being worked on.</div>
      )}
    </Modal>
  );
}

const statGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 16 };
const tabs = { display: "flex", gap: 6, marginBottom: 16 };
const tabBtn = { font: "inherit", fontSize: 12.5, fontWeight: 600, padding: "6px 13px", borderRadius: 0, border: "1px solid var(--border-strong)", background: "var(--surface-2)", color: "var(--muted)", cursor: "pointer" };
const tabActive = { background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" };
const row = { display: "flex", gap: 14, padding: "13px 16px" };
const th = { textAlign: "left", fontSize: 10.5, fontWeight: 700, color: "var(--muted)", padding: "10px 14px", background: "var(--surface)", textTransform: "uppercase", letterSpacing: "0.05em" };
const td = { padding: "10px 14px", fontSize: 12.5, verticalAlign: "middle" };
const errBanner = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 13, padding: "10px 14px", borderRadius: 0, marginBottom: 14 };
const errBox = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12, padding: "8px 11px", borderRadius: 0, marginBottom: 14 };
