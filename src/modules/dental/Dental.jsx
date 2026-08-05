import { useEffect, useState, useCallback } from "react";
import { PROCEDURES, listQueue, checkIn, advanceStage, addProcedure, dentalSummary } from "./dentalService";
import { PageHeader, StatCard, Card, Pill, Button, Modal, Field, inputStyle, EmptyState } from "../../lib/ui";
import { useAuth } from "../../auth/AuthContext";
import PatientPicker from "../patients/PatientPicker";

import { naira } from "../../lib/money";
const STAGE_LABEL = { waiting: "Waiting", "in-chair": "In chair", completed: "Completed" };

export default function Dental() {
  const { user } = useAuth();
  const [queue, setQueue] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [procFor, setProcFor] = useState(null);
  const [err, setErr] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [q, s] = await Promise.all([listQueue({}), dentalSummary()]);
      setQueue(q); setSummary(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const act = async (fn, ...args) => {
    setErr("");
    try { await fn(...args); await refresh(); } catch (e) { setErr(e.message); }
  };

  return (
    <div>
      <PageHeader group="Specialty services" title="Dental &amp; oral health" icon="Smile"
        subtitle="Dental clinic queue and procedure log"
        actions={<Button variant="primary" icon="Plus" onClick={() => setShowCheckIn(true)}>Check in patient</Button>} />

      {err && <div style={errBanner}>{err}</div>}

      {summary && (
        <div style={statGrid}>
          <StatCard label="Waiting" value={summary.waiting} />
          <StatCard label="In chair" value={summary.inChair} tone="info" />
          <StatCard label="Completed today" value={summary.completedToday} tone="good" />
        </div>
      )}

      <Card title="Clinic queue" pad={false}>
        {loading ? <div style={{ padding: 20, color: "var(--muted)", fontSize: 13 }}>Loading…</div> : queue.length === 0 ? (
          <div style={{ padding: 22 }}><EmptyState icon="Smile" title="No patients in the queue" /></div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {queue.map((v, i) => (
              <div key={v.id} style={{ ...row, borderTop: i ? "1px solid var(--border)" : "none" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink-strong)" }}>{v.patientName}</span>
                    <Pill tone={v.stage === "waiting" ? "warn" : "info"}>{STAGE_LABEL[v.stage]}</Pill>
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3 }}>
                    {v.ref} &middot; {v.procedures.length} procedure{v.procedures.length !== 1 ? "s" : ""}
                    {v.procedures.length > 0 && ` \u00b7 ${naira(v.procedures.reduce((s, p) => s + p.price, 0))}`}
                  </div>
                  {v.procedures.length > 0 && (
                    <div style={{ fontSize: 12, color: "var(--ink)", marginTop: 3 }}>{v.procedures.map((p) => p.name).join(", ")}</div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {v.stage !== "completed" && <Button onClick={() => setProcFor(v)}>Add procedure</Button>}
                  {v.stage !== "completed" && <Button variant="primary" onClick={() => act(advanceStage, v.id, user)}>
                    {v.stage === "waiting" ? "Call to chair" : "Complete visit"}
                  </Button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showCheckIn && <CheckInModal actor={user} onClose={() => setShowCheckIn(false)} onDone={async () => { setShowCheckIn(false); await refresh(); }} />}
      {procFor && <ProcedureModal visit={procFor} actor={user} onClose={() => setProcFor(null)} onDone={async () => { setProcFor(null); await refresh(); }} />}
    </div>
  );
}

function CheckInModal({ actor, onClose, onDone }) {
  const [patient, setPatient] = useState({ patientId: null, patientName: "", hospitalNo: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setBusy(true); setErr("");
    try { await checkIn({ ...patient, actor }); await onDone(); } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title="Check in patient" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Checking in…" : "Check in"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="Patient"><PatientPicker value={patient} onChange={setPatient} /></Field>
    </Modal>
  );
}

function ProcedureModal({ visit, actor, onClose, onDone }) {
  const [code, setCode] = useState(PROCEDURES[0].code);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setBusy(true); setErr("");
    try { await addProcedure(visit.id, code, actor); await onDone(); } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title={`Add procedure — ${visit.patientName}`} onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Adding…" : "Add"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="Procedure"><select style={inputStyle} value={code} onChange={(e) => setCode(e.target.value)}>{PROCEDURES.map((p) => <option key={p.code} value={p.code}>{p.name} — {naira(p.price)}</option>)}</select></Field>
    </Modal>
  );
}

const statGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 16 };
const row = { display: "flex", gap: 14, padding: "13px 16px", alignItems: "center" };
const errBanner = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 13, padding: "10px 14px", borderRadius: 0, marginBottom: 14 };
const errBox = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12, padding: "8px 11px", borderRadius: 0, marginBottom: 14 };
