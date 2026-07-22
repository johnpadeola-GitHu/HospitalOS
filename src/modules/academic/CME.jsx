import { useEffect, useState, useCallback } from "react";
import * as Icons from "lucide-react";
import { listCME, addCmeActivity, recordCmeAttendance } from "./academicService";
import { PageHeader, Button, Modal, Field, inputStyle } from "../../lib/ui";
import { useAuth } from "../../auth/AuthContext";

const CATEGORIES = ["Clinical", "Skills", "Research", "Ethics & Professionalism", "Management"];

export default function CME() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [err, setErr] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await listCME());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const attend = async (id) => {
    setErr("");
    try { await recordCmeAttendance(id, user); await refresh(); } catch (e) { setErr(e.message); }
  };

  return (
    <div>
      <PageHeader group="Academic" title={<>CME</>} icon="Award"
        subtitle="Continuing medical education activities and attendance"
        actions={<Button variant="primary" icon="Plus" onClick={() => setShowAdd(true)}>Schedule activity</Button>} />

      {err && <div style={errBox}>{err}</div>}

      {loading ? <div style={{ color: "var(--muted)", fontSize: 13 }}>Loading activities…</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map((c) => (
            <div key={c.id} style={card}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 14, color: "var(--ink-strong)" }}>{c.title}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{c.date} · {c.category} · {c.attendees || 0} attended</div>
              </div>
              <span style={credits}>{c.credits} credits</span>
              <Button onClick={() => attend(c.id)}>
                <Icons.UserPlus size={13} /> Record attendance
              </Button>
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddModal actor={user} onClose={() => setShowAdd(false)} onDone={async () => { setShowAdd(false); await refresh(); }} />}
    </div>
  );
}

function AddModal({ actor, onClose, onDone }) {
  const [form, setForm] = useState({ title: "", date: "", credits: "2", category: CATEGORIES[0] });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true); setErr("");
    try { await addCmeActivity({ ...form, actor }); await onDone(); } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title="Schedule a CME activity" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Saving…" : "Schedule"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="Title"><input style={inputStyle} value={form.title} onChange={set("title")} placeholder="e.g. Grand Round: Sepsis management" /></Field>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><Field label="Date"><input type="date" style={inputStyle} value={form.date} onChange={set("date")} /></Field></div>
        <div style={{ width: 100 }}><Field label="Credits"><input type="number" min="1" style={inputStyle} value={form.credits} onChange={set("credits")} /></Field></div>
      </div>
      <Field label="Category"><select style={inputStyle} value={form.category} onChange={set("category")}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
    </Modal>
  );
}

const card = { display: "flex", gap: 12, alignItems: "center", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 16px" };
const credits = { fontSize: 11, fontWeight: 600, color: "#1E3350", background: "#D3E1F8", padding: "3px 10px", borderRadius: 999, flexShrink: 0 };
const errBox = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12, padding: "8px 11px", borderRadius: 8, marginBottom: 14 };
