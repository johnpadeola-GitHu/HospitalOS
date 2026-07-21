import { useEffect, useState, useCallback } from "react";
import { VEHICLE_STATUS, listFleet, setVehicleStatus } from "./operationsService";
import { inputStyle, PageHeader } from "../../lib/ui";

const STATUS_KEYS = Object.keys(VEHICLE_STATUS);

export default function Fleet() {
  const [fleet, setFleet] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setFleet(await listFleet());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const change = async (id, status) => {
    await setVehicleStatus(id, status);
    await refresh();
  };

  const counts = fleet.reduce((a, v) => {
    a[v.status] = (a[v.status] || 0) + 1;
    return a;
  }, {});

  return (
    <div>
      <PageHeader group="Operations" title={<>Ambulance &amp; fleet</>} icon="Ambulance" />

      <div style={statRow}>
        {STATUS_KEYS.map((k) => (
          <div key={k} style={{ ...statChip, background: VEHICLE_STATUS[k].bg, color: VEHICLE_STATUS[k].color }}>
            <span style={{ fontWeight: 600 }}>{counts[k] || 0}</span> {VEHICLE_STATUS[k].label}
          </div>
        ))}
      </div>

      <div style={tableWrap}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Registration", "Type", "Model", "Service due", "Status"].map((h) => (
                <th key={h} style={th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={emptyCell}>
                  Loading fleet…
                </td>
              </tr>
            ) : (
              fleet.map((v) => (
                <tr key={v.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 12 }}>{v.reg}</td>
                  <td style={{ ...td, fontWeight: 500, color: "var(--ink-strong)" }}>{v.type}</td>
                  <td style={{ ...td, color: "var(--muted)" }}>{v.model}</td>
                  <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)" }}>{v.serviceDue}</td>
                  <td style={td}>
                    <select
                      style={{ ...inputStyle, maxWidth: 170, padding: "6px 8px", color: VEHICLE_STATUS[v.status].color, fontWeight: 500 }}
                      value={v.status}
                      onChange={(ev) => change(v.id, ev.target.value)}
                    >
                      {STATUS_KEYS.map((k) => (
                        <option key={k} value={k}>
                          {VEHICLE_STATUS[k].label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const statRow = { display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" };
const statChip = { fontSize: 12, padding: "5px 11px", borderRadius: 999 };
const tableWrap = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, overflow: "auto" };
const th = { textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--muted)", padding: "11px 14px", background: "var(--surface)" };
const td = { padding: "11px 14px", fontSize: 13, verticalAlign: "middle" };
const emptyCell = { padding: "28px 14px", textAlign: "center", color: "var(--muted)", fontSize: 13 };
