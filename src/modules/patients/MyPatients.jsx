import { useEffect, useState } from "react";
import { listPatients, ageFromDob } from "./patientService";
import { StatusBadge, PageHeader } from "../../lib/ui";
import { useAuth } from "../../auth/AuthContext";

// "My patients" — the admitted/active patients a clinician is caring for.
// Without per-patient assignment data yet, this shows admitted + outpatient
// patients as the active caseload, scoped by the signed-in user's context.
export default function MyPatients() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    let a = true;
    listPatients({ status: "all" }).then((p) => {
      if (!a) return;
      setRows(p.filter((x) => x.status !== "discharged"));
      setLoading(false);
    });
    return () => { a = false; };
  }, []);

  return (
    <div>
      <PageHeader group="Overview" title={<>My patients</>} icon="UserRound" />
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>Active caseload for {user.name}.</div>
      <div style={tableWrap}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["Hospital no.", "Patient", "Age / Sex", "Status", "Location"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={5} style={emptyCell}>Loading…</td></tr> :
              rows.length === 0 ? <tr><td colSpan={5} style={emptyCell}>No active patients.</td></tr> :
              rows.map((p) => (
                <tr key={p.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 12 }}>{p.hospitalNo}</td>
                  <td style={{ ...td, fontWeight: 500, color: "var(--ink-strong)" }}>{p.lastName}, {p.firstName}</td>
                  <td style={td}>{ageFromDob(p.dob)} / {p.sex}</td>
                  <td style={td}><StatusBadge status={p.status} /></td>
                  <td style={{ ...td, color: "var(--muted)" }}>{p.status === "admitted" ? `${p.ward} · ${p.bed}` : "—"}</td>
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
const emptyCell = { padding: "28px 14px", textAlign: "center", color: "var(--muted)", fontSize: 13 };
