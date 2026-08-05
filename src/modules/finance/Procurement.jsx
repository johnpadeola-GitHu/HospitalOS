import { useEffect, useState, useCallback } from "react";
import { PO_TINT, listPOs, advancePO, createPO } from "./procurementService";
import { Button, Modal, Field, inputStyle, PageHeader } from "../../lib/ui";

import { naira } from "../../lib/money";

export default function Procurement() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await listPOs());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  const advance = async (id) => { await advancePO(id); await refresh(); };
  return (
    <div>
      <PageHeader group="Finance & trade" title={<>Procurement &amp; suppliers</>} icon="ShoppingCart" actions={<><Button variant="primary" onClick={() => setShowNew(true)}>+ New PO</Button></>} />
      <div style={tableWrap}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["Ref", "Supplier", "Items", "Amount", "Status", ""].map((h) => <th key={h} style={{ ...th, textAlign: h === "Amount" ? "right" : "left" }}>{h}</th>)}</tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={6} style={emptyCell}>Loading…</td></tr> :
              rows.length === 0 ? (
              <tr><td colSpan={6} style={emptyCell}>Nothing here yet.</td></tr>
            ) : (
              rows.map((p) => {
                const t = PO_TINT[p.status];
                const canAdvance = p.status !== "received";
                return (
                  <tr key={p.id} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 12 }}>{p.ref}</td>
                    <td style={{ ...td, fontWeight: 500, color: "var(--ink-strong)" }}>{p.supplier}</td>
                    <td style={{ ...td, color: "var(--muted)", maxWidth: 220 }}>{p.items}</td>
                    <td style={{ ...td, textAlign: "right", fontFamily: "var(--font-mono)" }}>{naira(p.amount)}</td>
                    <td style={td}><span style={{ background: t.bg, color: t.fg, fontSize: 11, fontWeight: 500, padding: "2px 9px", borderRadius: 999 }}>{t.label}</span></td>
                    <td style={{ ...td, textAlign: "right" }}>{canAdvance && <Button onClick={() => advance(p.id)}>{p.status === "draft" ? "Place order" : "Mark received"}</Button>}</td>
                  </tr>
                );
              }))}
          </tbody>
        </table>
      </div>
      {showNew && <NewModal onClose={() => setShowNew(false)} onDone={async () => { setShowNew(false); await refresh(); }} />}
    </div>
  );
}

function NewModal({ onClose, onDone }) {
  const [form, setForm] = useState({ supplier: "", items: "", amount: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const submit = async () => { setBusy(true); setErr(""); try { await createPO(form); await onDone(); } catch (e) { setErr(e.message); setBusy(false); } };
  return (
    <Modal title="New purchase order" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Creating…" : "Create"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="Supplier"><input style={inputStyle} value={form.supplier} onChange={set("supplier")} /></Field>
      <Field label="Items"><input style={inputStyle} value={form.items} onChange={set("items")} /></Field>
      <Field label="Amount (₦)"><input type="number" min="1" style={inputStyle} value={form.amount} onChange={set("amount")} /></Field>
    </Modal>
  );
}
const header = { display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 18 };
const tableWrap = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, overflow: "auto" };
const th = { fontSize: 11, fontWeight: 600, color: "var(--muted)", padding: "11px 14px", background: "var(--surface)" };
const td = { padding: "11px 14px", fontSize: 13, verticalAlign: "middle" };
const emptyCell = { padding: "28px 14px", textAlign: "center", color: "var(--muted)", fontSize: 13 };
const errBox = { background: "#F7E9E9", color: "#7A2E2E", fontSize: 12, padding: "8px 11px", borderRadius: 8, marginBottom: 14 };
