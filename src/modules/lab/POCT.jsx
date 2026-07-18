import { useState } from "react";
import { PageHeader } from "../../lib/ui";

const SEED = [
  { id: "pt1", test: "Blood glucose", patient: "Eze, Chibuike", value: "6.2 mmol/L", flag: "normal", by: "Sr. Ade", at: "09:12" },
  { id: "pt2", test: "SpO₂", patient: "Okafor, Adaeze", value: "88%", flag: "low", by: "Dr. Umeh", at: "09:40" },
  { id: "pt3", test: "Urine dipstick", patient: "Bello, Fatima", value: "Protein +", flag: "abnormal", by: "Sr. Ade", at: "10:05" },
  { id: "pt4", test: "Malaria RDT", patient: "Eze, Chibuike", value: "Positive", flag: "abnormal", by: "Dr. Umeh", at: "10:20" },
];
const FLAG = { normal: "#4A6329", low: "#1E5A8A", abnormal: "#A35A2E" };

export default function POCT() {
  const [rows] = useState(SEED);
  return (
    <div>
      <PageHeader group="Diagnostics" title={<>Point of care testing</>} icon="Timer" />
      <div style={tableWrap}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["Time", "Test", "Patient", "Result", "By"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ borderTop: "1px solid var(--border)" }}>
                <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)" }}>{r.at}</td>
                <td style={{ ...td, fontWeight: 500, color: "var(--ink-strong)" }}>{r.test}</td>
                <td style={td}>{r.patient}</td>
                <td style={{ ...td, fontWeight: 600, color: FLAG[r.flag] }}>{r.value}</td>
                <td style={{ ...td, color: "var(--muted)" }}>{r.by}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
const tableWrap = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, overflow: "auto" };
const th = { textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--muted)", padding: "11px 14px", background: "var(--surface)" };
const td = { padding: "11px 14px", fontSize: 13, verticalAlign: "middle" };
