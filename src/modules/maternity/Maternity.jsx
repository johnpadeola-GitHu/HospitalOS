import { useEffect, useState, useCallback } from "react";
import {
  LABOUR_STAGES,
  STAGE_LABELS,
  DELIVERY_MODES,
  listAdmissions,
  admitMother,
  advanceLabour,
  recordDelivery,
} from "./maternityService";
import { Button, Modal, Field, inputStyle } from "../../lib/ui";

function since(iso) {
  const m = Math.round((Date.now() - new Date(iso)) / 60000);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export default function Maternity() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdmit, setShowAdmit] = useState(false);
  const [deliverFor, setDeliverFor] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setRows(await listAdmissions());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const advance = async (id) => {
    await advanceLabour(id);
    await refresh();
  };

  const active = rows.filter((r) => r.stage !== "delivered");
  const delivered = rows.filter((r) => r.stage === "delivered");

  return (
    <div>
      <div style={header}>
        <div>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>Patient care</div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--ink-strong)" }}>
            Maternity &amp; neonatology
          </h1>
        </div>
        <Button variant="primary" onClick={() => setShowAdmit(true)}>
          + Admit mother
        </Button>
      </div>

      {loading ? (
        <div style={{ color: "var(--muted)", fontSize: 13 }}>Loading labour ward…</div>
      ) : (
        <>
          <SectionTitle>In labour ({active.length})</SectionTitle>
          {active.length === 0 ? (
            <div style={emptyState}>No mothers currently in labour.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
              {active.map((a) => {
                const canAdvance = LABOUR_STAGES.indexOf(a.stage) < LABOUR_STAGES.length - 2;
                const nextLabel = canAdvance ? STAGE_LABELS[LABOUR_STAGES[LABOUR_STAGES.indexOf(a.stage) + 1]] : null;
                return (
                  <div key={a.id} style={card}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: 14, color: "var(--ink-strong)" }}>
                        {a.motherName}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
                        <span style={{ fontFamily: "var(--font-mono)" }}>{a.ref}</span> · {a.hospitalNo} ·{" "}
                        {a.gestation} wk · in labour {since(a.admittedAt)}
                      </div>
                    </div>
                    <StageChip stage={a.stage} />
                    <div style={{ display: "flex", gap: 6 }}>
                      {canAdvance && <Button onClick={() => advance(a.id)}>{nextLabel} →</Button>}
                      {a.stage === "second-stage" && (
                        <Button variant="primary" onClick={() => setDeliverFor(a)}>
                          Record delivery
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {delivered.length > 0 && (
            <>
              <SectionTitle>Delivered ({delivered.length})</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {delivered.map((a) => (
                  <div key={a.id} style={{ ...card, alignItems: "flex-start" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: 14, color: "var(--ink-strong)" }}>
                        {a.motherName}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
                        <span style={{ fontFamily: "var(--font-mono)" }}>{a.ref}</span> · {a.delivery.mode}
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                        {a.newborns.map((nb) => (
                          <span key={nb.id} style={{ ...nbChip, ...(nb.apgar < 7 ? nbLow : null) }}>
                            {nb.sex} · {nb.weight}kg · Apgar {nb.apgar}
                          </span>
                        ))}
                      </div>
                    </div>
                    <StageChip stage="delivered" />
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {showAdmit && (
        <AdmitModal onClose={() => setShowAdmit(false)} onDone={async () => { setShowAdmit(false); await refresh(); }} />
      )}
      {deliverFor && (
        <DeliveryModal admission={deliverFor} onClose={() => setDeliverFor(null)} onDone={async () => { setDeliverFor(null); await refresh(); }} />
      )}
    </div>
  );
}

function SectionTitle({ children }) {
  return <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-strong)", marginBottom: 10 }}>{children}</div>;
}

function StageChip({ stage }) {
  const tint = {
    admitted: { bg: "#E3ECF7", fg: "#3A5170" },
    "first-stage": { bg: "#FBF0DC", fg: "#8A5A17" },
    "second-stage": { bg: "#FBEADB", fg: "#A35A2E" },
    delivered: { bg: "#E6EFDF", fg: "#4A6329" },
  }[stage];
  return (
    <span style={{ background: tint.bg, color: tint.fg, fontSize: 11, fontWeight: 500, padding: "2px 9px", borderRadius: 999, whiteSpace: "nowrap" }}>
      {STAGE_LABELS[stage]}
    </span>
  );
}

function AdmitModal({ onClose, onDone }) {
  const [form, setForm] = useState({ motherName: "", hospitalNo: "", gestation: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true);
    setErr("");
    try {
      await admitMother(form);
      await onDone();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Admit mother"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Admitting…" : "Admit"}</Button>
        </>
      }
    >
      {err && <div style={errBox}>{err}</div>}
      <Field label="Mother's name">
        <input style={inputStyle} value={form.motherName} onChange={set("motherName")} />
      </Field>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <Field label="Hospital no.">
            <input style={inputStyle} value={form.hospitalNo} onChange={set("hospitalNo")} placeholder="H00…" />
          </Field>
        </div>
        <div style={{ width: 150 }}>
          <Field label="Gestation (weeks)">
            <input type="number" min="20" max="45" style={inputStyle} value={form.gestation} onChange={set("gestation")} />
          </Field>
        </div>
      </div>
    </Modal>
  );
}

function DeliveryModal({ admission, onClose, onDone }) {
  const [mode, setMode] = useState(DELIVERY_MODES[0]);
  const [newborns, setNewborns] = useState([{ sex: "F", weight: "", apgar: "" }]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const setNb = (i, k) => (e) =>
    setNewborns((list) => list.map((n, idx) => (idx === i ? { ...n, [k]: e.target.value } : n)));
  const addNb = () => setNewborns((l) => [...l, { sex: "F", weight: "", apgar: "" }]);
  const removeNb = (i) => setNewborns((l) => l.filter((_, idx) => idx !== i));

  const submit = async () => {
    setBusy(true);
    setErr("");
    try {
      await recordDelivery(admission.id, { mode, newborns });
      await onDone();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title={`Delivery — ${admission.motherName}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Recording…" : "Record delivery"}</Button>
        </>
      }
    >
      {err && <div style={errBox}>{err}</div>}
      <Field label="Delivery mode">
        <select style={inputStyle} value={mode} onChange={(e) => setMode(e.target.value)}>
          {DELIVERY_MODES.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </Field>

      <div style={{ fontSize: 12, color: "var(--muted)", margin: "6px 0 8px" }}>Newborn(s)</div>
      {newborns.map((n, i) => (
        <div key={i} style={nbRow}>
          <select style={{ ...inputStyle, width: 64 }} value={n.sex} onChange={setNb(i, "sex")}>
            <option value="F">F</option>
            <option value="M">M</option>
          </select>
          <input style={{ ...inputStyle, flex: 1 }} placeholder="Weight (kg)" value={n.weight} onChange={setNb(i, "weight")} />
          <input style={{ ...inputStyle, width: 92 }} placeholder="Apgar" value={n.apgar} onChange={setNb(i, "apgar")} />
          {newborns.length > 1 && (
            <button onClick={() => removeNb(i)} style={removeBtn} aria-label="Remove">&times;</button>
          )}
        </div>
      ))}
      <button onClick={addNb} style={addBtn}>+ Add newborn (twin)</button>
    </Modal>
  );
}

const header = { display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 18 };
const card = { display: "flex", gap: 14, alignItems: "center", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 16px" };
const emptyState = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 24px", textAlign: "center", color: "var(--muted)", fontSize: 13, marginBottom: 22 };
const nbChip = { fontSize: 11, fontWeight: 500, color: "#4A6329", background: "#E6EFDF", padding: "3px 9px", borderRadius: 999 };
const nbLow = { color: "#B0281F", background: "#F7E4E2" };
const nbRow = { display: "flex", gap: 8, alignItems: "center", marginBottom: 8 };
const removeBtn = { background: "none", border: "none", fontSize: 20, color: "var(--muted)", cursor: "pointer", lineHeight: 1 };
const addBtn = { font: "inherit", fontSize: 12, fontWeight: 500, color: "var(--ink-strong)", background: "none", border: "none", cursor: "pointer", padding: "4px 0" };
const errBox = { background: "#F7E9E9", color: "#7A2E2E", fontSize: 12, padding: "8px 11px", borderRadius: 8, marginBottom: 14 };
