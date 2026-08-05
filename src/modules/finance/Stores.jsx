import { useEffect, useState } from "react";
import { listStores } from "./procurementService";
import { PageHeader } from "../../lib/ui";

export default function Stores() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let a = true;
    listStores()
      .then((r) => { if (a) setRows(r); })
      .catch((e) => console.error(e))
      .finally(() => { if (a) setLoading(false); });
    return () => { a = false; };
  }, []);
  return (
    <div>
      <PageHeader group="Finance & trade" title={<>Stores &amp; assets</>} icon="Boxes" />
      <div style={tableWrap}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["Item", "Category", "Quantity", "Reorder at", "Status"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={5} style={emptyCell}>Loading…</td></tr> :
              rows.length === 0 ? (
              <tr><td colSpan={5} style={emptyCell}>Nothing here yet.</td></tr>
            ) : (
              rows.map((s) => (
                <tr key={s.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ ...td, fontWeight: 500, color: "var(--ink-strong)" }}>{s.item}</td>
                  <td style={{ ...td, color: "var(--muted)" }}>{s.category}</td>
                  <td style={{ ...td, fontFamily: "var(--font-mono)", color: s.low ? "#B0281F" : "var(--ink)" }}>{s.qty}</td>
                  <td style={{ ...td, fontFamily: "var(--font-mono)", color: "var(--muted)" }}>{s.reorder}</td>
                  <td style={td}>{s.low ? <span style={lowPill}>Reorder</span> : <span style={okPill}>OK</span>}</td>
                </tr>
              )))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
const tableWrap = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 0, overflow: "auto" };
const th = { textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--muted)", padding: "11px 14px", background: "var(--surface)" };
const td = { padding: "11px 14px", fontSize: 13, verticalAlign: "middle" };
const emptyCell = { padding: "28px 14px", textAlign: "center", color: "var(--muted)", fontSize: 13 };
const lowPill = { fontSize: 11, fontWeight: 500, color: "#B0281F", background: "#F7E4E2", padding: "2px 9px", borderRadius: 0 };
const okPill = { fontSize: 11, fontWeight: 500, color: "#4A6329", background: "#E6EFDF", padding: "2px 9px", borderRadius: 0 };
