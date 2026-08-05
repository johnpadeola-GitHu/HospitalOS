import { useEffect, useState, useCallback } from "react";
import { listPoctResults, listPoctTestTypes, recordPoctResult, POCT_FLAGS } from "./poctService";
import { listPatients } from "../patients/patientService";
import { PageHeader, Button, Modal, Field, inputStyle, EmptyState } from "../../lib/ui";
import { useAuth } from "../../auth/AuthContext";

const FLAG_COLOR = {
  normal: "var(--good)",
  low: "var(--info)",
  high: "var(--warn)",
  abnormal: "var(--bad)",
};

export default function POCT() {
  const { may } = useAuth();
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [showRecord, setShowRecord] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      setRows(await listPoctResults({ query }));
    } catch (e) {
      setErr(e.message);
    }
    setLoading(false);
  }, [query]);

  useEffect(() => {
    const t = setTimeout(load, 180);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div>
      <PageHeader
        group="Laboratory"
        title="Point of care testing"
        icon="Timer"
        actions={
          may("diagnostics:result") && (
            <Button variant="primary" icon="Plus" onClick={() => setShowRecord(true)}>
              Record result
            </Button>
          )
        }
      />

      <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6, marginBottom: 14 }}>
        Results generated and read at the bedside — glucometers, urine dipsticks, rapid antigen tests —
        rather than samples sent to the central laboratory. There is no collect or verify step here: the
        result exists the moment the test is performed.
      </div>

      <input
        style={{ ...inputStyle, maxWidth: 380, marginBottom: 14 }}
        placeholder="Search by test, patient name, or hospital number"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {err && <div style={errBanner}>{err}</div>}

      {loading ? (
        <div style={{ fontSize: 13, color: "var(--muted)", padding: "20px 2px" }}>Loading…</div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon="Timer"
          title={query ? "No results match" : "No point of care results yet"}
          hint={query ? "Try a different search term." : "Record a bedside test result to see it here."}
        />
      ) : (
        <div style={tableWrap}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Time", "Test", "Patient", "Result", "By"].map((h) => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)" }}>
                    {formatTime(r.performedAt)}
                  </td>
                  <td style={{ ...td, fontWeight: 500, color: "var(--ink-strong)" }}>{r.testType}</td>
                  <td style={td}>
                    {r.patientName}
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", marginLeft: 6 }}>
                      {r.hospitalNo}
                    </span>
                  </td>
                  <td style={{ ...td, fontWeight: 600, color: FLAG_COLOR[r.flag] || "var(--ink-strong)" }}>
                    {r.value}{r.unit ? ` ${r.unit}` : ""}
                  </td>
                  <td style={{ ...td, color: "var(--muted)" }}>{r.performedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showRecord && (
        <RecordModal
          onClose={() => setShowRecord(false)}
          onDone={async () => { setShowRecord(false); await load(); }}
        />
      )}
    </div>
  );
}

function formatTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");
  if (isNaN(d)) return iso;
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function RecordModal({ onClose, onDone }) {
  const [testTypes, setTestTypes] = useState([]);
  const [patientQuery, setPatientQuery] = useState("");
  const [patients, setPatients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [testType, setTestType] = useState("");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("");
  const [flag, setFlag] = useState("normal");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    listPoctTestTypes()
      .then((t) => { setTestTypes(t); if (t.length) setTestType(t[0]); })
      .catch((e) => setErr(e.message));
  }, []);

  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      try {
        const rows = await listPatients({ query: patientQuery, status: "all" });
        if (alive) setPatients(rows.slice(0, 6));
      } catch { if (alive) setPatients([]); }
    }, 180);
    return () => { alive = false; clearTimeout(t); };
  }, [patientQuery]);

  const submit = async () => {
    if (!selected) return setErr("Select a patient first.");
    if (!testType) return setErr("Choose a test type.");
    if (!value.trim()) return setErr("Enter the result value.");
    setBusy(true);
    setErr("");
    try {
      await recordPoctResult({ patientId: selected.id, testType, value, unit, flag, notes });
      await onDone();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Record point of care result"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={busy || !selected}>
            {busy ? "Saving…" : "Record result"}
          </Button>
        </>
      }
    >
      {err && <div style={errBox}>{err}</div>}

      <Field label="Find patient">
        <input
          style={inputStyle}
          placeholder="Name or hospital no."
          value={patientQuery}
          onChange={(e) => { setPatientQuery(e.target.value); setSelected(null); }}
        />
      </Field>
      <div style={{ maxHeight: 150, overflowY: "auto", marginBottom: 14 }}>
        {patients.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelected(p)}
            style={{ ...resultRow, ...(selected?.id === p.id ? resultRowActive : null) }}
          >
            <span style={{ fontWeight: 500, color: "var(--ink-strong)" }}>{p.lastName}, {p.firstName}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>{p.hospitalNo}</span>
          </button>
        ))}
        {patients.length === 0 && (
          <div style={{ fontSize: 12, color: "var(--muted)", padding: "8px 2px" }}>No patients match.</div>
        )}
      </div>

      <Field label="Test type">
        <select style={inputStyle} value={testType} onChange={(e) => setTestType(e.target.value)}>
          {testTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </Field>

      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 2 }}>
          <Field label="Result">
            <input style={inputStyle} placeholder="e.g. 6.2, Positive, Protein +" value={value} onChange={(e) => setValue(e.target.value)} />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Unit (optional)">
            <input style={inputStyle} placeholder="mmol/L, %" value={unit} onChange={(e) => setUnit(e.target.value)} />
          </Field>
        </div>
      </div>

      <Field label="Flag">
        <select style={inputStyle} value={flag} onChange={(e) => setFlag(e.target.value)}>
          {POCT_FLAGS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
        </select>
      </Field>

      <Field label="Notes (optional)">
        <input style={inputStyle} placeholder="Anything worth recording alongside the result" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
    </Modal>
  );
}

const tableWrap = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, overflow: "auto" };
const th = { textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--muted)", padding: "11px 14px", background: "var(--surface)" };
const td = { padding: "11px 14px", fontSize: 13, verticalAlign: "middle" };
const errBanner = { background: "var(--bad-bg)", color: "var(--bad)", border: "1px solid var(--bad)", borderRadius: 8, padding: "9px 12px", fontSize: 12.5, marginBottom: 12 };
const errBox = { background: "var(--bad-bg)", color: "var(--bad)", borderRadius: 8, padding: "9px 12px", fontSize: 12.5, marginBottom: 12 };
const resultRow = {
  display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%",
  padding: "9px 11px", borderRadius: 8, border: "1px solid transparent", background: "none",
  cursor: "pointer", textAlign: "left", font: "inherit", marginBottom: 3,
};
const resultRowActive = { background: "var(--accent-bg)", border: "1px solid var(--border-strong)" };
