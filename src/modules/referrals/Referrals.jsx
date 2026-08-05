import { useEffect, useState, useCallback } from "react";
import {
  FACILITY_TIERS, URGENCY, STATUS_TONE, CLINICS,
  listReferrals, receiveReferral, acceptReferral, declineReferral, checkInReferral,
  sendReferral, acknowledgeOutboundReferral, referralsSummary,
} from "./referralsService";
import { listPatients } from "../patients/patientService";
import { PageHeader, StatCard, Card, Pill, Button, Modal, Field, inputStyle, EmptyState } from "../../lib/ui";
import { useAuth } from "../../auth/AuthContext";

function ago(iso) {
  const m = Math.round((Date.now() - new Date(iso)) / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

export default function Referrals() {
  const { user } = useAuth();
  const [tab, setTab] = useState("inbound");
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReceive, setShowReceive] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [declineFor, setDeclineFor] = useState(null);
  const [err, setErr] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([listReferrals({ direction: tab }), referralsSummary()]);
      setRows(r); setSummary(s); 
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { refresh(); }, [refresh]);

  const act = async (fn, ...args) => {
    setErr("");
    try { await fn(...args); await refresh(); } catch (e) { setErr(e.message); }
  };

  return (
    <div>
      <PageHeader group="Patient care" title="Referrals" icon="ArrowLeftRight"
        subtitle="Patients referred to us from other facilities, and patients we refer onward"
        actions={
          <>
            <Button icon="ArrowDownToLine" onClick={() => setShowReceive(true)}>Log inbound referral</Button>
            <Button variant="primary" icon="ArrowUpFromLine" onClick={() => setShowSend(true)}>Refer patient out</Button>
          </>
        } />

      {err && <div style={errBanner}>{err}</div>}

      {summary && (
        <div style={statGrid}>
          <StatCard label="Awaiting review" value={summary.inboundPending} tone={summary.inboundPending ? "warn" : "default"} />
          <StatCard label="Emergency referrals" value={summary.inboundEmergency} tone={summary.inboundEmergency ? "bad" : "default"} />
          <StatCard label="Accepted, not yet arrived" value={summary.inboundAccepted} tone="info" />
          <StatCard label="Sent, awaiting ack." value={summary.outboundAwaiting} />
          <StatCard label="This period" value={summary.totalThisMonth} />
        </div>
      )}

      <div style={tabs}>
        {[["inbound", "Inbound — from other facilities"], ["outbound", "Outbound — referred elsewhere"]].map(([id, l]) => (
          <button key={id} onClick={() => setTab(id)} style={{ ...tabBtn, ...(tab === id ? tabActive : null) }}>{l}</button>
        ))}
      </div>

      <Card title={tab === "inbound" ? "Inbound referrals" : "Outbound referrals"} pad={false}>
        {loading ? <div style={{ padding: 20, color: "var(--muted)", fontSize: 13 }}>Loading…</div> : rows.length === 0 ? (
          <div style={{ padding: 22 }}><EmptyState icon="ArrowLeftRight" title="No referrals here yet" /></div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {rows.map((r, i) => (
              <div key={r.id} style={{ ...row, borderTop: i ? "1px solid var(--border)" : "none" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>{r.ref}</span>
                    <span style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink-strong)" }}>{r.patientName}</span>
                    <Pill tone={STATUS_TONE[r.status]}>{r.status}</Pill>
                    {r.urgency === "Emergency" && <Pill tone="bad">Emergency</Pill>}
                    {r.urgency === "Urgent" && <Pill tone="warn">Urgent</Pill>}
                    {r.direction === "inbound" && !r.patientId && <Pill tone="muted">Unmatched patient</Pill>}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3 }}>
                    {r.direction === "inbound" ? (
                      <>From <b>{r.fromFacility}</b> ({r.fromTier}) &middot; {r.clinic} &middot; {ago(r.receivedAt)}</>
                    ) : (
                      <>To <b>{r.toFacility}</b> ({r.toTier}) &middot; {ago(r.sentAt)}</>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink)", marginTop: 4 }}>{r.reason}</div>
                  {r.declineReason && <div style={{ fontSize: 11.5, color: "var(--bad)", marginTop: 3 }}>Declined: {r.declineReason}</div>}
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {r.direction === "inbound" && r.status === "received" && <>
                    <Button variant="primary" onClick={() => act(acceptReferral, r.id, user)}>Accept</Button>
                    <Button onClick={() => setDeclineFor(r)}>Decline</Button>
                  </>}
                  {r.direction === "inbound" && r.status === "accepted" && (
                    <Button variant="primary" onClick={() => act(checkInReferral, r.id, user)}>Check in</Button>
                  )}
                  {r.direction === "outbound" && r.status === "sent" && (
                    <Button onClick={() => act(acknowledgeOutboundReferral, r.id, user)}>Mark acknowledged</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showReceive && <ReceiveModal actor={user} onClose={() => setShowReceive(false)} onDone={async () => { setShowReceive(false); setTab("inbound"); await refresh(); }} />}
      {showSend && <SendModal actor={user} onClose={() => setShowSend(false)} onDone={async () => { setShowSend(false); setTab("outbound"); await refresh(); }} />}
      {declineFor && <DeclineModal referral={declineFor} actor={user} onClose={() => setDeclineFor(null)} onDone={async () => { setDeclineFor(null); await refresh(); }} onError={setErr} />}
    </div>
  );
}

function ReceiveModal({ actor, onClose, onDone }) {
  const [form, setForm] = useState({ fromFacility: "", fromTier: FACILITY_TIERS[0], patientName: "", patientPhone: "", age: "", sex: "F", reason: "", urgency: "Routine", clinic: CLINICS[0] });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true); setErr("");
    try { await receiveReferral({ ...form, actor }); await onDone(); } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title="Log an inbound referral" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Saving…" : "Log referral"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><Field label="Referring facility"><input style={inputStyle} value={form.fromFacility} onChange={set("fromFacility")} /></Field></div>
        <div style={{ width: 170 }}><Field label="Facility tier"><select style={inputStyle} value={form.fromTier} onChange={set("fromTier")}>{FACILITY_TIERS.map((t) => <option key={t}>{t}</option>)}</select></Field></div>
      </div>
      <Field label="Patient name"><input style={inputStyle} value={form.patientName} onChange={set("patientName")} /></Field>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><Field label="Phone"><input style={inputStyle} value={form.patientPhone} onChange={set("patientPhone")} /></Field></div>
        <div style={{ width: 80 }}><Field label="Age"><input type="number" style={inputStyle} value={form.age} onChange={set("age")} /></Field></div>
        <div style={{ width: 90 }}><Field label="Sex"><select style={inputStyle} value={form.sex} onChange={set("sex")}><option value="F">F</option><option value="M">M</option></select></Field></div>
      </div>
      <Field label="Reason for referral"><textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical", fontFamily: "var(--font-sans)" }} value={form.reason} onChange={set("reason")} /></Field>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><Field label="Receiving clinic"><select style={inputStyle} value={form.clinic} onChange={set("clinic")}>{CLINICS.map((c) => <option key={c}>{c}</option>)}</select></Field></div>
        <div style={{ width: 130 }}><Field label="Urgency"><select style={inputStyle} value={form.urgency} onChange={set("urgency")}>{URGENCY.map((u) => <option key={u}>{u}</option>)}</select></Field></div>
      </div>
    </Modal>
  );
}

function SendModal({ actor, onClose, onDone }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ toFacility: "", toTier: FACILITY_TIERS[0], reason: "", urgency: "Routine" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => { try { const r = await listPatients({ query, status: "all" }); if (alive) setResults(r.slice(0, 5)); } catch (e) { console.error(e); if (alive) setResults([]); } }, 180);
    return () => { alive = false; clearTimeout(t); };
  }, [query]);

  const submit = async () => {
    if (!selected) { setErr("Select a patient first."); return; }
    setBusy(true); setErr("");
    try {
      await sendReferral({ ...form, patientId: selected.id, patientName: `${selected.lastName}, ${selected.firstName}`, actor });
      await onDone();
    } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title="Refer a patient out" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy || !selected}>{busy ? "Sending…" : "Send referral"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="Find patient"><input style={inputStyle} value={query} onChange={(e) => { setQuery(e.target.value); setSelected(null); }} placeholder="Name or hospital no." /></Field>
      <div style={{ maxHeight: 110, overflowY: "auto", marginBottom: 14 }}>
        {results.map((p) => (
          <button key={p.id} onClick={() => setSelected(p)} style={{ ...resultRow, ...(selected?.id === p.id ? resultRowActive : null) }}>
            <span style={{ fontWeight: 500, color: "var(--ink-strong)" }}>{p.lastName}, {p.firstName}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>{p.hospitalNo}</span>
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><Field label="Receiving facility"><input style={inputStyle} value={form.toFacility} onChange={set("toFacility")} /></Field></div>
        <div style={{ width: 170 }}><Field label="Facility tier"><select style={inputStyle} value={form.toTier} onChange={set("toTier")}>{FACILITY_TIERS.map((t) => <option key={t}>{t}</option>)}</select></Field></div>
      </div>
      <Field label="Reason"><textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical", fontFamily: "var(--font-sans)" }} value={form.reason} onChange={set("reason")} /></Field>
      <Field label="Urgency"><select style={inputStyle} value={form.urgency} onChange={set("urgency")}>{URGENCY.map((u) => <option key={u}>{u}</option>)}</select></Field>
    </Modal>
  );
}

function DeclineModal({ referral, actor, onClose, onDone, onError }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setBusy(true); setErr("");
    try { await declineReferral(referral.id, { reason, actor }); await onDone(); }
    catch (e) { setErr(e.message); setBusy(false); onError?.(""); }
  };

  return (
    <Modal title={`Decline referral — ${referral.ref}`} onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy || !reason.trim()}>{busy ? "Saving…" : "Decline"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>{referral.patientName} &middot; from {referral.fromFacility}</div>
      <Field label="Reason (required — the referring facility needs to know why)">
        <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical", fontFamily: "var(--font-sans)" }} value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
    </Modal>
  );
}

const statGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 16 };
const tabs = { display: "flex", gap: 6, marginBottom: 14 };
const tabBtn = { font: "inherit", fontSize: 12.5, fontWeight: 600, padding: "6px 13px", borderRadius: 0, border: "1px solid var(--border-strong)", background: "var(--surface-2)", color: "var(--muted)", cursor: "pointer" };
const tabActive = { background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" };
const row = { display: "flex", gap: 14, padding: "13px 16px", alignItems: "center" };
const resultRow = { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", border: "1px solid transparent", borderRadius: 0, background: "none", cursor: "pointer", font: "inherit", fontSize: 13 };
const resultRowActive = { background: "var(--accent-bg)", border: "1px solid var(--border-strong)" };
const errBanner = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 13, padding: "10px 14px", borderRadius: 0, marginBottom: 14 };
const errBox = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12, padding: "8px 11px", borderRadius: 0, marginBottom: 14 };
