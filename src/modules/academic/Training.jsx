import { useEffect, useState, useCallback } from "react";
import * as Icons from "lucide-react";
import { listTraining, addTrainingProgramme, enrollTrainee, listTrainees } from "./academicService";
import { PageHeader, Button, Modal, Field, inputStyle } from "../../lib/ui";
import { useAuth } from "../../auth/AuthContext";

const LEVELS = ["Undergraduate", "Internship", "Residency", "Fellowship"];

export default function Training() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [enrollTarget, setEnrollTarget] = useState(null); // programme to enroll into
  const [expandId, setExpandId] = useState(null); // programme showing trainee list
  const [traineesMap, setTraineesMap] = useState({});
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

  const expandTrainees = async (id) => {
    if (expandId === id) { setExpandId(null); return; }
    setExpandId(id);
    if (!traineesMap[id]) {
      try { const list = await listTrainees(id); setTraineesMap((m) => ({ ...m, [id]: list })); }
      catch { setTraineesMap((m) => ({ ...m, [id]: [] })); }
    }
  };

  return (
    <div>
      <PageHeader group="Academic" title={<>Training &amp; rotations</>} icon="GraduationCap"
        subtitle="Residency, internship, and clerkship programmes"
        actions={<Button variant="primary" icon="Plus" onClick={() => setShowAdd(true)}>New programme</Button>} />

      {err && <div style={errBox}>{err}</div>}

      {loading ? <div style={{ color: "var(--muted)", fontSize: 13 }}>Loading programmes…</div> : rows.length === 0 ? (
        <div style={{ color: "var(--muted)", fontSize: 13, padding: "20px 2px" }}>No training programmes yet.</div>
      ) : (
        <div style={grid}>
          {rows.map((t) => (
            <div key={t.id} style={card}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-strong)" }}>{t.programme}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{t.level} · Lead: {t.lead}</div>
              <div style={{ fontSize: 24, fontWeight: 600, fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums", color: "var(--ink-strong)", marginTop: 8 }}>{t.trainees}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 10 }}>trainees enrolled</div>
              <div style={{ display: "flex", gap: 6 }}>
                <Button onClick={() => setEnrollTarget(t)}><Icons.UserPlus size={13} /> Enroll</Button>
                <Button onClick={() => expandTrainees(t.id)}><Icons.List size={13} /> {expandId === t.id ? "Hide" : "View trainees"}</Button>
              </div>
              {expandId === t.id && (
                <div style={{ marginTop: 10, borderTop: "1px solid var(--border)", paddingTop: 8 }}>
                  {!traineesMap[t.id] ? (
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>Loading…</div>
                  ) : traineesMap[t.id].length === 0 ? (
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>No trainees enrolled yet.</div>
                  ) : (
                    traineesMap[t.id].map((tr) => (
                      <div key={tr.id} style={{ fontSize: 12, padding: "4px 0", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontWeight: 500, color: "var(--ink-strong)" }}>{tr.name}</span>
                        <span style={{ color: "var(--muted)" }}>{tr.role || "—"}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddModal actor={user} onClose={() => setShowAdd(false)} onDone={async () => { setShowAdd(false); await refresh(); }} />}
      {enrollTarget && (
        <EnrollModal programme={enrollTarget} onClose={() => setEnrollTarget(null)}
          onDone={async () => {
            setEnrollTarget(null); await refresh();
            if (enrollTarget) setTraineesMap((m) => ({ ...m, [enrollTarget.id]: undefined }));
          }} />
      )}
    </div>
  );
}

function EnrollModal({ programme, onClose, onDone }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const submit = async () => {
    if (!name.trim()) return setErr("Enter the trainee's name.");
    setBusy(true); setErr("");
    try { await enrollTrainee(programme.id, { name, role }); await onDone(); }
    catch (e) { setErr(e.message); setBusy(false); }
  };
  return (
    <Modal title={`Enroll trainee — ${programme.programme}`} onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Enrolling…" : "Enroll"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="Trainee name *"><input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" autoFocus /></Field>
      <Field label="Role / specialty"><input style={inputStyle} value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. House Officer, Resident, Intern" /></Field>
    </Modal>
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
const card = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 0, padding: "14px 16px" };
const errBox = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12, padding: "8px 11px", borderRadius: 0, marginBottom: 14 };
