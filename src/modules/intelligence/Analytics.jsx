import { useEffect, useState } from "react";
import { analytics } from "./analyticsService";
import { PageHeader } from "../../lib/ui";

import { naira } from "../../lib/money";

export default function Analytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    analytics().then((d) => { if (alive) setData(d); }).catch((e) => console.error(e));
    return () => {
      alive = false;
    };
  }, []);

  if (!data) {
    return (
      <div>
        <Head />
        <div style={{ color: "var(--muted)", fontSize: 13 }}>Computing analytics…</div>
      </div>
    );
  }

  const k = data.kpis;

  return (
    <div>
      <Head />

      <div style={kpiGrid}>
        <Kpi label="Total patients" value={k.patients} />
        <Kpi label="Admitted" value={k.admitted} />
        <Kpi label="Bed occupancy" value={`${k.occupancy}%`} />
        <Kpi label="Lab completion" value={`${k.labCompletion}%`} />
        <Kpi label="ED active" value={k.edActive} />
        <Kpi label="Revenue collected" value={naira(k.revenue)} />
        <Kpi label="Outstanding" value={naira(k.outstanding)} warn={k.outstanding > 0} />
        <Kpi label="Low-stock drugs" value={k.lowStock} warn={k.lowStock > 0} />
      </div>

      <div style={panelGrid}>
        <Panel title="Ward occupancy">
          <BarList
            items={data.wards.map((w) => ({
              label: w.name,
              value: w.occupied,
              max: w.total,
              caption: `${w.occupied}/${w.total}`,
            }))}
          />
        </Panel>

        <Panel title="Lab orders by stage">
          <BarList
            items={["ordered", "collected", "resulted", "verified"].map((s) => ({
              label: s[0].toUpperCase() + s.slice(1),
              value: data.labByStage[s] || 0,
              max: Math.max(1, ...Object.values(data.labByStage)),
              caption: String(data.labByStage[s] || 0),
            }))}
          />
        </Panel>

        <Panel title="Radiology by modality">
          {Object.keys(data.radByModality).length === 0 ? (
            <Empty />
          ) : (
            <BarList
              items={Object.entries(data.radByModality).map(([m, n]) => ({
                label: m,
                value: n,
                max: Math.max(1, ...Object.values(data.radByModality)),
                caption: String(n),
              }))}
            />
          )}
        </Panel>

        <Panel title="ED dispositions">
          {Object.keys(data.edDispositions).length === 0 ? (
            <Empty />
          ) : (
            <BarList
              items={Object.entries(data.edDispositions).map(([d, n]) => ({
                label: d[0].toUpperCase() + d.slice(1),
                value: n,
                max: Math.max(1, ...Object.values(data.edDispositions)),
                caption: String(n),
              }))}
            />
          )}
        </Panel>
      </div>

      <div style={{ ...panel, marginTop: 14 }}>
        <div style={panelTitle}>Revenue</div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <Money label="Billed" value={data.billing.billed} />
          <Money label="Collected" value={data.billing.collected} accent="#4A6329" />
          <Money label="Outstanding" value={data.billing.outstanding} accent="#8A5A17" />
        </div>
      </div>
    </div>
  );
}

function Head() {
  return (
    <PageHeader group="Intelligence" title={<>Analytics &amp; KPIs</>} icon="ChartLine" />
  );
}

function Kpi({ label, value, warn }) {
  return (
    <div style={kpiCard}>
      <div style={{ fontSize: 12, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600, fontFamily: "var(--font-mono)", color: warn ? "#8A5A17" : "var(--ink-strong)", marginTop: 2 }}>
        {value}
      </div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div style={panel}>
      <div style={panelTitle}>{title}</div>
      {children}
    </div>
  );
}

function BarList({ items }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      {items.map((it, i) => {
        const pct = it.max ? Math.round((it.value / it.max) * 100) : 0;
        return (
          <div key={i}>
            <div style={barRow}>
              <span style={{ color: "var(--ink)" }}>{it.label}</span>
              <span style={{ color: "var(--muted)", fontSize: 12, fontFamily: "var(--font-mono)" }}>{it.caption}</span>
            </div>
            <div style={barTrack}>
              <div style={{ ...barFill, width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Money({ label, value, accent }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 600, fontFamily: "var(--font-mono)", color: accent || "var(--ink-strong)" }}>
        {naira(value)}
      </div>
    </div>
  );
}

function Empty() {
  return <div style={{ fontSize: 13, color: "var(--muted)" }}>No data yet.</div>;
}

const kpiGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 16 };
const kpiCard = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "13px 15px" };
const panelGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14, alignItems: "start" };
const panel = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px" };
const panelTitle = { fontWeight: 600, fontSize: 14, color: "var(--ink-strong)", marginBottom: 12 };
const barRow = { display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 };
const barTrack = { height: 6, borderRadius: 999, background: "var(--surface)", overflow: "hidden" };
const barFill = { height: "100%", borderRadius: 999, background: "#2F4A6D" };
