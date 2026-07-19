import { useEffect, useState, useCallback } from "react";
import { listOutreach, planOutreach, completeOutreach } from "./publicHealthService";
import { PageHeader, Button, Modal, Field, inputStyle, Pill } from "../../lib/ui";
import { useAuth } from "../../auth/AuthContext";

const STATUS_TONE = { planned: "info", completed: "good" };

export default function Outreach() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [completeFor, setCompleteFor] = useState(null);
  const [err, setErr] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setRows(await listOutreach());
    setLoading(false);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  return (
    <div>
      <PageHeader group="Public health" title={<>Outreach &amp; community</>} icon="Users"
        subtitle="Community health activities — screenings, antenatal outreach, campaigns"
        actions={<Button variant="primary" icon="Plus" onClick={() => setShowAdd(true)}>Plan activity</Button>} />

      {err && <div style={errBox}>{err}</div>}

      {loading ? <div style={{ color: "var(--muted)", fontSize: 13 }}>Loading…</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map((o) => (
            <div key={o.id} style={card}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink-strong)" }}>{o.activity}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{o.date} · {o.team}{o.status === "completed" ? ` · ${o.reached} reached` : ""}</div>
              </div>
              <Pill tone={STATUS_TONE[o.status]}>{o.status}</Pill>
              {o.status === "planned" && <Button variant="primary" onClick={() => setCompleteFor(o)}>Mark complete</Button>}
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddModal actor={user} onClose={() => setShowAdd(false)} onDone={async () => { setShowAdd(false); await refresh(); }} />}
      {completeFor && <CompleteModal activity={completeFor} actor={user} onClose={() => setCompleteFor(null)} onDone={async () => { setCompleteFor(null); await refresh(); }} />}
    </div>
  );
}

function AddModal({ actor, onClose, onDone }) {
  const [form, setForm] = useState({ activity: "", date: "", team: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true); setErr("");
    try { await planOutreach({ ...form, actor }); await onDone(); } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title="Plan an outreach activity" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Saving…" : "Plan"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="Activity"><input style={inputStyle} value={form.activity} onChange={set("activity")} placeholder="e.g. Rural health screening — Ijaye" /></Field>
      <Field label="Date"><input type="date" style={inputStyle} value={form.date} onChange={set("date")} /></Field>
      <Field label="Team"><input style={inputStyle} value={form.team} onChange={set("team")} placeholder="e.g. Community Health Team A" /></Field>
    </Modal>
  );
}

function CompleteModal({ activity, actor, onClose, onDone }) {
  const [reached, setReached] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setBusy(true); setErr("");
    try { await completeOutreach(activity.id, reached, actor); await onDone(); } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title={`Complete — ${activity.activity}`} onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Saving…" : "Mark complete"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="People reached"><input type="number" min="0" style={inputStyle} value={reached} onChange={(e) => setReached(e.target.value)} /></Field>
    </Modal>
  );
}

const card = { display: "flex", gap: 14, alignItems: "center", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 16px" };
const errBox = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12, padding: "8px 11px", borderRadius: 8, marginBottom: 14 };
