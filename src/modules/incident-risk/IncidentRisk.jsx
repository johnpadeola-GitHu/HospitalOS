import { useEffect, useState, useCallback } from "react";
import {
  INCIDENT_TYPES, SEVERITY_LEVELS, SEVERITY_TONE, INCIDENT_STATUS, STATUS_TONE,
  listIncidents, reportIncident, updateInvestigation, advanceStatus, incidentSummary,
} from "./incidentService";
import { PageHeader, StatCard, Card, Pill, Button, Modal, Field, inputStyle, EmptyState } from "../../lib/ui";
import { useAuth } from "../../auth/AuthContext";
import PatientPicker from "../patients/PatientPicker";

function ago(iso) {
  const d = Math.round((Date.now() - new Date(iso)) / 86400000);
  return d < 1 ? "today" : d === 1 ? "1 day ago" : `${d} days ago`;
}

export default function IncidentRisk() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [investigateFor, setInvestigateFor] = useState(null);
  const [err, setErr] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true); setErr("");
    try {
      const [i, s] = await Promise.all([listIncidents({ status }), incidentSummary()]);
      setIncidents(i); setSummary(s);
    } catch (e) { setErr(e.message); }
    setLoading(false);
  }, [status]);

  useEffect(() => { refresh(); }, [refresh]);

  const advance = async (id, next) => {
    setErr("");
    try { await advanceStatus(id, next, user); await refresh(); } catch (e) { setErr(e.message); }
  };

  return (
    <div>
      <PageHeader group="Compliance" title="Incident &amp; risk management" icon="TriangleAlert"
        subtitle="Adverse events, near-misses, and sentinel events \u2014 with a real root-cause and corrective-action trail"
        actions={<Button variant="primary" icon="Plus" onClick={() => setShowReport(true)}>Report incident</Button>} />

      {err && <div style={errBanner}>{err}</div>}

      {summary && (
        <div style={statGrid}>
          <StatCard label="Total incidents" value={summary.total} />
          <StatCard label="Open" value={summary.open} tone={summary.open ? "warn" : "default"} />
          <StatCard label="Serious &amp; open" value={summary.seriousOpen} tone={summary.seriousOpen ? "bad" : "default"} />
          <StatCard label="Closed" value={summary.closedThisPeriod} tone="good" />
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {["all", ...INCIDENT_STATUS].map((s) => (
          <button key={s} onClick={() => setStatus(s)} style={{ ...chip, ...(status === s ? chipActive : null) }}>{s}</button>
        ))}
      </div>

      <Card title="Incidents" pad={false}>
        {loading ? <div style={{ padding: 20, color: "var(--muted)", fontSize: 13 }}>Loading\u2026</div> : incidents.length === 0 ? (
          <div style={{ padding: 22 }}><EmptyState icon="TriangleAlert" title="No incidents match" /></div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {incidents.map((inc, i) => (
              <div key={inc.id} style={{ ...row, borderTop: i ? "1px solid var(--border)" : "none" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>{inc.ref}</span>
                    <span style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink-strong)" }}>{inc.type}</span>
                    <Pill tone={SEVERITY_TONE[inc.severity]}>{inc.severity}</Pill>
                    <Pill tone={STATUS_TONE[inc.status]}>{inc.status}</Pill>
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3 }}>
                    {inc.patientName !== "\u2014" && `${inc.patientName} \u00b7 `}{inc.ward} &middot; reported by {inc.reportedBy} &middot; {ago(inc.reportedAt)}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink)", marginTop: 4 }}>{inc.description}</div>
                  {inc.correctiveAction && (
                    <div style={{ fontSize: 11.5, color: "var(--good)", marginTop: 4 }}>
                      Corrective action: {inc.correctiveAction} (owner: {inc.actionOwner}{inc.actionDueDate ? `, due ${inc.actionDueDate}` : ""})
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {inc.status === "Reported" && <Button onClick={() => advance(inc.id, "Under investigation")}>Investigate</Button>}
                  {(inc.status === "Under investigation" || inc.status === "Reported") && (
                    <Button variant="primary" onClick={() => setInvestigateFor(inc)}>Root cause</Button>
                  )}
                  {inc.status === "Corrective action" && <Button variant="primary" onClick={() => advance(inc.id, "Closed")}>Close</Button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showReport && <ReportModal actor={user} onClose={() => setShowReport(false)} onDone={async () => { setShowReport(false); await refresh(); }} />}
      {investigateFor && <InvestigateModal incident={investigateFor} actor={user} onClose={() => setInvestigateFor(null)} onDone={async () => { setInvestigateFor(null); await refresh(); }} />}
    </div>
  );
}

function ReportModal({ actor, onClose, onDone }) {
  const [form, setForm] = useState({ type: INCIDENT_TYPES[0], severity: SEVERITY_LEVELS[0], patientId: null, patientName: "", hospitalNo: "", ward: "", description: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true); setErr("");
    try { await reportIncident({ ...form, actor }); await onDone(); } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title="Report an incident" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Reporting\u2026" : "Report"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><Field label="Incident type"><select style={inputStyle} value={form.type} onChange={set("type")}>{INCIDENT_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field></div>
        <div style={{ flex: 1 }}><Field label="Severity"><select style={inputStyle} value={form.severity} onChange={set("severity")}>{SEVERITY_LEVELS.map((s) => <option key={s}>{s}</option>)}</select></Field></div>
      </div>
      <Field label="Patient (if applicable)"><PatientPicker value={form} onChange={(p) => setForm((f) => ({ ...f, ...p }))} allowUnregistered /></Field>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><Field label="Hospital no."><input style={inputStyle} value={form.hospitalNo} onChange={set("hospitalNo")} /></Field></div>
        <div style={{ flex: 1 }}><Field label="Ward / location"><input style={inputStyle} value={form.ward} onChange={set("ward")} /></Field></div>
      </div>
      <Field label="What happened"><textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical", fontFamily: "var(--font-sans)" }} value={form.description} onChange={set("description")} /></Field>
    </Modal>
  );
}

function InvestigateModal({ incident, actor, onClose, onDone }) {
  const [rootCause, setRootCause] = useState(incident.rootCause);
  const [correctiveAction, setCorrectiveAction] = useState(incident.correctiveAction);
  const [actionOwner, setActionOwner] = useState(incident.actionOwner);
  const [actionDueDate, setActionDueDate] = useState(incident.actionDueDate || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    if (!correctiveAction.trim() || !actionOwner.trim()) { setErr("A corrective action and an owner are required."); return; }
    setBusy(true); setErr("");
    try { await updateInvestigation(incident.id, { rootCause, correctiveAction, actionOwner, actionDueDate, actor }); await onDone(); }
    catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title={`Root cause \u2014 ${incident.ref}`} onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Saving\u2026" : "Save"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="Root cause / contributing factors"><textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical", fontFamily: "var(--font-sans)" }} value={rootCause} onChange={(e) => setRootCause(e.target.value)} /></Field>
      <Field label="Corrective action"><textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical", fontFamily: "var(--font-sans)" }} value={correctiveAction} onChange={(e) => setCorrectiveAction(e.target.value)} /></Field>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><Field label="Action owner"><input style={inputStyle} value={actionOwner} onChange={(e) => setActionOwner(e.target.value)} /></Field></div>
        <div style={{ flex: 1 }}><Field label="Due date"><input type="date" style={inputStyle} value={actionDueDate} onChange={(e) => setActionDueDate(e.target.value)} /></Field></div>
      </div>
    </Modal>
  );
}

const statGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 16 };
const chip = { font: "inherit", fontSize: 12, fontWeight: 500, padding: "6px 12px", borderRadius: 999, border: "1px solid var(--border-strong)", background: "var(--surface-2)", color: "var(--muted)", cursor: "pointer" };
const chipActive = { background: "var(--charcoal)", color: "#fff", borderColor: "var(--charcoal)" };
const row = { display: "flex", gap: 14, padding: "13px 16px", alignItems: "flex-start" };
const errBanner = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 13, padding: "10px 14px", borderRadius: 10, marginBottom: 14 };
const errBox = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12, padding: "8px 11px", borderRadius: 8, marginBottom: 14 };
