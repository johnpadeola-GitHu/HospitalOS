import { useEffect, useState, useCallback } from "react";
import { EQUIP_STATUS, listEquipment, setEquipmentStatus } from "./operationsService";
import { inputStyle, PageHeader } from "../../lib/ui";

const STATUS_KEYS = Object.keys(EQUIP_STATUS);

export default function Biomedical() {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setEquipment(await listEquipment());
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
    try {
      await setEquipmentStatus(id, status);
      await refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const counts = equipment.reduce((a, e) => {
    a[e.status] = (a[e.status] || 0) + 1;
    return a;
  }, {});

  return (
    <div>
      <PageHeader group="Operations" title={<>Biomedical engineering</>} icon="Wrench" />

      <div style={statRow}>
        {STATUS_KEYS.map((k) => (
          <div key={k} style={{ ...statChip, background: EQUIP_STATUS[k].bg, color: EQUIP_STATUS[k].color }}>
            <span style={{ fontWeight: 600 }}>{counts[k] || 0}</span> {EQUIP_STATUS[k].label}
          </div>
        ))}
      </div>

      <div style={tableWrap}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Tag", "Equipment", "Location", "Last service", "Status"].map((h) => (
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
                  Loading register…
                </td>
              </tr>
            ) : (
              equipment.map((e) => (
                <tr key={e.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 12 }}>{e.tag}</td>
                  <td style={{ ...td, fontWeight: 500, color: "var(--ink-strong)" }}>{e.name}</td>
                  <td style={{ ...td, color: "var(--muted)" }}>{e.location}</td>
                  <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)" }}>{e.lastService}</td>
                  <td style={td}>
                    <select
                      style={{ ...inputStyle, maxWidth: 170, padding: "6px 8px", color: EQUIP_STATUS[e.status].color, fontWeight: 500 }}
                      value={e.status}
                      onChange={(ev) => change(e.id, ev.target.value)}
                    >
                      {STATUS_KEYS.map((k) => (
                        <option key={k} value={k}>
                          {EQUIP_STATUS[k].label}
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
