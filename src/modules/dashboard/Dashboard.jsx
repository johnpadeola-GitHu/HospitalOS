import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listPatients } from "../patients/patientService";
import { listWards } from "../wards/bedService";
import { listVisits } from "../outpatient/visitService";
import { listOrders } from "../lab/labService";
import { listAlerts } from "../alerts/alertService";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    async function load() {
      const [patients, wards, visits, orders, alerts] = await Promise.all([
        listPatients({ status: "all" }),
        listWards(),
        listVisits({ includeCompleted: false }),
        listOrders({ status: "all" }),
        listAlerts({ includeAcknowledged: false }),
      ]);
      if (!alive) return;

      const admitted = patients.filter((p) => p.status === "admitted").length;
      const outpatient = patients.filter((p) => p.status === "outpatient").length;

      const beds = wards.reduce(
        (a, w) => ({ total: a.total + w.total, occupied: a.occupied + w.occupied }),
        { total: 0, occupied: 0 }
      );
      const occPct = beds.total ? Math.round((beds.occupied / beds.total) * 100) : 0;

      const labByStage = orders.reduce((a, o) => {
        a[o.status] = (a[o.status] || 0) + 1;
        return a;
      }, {});
      const pendingLab = (labByStage.ordered || 0) + (labByStage.collected || 0) + (labByStage.resulted || 0);

      setData({
        patients: patients.length,
        admitted,
        outpatient,
        beds,
        occPct,
        wards,
        queue: visits.length,
        pendingLab,
        labByStage,
        alerts,
      });
    }
    load();
    return () => {
      alive = false;
    };
  }, []);

  if (!data) {
    return (
      <div>
        <Head />
        <div style={{ color: "var(--muted)", fontSize: 13 }}>Loading hospital overview…</div>
      </div>
    );
  }

  return (
    <div>
      <Head />

      <div style={statRow}>
        <Stat label="Registered patients" value={data.patients} onClick={() => navigate("/patients/adt")} />
        <Stat label="Admitted" value={data.admitted} onClick={() => navigate("/wards")} />
        <Stat
          label="Bed occupancy"
          value={`${data.occPct}%`}
          sub={`${data.beds.occupied}/${data.beds.total} beds`}
          onClick={() => navigate("/wards")}
        />
        <Stat label="In clinic queue" value={data.queue} onClick={() => navigate("/outpatient")} />
        <Stat label="Pending lab" value={data.pendingLab} onClick={() => navigate("/lab")} />
        <Stat
          label="Active alerts"
          value={data.alerts.length}
          danger={data.alerts.length > 0}
          onClick={() => navigate("/alerts")}
        />
      </div>

      <div style={panelRow}>
        <div style={panel}>
          <PanelHead title="Ward occupancy" onOpen={() => navigate("/wards")} />
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {data.wards.map((w) => {
              const pct = w.total ? Math.round((w.occupied / w.total) * 100) : 0;
              return (
                <div key={w.name}>
                  <div style={barRow}>
                    <span style={{ color: "var(--ink)" }}>{w.name}</span>
                    <span style={{ color: "var(--muted)", fontSize: 12 }}>
                      {w.occupied}/{w.total}
                    </span>
                  </div>
                  <div style={barTrack}>
                    <div
                      style={{
                        ...barFill,
                        width: `${pct}%`,
                        background: pct >= 90 ? "#A35A2E" : "#2F4A6D",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={panel}>
          <PanelHead title="Lab pipeline" onOpen={() => navigate("/lab")} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              ["ordered", "Ordered"],
              ["collected", "Collected"],
              ["resulted", "Resulted"],
              ["verified", "Verified"],
            ].map(([key, label]) => (
              <div key={key} style={pipelineRow}>
                <span style={{ color: "var(--ink)" }}>{label}</span>
                <span style={pipelineCount}>{data.labByStage[key] || 0}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16 }}>
            <PanelHead title="Recent alerts" onOpen={() => navigate("/alerts")} />
            {data.alerts.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--muted)" }}>No active alerts.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {data.alerts.slice(0, 3).map((a) => (
                  <div key={a.id} style={alertLine}>
                    <span style={alertDot} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ color: "var(--ink-strong)", fontWeight: 500 }}>{a.detail}</span>
                      {a.patientName && (
                        <span style={{ color: "var(--muted)" }}> · {a.patientName}</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Head() {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 11, color: "var(--muted)" }}>Overview</div>
      <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--ink-strong)" }}>Dashboard</h1>
    </div>
  );
}

function Stat({ label, value, sub, danger, onClick }) {
  return (
    <button style={{ ...statCard, ...(danger ? statDanger : null) }} onClick={onClick}>
      <div style={{ fontSize: 12, color: "var(--muted)" }}>{label}</div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 600,
          fontFamily: "var(--font-mono)",
          color: danger ? "#B0281F" : "var(--ink-strong)",
          marginTop: 2,
        }}
      >
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{sub}</div>}
    </button>
  );
}

function PanelHead({ title, onOpen }) {
  return (
    <div style={panelHead}>
      <span style={{ fontWeight: 600, fontSize: 14, color: "var(--ink-strong)" }}>{title}</span>
      <button style={openBtn} onClick={onOpen}>
        Open →
      </button>
    </div>
  );
}

const statRow = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 12,
  marginBottom: 18,
};
const statCard = {
  textAlign: "left",
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: "14px 16px",
  cursor: "pointer",
  font: "inherit",
};
const statDanger = { borderColor: "#E4B6B2", background: "#FCF4F3" };
const panelRow = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 14,
  alignItems: "start",
};
const panel = {
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: "14px 16px",
};
const panelHead = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 12,
};
const openBtn = {
  font: "inherit",
  fontSize: 12,
  fontWeight: 500,
  color: "var(--muted)",
  background: "none",
  border: "none",
  cursor: "pointer",
};
const barRow = { display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 };
const barTrack = { height: 6, borderRadius: 999, background: "var(--surface)", overflow: "hidden" };
const barFill = { height: "100%", borderRadius: 999 };
const pipelineRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: 13,
  padding: "6px 0",
  borderTop: "1px solid var(--border)",
};
const pipelineCount = {
  fontFamily: "var(--font-mono)",
  fontSize: 13,
  fontWeight: 600,
  color: "var(--ink-strong)",
};
const alertLine = { display: "flex", alignItems: "center", gap: 8, fontSize: 12 };
const alertDot = {
  width: 7,
  height: 7,
  borderRadius: "50%",
  background: "#B0281F",
  flexShrink: 0,
};
