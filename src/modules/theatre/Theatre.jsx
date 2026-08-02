import { useEffect, useState, useCallback } from "react";
import {
  THEATRES,
  PROCEDURES,
  SURGEONS,
  STAGE_LABELS,
  CASE_STAGES,
  listCases,
  scheduleCase,
  advanceCase,
  getProcedure,
} from "./theatreService";
import { listPatients } from "../patients/patientService";
import { priceFor } from "../../engines/pricing";
import { Button, Modal, Field, inputStyle, PageHeader } from "../../lib/ui";

import { naira } from "../../lib/money";

function timeLabel(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function Theatre() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSchedule, setShowSchedule] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setCases(await listCases());
    
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const advance = async (id) => {
    await advanceCase(id);
    await refresh();
  };

  return (
    <div>
      <PageHeader group="Patient care" title={<>Theatre &amp; day surgery</>} icon="Scissors" actions={<><Button variant="primary" onClick={() => setShowSchedule(true)}>
          + Schedule case
        </Button></>} />

      {loading ? (
        <div style={{ color: "var(--muted)", fontSize: 13 }}>Loading theatre list…</div>
      ) : cases.length === 0 ? (
        <div style={emptyState}>
          <div style={{ fontWeight: 600, color: "var(--ink-strong)", marginBottom: 4 }}>
            No cases on the list
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            Schedule a surgical case to populate the theatre list.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {cases.map((c) => {
            const proc = getProcedure(c.procCode);
            const canAdvance = CASE_STAGES.indexOf(c.stage) < CASE_STAGES.length - 1;
            const nextLabel = canAdvance ? STAGE_LABELS[CASE_STAGES[CASE_STAGES.indexOf(c.stage) + 1]] : null;
            return (
              <div key={c.id} style={caseCard}>
                <div style={{ width: 66, flexShrink: 0, textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 600, color: "var(--ink-strong)" }}>
                    {timeLabel(c.scheduledFor)}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--muted)" }}>{c.theatre}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 14, color: "var(--ink-strong)" }}>
                    {c.procName}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink)" }}>{c.patientName}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
                    <span style={{ fontFamily: "var(--font-mono)" }}>{c.ref}</span> · {c.surgeon} ·{" "}
                    {proc ? naira(priceFor("theatre", c.procCode, proc.price)) : ""}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <StageChip stage={c.stage} />
                  {canAdvance && <Button onClick={() => advance(c.id)}>{nextLabel} →</Button>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showSchedule && (
        <ScheduleModal
          onClose={() => setShowSchedule(false)}
          onDone={async () => {
            setShowSchedule(false);
            await refresh();
          }}
        />
      )}
    </div>
  );
}

function StageChip({ stage }) {
  const tint = {
    scheduled: { bg: "#E3ECF7", fg: "#3A5170" },
    "in-theatre": { bg: "#FBF0DC", fg: "#8A5A17" },
    recovery: { bg: "#EDE7F5", fg: "#553A80" },
    completed: { bg: "#E6EFDF", fg: "#4A6329" },
  }[stage];
  return (
    <span style={{ background: tint.bg, color: tint.fg, fontSize: 11, fontWeight: 500, padding: "2px 9px", borderRadius: 999, whiteSpace: "nowrap" }}>
      {STAGE_LABELS[stage]}
    </span>
  );
}

function ScheduleModal({ onClose, onDone }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [procCode, setProcCode] = useState(PROCEDURES[0].code);
  const [theatre, setTheatre] = useState(THEATRES[0]);
  const [surgeon, setSurgeon] = useState(SURGEONS[0]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      try { const rows = await listPatients({ query, status: "all" }); if (alive) setResults(rows.slice(0, 5)); } catch (e) { console.error(e); if (alive) setResults([]); }
    }, 180);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [query]);

  const submit = async () => {
    if (!selected) {
      setErr("Select a patient first.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      await scheduleCase({
        patientId: selected.id,
        patientName: `${selected.lastName}, ${selected.firstName}`,
        hospitalNo: selected.hospitalNo,
        procCode,
        theatre,
        surgeon,
      });
      await onDone();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Schedule surgical case"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={busy || !selected}>
            {busy ? "Scheduling…" : "Schedule"}
          </Button>
        </>
      }
    >
      {err && <div style={errBox}>{err}</div>}
      <Field label="Find patient">
        <input
          style={inputStyle}
          placeholder="Name or hospital no."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(null);
          }}
        />
      </Field>
      <div style={{ maxHeight: 120, overflowY: "auto", marginBottom: 14 }}>
        {results.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelected(p)}
            style={{ ...resultRow, ...(selected?.id === p.id ? resultRowActive : null) }}
          >
            <span style={{ fontWeight: 500, color: "var(--ink-strong)" }}>
              {p.lastName}, {p.firstName}
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>{p.hospitalNo}</span>
          </button>
        ))}
      </div>
      <Field label="Procedure">
        <select style={inputStyle} value={procCode} onChange={(e) => setProcCode(e.target.value)}>
          {PROCEDURES.map((p) => (
            <option key={p.code} value={p.code}>
              {p.name} — {naira(priceFor("theatre", p.code, p.price))}
            </option>
          ))}
        </select>
      </Field>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <Field label="Theatre">
            <select style={inputStyle} value={theatre} onChange={(e) => setTheatre(e.target.value)}>
              {THEATRES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Surgeon">
            <select style={inputStyle} value={surgeon} onChange={(e) => setSurgeon(e.target.value)}>
              {SURGEONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>
    </Modal>
  );
}

const header = { display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 18 };
const emptyState = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "28px 24px", textAlign: "center" };
const caseCard = { display: "flex", gap: 14, alignItems: "center", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 16px" };
const resultRow = {
  width: "100%",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "8px 10px",
  border: "1px solid transparent",
  borderRadius: 8,
  background: "none",
  cursor: "pointer",
  font: "inherit",
  fontSize: 13,
};
const resultRowActive = { background: "var(--accent-bg)", border: "1px solid var(--border-strong)" };
const errBox = { background: "#F7E9E9", color: "#7A2E2E", fontSize: 12, padding: "8px 11px", borderRadius: 8, marginBottom: 14 };
