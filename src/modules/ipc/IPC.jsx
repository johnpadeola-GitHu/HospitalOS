import { useEffect, useState, useCallback } from "react";
import * as Icons from "lucide-react";
import {
  HAI_TYPES, PRECAUTION_TYPES, STATUS_TONE,
  listHaiCases, reportHai, updateHaiStatus,
  listIsolations, startIsolation, endIsolation,
  checkOutbreakThreshold, ipcSummary,
} from "./ipcService";
import { PageHeader, StatCard, Card, Pill, Button, Modal, Field, inputStyle, EmptyState } from "../../lib/ui";
import { useAuth } from "../../auth/AuthContext";
import PatientPicker from "../patients/PatientPicker";

export default function IPC() {
  const { user } = useAuth();
  const [tab, setTab] = useState("hai");
  const [cases, setCases] = useState([]);
  const [isolations, setIsolations] = useState([]);
  const [outbreaks, setOutbreaks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [showIsolate, setShowIsolate] = useState(false);
  const [err, setErr] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [c, iso, ob, s] = await Promise.all([listHaiCases({}), listIsolations({}), checkOutbreakThreshold(), ipcSummary()]);
      setCases(c); setIsolations(iso); setOutbreaks(ob); setSummary(s);
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
      <PageHeader group="Specialty services" title="Infection prevention &amp; control" icon="ShieldAlert"
        subtitle="Hospital-acquired infections, isolation precautions, and outbreak signals"
        actions={
          <>
            <Button icon="Plus" onClick={() => setShowIsolate(true)}>Start isolation</Button>
            <Button variant="primary" icon="Plus" onClick={() => setShowReport(true)}>Report HAI</Button>
          </>
        } />

      {err && <div style={errBanner}>{err}</div>}

      {outbreaks.length > 0 && (
        <div style={outbreakBanner}>
          <Icons.TriangleAlert size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <b>Outbreak signal</b> \u2014 three or more open cases of the same infection type:
            {" "}{outbreaks.map((o) => `${o.type} (${o.count})`).join(", ")}
          </div>
        </div>
      )}

      {summary && (
        <div style={statGrid}>
          <StatCard label="Open HAI cases" value={summary.openCases} tone={summary.openCases ? "warn" : "default"} />
          <StatCard label="Active isolations" value={summary.activeIsolations} tone="info" />
          <StatCard label="Outbreak signals" value={summary.outbreakSignals} tone={summary.outbreakSignals ? "bad" : "default"} />
        </div>
      )}

      <div style={tabs}>
        {[["hai", "HAI cases"], ["isolation", "Isolation precautions"]].map(([id, l]) => (
          <button key={id} onClick={() => setTab(id)} style={{ ...tabBtn, ...(tab === id ? tabActive : null) }}>{l}</button>
        ))}
      </div>

      {tab === "hai" && (
        <Card title="Hospital-acquired infection cases" pad={false}>
          {loading ? <div style={{ padding: 20, color: "var(--muted)", fontSize: 13 }}>Loading…</div> : cases.length === 0 ? (
            <div style={{ padding: 22 }}><EmptyState icon="ShieldAlert" title="No cases reported" /></div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {cases.map((c, i) => (
                <div key={c.id} style={{ ...row, borderTop: i ? "1px solid var(--border)" : "none" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>{c.ref}</span>
                      <span style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink-strong)" }}>{c.patientName}</span>
                      <Pill tone="muted">{c.type}</Pill>
                      <Pill tone={STATUS_TONE[c.status]}>{c.status}</Pill>
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3 }}>
                      {c.ward} {c.bed} &middot; reported by {c.reportedBy}
                    </div>
                    {c.notes && <div style={{ fontSize: 12, color: "var(--ink)", marginTop: 4 }}>{c.notes}</div>}
                  </div>
                  {c.status !== "resolved" && (
                    <div style={{ display: "flex", gap: 6 }}>
                      {c.status === "open" && <Button onClick={() => act(updateHaiStatus, c.id, "under-investigation", user)}>Investigate</Button>}
                      <Button variant="primary" onClick={() => act(updateHaiStatus, c.id, "resolved", user)}>Resolve</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === "isolation" && (
        <Card title="Active isolation precautions" pad={false}>
          {isolations.length === 0 ? (
            <div style={{ padding: 22 }}><EmptyState icon="ShieldCheck" title="No patients currently isolated" /></div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {isolations.map((iso, i) => (
                <div key={iso.id} style={{ ...row, borderTop: i ? "1px solid var(--border)" : "none" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink-strong)" }}>{iso.patientName}</span>
                      <Pill tone="warn">{iso.precaution}</Pill>
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3 }}>{iso.ward} {iso.bed} &middot; {iso.reason}</div>
                  </div>
                  <Button onClick={() => act(endIsolation, iso.id, user)}>End isolation</Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {showReport && <ReportModal actor={user} onClose={() => setShowReport(false)} onDone={async () => { setShowReport(false); await refresh(); }} />}
      {showIsolate && <IsolateModal actor={user} onClose={() => setShowIsolate(false)} onDone={async () => { setShowIsolate(false); setTab("isolation"); await refresh(); }} />}
    </div>
  );
}

function ReportModal({ actor, onClose, onDone }) {
  const [form, setForm] = useState({ patientId: null, patientName: "", hospitalNo: "", type: HAI_TYPES[0], ward: "", bed: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true); setErr("");
    try { await reportHai({ ...form, actor }); await onDone(); } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title="Report a hospital-acquired infection" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Reporting…" : "Report"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="Patient"><PatientPicker value={form} onChange={(p) => setForm((f) => ({ ...f, ...p }))} /></Field>
      <Field label="Infection type"><select style={inputStyle} value={form.type} onChange={set("type")}>{HAI_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><Field label="Ward"><input style={inputStyle} value={form.ward} onChange={set("ward")} /></Field></div>
        <div style={{ width: 100 }}><Field label="Bed"><input style={inputStyle} value={form.bed} onChange={set("bed")} /></Field></div>
      </div>
      <Field label="Notes"><textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical", fontFamily: "var(--font-sans)" }} value={form.notes} onChange={set("notes")} /></Field>
    </Modal>
  );
}

function IsolateModal({ actor, onClose, onDone }) {
  const [form, setForm] = useState({ patientId: null, patientName: "", hospitalNo: "", ward: "", bed: "", precaution: PRECAUTION_TYPES[0], reason: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true); setErr("");
    try { await startIsolation({ ...form, actor }); await onDone(); } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title="Start isolation precautions" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Starting…" : "Start isolation"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="Patient"><PatientPicker value={form} onChange={(p) => setForm((f) => ({ ...f, ...p }))} /></Field>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><Field label="Ward"><input style={inputStyle} value={form.ward} onChange={set("ward")} /></Field></div>
        <div style={{ width: 100 }}><Field label="Bed"><input style={inputStyle} value={form.bed} onChange={set("bed")} /></Field></div>
      </div>
      <Field label="Precaution type"><select style={inputStyle} value={form.precaution} onChange={set("precaution")}>{PRECAUTION_TYPES.map((p) => <option key={p}>{p}</option>)}</select></Field>
      <Field label="Reason"><input style={inputStyle} value={form.reason} onChange={set("reason")} /></Field>
    </Modal>
  );
}

const statGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 16 };
const tabs = { display: "flex", gap: 6, marginBottom: 16 };
const tabBtn = { font: "inherit", fontSize: 12.5, fontWeight: 600, padding: "6px 13px", borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--surface-2)", color: "var(--muted)", cursor: "pointer" };
const tabActive = { background: "var(--charcoal)", color: "#fff", borderColor: "var(--charcoal)" };
const row = { display: "flex", gap: 14, padding: "13px 16px", alignItems: "center" };
const outbreakBanner = { display: "flex", gap: 9, background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12.5, padding: "11px 14px", borderRadius: 10, marginBottom: 16, lineHeight: 1.5 };
const errBanner = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 13, padding: "10px 14px", borderRadius: 10, marginBottom: 14 };
const errBox = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12, padding: "8px 11px", borderRadius: 8, marginBottom: 14 };
