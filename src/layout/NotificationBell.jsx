import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import * as Icons from "lucide-react";
import { listBookings, confirmBooking, declineBooking } from "../modules/bookings/bookingsService";
import { useAuth } from "../auth/AuthContext";

// Notification bell — currently sourced from booking requests. A booking stays
// in this list for as long as it is "requested": it does NOT disappear on its
// own, does not time out, and is not dismissible from the bell itself. It only
// leaves once someone actually treats it — confirms, declines, or (from the
// Bookings screen) checks the patient in. That is the whole point: the bell is
// a queue of unhandled work, not a feed of things to swipe away.
export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const ref = useRef(null);
  const navigate = useNavigate();
  const { can } = useAuth();

  const canSeeBookings = can("patient-care");

  const refresh = useCallback(async () => {
    if (!canSeeBookings) return;
    const rows = await listBookings({ status: "requested" });
    setPending(rows);
  }, [canSeeBookings]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 6000);
    return () => clearInterval(t);
  }, [refresh]);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!canSeeBookings) {
    return <Icons.Bell size={16} style={{ color: "var(--muted)" }} />;
  }

  const act = async (fn, id) => {
    setBusyId(id);
    await fn(id);
    setBusyId(null);
    await refresh();
  };

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <button style={bellBtn} onClick={() => setOpen((v) => !v)} aria-label="Notifications">
        <Icons.Bell size={16} style={{ color: pending.length ? "var(--charcoal-strong)" : "var(--muted)" }} />
        {pending.length > 0 && <span style={badge}>{pending.length}</span>}
      </button>

      {open && (
        <div style={panel}>
          <div style={panelHead}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-strong)" }}>
              Booking requests
            </span>
            {pending.length > 0 && <span style={countPill}>{pending.length} awaiting review</span>}
          </div>

          {pending.length === 0 ? (
            <div style={empty}>
              <Icons.CheckCircle2 size={20} style={{ color: "var(--muted)", marginBottom: 6 }} />
              <div>Nothing awaiting review.</div>
            </div>
          ) : (
            <div style={{ maxHeight: 340, overflowY: "auto" }}>
              {pending.map((b) => (
                <div key={b.id} style={item}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-strong)" }}>{b.name}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>{b.clinic}</div>
                    {b.note && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{b.note}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                    <button style={miniBtn} disabled={busyId === b.id} onClick={() => act(confirmBooking, b.id)} title="Confirm">
                      <Icons.Check size={13} />
                    </button>
                    <button style={{ ...miniBtn, color: "var(--bad)" }} disabled={busyId === b.id} onClick={() => act(declineBooking, b.id)} title="Decline">
                      <Icons.X size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button style={viewAll} onClick={() => { setOpen(false); navigate("/bookings"); }}>
            Open online bookings <Icons.ArrowRight size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

const bellBtn = { position: "relative", background: "none", border: "none", cursor: "pointer", display: "flex", padding: 2 };
const badge = {
  position: "absolute", top: -4, right: -5, minWidth: 15, height: 15, borderRadius: 999,
  background: "var(--bad)", color: "#fff", fontSize: 9.5, fontWeight: 700,
  display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px",
};
const panel = {
  position: "absolute", top: "calc(100% + 10px)", right: 0, width: 320,
  background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12,
  boxShadow: "0 14px 40px rgba(22,35,59,0.18)", zIndex: 60, overflow: "hidden",
};
const panelHead = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", borderBottom: "1px solid var(--border)" };
const countPill = { fontSize: 10, fontWeight: 700, color: "var(--bad)", background: "var(--bad-bg)", padding: "2px 7px", borderRadius: 999 };
const empty = { padding: "26px 16px", textAlign: "center", fontSize: 12, color: "var(--muted)" };
const item = { display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 14px", borderTop: "1px solid var(--border)" };
const miniBtn = {
  width: 24, height: 24, borderRadius: 7, border: "1px solid var(--border-strong)",
  background: "var(--surface)", color: "var(--good)", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
};
const viewAll = {
  width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
  font: "inherit", fontSize: 11.5, fontWeight: 600, color: "var(--charcoal)",
  background: "var(--surface)", border: "none", borderTop: "1px solid var(--border)",
  padding: "10px 0", cursor: "pointer",
};
