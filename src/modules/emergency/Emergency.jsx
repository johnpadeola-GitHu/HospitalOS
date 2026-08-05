import { useEffect, useState, useCallback } from "react";
import {
  ACUITY,
  ED_STAGES,
  STAGE_LABELS,
  DISPOSITIONS,
  listEncounters,
  presentPatient,
  setStage,
  disposePatient,
  edWaitMinutes,
} from "./emergencyService";
import { listPatients } from "../patients/patientService";
import { Button, Modal, Field, inputStyle, PageHeader } from "../../lib/ui";

export default function Emergency() {
  const [encounters, setEncounters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPresent, setShowPresent] = useState(false);
  const [disposeFor, setDisposeFor] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setEncounters(await listEncounters());
    
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const advance = async (e) => {
    const idx = ED_STAGES.indexOf(e.stage);
    if (idx < ED_STAGES.length - 1) {
      try {
        await setStage(e.id, ED_STAGES[idx + 1]);
        await refresh();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const counts = encounters.reduce((a, e) => {
    a[e.acuity] = (a[e.acuity] || 0) + 1;
    return a;
  }, {});

  return (
    <div>
      <PageHeader group="Patient care" title={<>Emergency &amp; observation</>} icon="Siren" actions={<><Button variant="primary" onClick={() => setShowPresent(true)}>
          + New presentation
        </Button></>} />

      <div style={acuityRow}>
        {[1, 2, 3, 4, 5].map((lvl) => (
          <div key={lvl} style={{ ...acuityChip, background: ACUITY[lvl].bg, color: ACUITY[lvl].color }}>
            <span style={{ fontWeight: 600 }}>{counts[lvl] || 0}</span> {ACUITY[lvl].label}
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ color: "var(--muted)", fontSize: 13 }}>Loading board…</div>
      ) : encounters.length === 0 ? (
        <div style={emptyState}>
          <div style={{ fontWeight: 600, color: "var(--ink-strong)", marginBottom: 4 }}>
            Emergency department clear
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            New presentations appear here, ordered by triage acuity.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {encounters.map((e) => {
            const ac = ACUITY[e.acuity];
            const wait = edWaitMinutes(e.arrivedAt);
            const canAdvance = ED_STAGES.indexOf(e.stage) < ED_STAGES.length - 1;
            return (
              <div key={e.id} style={encCard}>
                <div style={{ ...acuityBar, background: ac.color }} />
                <div style={{ width: 108, flexShrink: 0 }}>
                  <span style={{ ...acuityPill, background: ac.bg, color: ac.color }}>
                    {e.acuity} · {ac.label}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 14, color: "var(--ink-strong)" }}>
                    {e.patientName}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--ink)" }}>{e.complaint}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
                    <span style={{ fontFamily: "var(--font-mono)" }}>{e.encounterNo}</span> ·{" "}
                    {e.hospitalNo} · {STAGE_LABELS[e.stage]} ·{" "}
                    <span style={{ color: wait > 20 && e.acuity <= 2 ? "#B0281F" : "var(--muted)" }}>
                      {wait} min
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, alignSelf: "center" }}>
                  {canAdvance && (
                    <Button onClick={() => advance(e)}>
                      {STAGE_LABELS[ED_STAGES[ED_STAGES.indexOf(e.stage) + 1]]} →
                    </Button>
                  )}
                  <Button variant="primary" onClick={() => setDisposeFor(e)}>
                    Dispose
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showPresent && (
        <PresentModal
          onClose={() => setShowPresent(false)}
          onDone={async () => {
            setShowPresent(false);
            await refresh();
          }}
        />
      )}

      {disposeFor && (
        <DisposeModal
          encounter={disposeFor}
          onClose={() => setDisposeFor(null)}
          onDone={async () => {
            setDisposeFor(null);
            await refresh();
          }}
        />
      )}
    </div>
  );
}

function PresentModal({ onClose, onDone }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [unregistered, setUnregistered] = useState(false);
  const [complaint, setComplaint] = useState("");
  const [acuity, setAcuity] = useState(3);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (unregistered) return;
    let alive = true;
    const t = setTimeout(async () => {
      try { const rows = await listPatients({ query, status: "all" }); if (alive) setResults(rows.slice(0, 5)); } catch (e) { console.error(e); if (alive) setResults([]); }
    }, 180);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [query, unregistered]);

  const submit = async () => {
    if (!unregistered && !selected) {
      setErr("Select a patient, or mark as unregistered.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      await presentPatient({
        patientId: unregistered ? null : selected.id,
        patientName: unregistered ? "Unregistered patient" : `${selected.lastName}, ${selected.firstName}`,
        hospitalNo: unregistered ? "\u2014" : selected.hospitalNo,
        complaint,
        acuity,
      });
      await onDone();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title="New presentation"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={busy}>
            {busy ? "Adding…" : "Add to board"}
          </Button>
        </>
      }
    >
      {err && <div style={errBox}>{err}</div>}

      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink)", marginBottom: 12, cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={unregistered}
          onChange={(e) => {
            setUnregistered(e.target.checked);
            setSelected(null);
          }}
        />
        Unregistered patient (register later)
      </label>

      {!unregistered && (
        <>
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
          <div style={{ maxHeight: 130, overflowY: "auto", marginBottom: 14 }}>
            {results.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelected(p)}
                style={{ ...resultRow, ...(selected?.id === p.id ? resultRowActive : null) }}
              >
                <span style={{ fontWeight: 500, color: "var(--ink-strong)" }}>
                  {p.lastName}, {p.firstName}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>
                  {p.hospitalNo}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      <Field label="Presenting complaint">
        <input style={inputStyle} value={complaint} onChange={(e) => setComplaint(e.target.value)} placeholder="e.g. Chest pain" />
      </Field>
      <Field label="Triage acuity">
        <select style={inputStyle} value={acuity} onChange={(e) => setAcuity(Number(e.target.value))}>
          {[1, 2, 3, 4, 5].map((lvl) => (
            <option key={lvl} value={lvl}>
              {lvl} · {ACUITY[lvl].label}
            </option>
          ))}
        </select>
      </Field>
    </Modal>
  );
}

function DisposeModal({ encounter, onClose, onDone }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const run = async (disp) => {
    setBusy(true);
    setErr("");
    try {
      await disposePatient(encounter.id, disp);
      await onDone();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };
  return (
    <Modal
      title="Disposition"
      onClose={onClose}
      footer={
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      }
    >
      {err && <div style={errBox}>{err}</div>}
      <div style={{ fontSize: 13, marginBottom: 14 }}>
        <span style={{ fontWeight: 500, color: "var(--ink-strong)" }}>{encounter.patientName}</span>
        <span style={{ color: "var(--muted)" }}> · {encounter.complaint}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {DISPOSITIONS.map((d) => (
          <button key={d} style={dispBtn} disabled={busy} onClick={() => run(d)}>
            {d[0].toUpperCase() + d.slice(1)}
          </button>
        ))}
      </div>
    </Modal>
  );
}

const header = { display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 18 };
const acuityRow = { display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" };
const acuityChip = { fontSize: 12, padding: "5px 11px", borderRadius: 999 };
const emptyState = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 0, padding: "28px 24px", textAlign: "center" };
const encCard = {
  display: "flex",
  gap: 12,
  alignItems: "stretch",
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: 0,
  padding: "12px 16px",
  position: "relative",
  overflow: "hidden",
};
const acuityBar = { position: "absolute", left: 0, top: 0, bottom: 0, width: 4 };
const acuityPill = { fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999, whiteSpace: "nowrap" };
const dispBtn = {
  font: "inherit",
  fontSize: 13,
  fontWeight: 500,
  padding: "10px 14px",
  borderRadius: 0,
  border: "1px solid var(--border-strong)",
  background: "var(--surface-2)",
  color: "var(--ink)",
  cursor: "pointer",
  textAlign: "left",
};
const resultRow = {
  width: "100%",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "8px 10px",
  border: "1px solid transparent",
  borderRadius: 0,
  background: "none",
  cursor: "pointer",
  font: "inherit",
  fontSize: 13,
};
const resultRowActive = { background: "var(--accent-bg)", border: "1px solid var(--border-strong)" };
const errBox = { background: "#F7E9E9", color: "#7A2E2E", fontSize: 12, padding: "8px 11px", borderRadius: 0, marginBottom: 14 };
