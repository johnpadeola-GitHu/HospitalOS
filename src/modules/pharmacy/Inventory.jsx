import { useEffect, useState, useCallback } from "react";
import { listDrugs, restock } from "./pharmacyService";
import { Button, Modal, Field, inputStyle } from "../../lib/ui";

const STOCK_TINT = {
  ok: { bg: "#E6EFDF", fg: "#4A6329", label: "In stock" },
  low: { bg: "#FBF0DC", fg: "#8A5A17", label: "Low" },
  out: { bg: "#F7E4E2", fg: "#B0281F", label: "Out" },
};

export default function Inventory() {
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [onlyLow, setOnlyLow] = useState(false);
  const [restockFor, setRestockFor] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setDrugs(await listDrugs({ query, onlyLow }));
    setLoading(false);
  }, [query, onlyLow]);

  useEffect(() => {
    const t = setTimeout(refresh, 180);
    return () => clearTimeout(t);
  }, [refresh]);

  const lowCount = drugs.filter((d) => d.state !== "ok").length;

  return (
    <div>
      <div style={header}>
        <div>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>Pharmacy</div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--ink-strong)" }}>Drug inventory</h1>
        </div>
      </div>

      <div style={toolbar}>
        <input
          style={{ ...inputStyle, maxWidth: 280 }}
          placeholder="Search drug or NAFDAC no."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <label style={toggle}>
          <input type="checkbox" checked={onlyLow} onChange={(e) => setOnlyLow(e.target.checked)} />
          Needs reorder only
        </label>
      </div>

      {onlyLow && !loading && lowCount === 0 && (
        <div style={clearBanner}>All stock is above reorder level. No drugs need reordering.</div>
      )}

      <div style={tableWrap}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Drug", "NAFDAC", "Stock", "Reorder at", "Status", ""].map((h) => (
                <th key={h} style={th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={emptyCell}>
                  Loading inventory…
                </td>
              </tr>
            ) : drugs.length === 0 ? (
              <tr>
                <td colSpan={6} style={emptyCell}>
                  No drugs match.
                </td>
              </tr>
            ) : (
              drugs.map((d) => {
                const tint = STOCK_TINT[d.state];
                return (
                  <tr key={d.id} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ ...td, fontWeight: 500, color: "var(--ink-strong)" }}>
                      {d.name}
                      <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 400 }}>{d.form}</div>
                    </td>
                    <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 12 }}>{d.nafdac}</td>
                    <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 13 }}>
                      {d.stock.toLocaleString()}
                    </td>
                    <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--muted)" }}>
                      {d.reorder.toLocaleString()}
                    </td>
                    <td style={td}>
                      <span
                        style={{
                          background: tint.bg,
                          color: tint.fg,
                          fontSize: 11,
                          fontWeight: 500,
                          padding: "2px 9px",
                          borderRadius: 999,
                        }}
                      >
                        {tint.label}
                      </span>
                    </td>
                    <td style={{ ...td, textAlign: "right" }}>
                      <Button variant={d.state !== "ok" ? "primary" : "secondary"} onClick={() => setRestockFor(d)}>
                        Restock
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {restockFor && (
        <RestockModal
          drug={restockFor}
          onClose={() => setRestockFor(null)}
          onDone={async () => {
            setRestockFor(null);
            await refresh();
          }}
        />
      )}
    </div>
  );
}

function RestockModal({ drug, onClose, onDone }) {
  const [qty, setQty] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const n = parseInt(qty, 10) || 0;
  const projected = drug.stock + n;
  const clears = drug.state !== "ok" && projected > drug.reorder;

  const submit = async () => {
    if (n < 1) {
      setErr("Enter a quantity of at least 1.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      await restock(drug.id, n);
      await onDone();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title={`Restock — ${drug.name}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={busy || n < 1}>
            {busy ? "Adding…" : "Add stock"}
          </Button>
        </>
      }
    >
      {err && <div style={errBox}>{err}</div>}
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>
        {drug.nafdac} · current stock {drug.stock.toLocaleString()} · reorder at {drug.reorder.toLocaleString()}
      </div>

      <Field label="Quantity received">
        <input type="number" min="1" style={inputStyle} value={qty} onChange={(e) => setQty(e.target.value)} autoFocus />
      </Field>

      {n > 0 && (
        <div style={{ fontSize: 13, marginTop: 4 }}>
          <span style={{ color: "var(--muted)" }}>New stock level: </span>
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500, color: "var(--ink-strong)" }}>
            {projected.toLocaleString()}
          </span>
          {clears && (
            <div style={{ fontSize: 12, color: "#4A6329", marginTop: 6 }}>
              This clears the reorder alert for this drug.
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

const header = { display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 18 };
const toolbar = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 14,
  flexWrap: "wrap",
};
const toggle = { display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "var(--muted)", cursor: "pointer" };
const clearBanner = {
  background: "#E6EFDF",
  color: "#4A6329",
  fontSize: 13,
  padding: "10px 14px",
  borderRadius: 10,
  marginBottom: 14,
};
const tableWrap = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" };
const th = {
  textAlign: "left",
  fontSize: 11,
  fontWeight: 600,
  color: "var(--muted)",
  padding: "11px 14px",
  background: "var(--surface)",
};
const td = { padding: "11px 14px", fontSize: 13, verticalAlign: "middle" };
const emptyCell = { padding: "28px 14px", textAlign: "center", color: "var(--muted)", fontSize: 13 };
const errBox = {
  background: "#F7E9E9",
  color: "#7A2E2E",
  fontSize: 12,
  padding: "8px 11px",
  borderRadius: 8,
  marginBottom: 14,
};
