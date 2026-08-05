import { useEffect, useState, useCallback } from "react";
import { listAlerts, acknowledgeAlert } from "./alertService";
import { Button, PageHeader } from "../../lib/ui";

function timeAgo(iso) {
  if (!iso) return "";
  const mins = Math.round((Date.now() - new Date(iso)) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  return `${hrs} hr ago`;
}

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAcknowledged, setShowAcknowledged] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setAlerts(await listAlerts({ includeAcknowledged: showAcknowledged }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [showAcknowledged]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const ack = async (id) => {
    await acknowledgeAlert(id);
    await refresh();
  };

  const activeCount = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div>
      <PageHeader group="Overview" title={<>Alerts &amp; critical values</>} icon="BellRing" actions={<><label style={toggle}>
          <input
            type="checkbox"
            checked={showAcknowledged}
            onChange={(e) => setShowAcknowledged(e.target.checked)}
          />
          Show acknowledged
        </label></>} />

      {loading ? (
        <div style={{ color: "var(--muted)", fontSize: 13 }}>Loading alerts…</div>
      ) : alerts.length === 0 ? (
        <div style={emptyState}>
          <div style={{ fontWeight: 600, color: "var(--ink-strong)", marginBottom: 4 }}>
            No active alerts
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            Critical results and operational warnings from across the hospital
            appear here as they occur.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {!showAcknowledged && (
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 2 }}>
              {activeCount} active {activeCount === 1 ? "alert" : "alerts"}
            </div>
          )}
          {alerts.map((a) => (
            <div key={a.id} style={{ ...alertCard, ...(a.acknowledged ? ackCard : null) }}>
              <div style={{ ...sevBar, background: a.severity === "warning" ? "#B8811C" : "#B0281F" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={a.severity === "warning" ? sevPillWarn : sevPill}>
                    {a.severity === "warning" ? "Warning" : "Critical"}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>{a.source}</span>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>· {timeAgo(a.at)}</span>
                </div>
                <div style={{ fontWeight: 500, fontSize: 14, color: "var(--ink-strong)", marginTop: 5 }}>
                  {a.title}
                </div>
                <div style={{ fontSize: 13, color: "var(--ink)", marginTop: 2 }}>{a.detail}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 5 }}>
                  {a.patientName ? `${a.patientName} · ${a.hospitalNo} · ` : ""}
                  <span style={{ fontFamily: "var(--font-mono)" }}>{a.reference}</span>
                </div>
              </div>
              <div style={{ alignSelf: "center" }}>
                {a.acknowledged ? (
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>Acknowledged</span>
                ) : (
                  <Button onClick={() => ack(a.id)}>Acknowledge</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const header = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  marginBottom: 18,
};
const toggle = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  fontSize: 13,
  color: "var(--muted)",
  cursor: "pointer",
};
const emptyState = {
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: 0,
  padding: "28px 24px",
  textAlign: "center",
};
const alertCard = {
  display: "flex",
  gap: 14,
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: 0,
  padding: "14px 16px",
  overflow: "hidden",
  position: "relative",
};
const ackCard = { opacity: 0.62 };
const sevBar = {
  position: "absolute",
  left: 0,
  top: 0,
  bottom: 0,
  width: 4,
  background: "#B0281F",
};
const sevPill = {
  fontSize: 11,
  fontWeight: 600,
  color: "#B0281F",
  background: "#F7E4E2",
  padding: "1px 8px",
  borderRadius: 0,
};
const sevPillWarn = {
  fontSize: 11,
  fontWeight: 600,
  color: "#8A5A17",
  background: "#FBF0DC",
  padding: "1px 8px",
  borderRadius: 0,
};
