import { useEffect, useState, useCallback } from "react";
import { listResearch, registerResearch, updateResearchStatus, RESEARCH_STATUSES } from "./academicService";
import { PageHeader, Button, Modal, Field, inputStyle, Pill } from "../../lib/ui";
import { useAuth } from "../../auth/AuthContext";

const STATUS_TONE = { recruiting: "info", ongoing: "warn", analysis: "muted", completed: "good", suspended: "bad" };

export default function Research() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [err, setErr] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await listResearch());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const changeStatus = async (id, status) => {
    setErr("");
    try { await updateResearchStatus(id, status, user); await refresh(); } catch (e) { setErr(e.message); }
  };

  return (
    <div>
      <PageHeader group="Academic" title={<>Research &amp; trials</>} icon="FlaskConical"
        subtitle="Active studies and their principal investigators"
        actions={<Button variant="primary" icon="Plus" onClick={() => setShowAdd(true)}>Register study</Button>} />

      {err && <div style={errBox}>{err}</div>}

      {loading ? <div style={{ color: "var(--muted)", fontSize: 13 }}>Loading studies…</div> : rows.length === 0 ? (
        <div style={{ color: "var(--muted)", fontSize: 13, padding: "20px 2px" }}>No research studies yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map((r) => (
            <div key={r.id} style={card}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink-strong)" }}>{r.title}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>PI: {r.pi} · {r.dept}</div>
              </div>
              <Pill tone={STATUS_TONE[r.status]}>{r.status}</Pill>
              <select
                style={{ ...inputStyle, width: 150, padding: "6px 8px", fontSize: 12 }}
                value={r.status}
                onChange={(e) => changeStatus(r.id, e.target.value)}
              >
                {RESEARCH_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddModal actor={user} onClose={() => setShowAdd(false)} onDone={async () => { setShowAdd(false); await refresh(); }} />}
    </div>
  );
}

function AddModal({ actor, onClose, onDone }) {
  const [form, setForm] = useState({ title: "", pi: "", dept: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true); setErr("");
    try { await registerResearch({ ...form, actor }); await onDone(); } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title="Register a research study" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Saving…" : "Register"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="Study title"><input style={inputStyle} value={form.title} onChange={set("title")} /></Field>
      <Field label="Principal investigator"><input style={inputStyle} value={form.pi} onChange={set("pi")} /></Field>
      <Field label="Department"><input style={inputStyle} value={form.dept} onChange={set("dept")} /></Field>
      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
        New studies start as "recruiting." If this study needs ethics approval, submit it separately in Ethics committee.
      </div>
    </Modal>
  );
}

const card = { display: "flex", gap: 12, alignItems: "center", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 0, padding: "12px 16px" };
const errBox = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12, padding: "8px 11px", borderRadius: 0, marginBottom: 14 };
