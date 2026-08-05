import { useEffect, useState, useCallback } from "react";
import { ADMISSION_STATUS, OBSERVATION_LEVELS, OBS_TONE, RISK_FLAGS, listPatients, admitPatient, updateObservation, updateRiskFlags, mhuSummary } from "./mentalHealthService";
import { PageHeader, StatCard, Card, Pill, Button, Modal, Field, inputStyle, EmptyState } from "../../lib/ui";
import { useAuth } from "../../auth/AuthContext";
import PatientPicker from "../patients/PatientPicker";

export default function MentalHealth() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdmit, setShowAdmit] = useState(false);
  const [riskFor, setRiskFor] = useState(null);
  const [err, setErr] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([listPatients(), mhuSummary()]);
      setPatients(p); setSummary(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const changeObs = async (id, level) => {
    setErr("");
    try { await updateObservation(id, level, user); await refresh(); } catch (e) { setErr(e.message); }
  };

  return (
    <div>
      <PageHeader group="Patient care" title="Mental health unit" icon="Brain"
        subtitle="Dedicated psychiatric ward — admission status, observation level, and risk flags"
        actions={<Button variant="primary" icon="Plus" onClick={() => setShowAdmit(true)}>Admit patient</Button>} />

      {err && <div style={errBanner}>{err}</div>}

      {summary && (
        <div style={statGrid}>
          <StatCard label="Admitted" value={summary.admitted} />
          <StatCard label="Constant (1:1) observation" value={summary.constantObs} tone={summary.constantObs ? "bad" : "default"} />
          <StatCard label="With active risk flags" value={summary.withRiskFlags} tone={summary.withRiskFlags ? "warn" : "default"} />
          <StatCard label="Involuntary admission" value={summary.involuntary} tone="info" />
        </div>
      )}

      <Card title="Patients" pad={false}>
        {loading ? <div style={{ padding: 20, color: "var(--muted)", fontSize: 13 }}>Loading…</div> : patients.length === 0 ? (
          <div style={{ padding: 22 }}><EmptyState icon="Brain" title="No patients admitted" /></div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {patients.map((p, i) => (
              <div key={p.id} style={{ ...row, borderTop: i ? "1px solid var(--border)" : "none" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink-strong)" }}>{p.patientName}</span>
                    <Pill tone={p.admissionStatus === "Voluntary" ? "muted" : "warn"}>{p.admissionStatus}</Pill>
                    {p.riskFlags.map((f) => <Pill key={f} tone="bad">{f}</Pill>)}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3 }}>{p.bed}</div>
                  {p.notes && <div style={{ fontSize: 12, color: "var(--ink)", marginTop: 4 }}>{p.notes}</div>}
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <select style={{ ...selectSm, ...(OBS_TONE[p.observationLevel] === "bad" ? { borderColor: "var(--bad)", color: "var(--bad)" } : {}) }}
                    value={p.observationLevel} onChange={(e) => changeObs(p.id, e.target.value)}>
                    {OBSERVATION_LEVELS.map((o) => <option key={o}>{o}</option>)}
                  </select>
                  <Button onClick={() => setRiskFor(p)}>Risk flags</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showAdmit && <AdmitModal actor={user} onClose={() => setShowAdmit(false)} onDone={async () => { setShowAdmit(false); await refresh(); }} />}
      {riskFor && <RiskModal patient={riskFor} actor={user} onClose={() => setRiskFor(null)} onDone={async () => { setRiskFor(null); await refresh(); }} />}
    </div>
  );
}

function AdmitModal({ actor, onClose, onDone }) {
  const [form, setForm] = useState({ patientId: null, patientName: "", hospitalNo: "", bed: "", admissionStatus: ADMISSION_STATUS[0], observationLevel: OBSERVATION_LEVELS[0], riskFlags: [], notes: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggleFlag = (f) => setForm((form) => ({ ...form, riskFlags: form.riskFlags.includes(f) ? form.riskFlags.filter((x) => x !== f) : [...form.riskFlags, f] }));

  const submit = async () => {
    setBusy(true); setErr("");
    try { await admitPatient({ ...form, actor }); await onDone(); } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title="Admit to Mental Health Unit" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Admitting…" : "Admit"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="Patient"><PatientPicker value={form} onChange={(p) => setForm((f) => ({ ...f, ...p }))} /></Field>
        <div style={{ display: "flex", gap: 12 }}>
        <div style={{ width: 100 }}><Field label="Bed"><input style={inputStyle} value={form.bed} onChange={set("bed")} /></Field></div>
        </div>
      <Field label="Admission status"><select style={inputStyle} value={form.admissionStatus} onChange={set("admissionStatus")}>{ADMISSION_STATUS.map((s) => <option key={s}>{s}</option>)}</select></Field>
      <Field label="Observation level"><select style={inputStyle} value={form.observationLevel} onChange={set("observationLevel")}>{OBSERVATION_LEVELS.map((o) => <option key={o}>{o}</option>)}</select></Field>
      <Field label="Risk flags">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {RISK_FLAGS.map((f) => (
            <button key={f} type="button" onClick={() => toggleFlag(f)} style={{ ...flagChip, ...(form.riskFlags.includes(f) ? flagChipActive : null) }}>{f}</button>
          ))}
        </div>
      </Field>
      <Field label="Notes"><textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical", fontFamily: "var(--font-sans)" }} value={form.notes} onChange={set("notes")} /></Field>
    </Modal>
  );
}

function RiskModal({ patient, actor, onClose, onDone }) {
  const [flags, setFlags] = useState(patient.riskFlags);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const toggleFlag = (f) => setFlags((x) => (x.includes(f) ? x.filter((y) => y !== f) : [...x, f]));

  const submit = async () => {
    setBusy(true);
    setErr("");
    try {
      await updateRiskFlags(patient.id, flags, actor);
      await onDone();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <Modal title={`Risk flags — ${patient.patientName}`} onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {RISK_FLAGS.map((f) => (
          <button key={f} type="button" onClick={() => toggleFlag(f)} style={{ ...flagChip, ...(flags.includes(f) ? flagChipActive : null) }}>{f}</button>
        ))}
      </div>
    </Modal>
  );
}

const statGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 16 };
const row = { display: "flex", gap: 14, padding: "13px 16px", alignItems: "center" };
const selectSm = { fontSize: 12, padding: "6px 9px", borderRadius: 0, border: "1px solid var(--border-strong)", background: "var(--surface-2)", color: "var(--ink-strong)" };
const flagChip = { font: "inherit", fontSize: 11.5, fontWeight: 500, padding: "5px 11px", borderRadius: 999, border: "1px solid var(--border-strong)", background: "var(--surface-2)", color: "var(--muted)", cursor: "pointer" };
const flagChipActive = { background: "var(--bad)", color: "#fff", borderColor: "var(--bad)" };
const errBanner = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 13, padding: "10px 14px", borderRadius: 0, marginBottom: 14 };
const errBox = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12, padding: "8px 11px", borderRadius: 0, marginBottom: 14 };
