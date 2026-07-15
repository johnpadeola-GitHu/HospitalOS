import { useEffect, useState } from "react";
import { listIntegrations } from "./sysAdminService";
import { PageHeader } from "../../lib/ui";

const TINT = {
  connected: { bg: "#E6EFDF", fg: "#4A6329", label: "Connected" },
  pending: { bg: "#FBF0DC", fg: "#8A5A17", label: "Pending" },
  error: { bg: "#F7E4E2", fg: "#B0281F", label: "Error" },
};

export default function Integration() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    listIntegrations().then((r) => { if (alive) { setRows(r); setLoading(false); } });
    return () => { alive = false; };
  }, []);

  return (
    <div>
      <PageHeader group="Administration" title={<>Integrations (HL7 / FHIR)</>} icon="Network" />

      {loading ? (
        <div style={{ color: "var(--muted)", fontSize: 13 }}>Loading integrations…</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map((i) => {
            const t = TINT[i.status];
            return (
              <div key={i.id} style={card}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 14, color: "var(--ink-strong)" }}>{i.name}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{i.detail}</div>
                </div>
                <span style={{ background: t.bg, color: t.fg, fontSize: 11, fontWeight: 500, padding: "2px 9px", borderRadius: 999 }}>{t.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const card = { display: "flex", gap: 12, alignItems: "center", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 16px" };
