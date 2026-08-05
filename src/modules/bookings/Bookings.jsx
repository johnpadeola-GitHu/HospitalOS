import { useEffect, useState, useCallback } from "react";
import { CLINICS, BOOKING_STATUS, STATUS_TONE, listBookings, requestBooking, confirmBooking, declineBooking, checkInBooking, bookingsSummary } from "./bookingsService";
import { PageHeader, StatCard, Card, Pill, Button, Modal, Field, inputStyle, EmptyState } from "../../lib/ui";

function ago(iso) {
  const m = Math.round((Date.now() - new Date(iso)) / 60000);
  return m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`;
}

export default function Bookings() {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [err, setErr] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [b, s] = await Promise.all([listBookings({ status }), bookingsSummary()]);
      setRows(b); setSummary(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { refresh(); }, [refresh]);

  const act = async (fn, id) => {
    setErr("");
    try { await fn(id); await refresh(); } catch (e) { setErr(e.message); }
  };

  return (
    <div>
      <PageHeader group="Patient care" title="Online bookings" icon="CalendarPlus"
        subtitle="Appointment requests from the hospital website"
        actions={<Button variant="primary" icon="Plus" onClick={() => setShowNew(true)}>New request (demo)</Button>} />

      {err && <div style={errBanner}>{err}</div>}

      {summary && (
        <div style={statGrid}>
          <StatCard label="Today" value={summary.today} />
          <StatCard label="Awaiting review" value={summary.requested} tone="warn" />
          <StatCard label="Confirmed" value={summary.confirmed} tone="info" />
          <StatCard label="Checked in" value={summary.checkedIn} tone="good" />
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {["all", ...BOOKING_STATUS].map((s) => (
          <button key={s} onClick={() => setStatus(s)} style={{ ...chip, ...(status === s ? chipActive : null) }}>{s}</button>
        ))}
      </div>

      <Card title="Booking requests" pad={false}>
        {loading ? <div style={{ padding: 20, color: "var(--muted)", fontSize: 13 }}>Loading…</div> : rows.length === 0 ? (
          <div style={{ padding: 22 }}><EmptyState icon="CalendarPlus" title="No bookings match" /></div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {rows.map((b, i) => (
              <div key={b.id} style={{ ...row, borderTop: i ? "1px solid var(--border)" : "none" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink-strong)" }}>{b.name}</span>
                    <Pill tone={STATUS_TONE[b.status]}>{b.status}</Pill>
                    {!b.patientId && <Pill tone="muted">Unmatched patient</Pill>}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3 }}>
                    <span style={{ fontFamily: "var(--font-mono)" }}>{b.ref}</span> · {b.phone} · {b.clinic} · requested {ago(b.at)}
                  </div>
                  {b.note && <div style={{ fontSize: 12, color: "var(--ink)", marginTop: 4 }}>{b.note}</div>}
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {b.status === "requested" && <>
                    <Button onClick={() => act(confirmBooking, b.id)}>Confirm</Button>
                    <Button onClick={() => act(declineBooking, b.id)}>Decline</Button>
                  </>}
                  {b.status === "confirmed" && (
                    <Button variant="primary" onClick={() => act(checkInBooking, b.id)}>Check in</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showNew && <NewBookingModal onClose={() => setShowNew(false)} onDone={async () => { setShowNew(false); await refresh(); }} />}
    </div>
  );
}

function NewBookingModal({ onClose, onDone }) {
  const [form, setForm] = useState({ name: "", phone: "", clinic: CLINICS[0], note: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true); setErr("");
    try { await requestBooking(form); await onDone(); } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title="Simulate a website booking" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Sending…" : "Submit request"}</Button>
    </>}>
      <div style={demoNote}>This form stands in for the public booking widget on the hospital website.</div>
      {err && <div style={errBox}>{err}</div>}
      <Field label="Full name"><input style={inputStyle} value={form.name} onChange={set("name")} /></Field>
      <Field label="Phone"><input style={inputStyle} value={form.phone} onChange={set("phone")} placeholder="0803…" /></Field>
      <Field label="Clinic"><select style={inputStyle} value={form.clinic} onChange={set("clinic")}>{CLINICS.map((c) => <option key={c}>{c}</option>)}</select></Field>
      <Field label="Reason (optional)"><input style={inputStyle} value={form.note} onChange={set("note")} /></Field>
    </Modal>
  );
}

const statGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: 16 };
const chip = { font: "inherit", fontSize: 12, fontWeight: 500, padding: "6px 12px", borderRadius: 0, border: "1px solid var(--border-strong)", background: "var(--surface-2)", color: "var(--muted)", cursor: "pointer", textTransform: "capitalize" };
const chipActive = { background: "var(--charcoal)", color: "#fff", borderColor: "var(--charcoal)" };
const row = { display: "flex", gap: 14, padding: "13px 16px", alignItems: "center" };
const demoNote = { background: "var(--info-bg)", color: "var(--info)", fontSize: 12, padding: "8px 11px", borderRadius: 0, marginBottom: 14 };
const errBanner = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 13, padding: "10px 14px", borderRadius: 0, marginBottom: 14 };
const errBox = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12, padding: "8px 11px", borderRadius: 0, marginBottom: 14 };
