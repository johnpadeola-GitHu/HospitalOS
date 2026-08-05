import { useEffect, useState, useCallback } from "react";
import { listDrugs, listPrescriptions, createPrescription, fulfillPrescription, cancelPrescription, checkInteractions } from "./pharmacyService";
import { listPatients } from "../patients/patientService";
import { Button, Modal, Field, inputStyle, PageHeader } from "../../lib/ui";
import { useAuth } from "../../auth/AuthContext";

const STATUS_TINT = {
  pending: { bg: "#FBF0DC", fg: "#8A5A17", label: "Pending" },
  fulfilled: { bg: "#E6EFDF", fg: "#4A6329", label: "Fulfilled" },
  cancelled: { bg: "#EDEEF0", fg: "#5F5E5A", label: "Cancelled" },
};

export default function Prescriptions() {
  const { may } = useAuth();
  const [rows, setRows] = useState([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [err, setErr] = useState("");

  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      setRows(await listPrescriptions(statusFilter));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { refresh(); }, [refresh]);

  const fulfill = async (rx) => {
    setErr("");
    setBusyId(rx.id);
    try {
      await fulfillPrescription(rx.id);
      await refresh({ silent: true });
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const cancel = async (rx) => {
    setErr("");
    setBusyId(rx.id);
    try {
      await cancelPrescription(rx.id);
      await refresh({ silent: true });
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Prescriptions"
        subtitle="Clinician prescriptions awaiting pharmacy fulfilment."
        actions={may("patient-care:register") ? <Button onClick={() => setShowNew(true)}>New prescription</Button> : null}
      />

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {["pending", "fulfilled", "cancelled", "all"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: "6px 12px", borderRadius: 0, fontSize: 12.5, cursor: "pointer",
              border: "1px solid var(--border)",
              background: statusFilter === s ? "var(--accent-bg)" : "transparent",
              color: statusFilter === s ? "var(--accent)" : "var(--charcoal)",
              fontWeight: statusFilter === s ? 600 : 450, textTransform: "capitalize",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {err && <div style={{ color: "var(--bad)", fontSize: 13, marginBottom: 10 }}>{err}</div>}

      {loading ? (
        <div style={{ color: "var(--muted)", fontSize: 13 }}>Loading…</div>
      ) : rows.length === 0 ? (
        <div style={{ color: "var(--muted)", fontSize: 13, padding: "24px 0" }}>No {statusFilter === "all" ? "" : statusFilter} prescriptions.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.map((rx) => {
            const tint = STATUS_TINT[rx.status] || STATUS_TINT.cancelled;
            return (
              <div key={rx.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", border: "1px solid var(--border)", borderRadius: 0, background: "#fff" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--charcoal-strong)" }}>
                    {rx.quantity} × {rx.drugName} <span style={{ color: "var(--muted)", fontWeight: 400 }}>· {rx.ref}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>
                    {rx.patientName} ({rx.hospitalNo}){rx.dosage ? ` · ${rx.dosage}` : ""}{rx.prescribedBy ? ` · by ${rx.prescribedBy}` : ""}
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: tint.fg, background: tint.bg, padding: "3px 9px", borderRadius: 0 }}>{tint.label}</span>
                {rx.status === "pending" && (
                  <div style={{ display: "flex", gap: 6 }}>
                    {may("pharmacy:dispense") && (
                      <Button onClick={() => fulfill(rx)} disabled={busyId === rx.id}>{busyId === rx.id ? "…" : "Fulfil"}</Button>
                    )}
                    <button
                      onClick={() => cancel(rx)}
                      disabled={busyId === rx.id}
                      style={{ padding: "7px 12px", borderRadius: 0, border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", fontSize: 12.5, cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showNew && (
        <NewPrescriptionModal
          onClose={() => setShowNew(false)}
          onDone={async () => { setShowNew(false); await refresh({ silent: true }); }}
        />
      )}
    </div>
  );
}

function NewPrescriptionModal({ onClose, onDone }) {
  const [patients, setPatients] = useState([]);
  const [drugs, setDrugs] = useState([]);
  const [patientId, setPatientId] = useState("");
  const [drugId, setDrugId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [dosage, setDosage] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [interactions, setInteractions] = useState([]);

  useEffect(() => {
    Promise.all([listPatients(), listDrugs({})])
      .then(([p, d]) => { setPatients(p); setDrugs(d); })
      .catch((e) => setErr(e.message));
  }, []);

  // When both a patient and drug are chosen, check for interactions with the
  // patient's current medications and surface a warning (does not block).
  useEffect(() => {
    if (!patientId || !drugId) { setInteractions([]); return; }
    let live = true;
    checkInteractions(patientId, drugId)
      .then((r) => { if (live) setInteractions(r.interactions || []); })
      .catch(() => { if (live) setInteractions([]); });
    return () => { live = false; };
  }, [patientId, drugId]);

  const submit = async () => {
    if (!patientId || !drugId) { setErr("Choose a patient and a drug."); return; }
    const q = parseInt(quantity, 10);
    if (!q || q < 1) { setErr("Enter a quantity of at least 1."); return; }
    setBusy(true);
    setErr("");
    try {
      await createPrescription({ patientId, drugId, quantity: q, dosage: dosage.trim() || undefined, notes: notes.trim() || undefined });
      await onDone();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title="New prescription"
      onClose={onClose}
      footer={<Button onClick={submit} disabled={busy}>{busy ? "Saving…" : "Prescribe"}</Button>}
    >
      {err && <div style={{ color: "var(--bad)", fontSize: 13, marginBottom: 10 }}>{err}</div>}
      <Field label="Patient">
        <select style={inputStyle} value={patientId} onChange={(e) => setPatientId(e.target.value)}>
          <option value="">Select patient…</option>
          {patients.map((p) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.hospitalNo})</option>)}
        </select>
      </Field>
      <Field label="Drug">
        <select style={inputStyle} value={drugId} onChange={(e) => setDrugId(e.target.value)}>
          <option value="">Select drug…</option>
          {drugs.map((d) => <option key={d.id} value={d.id}>{d.name} — {d.stock} {d.unit}(s) in stock</option>)}
        </select>
      </Field>

      {interactions.length > 0 && (
        <div style={{ border: "1px solid #E9C6C2", background: "#FBF1F0", borderRadius: 0, padding: "10px 12px", marginBottom: 12 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--bad)", marginBottom: 4 }}>
            ⚠ Interaction warning ({interactions.length})
          </div>
          {interactions.map((it, i) => (
            <div key={i} style={{ fontSize: 12, color: "var(--charcoal)", marginTop: 3 }}>
              <span style={{ fontWeight: 600, textTransform: "capitalize" }}>{it.severity}</span> with <span style={{ fontWeight: 600 }}>{it.with}</span> — {it.note}
            </div>
          ))}
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 5 }}>Clinical judgement required — you can still prescribe if appropriate.</div>
        </div>
      )}
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ width: 120 }}>
          <Field label="Quantity">
            <input type="number" min="1" style={inputStyle} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Dosage (optional)">
            <input style={inputStyle} value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="1 tab twice daily × 5 days" />
          </Field>
        </div>
      </div>
      <Field label="Notes (optional)">
        <input style={inputStyle} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
    </Modal>
  );
}
