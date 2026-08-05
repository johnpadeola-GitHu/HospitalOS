import { useEffect, useState, useCallback } from "react";
import {
  CANCER_SITES,
  STAGES,
  MODALITIES,
  PATHWAY_STATUS,
  STATUS_LABELS,
  listOncology,
  registerOncology,
  recordCycle,
  setStatus,
} from "./oncologyService";
import { listPatients } from "../patients/patientService";
import { Button, Modal, Field, inputStyle, PageHeader } from "../../lib/ui";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "remission", label: "Remission" },
  { id: "palliative", label: "Palliative" },
];

export default function Oncology() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatusFilter] = useState("all");
  const [showNew, setShowNew] = useState(false);
  const [err, setErr] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await listOncology({ status }));
    
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const cycle = async (id) => {
    setErr("");
    try {
      await recordCycle(id);
      await refresh();
    } catch (e) {
      setErr(e.message);
    }
  };

  const changeStatus = async (id, s) => {
    try {
      await setStatus(id, s);
      await refresh();
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div>
      <PageHeader group="Patient care" title={<>Oncology</>} icon="Ribbon" actions={<><Button variant="primary" onClick={() => setShowNew(true)}>+ Register patient</Button></>} />

      {err && <div style={errBanner}>{err}</div>}

      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {FILTERS.map((f) => (
          <button key={f.id} onClick={() => setStatusFilter(f.id)} style={{ ...chip, ...(status === f.id ? chipActive : null) }}>
            {f.label}
          </button>
        ))}
      </div>

      <div style={tableWrap}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Ref", "Patient", "Diagnosis", "Treatment", "Progress", "Status", ""].map((h) => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={emptyCell}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} style={emptyCell}>No patients match.</td></tr>
            ) : (
              rows.map((p) => (
                <tr key={p.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 12 }}>
                    {p.ref}
                    {p.overdue && <span style={overdueDot} title="Cycle overdue" />}
                  </td>
                  <td style={{ ...td, fontWeight: 500, color: "var(--ink-strong)" }}>{p.patientName}</td>
                  <td style={td}>
                    {p.site} <span style={{ color: "var(--muted)" }}>· Stage {p.stage}</span>
                  </td>
                  <td style={{ ...td, fontSize: 12 }}>{p.modality}</td>
                  <td style={td}>
                    {p.modality === "Chemotherapy" ? (
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: p.overdue ? "#B0281F" : "var(--ink)" }}>
                        cycle {p.cyclesDone}/{p.cyclesTotal}
                      </span>
                    ) : (
                      <span style={{ color: "var(--muted)", fontSize: 12 }}>—</span>
                    )}
                  </td>
                  <td style={td}>
                    <select
                      style={{ ...inputStyle, maxWidth: 150, padding: "5px 8px", fontSize: 12 }}
                      value={p.status}
                      onChange={(e) => changeStatus(p.id, e.target.value)}
                    >
                      {PATHWAY_STATUS.map((s) => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ ...td, textAlign: "right" }}>
                    {p.modality === "Chemotherapy" && p.status === "active" && p.cyclesDone < p.cyclesTotal && (
                      <Button onClick={() => cycle(p.id)}>Record cycle</Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showNew && (
        <RegisterModal onClose={() => setShowNew(false)} onDone={async () => { setShowNew(false); await refresh(); }} />
      )}
    </div>
  );
}

function RegisterModal({ onClose, onDone }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [site, setSite] = useState(CANCER_SITES[0]);
  const [stage, setStage] = useState("II");
  const [modality, setModality] = useState(MODALITIES[0]);
  const [cyclesTotal, setCyclesTotal] = useState("6");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      try { const rows = await listPatients({ query, status: "all" }); if (alive) setResults(rows.slice(0, 5)); } catch (e) { console.error(e); if (alive) setResults([]); }
    }, 180);
    return () => { alive = false; clearTimeout(t); };
  }, [query]);

  const submit = async () => {
    if (!selected) { setErr("Select a patient first."); return; }
    setBusy(true);
    setErr("");
    try {
      await registerOncology({
        patientName: `${selected.lastName}, ${selected.firstName}`,
        hospitalNo: selected.hospitalNo,
        site, stage, modality, cyclesTotal,
      });
      await onDone();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Register oncology patient"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={busy || !selected}>{busy ? "Registering…" : "Register"}</Button>
        </>
      }
    >
      {err && <div style={errBox}>{err}</div>}
      <Field label="Find patient">
        <input style={inputStyle} placeholder="Name or hospital no." value={query} onChange={(e) => { setQuery(e.target.value); setSelected(null); }} />
      </Field>
      <div style={{ maxHeight: 110, overflowY: "auto", marginBottom: 14 }}>
        {results.map((p) => (
          <button key={p.id} onClick={() => setSelected(p)} style={{ ...resultRow, ...(selected?.id === p.id ? resultRowActive : null) }}>
            <span style={{ fontWeight: 500, color: "var(--ink-strong)" }}>{p.lastName}, {p.firstName}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>{p.hospitalNo}</span>
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <Field label="Primary site">
            <select style={inputStyle} value={site} onChange={(e) => setSite(e.target.value)}>
              {CANCER_SITES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>
        <div style={{ width: 90 }}>
          <Field label="Stage">
            <select style={inputStyle} value={stage} onChange={(e) => setStage(e.target.value)}>
              {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <Field label="Modality">
            <select style={inputStyle} value={modality} onChange={(e) => setModality(e.target.value)}>
              {MODALITIES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </Field>
        </div>
        {modality === "Chemotherapy" && (
          <div style={{ width: 120 }}>
            <Field label="Total cycles">
              <input type="number" min="1" style={inputStyle} value={cyclesTotal} onChange={(e) => setCyclesTotal(e.target.value)} />
            </Field>
          </div>
        )}
      </div>
    </Modal>
  );
}

const header = { display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 18 };
const chip = { font: "inherit", fontSize: 12, fontWeight: 500, padding: "6px 12px", borderRadius: 0, border: "1px solid var(--border-strong)", background: "var(--surface-2)", color: "var(--muted)", cursor: "pointer" };
const chipActive = { background: "var(--ink-strong)", color: "#fff", borderColor: "var(--ink-strong)" };
const tableWrap = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 0, overflow: "auto" };
const th = { textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--muted)", padding: "11px 14px", background: "var(--surface)" };
const td = { padding: "11px 14px", fontSize: 13, verticalAlign: "middle" };
const emptyCell = { padding: "28px 14px", textAlign: "center", color: "var(--muted)", fontSize: 13 };
const overdueDot = { display: "inline-block", width: 7, height: 7, borderRadius: 0, background: "#B0281F", marginLeft: 7, verticalAlign: "middle" };
const resultRow = { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", border: "1px solid transparent", borderRadius: 0, background: "none", cursor: "pointer", font: "inherit", fontSize: 13 };
const resultRowActive = { background: "var(--accent-bg)", border: "1px solid var(--border-strong)" };
const errBanner = { background: "#F7E9E9", color: "#7A2E2E", fontSize: 13, padding: "10px 14px", borderRadius: 0, marginBottom: 14 };
const errBox = { background: "#F7E9E9", color: "#7A2E2E", fontSize: 12, padding: "8px 11px", borderRadius: 0, marginBottom: 14 };
