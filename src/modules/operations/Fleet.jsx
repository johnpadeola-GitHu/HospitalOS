import { useEffect, useState, useCallback } from "react";
import { VEHICLE_STATUS, listFleet, createVehicle, setVehicleStatus } from "./operationsService";
import { inputStyle, PageHeader, Button, Modal, Field } from "../../lib/ui";

const STATUS_KEYS = Object.keys(VEHICLE_STATUS);

export default function Fleet() {
  const [fleet, setFleet] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

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
    try {
      await setVehicleStatus(id, status);
      await refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const counts = fleet.reduce((a, v) => {
    a[v.status] = (a[v.status] || 0) + 1;
    return a;
  }, {});

  return (
    <div>
      <PageHeader group="Operations" title={<>Ambulance &amp; fleet</>} icon="Ambulance"
        actions={<Button variant="primary" onClick={() => setShowAdd(true)}>+ Add vehicle</Button>} />

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
            ) : fleet.length === 0 ? (
              <tr>
                <td colSpan={5} style={emptyCell}>
                  No vehicles in the fleet yet.
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

      {showAdd && (
        <AddVehicleModal
          onClose={() => setShowAdd(false)}
          onDone={async () => { setShowAdd(false); await refresh(); }}
        />
      )}
    </div>
  );
}

function AddVehicleModal({ onClose, onDone }) {
  const [reg, setReg] = useState("");
  const [type, setType] = useState("");
  const [model, setModel] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setBusy(true);
    setErr("");
    try {
      await createVehicle({ reg, type, model });
      await onDone();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Add vehicle"
      onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={submit} disabled={busy || !reg.trim() || !type.trim() || !model.trim()}>
          {busy ? "Adding\u2026" : "Add to fleet"}
        </Button>
      </>}
    >
      {err && <div style={{ color: "var(--bad)", fontSize: 12.5, marginBottom: 12 }}>{err}</div>}
      <Field label="Registration number">
        <input style={inputStyle} value={reg} onChange={(e) => setReg(e.target.value)} placeholder="e.g. LSD 234 XY" autoFocus />
      </Field>
      <Field label="Type">
        <input style={inputStyle} value={type} onChange={(e) => setType(e.target.value)} placeholder="e.g. Ambulance" />
      </Field>
      <Field label="Model">
        <input style={inputStyle} value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. Toyota Hiace" />
      </Field>
      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>New vehicles start as Available.</div>
    </Modal>
  );
}

const statRow = { display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" };
const statChip = { fontSize: 12, padding: "5px 11px", borderRadius: 999 };
const tableWrap = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 0, overflow: "auto" };
const th = { textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--muted)", padding: "11px 14px", background: "var(--surface)" };
const td = { padding: "11px 14px", fontSize: 13, verticalAlign: "middle" };
const emptyCell = { padding: "28px 14px", textAlign: "center", color: "var(--muted)", fontSize: 13 };
