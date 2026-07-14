import { useEffect, useState } from "react";
import { listDrugs } from "./pharmacyService";

export default function Formulary() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  useEffect(() => {
    let a = true;
    const t = setTimeout(async () => { const d = await listDrugs({ query }); if (a) { setRows(d); setLoading(false); } }, 180);
    return () => { a = false; clearTimeout(t); };
  }, [query]);
  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, color: "var(--muted)" }}>Pharmacy</div>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--ink-strong)" }}>Formulary &amp; NAFDAC</h1>
      </div>
      <div style={{ marginBottom: 14 }}>
        <input style={{ ...input, maxWidth: 280 }} placeholder="Search drug or NAFDAC no." value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <div style={tableWrap}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["Drug", "Form", "NAFDAC no.", "Unit price"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={4} style={emptyCell}>Loading formulary…</td></tr> :
              rows.map((d) => (
                <tr key={d.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ ...td, fontWeight: 500, color: "var(--ink-strong)" }}>{d.name}</td>
                  <td style={{ ...td, color: "var(--muted)" }}>{d.form}</td>
                  <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 12 }}>{d.nafdac}</td>
                  <td style={{ ...td, fontFamily: "var(--font-mono)" }}>₦{d.price}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
const input = { width: "100%", font: "inherit", fontSize: 13, padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--surface-2)", color: "var(--ink)" };
const tableWrap = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" };
const th = { textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--muted)", padding: "11px 14px", background: "var(--surface)" };
const td = { padding: "11px 14px", fontSize: 13, verticalAlign: "middle" };
const emptyCell = { padding: "28px 14px", textAlign: "center", color: "var(--muted)", fontSize: 13 };
