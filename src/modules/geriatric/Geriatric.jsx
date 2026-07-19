import { useEffect, useState, useCallback } from "react";
import { FRAILTY_LEVELS, FRAILTY_TONE, COGNITIVE_SCREEN, listPatients, admitPatient, updateAssessment, geriatricSummary } from "./geriatricService";
import { PageHeader, StatCard, Card, Pill, Button, Modal, Field, inputStyle, EmptyState } from "../../lib/ui";
import { useAuth } from "../../auth/AuthContext";
import PatientPicker from "../patients/PatientPicker";

export default function Geriatric() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdmit, setShowAdmit] = useState(false);
  const [editFor, setEditFor] = useState(null);
  const [err, setErr] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true); setErr("");
    try {
      const [p, s] = await Promise.all([listPatients(), geriatricSummary()]);
      setPatients(p); setSummary(s);
    } catch (e) { setErr(e.message || "Failed to load patients."); }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <div>
      <PageHeader group="Patient care" title="Geriatric unit" icon="Users"
        subtitle="Dedicated ward for older adults — Comprehensive Geriatric Assessment on admission"
        actions={<Button variant="primary" icon="Plus" onClick={() => setShowAdmit(true)}>Admit patient</Button>} />

      {err && <div style={errBanner}>{err}</div>}

      {summary && (
        <div style={statGrid}>
          <StatCard label="Admitted" value={summary.admitted} />
          <StatCard label="High falls risk" value={summary.highFallsRisk} tone={summary.highFallsRisk ? "bad" : "default"} />
          <StatCard label="Polypharmacy (5+ meds)" value={summary.polypharmacy} tone={summary.polypharmacy ? "warn" : "default"} />
          <StatCard label="Frail or worse" value={summary.frailOrWorse} tone={summary.frailOrWorse ? "warn" : "default"} />
        </div>
      )}

      <Card title="Patients" pad={false}>
        {loading ? <div style={{ padding: 20, color: "var(--muted)", fontSize: 13 }}>Loading…</div> : patients.length === 0 ? (
          <div style={{ padding: 22 }}><EmptyState icon="Users" title="No patients admitted" /></div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {patients.map((p, i) => (
              <div key={p.id} style={{ ...row, borderTop: i ? "1px solid var(--border)" : "none" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink-strong)" }}>{p.patientName}</span>
                    <span style={{ fontSize: 11.5, color: "var(--muted)" }}>{p.age}y</span>
                    <Pill tone={FRAILTY_TONE[p.frailty]}>{p.frailty}</Pill>
                    <Pill tone={p.fallsRisk.tone}>{p.fallsRisk.label}</Pill>
                    {p.medicationCount >= 5 && <Pill tone="warn">Polypharmacy ({p.medicationCount})</Pill>}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3 }}>
                    {p.bed} &middot; Cognitive: {p.cognitiveScreen} &middot; {p.medicationCount} medications
                  </div>
                  {p.notes && <div style={{ fontSize: 12, color: "var(--ink)", marginTop: 4 }}>{p.notes}</div>}
                </div>
                <Button onClick={() => setEditFor(p)}>Update assessment</Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showAdmit && <AdmitModal actor={user} onClose={() => setShowAdmit(false)} onDone={async () => { setShowAdmit(false); await refresh(); }} />}
      {editFor && <EditModal patient={editFor} actor={user} onClose={() => setEditFor(null)} onDone={async () => { setEditFor(null); await refresh(); }} />}
    </div>
  );
}

function AdmitModal({ actor, onClose, onDone }) {
  const [form, setForm] = useState({ patientId: null, patientName: "", hospitalNo: "", age: "", bed: "", fallsRiskScore: "2", medicationCount: "", cognitiveScreen: COGNITIVE_SCREEN[0], frailty: FRAILTY_LEVELS[1], notes: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true); setErr("");
    try { await admitPatient({ ...form, actor }); await onDone(); } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title="Admit to Geriatric Unit — Comprehensive Geriatric Assessment" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Admitting…" : "Admit"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><Field label="Patient"><PatientPicker value={form} onChange={(p) => setForm((f) => ({ ...f, ...p }))} /></Field></div>
        <div style={{ width: 80 }}><Field label="Age"><input type="number" style={inputStyle} value={form.age} onChange={set("age")} /></Field></div>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ width: 100 }}><Field label="Bed"><input style={inputStyle} value={form.bed} onChange={set("bed")} /></Field></div>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><Field label="Falls risk score (0-5)"><input type="number" min="0" max="5" style={inputStyle} value={form.fallsRiskScore} onChange={set("fallsRiskScore")} /></Field></div>
        <div style={{ flex: 1 }}><Field label="Regular medication count"><input type="number" style={inputStyle} value={form.medicationCount} onChange={set("medicationCount")} /></Field></div>
      </div>
      <Field label="Cognitive screen"><select style={inputStyle} value={form.cognitiveScreen} onChange={set("cognitiveScreen")}>{COGNITIVE_SCREEN.map((c) => <option key={c}>{c}</option>)}</select></Field>
      <Field label="Frailty level"><select style={inputStyle} value={form.frailty} onChange={set("frailty")}>{FRAILTY_LEVELS.map((f) => <option key={f}>{f}</option>)}</select></Field>
      <Field label="Notes"><textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical", fontFamily: "var(--font-sans)" }} value={form.notes} onChange={set("notes")} /></Field>
    </Modal>
  );
}

function EditModal({ patient, actor, onClose, onDone }) {
  const [fallsRiskScore, setFallsRiskScore] = useState(patient.fallsRiskScore);
  const [medicationCount, setMedicationCount] = useState(patient.medicationCount);
  const [frailty, setFrailty] = useState(patient.frailty);
  const [notes, setNotes] = useState(patient.notes);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    await updateAssessment(patient.id, { fallsRiskScore: parseInt(fallsRiskScore, 10), medicationCount: parseInt(medicationCount, 10), frailty, notes }, actor);
    await onDone();
  };

  return (
    <Modal title={`Update assessment — ${patient.patientName}`} onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
    </>}>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><Field label="Falls risk score"><input type="number" min="0" max="5" style={inputStyle} value={fallsRiskScore} onChange={(e) => setFallsRiskScore(e.target.value)} /></Field></div>
        <div style={{ flex: 1 }}><Field label="Medication count"><input type="number" style={inputStyle} value={medicationCount} onChange={(e) => setMedicationCount(e.target.value)} /></Field></div>
      </div>
      <Field label="Frailty level"><select style={inputStyle} value={frailty} onChange={(e) => setFrailty(e.target.value)}>{FRAILTY_LEVELS.map((f) => <option key={f}>{f}</option>)}</select></Field>
      <Field label="Notes"><textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical", fontFamily: "var(--font-sans)" }} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
    </Modal>
  );
}

const statGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 16 };
const row = { display: "flex", gap: 14, padding: "13px 16px", alignItems: "center" };
const errBanner = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 13, padding: "10px 14px", borderRadius: 10, marginBottom: 14 };
const errBox = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12, padding: "8px 11px", borderRadius: 8, marginBottom: 14 };
