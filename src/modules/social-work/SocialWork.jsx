import { useEffect, useState, useCallback } from "react";
import { REFERRAL_REASONS, CASE_STATUS, STATUS_TONE, listCases, openCase, updateCase, socialWorkSummary } from "./socialWorkService";
import { PageHeader, StatCard, Card, Pill, Button, Modal, Field, inputStyle, EmptyState } from "../../lib/ui";
import { useAuth } from "../../auth/AuthContext";
import PatientPicker from "../patients/PatientPicker";

export default function SocialWork() {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showOpen, setShowOpen] = useState(false);
  const [editFor, setEditFor] = useState(null);
  const [err, setErr] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true); setErr("");
    try {
      const [c, s] = await Promise.all([listCases({ status }), socialWorkSummary()]);
      setCases(c); setSummary(s);
    } catch (e) { setErr(e.message || "Failed to load cases."); }
    setLoading(false);
  }, [status]);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <div>
      <PageHeader group="Specialty services" title="Medical social services" icon="HeartHandshake"
        subtitle="Discharge planning, indigent patient support, and psychosocial referrals"
        actions={<Button variant="primary" icon="Plus" onClick={() => setShowOpen(true)}>Open case</Button>} />

      {err && <div style={errBanner}>{err}</div>}

      {summary && (
        <div style={statGrid}>
          <StatCard label="Open" value={summary.open} tone="warn" />
          <StatCard label="In progress" value={summary.inProgress} tone="info" />
          <StatCard label="Resolved" value={summary.resolved} tone="good" />
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {["all", ...CASE_STATUS].map((s) => (
          <button key={s} onClick={() => setStatus(s)} style={{ ...chip, ...(status === s ? chipActive : null) }}>{s}</button>
        ))}
      </div>

      <Card title="Cases" pad={false}>
        {loading ? <div style={{ padding: 20, color: "var(--muted)", fontSize: 13 }}>Loading…</div> : cases.length === 0 ? (
          <div style={{ padding: 22 }}><EmptyState icon="HeartHandshake" title="No cases match" /></div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {cases.map((c, i) => (
              <div key={c.id} style={{ ...row, borderTop: i ? "1px solid var(--border)" : "none" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink-strong)" }}>{c.patientName}</span>
                    <Pill tone={STATUS_TONE[c.status]}>{c.status}</Pill>
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3 }}>
                    {c.reason} &middot; opened {c.openedAt} &middot; {c.assignedTo}
                  </div>
                  {c.notes && <div style={{ fontSize: 12, color: "var(--ink)", marginTop: 4 }}>{c.notes}</div>}
                </div>
                {c.status !== "resolved" && <Button onClick={() => setEditFor(c)}>Update</Button>}
              </div>
            ))}
          </div>
        )}
      </Card>

      {showOpen && <OpenModal actor={user} onClose={() => setShowOpen(false)} onDone={async () => { setShowOpen(false); await refresh(); }} />}
      {editFor && <EditModal caseItem={editFor} actor={user} onClose={() => setEditFor(null)} onDone={async () => { setEditFor(null); await refresh(); }} />}
    </div>
  );
}

function OpenModal({ actor, onClose, onDone }) {
  const [form, setForm] = useState({ patientId: null, patientName: "", hospitalNo: "", reason: REFERRAL_REASONS[0], notes: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true); setErr("");
    try { await openCase({ ...form, actor }); await onDone(); } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title="Open a social work case" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Opening…" : "Open case"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="Patient"><PatientPicker value={form} onChange={(p) => setForm((f) => ({ ...f, ...p }))} /></Field>
      <Field label="Reason"><select style={inputStyle} value={form.reason} onChange={set("reason")}>{REFERRAL_REASONS.map((r) => <option key={r}>{r}</option>)}</select></Field>
      <Field label="Notes"><textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical", fontFamily: "var(--font-sans)" }} value={form.notes} onChange={set("notes")} /></Field>
    </Modal>
  );
}

function EditModal({ caseItem, actor, onClose, onDone }) {
  const [status, setStatus] = useState(caseItem.status);
  const [notes, setNotes] = useState(caseItem.notes);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setBusy(true);
    setErr("");
    try {
      await updateCase(caseItem.id, { status, notes, actor });
      await onDone();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <Modal title={`Update case — ${caseItem.patientName}`} onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="Status"><select style={inputStyle} value={status} onChange={(e) => setStatus(e.target.value)}>{CASE_STATUS.map((s) => <option key={s}>{s}</option>)}</select></Field>
      <Field label="Notes"><textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical", fontFamily: "var(--font-sans)" }} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
    </Modal>
  );
}

const statGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 16 };
const chip = { font: "inherit", fontSize: 12, fontWeight: 500, padding: "6px 12px", borderRadius: 999, border: "1px solid var(--border-strong)", background: "var(--surface-2)", color: "var(--muted)", cursor: "pointer", textTransform: "capitalize" };
const chipActive = { background: "var(--charcoal)", color: "#fff", borderColor: "var(--charcoal)" };
const row = { display: "flex", gap: 14, padding: "13px 16px", alignItems: "center" };
const errBanner = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 13, padding: "10px 14px", borderRadius: 0, marginBottom: 14 };
const errBox = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12, padding: "8px 11px", borderRadius: 0, marginBottom: 14 };
