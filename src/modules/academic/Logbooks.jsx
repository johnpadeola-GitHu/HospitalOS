import { useEffect, useState, useCallback } from "react";
import { listLogs, addLog } from "./academicService";
import { Button, Modal, Field, inputStyle, PageHeader } from "../../lib/ui";

export default function Logbooks() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await listLogs());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  return (
    <div>
      <PageHeader group="Academic" title={<>Clinical logbooks</>} icon="NotebookPen" actions={<><Button variant="primary" onClick={() => setShowAdd(true)}>+ Log procedure</Button></>} />
      <div style={tableWrap}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["Date", "Trainee", "Procedure", "Supervisor"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={4} style={emptyCell}>Loading…</td></tr> :
              rows.map((l) => (
                <tr key={l.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)" }}>{l.date}</td>
                  <td style={{ ...td, fontWeight: 500, color: "var(--ink-strong)" }}>{l.trainee}</td>
                  <td style={td}>{l.procedure}</td>
                  <td style={{ ...td, color: "var(--muted)" }}>{l.supervisor}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {showAdd && <AddModal onClose={() => setShowAdd(false)} onDone={async () => { setShowAdd(false); await refresh(); }} />}
    </div>
  );
}

function AddModal({ onClose, onDone }) {
  const [form, setForm] = useState({ trainee: "", procedure: "", supervisor: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const submit = async () => { setBusy(true); setErr(""); try { await addLog(form); await onDone(); } catch (e) { setErr(e.message); setBusy(false); } };
  return (
    <Modal title="Log procedure" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="Trainee"><input style={inputStyle} value={form.trainee} onChange={set("trainee")} placeholder="Name (grade)" /></Field>
      <Field label="Procedure"><input style={inputStyle} value={form.procedure} onChange={set("procedure")} /></Field>
      <Field label="Supervisor"><input style={inputStyle} value={form.supervisor} onChange={set("supervisor")} /></Field>
    </Modal>
  );
}
const header = { display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 18 };
const tableWrap = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, overflow: "auto" };
const th = { textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--muted)", padding: "11px 14px", background: "var(--surface)" };
const td = { padding: "11px 14px", fontSize: 13, verticalAlign: "middle" };
const emptyCell = { padding: "28px 14px", textAlign: "center", color: "var(--muted)", fontSize: 13 };
const errBox = { background: "#F7E9E9", color: "#7A2E2E", fontSize: 12, padding: "8px 11px", borderRadius: 8, marginBottom: 14 };
