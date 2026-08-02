import { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PO_TINT, listPOs, advancePO, createPO, listStores } from "./procurementService";
import { Button, Modal, Field, inputStyle, PageHeader } from "../../lib/ui";

import { naira } from "../../lib/money";

export default function Procurement() {
  const location = useLocation();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [prefill, setPrefill] = useState(null);

  // Arrived here via a "Raise LPO" click from a low-stock Stores item \u2014
  // open the New LPO modal pre-filled with that item rather than making the
  // person find it again. Clear the navigation state right away so a later
  // revisit or refresh of this page doesn't keep reopening the modal.
  useEffect(() => {
    if (location.state?.raisePoFor) {
      setPrefill(location.state.raisePoFor);
      setShowNew(true);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate]);

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
      <PageHeader group="Finance & trade" title={<>Procurement &amp; suppliers</>} icon="ShoppingCart" actions={<><Button variant="primary" onClick={() => setShowNew(true)}>+ New LPO</Button></>} />
      <div style={tableWrap}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["Ref", "Supplier", "Items", "Amount", "Status", ""].map((h) => <th key={h} style={{ ...th, textAlign: h === "Amount" ? "right" : "left" }}>{h}</th>)}</tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={6} style={emptyCell}>Loading…</td></tr> :
              rows.map((p) => {
                const t = PO_TINT[p.status];
                const canAdvance = p.status !== "received";
                return (
                  <tr key={p.id} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 12 }}>{p.ref}</td>
                    <td style={{ ...td, fontWeight: 500, color: "var(--ink-strong)" }}>{p.supplier}</td>
                    <td style={{ ...td, color: "var(--muted)", maxWidth: 220 }}>
                      {p.items}
                      {p.lines && p.lines.length > 0 && (
                        <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 2 }}>
                          Linked to stock: {p.lines.map((l) => `${l.item} (+${l.quantity})`).join(", ")}
                        </div>
                      )}
                    </td>
                    <td style={{ ...td, textAlign: "right", fontFamily: "var(--font-mono)" }}>{naira(p.amount)}</td>
                    <td style={td}><span style={{ background: t.bg, color: t.fg, fontSize: 11, fontWeight: 500, padding: "2px 9px", borderRadius: 999 }}>{t.label}</span></td>
                    <td style={{ ...td, textAlign: "right" }}>{canAdvance && <Button onClick={() => advance(p.id)}>{p.status === "draft" ? "Place order" : "Mark received"}</Button>}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
      {showNew && (
        <NewModal
          prefill={prefill}
          onClose={() => { setShowNew(false); setPrefill(null); }}
          onDone={async () => { setShowNew(false); setPrefill(null); await refresh(); }}
        />
      )}
    </div>
  );
}

function NewModal({ prefill, onClose, onDone }) {
  const [form, setForm] = useState({
    supplier: "", amount: "",
    items: prefill ? `${prefill.itemName} (reorder)` : "",
  });
  const [storeItems, setStoreItems] = useState([]);
  const [lines, setLines] = useState(
    prefill ? [{ storeItemId: prefill.storeItemId, quantity: String(prefill.suggestedQty) }] : []
  ); // [{ storeItemId, quantity }]
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    listStores().then(setStoreItems).catch(() => setStoreItems([]));
  }, []);

  const addLine = () => setLines((ls) => [...ls, { storeItemId: "", quantity: "" }]);
  const updateLine = (i, patch) => setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const removeLine = (i) => setLines((ls) => ls.filter((_, idx) => idx !== i));

  const submit = async () => {
    setBusy(true);
    setErr("");
    try {
      const validLines = lines.filter((l) => l.storeItemId && parseInt(l.quantity, 10) > 0);
      await createPO({ ...form, lines: validLines });
      await onDone();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <Modal title="New local purchase order" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Creating…" : "Create"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="Supplier"><input style={inputStyle} value={form.supplier} onChange={set("supplier")} /></Field>
      <Field label="Items (summary)"><input style={inputStyle} value={form.items} onChange={set("items")} placeholder="e.g. Surgical gloves, gauze rolls (bulk)" /></Field>
      <Field label="Amount (₦)"><input type="number" min="1" style={inputStyle} value={form.amount} onChange={set("amount")} /></Field>

      <div style={{ borderTop: "1px solid var(--border)", margin: "16px 0 12px", paddingTop: 14 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-strong)", marginBottom: 4 }}>
          Link to stock (optional)
        </div>
        <div style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 10, lineHeight: 1.5 }}>
          Attach store items and quantities so marking this LPO received automatically increases stock.
          Leave blank if this LPO isn't for stores inventory (e.g. equipment, services).
        </div>
        {lines.map((l, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
            <select
              style={{ ...inputStyle, flex: 1 }}
              value={l.storeItemId}
              onChange={(e) => updateLine(i, { storeItemId: e.target.value })}
            >
              <option value="">Select store item…</option>
              {storeItems.map((si) => <option key={si.id} value={si.id}>{si.item}</option>)}
            </select>
            <input
              type="number" min="1" style={{ ...inputStyle, width: 90 }}
              placeholder="Qty" value={l.quantity}
              onChange={(e) => updateLine(i, { quantity: e.target.value })}
            />
            <button
              onClick={() => removeLine(i)}
              style={{ border: "none", background: "transparent", color: "var(--muted)", cursor: "pointer", fontSize: 16, padding: "0 4px" }}
              aria-label="Remove line"
            >
              ×
            </button>
          </div>
        ))}
        <Button onClick={addLine}>+ Add line</Button>
      </div>
    </Modal>
  );
}
const header = { display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 18 };
const tableWrap = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, overflow: "auto" };
const th = { fontSize: 11, fontWeight: 600, color: "var(--muted)", padding: "11px 14px", background: "var(--surface)" };
const td = { padding: "11px 14px", fontSize: 13, verticalAlign: "middle" };
const emptyCell = { padding: "28px 14px", textAlign: "center", color: "var(--muted)", fontSize: 13 };
const errBox = { background: "#F7E9E9", color: "#7A2E2E", fontSize: 12, padding: "8px 11px", borderRadius: 8, marginBottom: 14 };
