import { useEffect, useState, useCallback } from "react";
import * as Icons from "lucide-react";
import { listSurveillance, logCase, NOTIFIABLE_DISEASES } from "./publicHealthService";
import { PageHeader, Button, Modal, Field, inputStyle, Pill } from "../../lib/ui";
import { useAuth } from "../../auth/AuthContext";

const TREND_ICON = { up: "TrendingUp", down: "TrendingDown", flat: "Minus" };
const TREND_TONE = { up: "warn", down: "good", flat: "muted" };

export default function Surveillance() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLog, setShowLog] = useState(false);
  const [err, setErr] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setRows(await listSurveillance());
    setLoading(false);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  return (
    <div>
      <PageHeader group="Public health" title={<>Disease surveillance</>} icon="Radar"
        subtitle="Weekly notifiable case counts — a notifiable disease trending up raises a hospital-wide alert"
        actions={<Button variant="primary" icon="Plus" onClick={() => setShowLog(true)}>Log case(s)</Button>} />

      {err && <div style={errBox}>{err}</div>}

      {loading ? <div style={{ color: "var(--muted)", fontSize: 13 }}>Loading…</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map((d) => (
            <div key={d.id} style={card}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: "var(--ink-strong)" }}>{d.disease}</span>
                  {d.notifiable && <Pill tone="warn">Notifiable</Pill>}
                </div>
              </div>
              <span style={{ fontSize: 22, fontWeight: 600, fontFamily: "var(--font-mono)", color: "var(--ink-strong)" }}>{d.cases}</span>
              <Pill tone={TREND_TONE[d.trend]}>
                {(() => { const T = Icons[TREND_ICON[d.trend]]; return <T size={12} style={{ marginRight: 3 }} />; })()}
                {d.trend}
              </Pill>
            </div>
          ))}
        </div>
      )}

      {showLog && <LogModal actor={user} onClose={() => setShowLog(false)} onDone={async () => { setShowLog(false); await refresh(); }} />}
    </div>
  );
}

function LogModal({ actor, onClose, onDone }) {
  const [disease, setDisease] = useState(NOTIFIABLE_DISEASES[0]);
  const [customDisease, setCustomDisease] = useState("");
  const [count, setCount] = useState("1");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setBusy(true); setErr("");
    try {
      const finalDisease = disease === "Other notifiable disease" ? customDisease : disease;
      await logCase({ disease: finalDisease, count, notifiable: true, actor });
      await onDone();
    } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title="Log notifiable case(s)" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Logging…" : "Log"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="Disease">
        <select style={inputStyle} value={disease} onChange={(e) => setDisease(e.target.value)}>
          {NOTIFIABLE_DISEASES.map((d) => <option key={d}>{d}</option>)}
        </select>
      </Field>
      {disease === "Other notifiable disease" && (
        <Field label="Disease name"><input style={inputStyle} value={customDisease} onChange={(e) => setCustomDisease(e.target.value)} /></Field>
      )}
      <Field label="Number of new cases"><input type="number" min="1" style={inputStyle} value={count} onChange={(e) => setCount(e.target.value)} /></Field>
    </Modal>
  );
}

const card = { display: "flex", gap: 14, alignItems: "center", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 16px" };
const errBox = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12, padding: "8px 11px", borderRadius: 8, marginBottom: 14 };
