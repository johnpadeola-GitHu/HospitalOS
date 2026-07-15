import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { diagnosticSummary, turnaroundReport, positivityReport } from "./diagnosticIntelService";
import { PageHeader, StatCard, Card, EmptyState } from "../../lib/ui";

export default function DiagnosticIntel() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    Promise.all([diagnosticSummary(), turnaroundReport(), positivityReport()]).then(([sum, tat, pos]) => {
      if (alive) setData({ sum, tat, pos });
    });
    return () => { alive = false; };
  }, []);

  if (!data) {
    return (<div><PageHeader group="Diagnostics" title="Diagnostic intelligence" icon="Brain" /><div style={{ color: "var(--muted)", fontSize: 13 }}>Compiling…</div></div>);
  }
  const { sum, tat, pos } = data;

  return (
    <div>
      <PageHeader group="Diagnostics" title="Diagnostic intelligence" icon="Brain"
        subtitle="Cross-diagnostic analytics across Laboratory, Radiology, and Blood Bank" />

      <div style={statGrid}>
        <StatCard label="Lab completion" value={sum.labCompletionPct + "%"} tone={sum.labCompletionPct >= 70 ? "good" : "warn"} sub={`${sum.labVerified}/${sum.labTotal} verified`} />
        <StatCard label="Lab pending" value={sum.labPending} sub="orders in pipeline" />
        <StatCard label="Imaging reported" value={sum.radReported} sub={`of ${sum.radTotal} studies`} />
        <StatCard label="Blood requests" value={sum.bloodRequests} sub="crossmatch to date" />
        <StatCard label="Catalogue" value={sum.catalogueSize} sub="tests offered" tone="accent" />
      </div>

      <div style={row2}>
        <Card title="Most-ordered tests">
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sum.topTests} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "var(--muted)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10, fill: "var(--ink)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tip} />
                <Bar dataKey="n" radius={[0, 4, 4, 0]} fill="var(--chart-2)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Orders by department">
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {sum.byDept.map((d) => {
              const max = Math.max(...sum.byDept.map((x) => x.n), 1);
              return (
                <div key={d.dept}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 3 }}>
                    <span style={{ color: "var(--ink)" }}>{d.dept}</span>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>{d.n}</span>
                  </div>
                  <div style={track}><div style={{ ...fill, width: `${(d.n / max) * 100}%` }} /></div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div style={{ marginTop: 14 }}>
        <Card title="Turnaround performance — declared vs. actual" pad={false}>
          {tat.length === 0 ? <div style={{ padding: 22 }}><EmptyState icon="Clock" title="No resulted orders yet" /></div> : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["Test", "Declared TAT", "Actual (avg)", "Samples"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {tat.map((t) => (
                  <tr key={t.code} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ ...td, fontWeight: 600, color: "var(--ink-strong)" }}>{t.name}</td>
                    <td style={{ ...td, color: "var(--muted)" }}>{t.declaredTat}</td>
                    <td style={{ ...td, fontFamily: "var(--font-mono)" }}>{t.actualMinutes} min</td>
                    <td style={{ ...td, fontFamily: "var(--font-mono)", color: "var(--muted)" }}>{t.n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <div style={{ marginTop: 14 }}>
        <Card title="Positivity rates — qualitative screens" pad={false}>
          {pos.length === 0 ? <div style={{ padding: 22 }}><EmptyState icon="Percent" title="No qualitative results yet" /></div> : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["Test", "Tested", "Positive", "Rate"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {pos.map((p) => (
                  <tr key={p.code} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ ...td, fontWeight: 600, color: "var(--ink-strong)" }}>{p.name}</td>
                    <td style={{ ...td, fontFamily: "var(--font-mono)" }}>{p.tested}</td>
                    <td style={{ ...td, fontFamily: "var(--font-mono)" }}>{p.positive}</td>
                    <td style={{ ...td, fontFamily: "var(--font-mono)", fontWeight: 700, color: p.ratePct > 20 ? "var(--warn)" : "var(--ink)" }}>{p.ratePct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}

const statGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 16 };
const row2 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 };
const track = { height: 7, borderRadius: 999, background: "var(--surface)", overflow: "hidden" };
const fill = { height: "100%", borderRadius: 999, background: "var(--chart-1)" };
const tip = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, boxShadow: "var(--shadow)" };
const th = { textAlign: "left", fontSize: 10.5, fontWeight: 700, color: "var(--muted)", padding: "10px 14px", background: "var(--surface)", textTransform: "uppercase", letterSpacing: "0.05em" };
const td = { padding: "10px 14px", fontSize: 12.5, verticalAlign: "middle" };
