import { useEffect, useState, useCallback } from "react";
import { listRehab, logSession } from "./rehabService";
import { Button, PageHeader } from "../../lib/ui";

export default function Rehab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await listRehab());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  const log = async (id) => { setErr(""); try { await logSession(id); await refresh(); } catch (e) { setErr(e.message); } };
  return (
    <div>
      <PageHeader group="Patient care" title={<>Rehabilitation &amp; therapy</>} icon="Accessibility" />
      {err && <div style={errBanner}>{err}</div>}
      {loading ? <div style={{ color: "var(--muted)", fontSize: 13 }}>Loading referrals…</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map((r) => (
            <div key={r.id} style={card}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 14, color: "var(--ink-strong)" }}>{r.patientName}</div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{r.therapy} · {r.reason}</div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6, fontFamily: "var(--font-mono)" }}>session {r.sessionsDone}/{r.sessionsPlanned}</div>
              </div>
              <div style={{ alignSelf: "center" }}>
                {r.complete ? <span style={donePill}>Complete</span> : <Button onClick={() => log(r.id)}>Log session</Button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
const card = { display: "flex", gap: 14, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 16px" };
const donePill = { fontSize: 11, fontWeight: 500, color: "#4A6329", background: "#E6EFDF", padding: "2px 9px", borderRadius: 999 };
const errBanner = { background: "#F7E9E9", color: "#7A2E2E", fontSize: 13, padding: "10px 14px", borderRadius: 10, marginBottom: 14 };
