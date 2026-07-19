import { useEffect, useState, useCallback } from "react";
import {
  DIET_TYPES, REFERRAL_SOURCES, NUTRITION_STATUS, STATUS_TONE,
  listCases, referForAssessment, updatePlan, nutritionSummary,
} from "./nutritionService";
import { PageHeader, StatCard, Card, Pill, Button, Modal, Field, inputStyle, EmptyState } from "../../lib/ui";
import { useAuth } from "../../auth/AuthContext";
import PatientPicker from "../patients/PatientPicker";

export default function Nutrition() {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [summary, setSummary] = useState(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showRefer, setShowRefer] = useState(false);
  const [editFor, setEditFor] = useState(null);
  const [err, setErr] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true); setErr("");
    try {
      const [c, s] = await Promise.all([listCases({ query, status }), nutritionSummary()]);
      setCases(c); setSummary(s);
    } catch (e) { setErr(e.message); }
    setLoading(false);
  }, [query, status]);

  useEffect(() => { const t = setTimeout(refresh, 150); return () => clearTimeout(t); }, [refresh]);

  return (
    <div>
      <PageHeader group="Specialty services" title="Nutrition &amp; dietetics" icon="Apple"
        subtitle="Nutritional assessment and therapeutic diet plans, referred in from any ward"
        actions={<Button variant="primary" icon="Plus" onClick={() => setShowRefer(true)}>Refer for assessment</Button>} />

      {err && <div style={errBanner}>{err}</div>}

      {summary && (
        <div style={statGrid}>
          <StatCard label="Active cases" value={summary.total} />
          <StatCard label="At risk" value={summary.atRisk} tone="warn" />
          <StatCard label="Malnourished" value={summary.malnourished} tone={summary.malnourished ? "bad" : "default"} />
          <StatCard label="Severe" value={summary.severeCases} tone={summary.severeCases ? "bad" : "default"} />
        </div>
      )}

      <div style={toolbar}>
        <input style={{ ...inputStyle, maxWidth: 240 }} placeholder="Search patient…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select style={{ ...inputStyle, maxWidth: 220 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          {NUTRITION_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <Card title="Cases" pad={false}>
        {loading ? <div style={{ padding: 20, color: "var(--muted)", fontSize: 13 }}>Loading…</div> : cases.length === 0 ? (
          <div style={{ padding: 22 }}><EmptyState icon="Apple" title="No cases match" /></div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {cases.map((c, i) => (
              <div key={c.id} style={{ ...row, borderTop: i ? "1px solid var(--border)" : "none" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink-strong)" }}>{c.patientName}</span>
                    <Pill tone={STATUS_TONE[c.status]}>{c.status}</Pill>
                    <Pill tone="muted">{c.dietType}</Pill>
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3 }}>
                    Referred from {c.source} &middot; {c.bmi ? `BMI ${c.bmi}` : "BMI not recorded"} &middot; review due {c.reviewDue}
                  </div>
                  {c.notes && <div style={{ fontSize: 12, color: "var(--ink)", marginTop: 4 }}>{c.notes}</div>}
                </div>
                <Button onClick={() => setEditFor(c)}>Update plan</Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showRefer && <ReferModal actor={user} onClose={() => setShowRefer(false)} onDone={async () => { setShowRefer(false); await refresh(); }} />}
      {editFor && <EditModal caseItem={editFor} actor={user} onClose={() => setEditFor(null)} onDone={async () => { setEditFor(null); await refresh(); }} />}
    </div>
  );
}

function ReferModal({ actor, onClose, onDone }) {
  const [form, setForm] = useState({ patientId: null, patientName: "", hospitalNo: "", source: REFERRAL_SOURCES[0], weightKg: "", heightCm: "", status: NUTRITION_STATUS[0], dietType: DIET_TYPES[0], notes: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true); setErr("");
    try { await referForAssessment({ ...form, actor }); await onDone(); } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title="Refer for nutritional assessment" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Saving…" : "Refer"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="Patient"><PatientPicker value={form} onChange={(p) => setForm((f) => ({ ...f, ...p }))} /></Field>
      <Field label="Referred from"><select style={inputStyle} value={form.source} onChange={set("source")}>{REFERRAL_SOURCES.map((s) => <option key={s}>{s}</option>)}</select></Field>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><Field label="Weight (kg)"><input type="number" style={inputStyle} value={form.weightKg} onChange={set("weightKg")} /></Field></div>
        <div style={{ flex: 1 }}><Field label="Height (cm)"><input type="number" style={inputStyle} value={form.heightCm} onChange={set("heightCm")} /></Field></div>
      </div>
      <Field label="Nutritional status"><select style={inputStyle} value={form.status} onChange={set("status")}>{NUTRITION_STATUS.map((s) => <option key={s}>{s}</option>)}</select></Field>
      <Field label="Diet type"><select style={inputStyle} value={form.dietType} onChange={set("dietType")}>{DIET_TYPES.map((d) => <option key={d}>{d}</option>)}</select></Field>
      <Field label="Notes"><textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical", fontFamily: "var(--font-sans)" }} value={form.notes} onChange={set("notes")} /></Field>
    </Modal>
  );
}

function EditModal({ caseItem, actor, onClose, onDone }) {
  const [dietType, setDietType] = useState(caseItem.dietType);
  const [status, setStatus] = useState(caseItem.status);
  const [notes, setNotes] = useState(caseItem.notes);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    await updatePlan(caseItem.id, { dietType, status, notes, actor });
    await onDone();
  };

  return (
    <Modal title={`Update plan — ${caseItem.patientName}`} onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
    </>}>
      <Field label="Diet type"><select style={inputStyle} value={dietType} onChange={(e) => setDietType(e.target.value)}>{DIET_TYPES.map((d) => <option key={d}>{d}</option>)}</select></Field>
      <Field label="Nutritional status"><select style={inputStyle} value={status} onChange={(e) => setStatus(e.target.value)}>{NUTRITION_STATUS.map((s) => <option key={s}>{s}</option>)}</select></Field>
      <Field label="Notes"><textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical", fontFamily: "var(--font-sans)" }} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
    </Modal>
  );
}

const statGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 16 };
const toolbar = { display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" };
const row = { display: "flex", gap: 14, padding: "13px 16px", alignItems: "center" };
const errBanner = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 13, padding: "10px 14px", borderRadius: 10, marginBottom: 14 };
const errBox = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12, padding: "8px 11px", borderRadius: 8, marginBottom: 14 };
