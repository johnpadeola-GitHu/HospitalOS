import { useEffect, useState, useCallback } from "react";
import { VITALS, listCriticalCare, updateVitals, flagVital } from "./criticalCareService";
import { Button, Modal, inputStyle, PageHeader } from "../../lib/ui";

const FLAG_COLOR = {
  critical: "#B0281F",
  high: "#A35A2E",
  low: "#1E5A8A",
  normal: "var(--ink-strong)",
  unrecorded: "var(--muted)",
};

function sinceLabel(iso) {
  if (!iso) return "";
  const mins = Math.round((Date.now() - new Date(iso)) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  return `${Math.round(mins / 60)} hr ago`;
}

export default function CriticalCare() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recordFor, setRecordFor] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await listCriticalCare());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const unstableCount = rows.filter((r) => r.unstable).length;

  return (
    <div>
      <PageHeader group="Patient care" title={<>ICU / HDU</>} icon="Activity" />

      <div style={statRow}>
        <Stat label="Occupied beds" value={rows.length} />
        <Stat label="Unstable" value={unstableCount} danger={unstableCount > 0} />
      </div>

      {loading ? (
        <div style={{ color: "var(--muted)", fontSize: 13 }}>Loading critical-care board…</div>
      ) : rows.length === 0 ? (
        <div style={emptyState}>
          <div style={{ fontWeight: 600, color: "var(--ink-strong)", marginBottom: 4 }}>
            No critical-care patients
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            Patients admitted to ICU or HDU beds appear here with live vitals.
          </div>
        </div>
      ) : (
        <div style={grid}>
          {rows.map((r) => (
            <div key={r.bedId} style={{ ...card, ...(r.unstable ? cardUnstable : null) }}>
              <div style={cardHead}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink-strong)" }}>
                    {r.occupantName}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>
                    {r.ward} · <span style={{ fontFamily: "var(--font-mono)" }}>{r.bedId}</span>
                  </div>
                </div>
                {r.unstable && <span style={unstablePill}>Unstable</span>}
              </div>

              <div style={vitalsGrid}>
                {r.vitals ? (
                  VITALS.map((vd) => {
                    const flag = flagVital(vd, r.vitals[vd.key]);
                    return (
                      <div key={vd.key} style={vitalCell}>
                        <div style={{ fontSize: 10, color: "var(--muted)" }}>{vd.label}</div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 600, color: FLAG_COLOR[flag] }}>
                          {r.vitals[vd.key]}
                          <span style={{ fontSize: 10, fontWeight: 400, color: "var(--muted)" }}> {vd.unit}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ gridColumn: "1 / -1", fontSize: 12, color: "var(--warn)", padding: "6px 0" }}>
                    No vitals recorded yet
                  </div>
                )}
              </div>

              <div style={cardFoot}>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>
                  {r.vitals ? `Updated ${sinceLabel(r.vitals.updatedAt)}` : "Awaiting first reading"}
                </span>
                <Button onClick={() => setRecordFor(r)}>Record vitals</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {recordFor && (
        <VitalsModal
          row={recordFor}
          onClose={() => setRecordFor(null)}
          onDone={async () => {
            setRecordFor(null);
            await refresh();
          }}
        />
      )}
    </div>
  );
}

function Stat({ label, value, danger }) {
  return (
    <div style={{ ...statCard, ...(danger ? { borderColor: "#E4B6B2", background: "#FCF4F3" } : null) }}>
      <div style={{ fontSize: 12, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600, fontFamily: "var(--font-mono)", color: danger ? "#B0281F" : "var(--ink-strong)", marginTop: 2 }}>
        {value}
      </div>
    </div>
  );
}

function VitalsModal({ row, onClose, onDone }) {
  const [vals, setVals] = useState(() => {
    const init = {};
    for (const vd of VITALS) init[vd.key] = String(row.vitals?.[vd.key] ?? "");
    return init;
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const set = (k) => (e) => setVals((v) => ({ ...v, [k]: e.target.value }));

  const save = async () => {
    setBusy(true);
    setErr("");
    try {
      await updateVitals(row.occupantId, vals);
      await onDone();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title={`Vitals — ${row.occupantName}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} disabled={busy}>
            {busy ? "Saving…" : "Save vitals"}
          </Button>
        </>
      }
    >
      {err && <div style={errBox}>{err}</div>}
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>
        {row.ward} · {row.bedId}
      </div>
      {VITALS.map((vd) => {
        const flag = vals[vd.key] ? flagVital(vd, vals[vd.key]) : "normal";
        return (
          <div key={vd.key} style={vitalRow}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: "var(--ink-strong)" }}>{vd.label}</div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>
                Normal {vd.low}–{vd.high} {vd.unit}
              </div>
            </div>
            <input style={{ ...inputStyle, width: 90 }} value={vals[vd.key]} onChange={set(vd.key)} />
            <div style={{ width: 56, textAlign: "right" }}>
              {flag !== "normal" && (
                <span style={{ fontSize: 11, fontWeight: 600, color: FLAG_COLOR[flag] }}>
                  {flag[0].toUpperCase() + flag.slice(1)}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </Modal>
  );
}

const statRow = { display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" };
const statCard = { flex: "0 1 160px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 0, padding: "12px 16px" };
const emptyState = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 0, padding: "28px 24px", textAlign: "center" };
const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 };
const card = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 0, padding: "14px 16px" };
const cardUnstable = { border: "1px solid #E4B6B2", boxShadow: "inset 3px 0 0 #B0281F" };
const cardHead = { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 };
const unstablePill = { fontSize: 11, fontWeight: 600, color: "#B0281F", background: "#F7E4E2", padding: "2px 9px", borderRadius: 0 };
const vitalsGrid = { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6, marginBottom: 12 };
const vitalCell = { background: "var(--surface)", borderRadius: 0, padding: "7px 6px", textAlign: "center" };
const cardFoot = { display: "flex", alignItems: "center", justifyContent: "space-between" };
const vitalRow = { display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: "1px solid var(--border)" };
const errBox = { background: "#F7E9E9", color: "#7A2E2E", fontSize: 12, padding: "8px 11px", borderRadius: 0, marginBottom: 14 };
