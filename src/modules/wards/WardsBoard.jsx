import { useEffect, useState, useCallback } from "react";
import { listWards } from "./bedService";
import { priceFor } from "../../engines/pricing";
import { PageHeader } from "../../lib/ui";

export default function WardsBoard() {
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setWards(await listWards());
    
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const totals = wards.reduce(
    (acc, w) => {
      acc.total += w.total;
      acc.occupied += w.occupied;
      return acc;
    },
    { total: 0, occupied: 0 }
  );
  const free = totals.total - totals.occupied;
  const pct = totals.total ? Math.round((totals.occupied / totals.total) * 100) : 0;

  return (
    <div>
      <PageHeader group="Patient care" title={<>Wards &amp; bed management</>} icon="BedDouble" actions={<><button style={refreshBtn} onClick={refresh}>
          Refresh
        </button></>} />

      <div style={statRow}>
        <Stat label="Total beds" value={totals.total} />
        <Stat label="Occupied" value={totals.occupied} />
        <Stat label="Free" value={free} accent />
        <Stat label="Occupancy" value={`${pct}%`} />
      </div>

      {loading ? (
        <div style={{ color: "var(--muted)", fontSize: 13 }}>Loading bed board…</div>
      ) : wards.length === 0 ? (
        <div style={{ color: "var(--muted)", fontSize: 13, padding: "20px 2px" }}>No wards configured yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {wards.map((w) => (
            <div key={w.name} style={card}>
              <div style={cardHead}>
                <div style={{ fontWeight: 600, color: "var(--ink-strong)", fontSize: 14 }}>
                  {w.name}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={tierPill}>{w.tierLabel} · ₦{priceFor("accommodation", w.tier, w.rate).toLocaleString()}/night</span>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>
                    {w.occupied}/{w.total} occupied · {w.free} free
                  </span>
                </div>
              </div>
              <div style={bedGrid}>
                {w.beds.map((b) => (
                  <div
                    key={b.id}
                    style={{ ...bed, ...(b.occupantId ? bedOccupied : bedFree) }}
                    title={b.occupantId ? `${b.id} · ${b.occupantName}` : `${b.id} · free`}
                  >
                    <span style={bedId}>{b.id}</span>
                    <span style={bedOcc}>
                      {b.occupantId ? b.occupantName.split(",")[0] : "Free"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div style={statCard}>
      <div style={{ fontSize: 12, color: "var(--muted)" }}>{label}</div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 600,
          color: accent ? "#1D6E56" : "var(--ink-strong)",
          fontFamily: "var(--font-mono)",
        }}
      >
        {value}
      </div>
    </div>
  );
}

const header = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  marginBottom: 18,
};
const refreshBtn = {
  font: "inherit",
  fontSize: 13,
  fontWeight: 500,
  padding: "8px 14px",
  borderRadius: 0,
  border: "1px solid var(--border-strong)",
  background: "var(--surface-2)",
  color: "var(--ink)",
  cursor: "pointer",
};
const statRow = { display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" };
const statCard = {
  flex: "1 1 120px",
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: 0,
  padding: "12px 16px",
};
const card = {
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: 0,
  padding: "14px 16px",
};
const cardHead = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 12,
};
const tierPill = { fontSize: 10.5, fontWeight: 600, color: "var(--charcoal)", background: "var(--charcoal-bg)", padding: "2px 8px", borderRadius: 999, whiteSpace: "nowrap" };
const bedGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(84px, 1fr))",
  gap: 8,
};
const bed = {
  borderRadius: 0,
  padding: "8px 9px",
  display: "flex",
  flexDirection: "column",
  gap: 2,
  border: "1px solid transparent",
};
const bedFree = { background: "var(--surface)", border: "1px solid var(--border)" };
const bedOccupied = { background: "#D3E1F8", border: "1px solid #A9BEDE" };
const bedId = { fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-strong)" };
const bedOcc = {
  fontSize: 11,
  color: "var(--muted)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};
