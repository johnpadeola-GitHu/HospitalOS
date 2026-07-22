import { useEffect, useState, useCallback } from "react";
import { STATUS_TONE, listRequests, requestVisit, advanceRequest, chaplaincySummary } from "./chaplaincyService";
import { PageHeader, StatCard, Card, Pill, Button, Modal, Field, inputStyle, EmptyState } from "../../lib/ui";
import { useAuth } from "../../auth/AuthContext";
import PatientPicker from "../patients/PatientPicker";

const NEXT_LABEL = { requested: "Schedule visit", scheduled: "Mark completed" };

export default function Chaplaincy() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRequest, setShowRequest] = useState(false);
  const [err, setErr] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([listRequests({}), chaplaincySummary()]);
      setRequests(r); setSummary(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const advance = async (id) => {
    setErr("");
    try { await advanceRequest(id, user); await refresh(); } catch (e) { setErr(e.message); }
  };

  return (
    <div>
      <PageHeader group="Specialty services" title="Chaplaincy &amp; pastoral care" icon="Church"
        subtitle="Patient and family visit requests, routed to a chaplain"
        actions={<Button variant="primary" icon="Plus" onClick={() => setShowRequest(true)}>Request visit</Button>} />

      {err && <div style={errBanner}>{err}</div>}

      {summary && (
        <div style={statGrid}>
          <StatCard label="Awaiting scheduling" value={summary.requested} tone="warn" />
          <StatCard label="Scheduled" value={summary.scheduled} tone="info" />
        </div>
      )}

      <Card title="Visit requests" pad={false}>
        {loading ? <div style={{ padding: 20, color: "var(--muted)", fontSize: 13 }}>Loading…</div> : requests.length === 0 ? (
          <div style={{ padding: 22 }}><EmptyState icon="Church" title="No visit requests" /></div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {requests.map((r, i) => (
              <div key={r.id} style={{ ...row, borderTop: i ? "1px solid var(--border)" : "none" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink-strong)" }}>{r.patientName}</span>
                    <Pill tone="muted">{r.faithPreference}</Pill>
                    <Pill tone={STATUS_TONE[r.status]}>{r.status}</Pill>
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3 }}>{r.ward}</div>
                  {r.notes && <div style={{ fontSize: 12, color: "var(--ink)", marginTop: 4 }}>{r.notes}</div>}
                </div>
                {r.status !== "completed" && <Button variant="primary" onClick={() => advance(r.id)}>{NEXT_LABEL[r.status]}</Button>}
              </div>
            ))}
          </div>
        )}
      </Card>

      {showRequest && <RequestModal actor={user} onClose={() => setShowRequest(false)} onDone={async () => { setShowRequest(false); await refresh(); }} />}
    </div>
  );
}

function RequestModal({ actor, onClose, onDone }) {
  const [form, setForm] = useState({ patientId: null, patientName: "", hospitalNo: "", ward: "", faithPreference: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true); setErr("");
    try { await requestVisit({ ...form, actor }); await onDone(); } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title="Request a chaplaincy visit" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Requesting…" : "Request"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="Patient"><PatientPicker value={form} onChange={(p) => setForm((f) => ({ ...f, ...p }))} /></Field>
      <Field label="Ward"><input style={inputStyle} value={form.ward} onChange={set("ward")} /></Field>
      <Field label="Faith preference (optional)"><input style={inputStyle} value={form.faithPreference} onChange={set("faithPreference")} /></Field>
      <Field label="Notes"><textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical", fontFamily: "var(--font-sans)" }} value={form.notes} onChange={set("notes")} /></Field>
    </Modal>
  );
}

const statGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 16 };
const row = { display: "flex", gap: 14, padding: "13px 16px", alignItems: "center" };
const errBanner = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 13, padding: "10px 14px", borderRadius: 10, marginBottom: 14 };
const errBox = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12, padding: "8px 11px", borderRadius: 8, marginBottom: 14 };
