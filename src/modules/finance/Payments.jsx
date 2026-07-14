import { useEffect, useState } from "react";
import { listPayments, billingSummary } from "./billingService";

const naira = (n) => "\u20a6" + Math.round(n).toLocaleString();

function when(iso) {
  return new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([listPayments(), billingSummary()]).then(([p, s]) => {
      if (!alive) return;
      setPayments(p);
      setSummary(s);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, color: "var(--muted)" }}>Finance &amp; trade</div>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--ink-strong)" }}>Payments &amp; cashiering</h1>
      </div>

      {summary && (
        <div style={statRow}>
          <Stat label="Collected" value={naira(summary.collected)} />
          <Stat label="Outstanding" value={naira(summary.outstanding)} accent={summary.outstanding > 0} />
          <Stat label="Receipts" value={payments.length} />
        </div>
      )}

      <div style={tableWrap}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Receipt", "Patient", "Method", "When", "Amount"].map((h) => (
                <th key={h} style={{ ...th, textAlign: h === "Amount" ? "right" : "left" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={emptyCell}>
                  Loading payments…
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={5} style={emptyCell}>
                  No payments recorded yet. Take a payment from Billing to see it here.
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.receipt} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 12 }}>{p.receipt}</td>
                  <td style={{ ...td, fontWeight: 500, color: "var(--ink-strong)" }}>
                    {p.patientName}
                    <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-mono)", fontWeight: 400 }}>
                      {p.hospitalNo}
                    </div>
                  </td>
                  <td style={td}>
                    <span style={methodPill}>{p.method}</span>
                  </td>
                  <td style={{ ...td, color: "var(--muted)", fontSize: 12 }}>{when(p.at)}</td>
                  <td style={{ ...td, textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 600, color: "#4A6329" }}>
                    {naira(p.amount)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div style={statCard}>
      <div style={{ fontSize: 12, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600, fontFamily: "var(--font-mono)", color: accent ? "#8A5A17" : "var(--ink-strong)", marginTop: 2 }}>
        {value}
      </div>
    </div>
  );
}

const statRow = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 18 };
const statCard = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px" };
const tableWrap = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" };
const th = { fontSize: 11, fontWeight: 600, color: "var(--muted)", padding: "11px 14px", background: "var(--surface)" };
const td = { padding: "11px 14px", fontSize: 13, verticalAlign: "middle" };
const emptyCell = { padding: "28px 14px", textAlign: "center", color: "var(--muted)", fontSize: 13 };
const methodPill = { fontSize: 11, fontWeight: 500, color: "var(--ink)", background: "var(--surface)", padding: "2px 9px", borderRadius: 999 };
