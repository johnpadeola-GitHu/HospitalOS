import { useEffect, useState, useCallback } from "react";
import {
  ACCESS_TYPES, stageForEgfr,
  listDialysisPatients, enrolDialysis, recordSession,
  listCkdRegistry, addCkdEntry, renalSummary,
} from "./renalService";
import { PageHeader, StatCard, Card, Pill, Button, Modal, Field, inputStyle, EmptyState } from "../../lib/ui";
import { useAuth } from "../../auth/AuthContext";
import PatientPicker from "../patients/PatientPicker";

const STAGE_TONE = { "1": "good", "2": "good", "3a": "warn", "3b": "warn", "4": "bad", "5": "bad" };

export default function Renal() {
  const { user } = useAuth();
  const [tab, setTab] = useState("dialysis");
  const [patients, setPatients] = useState([]);
  const [ckd, setCkd] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEnrol, setShowEnrol] = useState(false);
  const [showCkd, setShowCkd] = useState(false);
  const [sessionFor, setSessionFor] = useState(null);
  const [err, setErr] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true); setErr("");
    try {
      const [p, c, s] = await Promise.all([listDialysisPatients(), listCkdRegistry(), renalSummary()]);
      setPatients(p); setCkd(c); setSummary(s);
    } catch (e) { setErr(e.message || "Failed to load renal data."); }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <div>
      <PageHeader group="Patient care" title="Renal & dialysis" icon="Droplets"
        subtitle="Haemodialysis programme and chronic kidney disease registry" />

      {err && <div style={errBanner}>{err}</div>}

      {summary && (
        <div style={statGrid}>
          <StatCard label="On dialysis" value={summary.onDialysis} />
          <StatCard label="Overdue sessions" value={summary.overdueDialysis} tone={summary.overdueDialysis ? "bad" : "default"} />
          <StatCard label="Sessions this week" value={summary.sessionsThisWeek} tone="accent" />
          <StatCard label="CKD registry" value={summary.ckdTotal} />
          <StatCard label="Stage 4+" value={summary.ckdStage4Plus} tone={summary.ckdStage4Plus ? "warn" : "default"} />
        </div>
      )}

      <div style={tabs}>
        {[["dialysis", "Dialysis programme"], ["ckd", "CKD registry"]].map(([id, l]) => (
          <button key={id} onClick={() => setTab(id)} style={{ ...tabBtn, ...(tab === id ? tabActive : null) }}>{l}</button>
        ))}
      </div>

      {tab === "dialysis" && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <Button variant="primary" icon="Plus" onClick={() => setShowEnrol(true)}>Enrol patient</Button>
          </div>
          {loading ? <div style={{ color: "var(--muted)", fontSize: 13 }}>Loading…</div> : patients.length === 0 ? (
            <EmptyState icon="Droplets" title="No patients on the dialysis programme" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {patients.map((p) => (
                <div key={p.id} style={{ ...row, ...(p.overdue ? rowOverdue : null) }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink-strong)" }}>{p.patientName}</span>
                      {p.overdue && <Pill tone="bad">Overdue</Pill>}
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3 }}>
                      {p.access} · {p.schedule} · dry weight {p.dryWeight}kg · {p.sessionsDone} sessions logged
                    </div>
                    <div style={{ fontSize: 11.5, color: p.overdue ? "var(--bad)" : "var(--muted)", marginTop: 2 }}>
                      Next due: {p.nextDue}
                    </div>
                  </div>
                  <Button variant="primary" onClick={() => setSessionFor(p)}>Log session</Button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "ckd" && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <Button variant="primary" icon="Plus" onClick={() => setShowCkd(true)}>Add to registry</Button>
          </div>
          <Card title="CKD staging" pad={false}>
            {ckd.length === 0 ? <div style={{ padding: 22 }}><EmptyState icon="Activity" title="No patients in the CKD registry" /></div> : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>{["Patient", "eGFR", "Stage", "Follow-up", "Staged by"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {ckd.map((c) => (
                    <tr key={c.id} style={{ borderTop: "1px solid var(--border)" }}>
                      <td style={{ ...td, fontWeight: 600, color: "var(--ink-strong)" }}>{c.patientName}</td>
                      <td style={{ ...td, fontFamily: "var(--font-mono)" }}>{c.egfr}</td>
                      <td style={td}><Pill tone={STAGE_TONE[c.stage?.stage] || "muted"}>{c.stage?.label}</Pill></td>
                      <td style={{ ...td, color: "var(--muted)" }}>{c.followUp}</td>
                      <td style={{ ...td, color: "var(--muted)", fontSize: 12 }}>{c.by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}

      {showEnrol && <EnrolModal actor={user} onClose={() => setShowEnrol(false)} onDone={async () => { setShowEnrol(false); await refresh(); }} />}
      {showCkd && <CkdModal actor={user} onClose={() => setShowCkd(false)} onDone={async () => { setShowCkd(false); await refresh(); }} />}
      {sessionFor && <SessionModal patient={sessionFor} actor={user} onClose={() => setSessionFor(null)} onDone={async () => { setSessionFor(null); await refresh(); }} />}
    </div>
  );
}

function EnrolModal({ actor, onClose, onDone }) {
  const [form, setForm] = useState({ patientId: null, patientName: "", hospitalNo: "", access: ACCESS_TYPES[0], schedule: "Mon / Wed / Fri", dryWeight: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true); setErr("");
    try { await enrolDialysis({ ...form, actor }); await onDone(); } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title="Enrol in dialysis programme" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Enrolling…" : "Enrol"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="Patient"><PatientPicker value={form} onChange={(p) => setForm((f) => ({ ...f, ...p }))} /></Field>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><Field label="Vascular access"><select style={inputStyle} value={form.access} onChange={set("access")}>{ACCESS_TYPES.map((a) => <option key={a}>{a}</option>)}</select></Field></div>
        <div style={{ width: 120 }}><Field label="Dry weight (kg)"><input type="number" style={inputStyle} value={form.dryWeight} onChange={set("dryWeight")} /></Field></div>
      </div>
      <Field label="Schedule"><input style={inputStyle} value={form.schedule} onChange={set("schedule")} /></Field>
    </Modal>
  );
}

function CkdModal({ actor, onClose, onDone }) {
  const [form, setForm] = useState({ patientId: null, patientName: "", hospitalNo: "", egfr: "", followUp: "3-monthly" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const preview = form.egfr ? stageForEgfr(form.egfr) : null;

  const submit = async () => {
    setBusy(true); setErr("");
    try { await addCkdEntry({ ...form, actor }); await onDone(); } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title="Add to CKD registry" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Saving…" : "Add"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="Patient"><PatientPicker value={form} onChange={(p) => setForm((f) => ({ ...f, ...p }))} /></Field>
      <Field label="eGFR (mL/min/1.73m²)"><input type="number" style={inputStyle} value={form.egfr} onChange={set("egfr")} /></Field>
      {preview && <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>Stages as: <b style={{ color: "var(--ink-strong)" }}>{preview.label}</b></div>}
      <Field label="Follow-up interval">
        <select style={inputStyle} value={form.followUp} onChange={set("followUp")}>
          <option>Monthly</option><option>3-monthly</option><option>6-monthly</option><option>Annual</option>
        </select>
      </Field>
    </Modal>
  );
}

function SessionModal({ patient, actor, onClose, onDone }) {
  const [form, setForm] = useState({ preWeight: patient.dryWeight + 2, postWeight: patient.dryWeight, duration: "4h", bpPre: "", bpPost: "", complications: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const removed = form.preWeight && form.postWeight ? Math.round((form.preWeight - form.postWeight) * 100) / 100 : null;

  const submit = async () => {
    setBusy(true); setErr("");
    try { await recordSession(patient.id, { ...form, actor }); await onDone(); } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title={`Log dialysis session — ${patient.patientName}`} onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Saving…" : "Save session"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>{patient.access} · dry weight {patient.dryWeight}kg</div>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><Field label="Pre-dialysis weight (kg)"><input type="number" style={inputStyle} value={form.preWeight} onChange={set("preWeight")} /></Field></div>
        <div style={{ flex: 1 }}><Field label="Post-dialysis weight (kg)"><input type="number" style={inputStyle} value={form.postWeight} onChange={set("postWeight")} /></Field></div>
      </div>
      {removed != null && <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>Fluid removed: <b style={{ color: "var(--ink-strong)" }}>{removed} L</b></div>}
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><Field label="BP pre"><input style={inputStyle} value={form.bpPre} onChange={set("bpPre")} placeholder="140/90" /></Field></div>
        <div style={{ flex: 1 }}><Field label="BP post"><input style={inputStyle} value={form.bpPost} onChange={set("bpPost")} placeholder="120/80" /></Field></div>
        <div style={{ width: 90 }}><Field label="Duration"><input style={inputStyle} value={form.duration} onChange={set("duration")} /></Field></div>
      </div>
      <Field label="Complications"><input style={inputStyle} value={form.complications} onChange={set("complications")} placeholder="None" /></Field>
    </Modal>
  );
}

const statGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 16 };
const tabs = { display: "flex", gap: 6, marginBottom: 16 };
const tabBtn = { font: "inherit", fontSize: 12.5, fontWeight: 600, padding: "6px 13px", borderRadius: 0, border: "1px solid var(--border-strong)", background: "var(--surface-2)", color: "var(--muted)", cursor: "pointer" };
const tabActive = { background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" };
const row = { display: "flex", gap: 14, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 0, padding: "13px 16px", boxShadow: "var(--shadow-sm)", alignItems: "center" };
const rowOverdue = { borderColor: "#E4B6B2" };
const th = { textAlign: "left", fontSize: 10.5, fontWeight: 700, color: "var(--muted)", padding: "10px 14px", background: "var(--surface)", textTransform: "uppercase", letterSpacing: "0.05em" };
const td = { padding: "10px 14px", fontSize: 12.5, verticalAlign: "middle" };
const errBanner = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 13, padding: "10px 14px", borderRadius: 0, marginBottom: 14 };
const errBox = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12, padding: "8px 11px", borderRadius: 0, marginBottom: 14 };
