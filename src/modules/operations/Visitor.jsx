import { useEffect, useState, useCallback } from "react";
import { listVisitors, checkInVisitor, checkOutVisitor } from "./opsAdminService";
import { Button, Modal, Field, inputStyle, PageHeader } from "../../lib/ui";

function since(iso) {
  const m = Math.round((Date.now() - new Date(iso)) / 60000);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

export default function Visitor() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showIn, setShowIn] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await listVisitors({ activeOnly: true }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const out = async (id) => { await checkOutVisitor(id); await refresh(); };

  return (
    <div>
      <PageHeader group="Operations" title={<>Visitor &amp; security</>} icon="IdCard" actions={<><Button variant="primary" onClick={() => setShowIn(true)}>+ Check in visitor</Button></>} />

      <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
        {loading ? "…" : `${rows.length} visitor(s) currently on site`}
      </div>

      <div style={tableWrap}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>{["Pass", "Visitor", "Visiting", "On site", ""].map((h) => <th key={h} style={th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={emptyCell}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} style={emptyCell}>No visitors currently on site.</td></tr>
            ) : (
              rows.map((v) => (
                <tr key={v.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 12 }}>{v.pass}</td>
                  <td style={{ ...td, fontWeight: 500, color: "var(--ink-strong)" }}>{v.name}</td>
                  <td style={td}>{v.visiting}</td>
                  <td style={{ ...td, color: "var(--muted)" }}>{since(v.in)}</td>
                  <td style={{ ...td, textAlign: "right" }}><Button onClick={() => out(v.id)}>Check out</Button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showIn && <CheckInModal onClose={() => setShowIn(false)} onDone={async () => { setShowIn(false); await refresh(); }} />}
    </div>
  );
}

function CheckInModal({ onClose, onDone }) {
  const [form, setForm] = useState({ name: "", visiting: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true); setErr("");
    try { await checkInVisitor(form); await onDone(); }
    catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title="Check in visitor" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Issuing…" : "Issue pass"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="Visitor name"><input style={inputStyle} value={form.name} onChange={set("name")} /></Field>
      <Field label="Visiting (patient / ward)"><input style={inputStyle} value={form.visiting} onChange={set("visiting")} placeholder="e.g. Adaeze Okafor (MA-04)" /></Field>
    </Modal>
  );
}

const header = { display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 18 };
const tableWrap = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, overflow: "auto" };
const th = { textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--muted)", padding: "11px 14px", background: "var(--surface)" };
const td = { padding: "11px 14px", fontSize: 13, verticalAlign: "middle" };
const emptyCell = { padding: "28px 14px", textAlign: "center", color: "var(--muted)", fontSize: 13 };
const errBox = { background: "#F7E9E9", color: "#7A2E2E", fontSize: 12, padding: "8px 11px", borderRadius: 8, marginBottom: 14 };
