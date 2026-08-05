import { useState } from "react";
import { CALCULATORS, CONVERSIONS, convert, CRITICAL_VALUES, SPECIMEN_GUIDE } from "./utilitiesService";
import { PageHeader, Card, inputStyle } from "../../lib/ui";

export default function LabUtilities() {
  const [tab, setTab] = useState("calc");
  return (
    <div>
      <PageHeader group="Diagnostics" title="Lab utilities" icon="Calculator"
        subtitle="Calculators, converters, and bench reference material" />
      <div style={tabs}>
        {[["calc", "Calculators"], ["conv", "Converters"], ["crit", "Critical values"], ["spec", "Specimen guide"]].map(([id, l]) => (
          <button key={id} onClick={() => setTab(id)} style={{ ...tabBtn, ...(tab === id ? tabActive : null) }}>{l}</button>
        ))}
      </div>
      {tab === "calc" && <Calculators />}
      {tab === "conv" && <Converters />}
      {tab === "crit" && <CriticalTable />}
      {tab === "spec" && <SpecimenTable />}
    </div>
  );
}

function Calculators() {
  const [sel, setSel] = useState(CALCULATORS[0].key);
  const calc = CALCULATORS.find((c) => c.key === sel);
  const [vals, setVals] = useState({});
  const set = (k) => (e) => setVals((v) => ({ ...v, [k]: e.target.value }));

  const result = calc.fn(vals);
  const display = result && typeof result === "object"
    ? Object.entries(result).map(([k, v]) => `${k}: ${v}`).join(" · ")
    : result;

  const fieldMeta = {
    age: { label: "Age", unit: "years" }, weightKg: { label: "Weight", unit: "kg" },
    heightCm: { label: "Height", unit: "cm" }, creatinineUmol: { label: "Creatinine", unit: "\u00b5mol/L" },
    sex: { label: "Sex", select: ["M", "F"] }, na: { label: "Sodium", unit: "mmol/L" },
    k: { label: "Potassium", unit: "mmol/L" }, cl: { label: "Chloride", unit: "mmol/L" },
    hco3: { label: "Bicarbonate", unit: "mmol/L" }, calciumMmol: { label: "Calcium", unit: "mmol/L" },
    albuminGL: { label: "Albumin", unit: "g/L" },
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 14 }}>
      <Card pad={false}>
        {CALCULATORS.map((c, i) => (
          <button key={c.key} onClick={() => { setSel(c.key); setVals({}); }}
            style={{ ...calcRow, ...(sel === c.key ? calcActive : null), borderTop: i ? "1px solid var(--border)" : "none" }}>
            {c.label}
          </button>
        ))}
      </Card>
      <Card title={calc.label}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 16 }}>
          {calc.fields.map((f) => {
            const meta = fieldMeta[f];
            return (
              <label key={f}>
                <span style={fieldLabel}>{meta.label}{meta.unit ? ` (${meta.unit})` : ""}</span>
                {meta.select ? (
                  <select style={inputStyle} value={vals[f] || meta.select[0]} onChange={set(f)}>
                    {meta.select.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <input style={inputStyle} type="number" value={vals[f] || ""} onChange={set(f)} />
                )}
              </label>
            );
          })}
        </div>
        <div style={resultBox}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Result</div>
          <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "var(--font-mono)", color: display != null ? "var(--ink-strong)" : "var(--muted)", marginTop: 4 }}>
            {display != null ? display : "\u2014"}
            {display != null && typeof result !== "object" && <span style={{ fontSize: 13, fontWeight: 500, color: "var(--muted)" }}> {calc.unit}</span>}
          </div>
        </div>
      </Card>
    </div>
  );
}

function Converters() {
  const [key, setKey] = useState("glucose");
  const [val, setVal] = useState("");
  const c = CONVERSIONS[key];
  const out = convert(key, val);
  return (
    <Card title="Unit converter">
      <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
        <label style={{ minWidth: 200 }}>
          <span style={fieldLabel}>Analyte</span>
          <select style={inputStyle} value={key} onChange={(e) => { setKey(e.target.value); setVal(""); }}>
            {Object.entries(CONVERSIONS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </label>
        <label style={{ width: 140 }}>
          <span style={fieldLabel}>{c.from}</span>
          <input style={inputStyle} type="number" value={val} onChange={(e) => setVal(e.target.value)} />
        </label>
        <div style={{ fontSize: 20, color: "var(--muted)", paddingBottom: 8 }}>=</div>
        <div style={convResult}>
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--ink-strong)" }}>
            {out != null ? out : "\u2014"}
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>{c.to}</div>
        </div>
      </div>
    </Card>
  );
}

function CriticalTable() {
  return (
    <Card title="Critical value quick reference" pad={false}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr>{["Analyte", "Low", "High", "Action"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
        <tbody>
          {CRITICAL_VALUES.map((c) => (
            <tr key={c.analyte} style={{ borderTop: "1px solid var(--border)" }}>
              <td style={{ ...td, fontWeight: 600, color: "var(--ink-strong)" }}>{c.analyte}</td>
              <td style={{ ...td, color: "var(--info)", fontFamily: "var(--font-mono)", fontSize: 12 }}>{c.low}</td>
              <td style={{ ...td, color: "var(--bad)", fontFamily: "var(--font-mono)", fontSize: 12 }}>{c.high}</td>
              <td style={{ ...td, color: "var(--muted)" }}>{c.action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function SpecimenTable() {
  return (
    <Card title="Specimen tube guide" pad={false}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr>{["Tube", "Used for"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
        <tbody>
          {SPECIMEN_GUIDE.map((s) => (
            <tr key={s.tube} style={{ borderTop: "1px solid var(--border)" }}>
              <td style={{ ...td, fontWeight: 600, color: "var(--ink-strong)" }}>{s.tube}</td>
              <td style={{ ...td, color: "var(--ink)" }}>{s.uses}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

const tabs = { display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" };
const tabBtn = { font: "inherit", fontSize: 12.5, fontWeight: 600, padding: "6px 13px", borderRadius: 0, border: "1px solid var(--border-strong)", background: "var(--surface-2)", color: "var(--muted)", cursor: "pointer" };
const tabActive = { background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" };
const calcRow = { width: "100%", textAlign: "left", padding: "10px 13px", fontSize: 12.5, fontWeight: 500, color: "var(--ink)", background: "none", border: "none", cursor: "pointer", font: "inherit" };
const calcActive = { background: "var(--charcoal-bg)", color: "var(--charcoal-strong)", fontWeight: 700 };
const fieldLabel = { display: "block", fontSize: 11, fontWeight: 600, color: "var(--muted)", marginBottom: 4 };
const resultBox = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 0, padding: "14px 16px" };
const convResult = { background: "var(--charcoal-bg)", borderRadius: 0, padding: "8px 16px", minWidth: 100 };
const th = { textAlign: "left", fontSize: 10.5, fontWeight: 700, color: "var(--muted)", padding: "10px 14px", background: "var(--surface)", textTransform: "uppercase", letterSpacing: "0.05em" };
const td = { padding: "10px 14px", fontSize: 12.5, verticalAlign: "top" };
