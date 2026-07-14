import { useEffect, useState } from "react";
import { listAudit } from "./sysAdminService";
import { PageHeader } from "../../lib/ui";

function when(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function Security() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    listAudit().then((r) => { if (alive) { setRows(r); setLoading(false); } });
    return () => { alive = false; };
  }, []);

  return (
    <div>
      <PageHeader group="System" title={<>Security &amp; audit</>} icon="ShieldCheck" />

      <div style={tableWrap}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>{["Time", "User", "Action", "Reference"].map((h) => <th key={h} style={th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={emptyCell}>Loading audit log…</td></tr>
            ) : (
              rows.map((a) => (
                <tr key={a.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)" }}>{when(a.at)}</td>
                  <td style={{ ...td, fontWeight: 500, color: "var(--ink-strong)" }}>{a.actor}</td>
                  <td style={td}>{a.action}</td>
                  <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 12 }}>{a.ref}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const tableWrap = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" };
const th = { textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--muted)", padding: "11px 14px", background: "var(--surface)" };
const td = { padding: "11px 14px", fontSize: 13, verticalAlign: "middle" };
const emptyCell = { padding: "28px 14px", textAlign: "center", color: "var(--muted)", fontSize: 13 };
