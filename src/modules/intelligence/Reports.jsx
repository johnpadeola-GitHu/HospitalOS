import { useEffect, useState } from "react";
import { analytics } from "./analyticsService";

const naira = (n) => "\u20a6" + Math.round(n).toLocaleString();

export default function Reports() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    analytics().then((a) => { if (alive) setData(a); }).catch((e) => console.error(e));
    return () => { alive = false; };
  }, []);

  if (!data) {
    return (
      <div>
        <Head />
        <div style={{ color: "var(--muted)", fontSize: 13 }}>Compiling report…</div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 18 }}>
        <Head />
        <button style={printBtn} onClick={() => window.print()}>Print / export</button>
      </div>

      <div style={sheet}>
        <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--ink-strong)" }}>
            HospitalOS — Operations Report
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>{today}</div>
        </div>

        <Section title="Patient activity">
          <Row label="Registered patients" value={data.kpis.patients} />
          <Row label="Currently admitted" value={data.kpis.admitted} />
          <Row label="Bed occupancy" value={`${data.kpis.occupancy}%`} />
          <Row label="Active ED presentations" value={data.kpis.edActive} />
        </Section>

        <Section title="Diagnostics">
          <Row label="Lab completion rate" value={`${data.kpis.labCompletion}%`} />
          {Object.entries(data.labByStage).map(([k, v]) => (
            <Row key={k} label={`Lab — ${k}`} value={v} sub />
          ))}
          {Object.entries(data.radByModality).map(([k, v]) => (
            <Row key={k} label={`Imaging — ${k}`} value={v} sub />
          ))}
        </Section>

        <Section title="Ward occupancy">
          {data.wards.map((w) => (
            <Row key={w.name} label={w.name} value={`${w.occupied} / ${w.total}`} sub />
          ))}
        </Section>

        <Section title="Emergency dispositions">
          {Object.keys(data.edDispositions).length === 0 ? (
            <Row label="No disposed encounters yet" value="—" sub />
          ) : (
            Object.entries(data.edDispositions).map(([k, v]) => (
              <Row key={k} label={k[0].toUpperCase() + k.slice(1)} value={v} sub />
            ))
          )}
        </Section>

        <Section title="Finance">
          <Row label="Collected" value={naira(data.billing.collected)} />
          <Row label="Outstanding" value={naira(data.billing.outstanding)} />
          <Row label="Total billed" value={naira(data.billing.billed)} />
        </Section>

        <Section title="Pharmacy">
          <Row label="Lines needing reorder" value={data.kpis.lowStock} />
        </Section>
      </div>
    </div>
  );
}

function Head() {
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--muted)" }}>Intelligence</div>
      <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--ink-strong)" }}>Reports</h1>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
        {title}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Row({ label, value, sub }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: "1px solid var(--border)" }}>
      <span style={{ fontSize: 13, color: sub ? "var(--muted)" : "var(--ink)", paddingLeft: sub ? 12 : 0 }}>{label}</span>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: sub ? 400 : 600, color: "var(--ink-strong)" }}>{value}</span>
    </div>
  );
}

const printBtn = { font: "inherit", fontSize: 13, fontWeight: 500, padding: "8px 14px", borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--surface-2)", color: "var(--ink)", cursor: "pointer" };
const sheet = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "22px 24px", maxWidth: 620 };
