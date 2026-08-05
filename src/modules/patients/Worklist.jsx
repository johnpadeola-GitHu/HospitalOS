import { useEffect, useState } from "react";
import { listOrders } from "../lab/labService";
import { listStudies } from "../radiology/radiologyService";
import { listRequests as listBloodRequests } from "../blood-bank/bloodBankService";
import { PageHeader } from "../../lib/ui";

// Worklist — outstanding diagnostic and clinical tasks across the hospital,
// the cross-cutting "what needs doing" view. Covers laboratory (all
// disciplines, including histopathology/cytology, which flow through lab
// orders), radiology, and blood-bank transfusion requests awaiting action.
export default function Worklist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let a = true;
    Promise.all([
      listOrders({ status: "all" }),
      listStudies({}),
      listBloodRequests({ includeCompleted: false }).catch(() => []),
    ])
      .then(([orders, studies, bloodRequests]) => {
        if (!a) return;
        const labTasks = orders.filter((o) => o.status !== "verified").map((o) => ({
          id: "lab-" + o.id, area: "Laboratory", ref: o.accession, patient: o.patientName, task: o.testName, state: o.status,
        }));
        const radTasks = studies.filter((s) => s.status !== "reported").map((s) => ({
          id: "rad-" + s.id, area: "Radiology", ref: s.accession, patient: s.patientName, task: s.name, state: s.status,
        }));
        // Transfusion requests that aren't yet transfused are outstanding
        // tasks — crossmatch, issue, or complete. listRequests already
        // excludes completed ('transfused') requests.
        const bloodTasks = (bloodRequests || []).map((r) => ({
          id: "blood-" + r.id, area: "Blood Bank", ref: r.ref, patient: r.patientName,
          task: `Transfusion — ${r.recipientGroup}`, state: r.status,
        }));
        setItems([...labTasks, ...radTasks, ...bloodTasks]);
      })
      .catch((e) => console.error(e))
      .finally(() => { if (a) setLoading(false); });
    return () => { a = false; };
  }, []);

  return (
    <div>
      <PageHeader group="Overview" title={<>Worklist</>} icon="ListChecks" />
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>Outstanding diagnostic tasks across the hospital.</div>
      <div style={tableWrap}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["Area", "Ref", "Patient", "Task", "State"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={5} style={emptyCell}>Loading worklist…</td></tr> :
              items.length === 0 ? <tr><td colSpan={5} style={emptyCell}>Nothing outstanding — all diagnostics complete.</td></tr> :
              items.map((i) => (
                <tr key={i.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={td}><span style={areaPill}>{i.area}</span></td>
                  <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 12 }}>{i.ref}</td>
                  <td style={{ ...td, fontWeight: 500, color: "var(--ink-strong)" }}>{i.patient}</td>
                  <td style={td}>{i.task}</td>
                  <td style={{ ...td, color: "var(--muted)", textTransform: "capitalize" }}>{i.state}</td>
                </tr>
              ))}
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
const areaPill = { fontSize: 11, fontWeight: 500, color: "#1E3350", background: "#D3E1F8", padding: "2px 9px", borderRadius: 999 };
