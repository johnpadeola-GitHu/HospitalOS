import { useEffect, useState, useCallback } from "react";
import * as Icons from "lucide-react";
import { listTraining, addTrainingProgramme, enrollTrainee } from "./academicService";
import { PageHeader, Button, Modal, Field, inputStyle } from "../../lib/ui";
import { useAuth } from "../../auth/AuthContext";

const LEVELS = ["Undergraduate", "Internship", "Residency", "Fellowship"];

export default function Training() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [err, setErr] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await listTraining());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const enroll = async (id) => {
    setErr("");
    try { await enrollTrainee(id, user); await refresh(); } catch (e) { setErr(e.message); }
  };

  return (
    <div>
      <PageHeader group="Academic" title={<>Training &amp; rotations</>} icon="GraduationCap"
        subtitle="Residency, internship, and clerkship programmes"
        actions={<Button variant="primary" icon="Plus" onClick={() => setShowAdd(true)}>New programme</Button>} />

      {err && <div style={errBox}>{err}</div>}

      {loading ? <div style={{ color: "var(--muted)", fontSize: 13 }}>Loading programmes…</div> : (
        <div style={grid}>
          {rows.map((t) => (
            <div key={t.id} style={card}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-strong)" }}>{t.programme}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{t.level} · Lead: {t.lead}</div>
              <div style={{ fontSize: 24, fontWeight: 600, fontFamily: "var(--font-mono)", color: "var(--ink-strong)", marginTop: 8 }}>{t.trainees}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 10 }}>trainees enrolled</div>
              <Button onClick={() => enroll(t.id)}><Icons.UserPlus size={13} /> Enroll trainee</Button>
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddModal actor={user} onClose={() => setShowAdd(false)} onDone={async () => { setShowAdd(false); await refresh(); }} />}
    </div>
  );
}

function AddModal({ actor, onClose, onDone }) {
  const [form, setForm] = useState({ programme: "", level: LEVELS[2], lead: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true); setErr("");
    try { await addTrainingProgramme({ ...form, actor }); await onDone(); } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title="New training programme" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Saving…" : "Create"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="Programme name"><input style={inputStyle} value={form.programme} onChange={set("programme")} placeholder="e.g. Paediatrics Residency" /></Field>
      <Field label="Level"><select style={inputStyle} value={form.level} onChange={set("level")}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select></Field>
      <Field label="Programme lead"><input style={inputStyle} value={form.lead} onChange={set("lead")} /></Field>
    </Modal>
  );
}

const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 };
const card = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px" };
const errBox = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12, padding: "8px 11px", borderRadius: 8, marginBottom: 14 };
