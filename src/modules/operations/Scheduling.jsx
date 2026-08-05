import { useEffect, useState, useCallback } from "react";
import { listShifts, addShift } from "./opsAdminService";
import { Button, Modal, Field, inputStyle, PageHeader } from "../../lib/ui";

export default function Scheduling() {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setShifts(await listShifts());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <div>
      <PageHeader group="Operations" title={<>Scheduling &amp; rosters</>} icon="CalendarClock" actions={<><Button variant="primary" onClick={() => setShowAdd(true)}>+ Add shift</Button></>} />

      <div style={tableWrap}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>{["Unit", "Shift", "Staff on duty"].map((h) => <th key={h} style={th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} style={emptyCell}>Loading roster…</td></tr>
            ) : shifts.length === 0 ? (
              <tr><td colSpan={3} style={emptyCell}>No shifts scheduled yet.</td></tr>
            ) : (
              shifts.map((s) => (
                <tr key={s.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ ...td, fontWeight: 500, color: "var(--ink-strong)" }}>{s.unit}</td>
                  <td style={td}>{s.shift}</td>
                  <td style={{ ...td, color: "var(--muted)" }}>{s.staff}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAdd && <AddShiftModal onClose={() => setShowAdd(false)} onDone={async () => { setShowAdd(false); await refresh(); }} />}
    </div>
  );
}

function AddShiftModal({ onClose, onDone }) {
  const [form, setForm] = useState({ unit: "", shift: "Morning (07:00–15:00)", staff: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true); setErr("");
    try { await addShift(form); await onDone(); }
    catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title="Add shift" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Adding…" : "Add"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="Unit"><input style={inputStyle} value={form.unit} onChange={set("unit")} placeholder="e.g. Medical Ward A" /></Field>
      <Field label="Shift">
        <select style={inputStyle} value={form.shift} onChange={set("shift")}>
          <option>Morning (07:00–15:00)</option>
          <option>Afternoon (15:00–23:00)</option>
          <option>Night (23:00–07:00)</option>
        </select>
      </Field>
      <Field label="Staff on duty"><input style={inputStyle} value={form.staff} onChange={set("staff")} placeholder="Names / roles" /></Field>
    </Modal>
  );
}

const header = { display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 18 };
const tableWrap = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 0, overflow: "auto" };
const th = { textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--muted)", padding: "11px 14px", background: "var(--surface)" };
const td = { padding: "11px 14px", fontSize: 13, verticalAlign: "middle" };
const emptyCell = { padding: "28px 14px", textAlign: "center", color: "var(--muted)", fontSize: 13 };
const errBox = { background: "#F7E9E9", color: "#7A2E2E", fontSize: 12, padding: "8px 11px", borderRadius: 0, marginBottom: 14 };
