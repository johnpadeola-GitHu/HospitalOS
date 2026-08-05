import { useEffect, useState, useCallback } from "react";
import { listReports, submitReport, REPORT_TINT } from "./publicHealthService";
import { PageHeader, Button, Pill } from "../../lib/ui";
import { useAuth } from "../../auth/AuthContext";

export default function Reporting() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await listReports());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const submit = async (id) => {
    setErr("");
    try { await submitReport(id, user); await refresh(); } catch (e) { setErr(e.message); }
  };

  return (
    <div>
      <PageHeader group="Public health" title={<>National reporting</>} icon="FileBarChart"
        subtitle="IDSR and NHMIS submissions — statutory reporting to national health authorities" />

      {err && <div style={errBox}>{err}</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {loading ? <div style={{ color: "var(--muted)", fontSize: 13 }}>Loading…</div> : rows.length === 0 ? <div style={{ color: "var(--muted)", fontSize: 13, padding: "20px 2px" }}>No reports generated yet.</div> : rows.map((r) => {
          const tint = REPORT_TINT[r.status];
          return (
            <div key={r.id} style={card}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink-strong)" }}>{r.form}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{r.period} · due {r.due}</div>
              </div>
              <Pill tone={r.status === "submitted" ? "good" : r.status === "overdue" ? "bad" : "warn"}>{tint.label}</Pill>
              {r.status !== "submitted" && <Button variant="primary" onClick={() => submit(r.id)}>Mark submitted</Button>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const card = { display: "flex", gap: 14, alignItems: "center", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 16px" };
const errBox = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12, padding: "8px 11px", borderRadius: 8, marginBottom: 14 };
