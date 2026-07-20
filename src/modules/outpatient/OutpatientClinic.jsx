import { useEffect, useState, useCallback } from "react";
import {
  CLINICS,
  STAGES,
  STAGE_LABELS,
  listVisits,
  checkInVisit,
  advanceVisit,
  setVisitStage,
  waitMinutes,
} from "./visitService";
import { listPatients } from "../patients/patientService";
import { Button, Modal, Field, inputStyle, PageHeader } from "../../lib/ui";

const ACTIVE_STAGES = STAGES.filter((s) => s !== "completed");

export default function OutpatientClinic() {
  const [clinic, setClinic] = useState("all");
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCheckIn, setShowCheckIn] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setVisits(await listVisits({ clinic }));
    
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [clinic]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const byStage = (stage) => visits.filter((v) => v.stage === stage);

  return (
    <div>
      <PageHeader group="Patient care" title={<>Outpatient (GOPD &amp; clinics)</>} icon="ClipboardList" actions={<><Button variant="primary" onClick={() => setShowCheckIn(true)}>
          + Check in patient
        </Button></>} />

      <div style={{ marginBottom: 16 }}>
        <select
          style={{ ...inputStyle, maxWidth: 260 }}
          value={clinic}
          onChange={(e) => setClinic(e.target.value)}
        >
          <option value="all">All clinics</option>
          {CLINICS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ color: "var(--muted)", fontSize: 13 }}>Loading queue…</div>
      ) : (
        <div style={board}>
          {ACTIVE_STAGES.map((stage) => {
            const col = byStage(stage);
            return (
              <div key={stage} style={column}>
                <div style={colHead}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: "var(--ink-strong)" }}>
                    {STAGE_LABELS[stage]}
                  </span>
                  <span style={countPill}>{col.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {col.length === 0 ? (
                    <div style={emptyCol}>Empty</div>
                  ) : (
                    col.map((v) => (
                      <VisitCard key={v.id} visit={v} onChanged={refresh} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCheckIn && (
        <CheckInModal
          onClose={() => setShowCheckIn(false)}
          onDone={async () => {
            setShowCheckIn(false);
            await refresh();
          }}
        />
      )}
    </div>
  );
}

function VisitCard({ visit, onChanged }) {
  const [busy, setBusy] = useState(false);
  const wait = waitMinutes(visit.checkedInAt);
  const isLast = visit.stage === "with-doctor";

  const advance = async () => {
    setBusy(true);
    try {
      await advanceVisit(visit.id);
      await onChanged();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };
  const complete = async () => {
    setBusy(true);
    try {
      await setVisitStage(visit.id, "completed");
      await onChanged();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={visitCard}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontWeight: 500, fontSize: 13, color: "var(--ink-strong)" }}>
          {visit.patientName}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>
          {visit.ticket}
        </span>
      </div>
      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
        {visit.clinic}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
        <span style={{ fontSize: 11, color: wait > 30 ? "#A35A2E" : "var(--muted)" }}>
          {wait} min wait
        </span>
        <button
          style={advanceBtn}
          onClick={isLast ? complete : advance}
          disabled={busy}
        >
          {isLast ? "Complete" : "Advance →"}
        </button>
      </div>
    </div>
  );
}

function CheckInModal({ onClose, onDone }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [clinic, setClinic] = useState(CLINICS[0]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      try { const rows = await listPatients({ query, status: "all" }); if (alive) setResults(rows.slice(0, 6)); } catch (e) { console.error(e); if (alive) setResults([]); }
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
      await checkInVisit({
        patientId: selected.id,
        patientName: `${selected.lastName}, ${selected.firstName}`,
        hospitalNo: selected.hospitalNo,
        clinic,
      });
      await onDone();
    } catch (e) {
      setErr(e.message || "Could not check in.");
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Check in patient"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={busy || !selected}>
            {busy ? "Checking in…" : "Check in"}
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

      <div style={{ maxHeight: 180, overflowY: "auto", marginBottom: 14 }}>
        {results.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelected(p)}
            style={{
              ...resultRow,
              ...(selected?.id === p.id ? resultRowActive : null),
            }}
          >
            <span style={{ fontWeight: 500, color: "var(--ink-strong)" }}>
              {p.lastName}, {p.firstName}
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>
              {p.hospitalNo}
            </span>
          </button>
        ))}
        {results.length === 0 && (
          <div style={{ fontSize: 12, color: "var(--muted)", padding: "8px 2px" }}>
            No patients match.
          </div>
        )}
      </div>

      <Field label="Clinic">
        <select style={inputStyle} value={clinic} onChange={(e) => setClinic(e.target.value)}>
          {CLINICS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>
    </Modal>
  );
}

const header = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  marginBottom: 18,
};
const board = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: 12,
  alignItems: "start",
};
const column = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: 12,
};
const colHead = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 10,
};
const countPill = {
  fontSize: 11,
  fontWeight: 500,
  color: "var(--ink-strong)",
  background: "var(--accent-bg)",
  padding: "1px 8px",
  borderRadius: 999,
};
const emptyCol = { fontSize: 12, color: "var(--muted)", padding: "10px 2px", textAlign: "center" };
const visitCard = {
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: "10px 11px",
};
const advanceBtn = {
  font: "inherit",
  fontSize: 12,
  fontWeight: 500,
  padding: "5px 10px",
  borderRadius: 7,
  border: "1px solid var(--border-strong)",
  background: "var(--ink-strong)",
  color: "#fff",
  cursor: "pointer",
};
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
const resultRowActive = {
  background: "var(--accent-bg)",
  border: "1px solid var(--border-strong)",
};
const errBox = {
  background: "#F7E9E9",
  color: "#7A2E2E",
  fontSize: 12,
  padding: "8px 11px",
  borderRadius: 8,
  marginBottom: 14,
};
