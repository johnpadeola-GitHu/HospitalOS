import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { listStores, createStoreItem, restockStoreItem } from "./procurementService";
import { PageHeader, Button, Modal, Field, inputStyle } from "../../lib/ui";

export default function Stores() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [restockFor, setRestockFor] = useState(null);

  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      setRows(await listStores());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <div>
      <PageHeader group="Finance & trade" title={<>Stores &amp; assets</>} icon="Boxes"
        actions={<Button onClick={() => setShowAdd(true)}>Add item</Button>} />
      <div style={tableWrap}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["Item", "Category", "Quantity", "Reorder at", "Status", ""].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={6} style={emptyCell}>Loading…</td></tr> :
              rows.length === 0 ? <tr><td colSpan={6} style={emptyCell}>No store items yet — add one to get started.</td></tr> :
              rows.map((s) => (
                <tr key={s.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ ...td, fontWeight: 500, color: "var(--ink-strong)" }}>{s.item}</td>
                  <td style={{ ...td, color: "var(--muted)" }}>{s.category}</td>
                  <td style={{ ...td, fontFamily: "var(--font-mono)", color: s.low ? "#B0281F" : "var(--ink)" }}>{s.qty}</td>
                  <td style={{ ...td, fontFamily: "var(--font-mono)", color: "var(--muted)" }}>{s.reorder}</td>
                  <td style={td}>{s.low ? <span style={lowPill}>Reorder</span> : <span style={okPill}>OK</span>}</td>
                  <td style={{ ...td, textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: 6 }}>
                      {s.low && (
                        <Button
                          variant="primary"
                          onClick={() => navigate("/finance/procurement", {
                            state: {
                              raisePoFor: {
                                storeItemId: s.id, itemName: s.item,
                                // Suggest enough to clear back above the reorder
                                // threshold with a small buffer, not just "1" \u2014
                                // a starting point the person can still adjust.
                                suggestedQty: Math.max(s.reorder - s.qty, 1) + Math.ceil(s.reorder * 0.25),
                              },
                            },
                          })}
                        >
                          Raise LPO
                        </Button>
                      )}
                      <Button onClick={() => setRestockFor(s)}>Restock</Button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <AddItemModal
          onClose={() => setShowAdd(false)}
          onDone={async () => { setShowAdd(false); await refresh({ silent: true }); }}
        />
      )}

      {restockFor && (
        <RestockItemModal
          item={restockFor}
          onClose={() => setRestockFor(null)}
          onDone={async () => { setRestockFor(null); await refresh({ silent: true }); }}
        />
      )}
    </div>
  );
}

function AddItemModal({ onClose, onDone }) {
  const [item, setItem] = useState("");
  const [category, setCategory] = useState("");
  const [qty, setQty] = useState("");
  const [reorder, setReorder] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    if (!item.trim() || !category.trim()) {
      setErr("Item name and category are required.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      await createStoreItem({ item: item.trim(), category: category.trim(), qty: qty || 0, reorder: reorder || 0 });
      await onDone();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Add store item"
      onClose={onClose}
      footer={<Button onClick={submit} disabled={busy}>{busy ? "Saving…" : "Add item"}</Button>}
    >
      {err && <div style={errBox}>{err}</div>}
      <Field label="Item name">
        <input style={inputStyle} value={item} onChange={(e) => setItem(e.target.value)} placeholder="e.g. Surgical gloves (box of 100)" autoFocus />
      </Field>
      <Field label="Category">
        <input style={inputStyle} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Consumables, PPE, Linen, Equipment" />
      </Field>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <Field label="Opening quantity">
            <input type="number" min="0" style={inputStyle} value={qty} onChange={(e) => setQty(e.target.value)} placeholder="0" />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Reorder threshold">
            <input type="number" min="0" style={inputStyle} value={reorder} onChange={(e) => setReorder(e.target.value)} placeholder="0" />
          </Field>
        </div>
      </div>
    </Modal>
  );
}

function RestockItemModal({ item, onClose, onDone }) {
  const [qty, setQty] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const n = parseInt(qty, 10) || 0;
  const projected = item.qty + n;

  const submit = async () => {
    if (n < 1) {
      setErr("Enter a quantity of at least 1.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      await restockStoreItem(item.id, n);
      await onDone();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title={`Restock — ${item.item}`}
      onClose={onClose}
      footer={<Button onClick={submit} disabled={busy}>{busy ? "Saving…" : "Restock"}</Button>}
    >
      {err && <div style={errBox}>{err}</div>}
      <Field label="Quantity received">
        <input type="number" min="1" style={inputStyle} value={qty} onChange={(e) => setQty(e.target.value)} autoFocus />
      </Field>
      {n > 0 && <div style={{ fontSize: 12, color: "var(--muted)" }}>New quantity: {projected}</div>}
    </Modal>
  );
}

const tableWrap = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, overflow: "auto" };
const th = { textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--muted)", padding: "11px 14px", background: "var(--surface)" };
const td = { padding: "11px 14px", fontSize: 13, verticalAlign: "middle" };
const emptyCell = { padding: "28px 14px", textAlign: "center", color: "var(--muted)", fontSize: 13 };
const lowPill = { fontSize: 11, fontWeight: 500, color: "#B0281F", background: "#F7E4E2", padding: "2px 9px", borderRadius: 999 };
const okPill = { fontSize: 11, fontWeight: 500, color: "#4A6329", background: "#E6EFDF", padding: "2px 9px", borderRadius: 999 };
const errBox = { background: "#F7E9E9", color: "#7A2E2E", fontSize: 12, padding: "8px 11px", borderRadius: 8, marginBottom: 14 };
