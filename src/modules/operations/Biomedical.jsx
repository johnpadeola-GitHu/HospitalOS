import { useEffect, useState, useCallback } from "react";
import { EQUIP_STATUS, listEquipment, createEquipment, setEquipmentStatus } from "./operationsService";
import { inputStyle, PageHeader, Button, Modal, Field } from "../../lib/ui";

const STATUS_KEYS = Object.keys(EQUIP_STATUS);

export default function Biomedical() {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

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
      <PageHeader group="Operations" title={<>Biomedical engineering</>} icon="Wrench"
        actions={<Button variant="primary" onClick={() => setShowAdd(true)}>+ Add equipment</Button>} />

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
            ) : equipment.length === 0 ? (
              <tr><td colSpan={5} style={emptyCell}>No equipment registered yet.</td></tr>
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

      {showAdd && (
        <AddEquipmentModal
          onClose={() => setShowAdd(false)}
          onDone={async () => { setShowAdd(false); await refresh(); }}
        />
      )}
    </div>
  );
}

function AddEquipmentModal({ onClose, onDone }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [vendor, setVendor] = useState("");
  const [year, setYear] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setBusy(true);
    setErr("");
    try {
      await createEquipment({ name, category, location, vendor, year });
      await onDone();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Add equipment"
      onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={submit} disabled={busy || !name.trim() || !category.trim()}>
          {busy ? "Adding\u2026" : "Add to register"}
        </Button>
      </>}
    >
      {err && <div style={{ color: "var(--bad)", fontSize: 12.5, marginBottom: 12 }}>{err}</div>}
      <Field label="Equipment name">
        <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Infusion pump" autoFocus />
      </Field>
      <Field label="Category">
        <input style={inputStyle} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Patient monitoring" />
      </Field>
      <Field label="Location">
        <input style={inputStyle} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. ICU Bay 3" />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Vendor (optional)">
          <input style={inputStyle} value={vendor} onChange={(e) => setVendor(e.target.value)} />
        </Field>
        <Field label="Year (optional)">
          <input type="number" style={inputStyle} value={year} onChange={(e) => setYear(e.target.value)} />
        </Field>
      </div>
      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
        A tag (e.g. EQ-0101) is assigned automatically. New equipment starts as Operational.
      </div>
    </Modal>
  );
}

const statRow = { display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" };
const statChip = { fontSize: 12, padding: "5px 11px", borderRadius: 999 };
const tableWrap = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, overflow: "auto" };
const th = { textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--muted)", padding: "11px 14px", background: "var(--surface)" };
const td = { padding: "11px 14px", fontSize: 13, verticalAlign: "middle" };
const emptyCell = { padding: "28px 14px", textAlign: "center", color: "var(--muted)", fontSize: 13 };
