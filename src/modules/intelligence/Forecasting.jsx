import { useEffect, useState } from "react";
import { forecasts } from "./analyticsService";
import { PageHeader } from "../../lib/ui";

const naira = (n) => "\u20a6" + Math.round(n).toLocaleString();

export default function Forecasting() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    forecasts().then((f) => { if (alive) setData(f); }).catch((e) => console.error(e));
    return () => { alive = false; };
  }, []);

  if (!data) {
    return (
      <div>
        <Head />
        <div style={{ color: "var(--muted)", fontSize: 13 }}>Running projections…</div>
      </div>
    );
  }

  const occMax = 100;
  const revMax = Math.max(...data.revenue.map((r) => r.value), 1);

  return (
    <div>
      <Head />

      <div style={note}>
        Projections are illustrative trajectories over current activity, not
        statistical forecasts — intended to surface direction, not precise values.
      </div>

      <div style={panelRow}>
        <div style={panel}>
          <PanelTitle>Bed occupancy — next 7 days</PanelTitle>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140, marginTop: 12 }}>
            {data.occupancy.map((d) => (
              <div key={d.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: d.value >= 90 ? "#A35A2E" : "var(--muted)" }}>
                  {d.value}%
                </div>
                <div style={{ width: "100%", display: "flex", alignItems: "flex-end", height: 100 }}>
                  <div style={{ width: "100%", height: `${(d.value / occMax) * 100}%`, background: d.value >= 90 ? "#A35A2E" : "#2F4A6D", borderRadius: "4px 4px 0 0" }} />
                </div>
                <div style={{ fontSize: 10, color: "var(--muted)" }}>{d.day}</div>
              </div>
            ))}
          </div>
          {data.occupancy.some((d) => d.value >= 90) && (
            <div style={{ fontSize: 12, color: "#A35A2E", marginTop: 10 }}>
              Occupancy trends toward capacity — consider surge planning.
            </div>
          )}
        </div>

        <div style={panel}>
          <PanelTitle>Revenue run-rate — projected</PanelTitle>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140, marginTop: 12 }}>
            {data.revenue.map((r) => (
              <div key={r.week} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ width: "100%", display: "flex", alignItems: "flex-end", height: 110 }}>
                  <div style={{ width: "100%", height: `${(r.value / revMax) * 100}%`, background: "#6B9BD1", borderRadius: "4px 4px 0 0" }} />
                </div>
                <div style={{ fontSize: 10, color: "var(--muted)" }}>{r.week}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 10 }}>
            Projected 30-day revenue:{" "}
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink-strong)", fontWeight: 600 }}>
              {naira(data.projectedMonthlyRevenue)}
            </span>
          </div>
        </div>
      </div>

      <div style={{ ...panelRow, marginTop: 14 }}>
        <RiskCard
          label="Stock-out risk"
          value={data.stockRisk}
          hint={data.stockRisk > 0 ? `${data.stockRisk} line(s) below reorder — restock to avert stockout` : "No lines at risk"}
          danger={data.stockRisk > 0}
        />
        <RiskCard
          label="Outstanding receivables"
          value={naira(data.outstanding)}
          hint={data.outstanding > 0 ? "Follow up to improve collection" : "All settled"}
          danger={data.outstanding > 0}
        />
        <RiskCard
          label="Active ED load"
          value={data.edActive}
          hint={data.edActive >= 3 ? "Elevated — monitor staffing" : "Within normal range"}
          danger={data.edActive >= 3}
        />
      </div>
    </div>
  );
}

function Head() {
  return (
    <PageHeader group="Intelligence" title={<>Forecasting</>} icon="TrendingUp" />
  );
}

function PanelTitle({ children }) {
  return <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-strong)" }}>{children}</div>;
}

function RiskCard({ label, value, hint, danger }) {
  return (
    <div style={{ ...panel, ...(danger ? { borderColor: "#E4B6B2", background: "#FCF4F3" } : null) }}>
      <div style={{ fontSize: 12, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 600, fontFamily: "var(--font-mono)", color: danger ? "#B0281F" : "var(--ink-strong)", margin: "3px 0" }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "var(--muted)" }}>{hint}</div>
    </div>
  );
}

const note = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "var(--muted)", marginBottom: 16 };
const panelRow = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 };
const panel = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px" };
