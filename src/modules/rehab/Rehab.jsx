import { useEffect, useState, useCallback } from "react";
import { listRehab, logSession, addRehab, THERAPIES } from "./rehabService";
import { Button, PageHeader, Modal, Field, inputStyle } from "../../lib/ui";

export default function Rehab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [showAdd, setShowAdd] = useState(false);
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
      <PageHeader group="Patient care" title={<>Rehabilitation &amp; therapy</>} icon="Accessibility"
        actions={<Button variant="primary" onClick={() => setShowAdd(true)}>+ Refer to rehab</Button>} />
      {err && <div style={errBanner}>{err}</div>}
      {loading ? <div style={{ color: "var(--muted)", fontSize: 13 }}>Loading referrals…</div> : rows.length === 0 ? (
        <div style={{ color: "var(--muted)", fontSize: 13, padding: "20px 2px" }}>No rehabilitation referrals yet.</div>
      ) : (
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

      {showAdd && (
        <AddReferralModal
          onClose={() => setShowAdd(false)}
          onDone={async () => { setShowAdd(false); await refresh(); }}
        />
      )}
    </div>
  );
}

function AddReferralModal({ onClose, onDone }) {
  const [patientName, setPatientName] = useState("");
  const [hospitalNo, setHospitalNo] = useState("");
  const [therapy, setTherapy] = useState(THERAPIES[0]);
  const [reason, setReason] = useState("");
  const [sessionsPlanned, setSessionsPlanned] = useState("6");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setBusy(true);
    setErr("");
    try {
      await addRehab({ patientName, hospitalNo, therapy, reason, sessionsPlanned });
      await onDone();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Refer to rehabilitation"
      onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={submit} disabled={busy || !patientName.trim() || !reason.trim()}>
          {busy ? "Referring\u2026" : "Refer"}
        </Button>
      </>}
    >
      {err && <div style={{ color: "var(--bad)", fontSize: 12.5, marginBottom: 12 }}>{err}</div>}
      <Field label="Patient name">
        <input style={inputStyle} value={patientName} onChange={(e) => setPatientName(e.target.value)} autoFocus />
      </Field>
      <Field label="Hospital number (optional)">
        <input style={inputStyle} value={hospitalNo} onChange={(e) => setHospitalNo(e.target.value)} />
      </Field>
      <Field label="Therapy">
        <select style={inputStyle} value={therapy} onChange={(e) => setTherapy(e.target.value)}>
          {THERAPIES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </Field>
      <Field label="Reason for referral">
        <input style={inputStyle} value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
      <Field label="Sessions planned">
        <input type="number" min="1" style={inputStyle} value={sessionsPlanned} onChange={(e) => setSessionsPlanned(e.target.value)} />
      </Field>
    </Modal>
  );
}
const card = { display: "flex", gap: 14, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 0, padding: "12px 16px" };
const donePill = { fontSize: 11, fontWeight: 500, color: "#4A6329", background: "#E6EFDF", padding: "2px 9px", borderRadius: 0 };
const errBanner = { background: "#F7E9E9", color: "#7A2E2E", fontSize: 13, padding: "10px 14px", borderRadius: 0, marginBottom: 14 };
