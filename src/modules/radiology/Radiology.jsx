import { useEffect, useState, useCallback } from "react";
import {
  MODALITIES,
  STATUS_LABELS,
  listStudies,
  createStudy,
  scheduleStudy,
  markPerformed,
  fileReport,
} from "./radiologyService";
import { listPatients, getPatient } from "../patients/patientService";
import { Button, Modal, Field, inputStyle, PageHeader } from "../../lib/ui";
import { releaseResult, isReleased, releaseStatus } from "../../engines/results";
import { useAuth } from "../../auth/AuthContext";
import ImagingReportPrint from "./ImagingReportPrint";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "requested", label: "Requested" },
  { id: "scheduled", label: "Scheduled" },
  { id: "performed", label: "Performed" },
  { id: "reported", label: "Reported" },
];

export default function Radiology() {
  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [showRequest, setShowRequest] = useState(false);
  const [reportFor, setReportFor] = useState(null);
  const [releaseFor, setReleaseFor] = useState(null);
  const [printFor, setPrintFor] = useState(null);
  const [releasedIds, setReleasedIds] = useState({});
  const { user } = useAuth();

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listStudies({ query, status });
      setStudies(rows);
      const reportedOnes = rows.filter((s) => s.status === "reported");
      const flags = {};
      await Promise.all(reportedOnes.map(async (s) => { flags[s.id] = await isReleased("imaging", s.id); }));
      setReleasedIds((prev) => ({ ...prev, ...flags }));
    
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [query, status]);

  useEffect(() => {
    const t = setTimeout(refresh, 180);
    return () => clearTimeout(t);
  }, [refresh]);

  const act = async (fn, id) => {
    await fn(id);
    await refresh();
  };

  return (
    <div>
      <PageHeader group="Diagnostics" title={<>Radiology &amp; imaging</>} icon="ScanLine" actions={<><Button variant="primary" onClick={() => setShowRequest(true)}>
          + Request study
        </Button></>} />

      <div style={toolbar}>
        <input
          style={{ ...inputStyle, maxWidth: 280 }}
          placeholder="Search patient, hospital no. or accession"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div style={{ display: "flex", gap: 6 }}>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setStatus(f.id)}
              style={{ ...chip, ...(status === f.id ? chipActive : null) }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div style={tableWrap}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Accession", "Patient", "Study", "Modality", "Status", ""].map((h) => (
                <th key={h} style={th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={emptyCell}>
                  Loading…
                </td>
              </tr>
            ) : studies.length === 0 ? (
              <tr>
                <td colSpan={6} style={emptyCell}>
                  No studies match. Request one to get started.
                </td>
              </tr>
            ) : (
              studies.map((s) => (
                <tr key={s.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 12 }}>
                    {s.accession}
                    {s.priority === "urgent" && s.status !== "reported" && (
                      <span style={urgentTag}>Urgent</span>
                    )}
                    {s.urgentFinding && <span style={findingDot} title="Urgent finding" />}
                  </td>
                  <td style={{ ...td, fontWeight: 500, color: "var(--ink-strong)" }}>{s.patientName}</td>
                  <td style={td}>{s.name}</td>
                  <td style={{ ...td, color: "var(--muted)", fontSize: 12 }}>{s.modality}</td>
                  <td style={td}>
                    <StatusChip status={s.status} />
                  </td>
                  <td style={{ ...td, textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: 6 }}>
                      {s.status === "requested" && (
                        <Button onClick={() => act(scheduleStudy, s.id)}>Schedule</Button>
                      )}
                      {s.status === "scheduled" && (
                        <Button onClick={() => act(markPerformed, s.id)}>Mark performed</Button>
                      )}
                      {(s.status === "performed" || s.status === "reported") && (
                        <Button onClick={() => setReportFor(s)}>
                          {s.status === "performed" ? "File report" : "View report"}
                        </Button>
                      )}
                      {s.status === "reported" && (
                        releasedIds[s.id] ? (
                          <>
                            <span style={releasedBadge}>Released ✓</span>
                            <Button onClick={() => setPrintFor(s)}>Print report</Button>
                          </>
                        ) : (
                          <Button variant="primary" onClick={() => setReleaseFor(s)}>Release result</Button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showRequest && (
        <RequestModal
          onClose={() => setShowRequest(false)}
          onDone={async () => {
            setShowRequest(false);
            await refresh();
          }}
        />
      )}

      {reportFor && (
        <ReportModal
          study={reportFor}
          onClose={() => setReportFor(null)}
          onDone={async () => {
            setReportFor(null);
            await refresh();
          }}
        />
      )}
      {releaseFor && (
        <ReleaseModal study={releaseFor} actor={user} onClose={() => setReleaseFor(null)}
          onDone={async () => { setReleaseFor(null); await refresh(); }} />
      )}
      {printFor && <ImagingPrintWrapper study={printFor} onClose={() => setPrintFor(null)} />}
    </div>
  );
}

function ImagingPrintWrapper({ study, onClose }) {
  const [release, setRelease] = useState(null);
  useEffect(() => { releaseStatus("imaging", study.id).then(setRelease).catch((e) => console.error(e)); }, [study.id]);
  return <ImagingReportPrint study={study} release={release} onClose={onClose} actor={useAuth().user} />;
}

function ReleaseModal({ study, actor, onClose, onDone }) {
  const [orderingClinician, setOrderingClinician] = useState(actor?.name || "");
  const [notifyPatient, setNotifyPatient] = useState(true);
  const [patientPhone, setPatientPhone] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    if (study.patientId) getPatient(study.patientId).then((p) => { if (alive) setPatientPhone(p?.phone || null); }).catch((e) => console.error(e));
    return () => { alive = false; };
  }, [study.patientId]);

  const submit = async () => {
    setBusy(true); setErr("");
    try {
      await releaseResult({
        kind: "imaging", id: study.id, patientName: study.patientName, patientPhone,
        hospitalNo: study.hospitalNo, testName: study.name, orderingClinician,
        urgent: study.urgentFinding, notifyPatient: notifyPatient && !!patientPhone, actor,
      });
      await onDone();
    } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title={`Release result — ${study.name}`} onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Releasing…" : "Release"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>{study.patientName} &middot; {study.accession}</div>
      {study.urgentFinding && (
        <div style={urgentNote}>This report has an urgent finding. The clinician notification is flagged urgent.</div>
      )}
      <Field label="Ordering clinician (notified in-app)">
        <input style={inputStyle} value={orderingClinician} onChange={(e) => setOrderingClinician(e.target.value)} />
      </Field>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: patientPhone ? "var(--ink)" : "var(--muted)", cursor: patientPhone ? "pointer" : "not-allowed" }}>
        <input type="checkbox" checked={notifyPatient} disabled={!patientPhone} onChange={(e) => setNotifyPatient(e.target.checked)} />
        {patientPhone ? `Also notify the patient by SMS (${patientPhone})` : "No phone number on file \u2014 patient cannot be SMS'd"}
      </label>
    </Modal>
  );
}

function StatusChip({ status }) {
  const tint = {
    requested: { bg: "#E3ECF7", fg: "#3A5170" },
    scheduled: { bg: "#EDE7F5", fg: "#553A80" },
    performed: { bg: "#FBF0DC", fg: "#8A5A17" },
    reported: { bg: "#D3E1F8", fg: "#1E3350" },
  }[status];
  return (
    <span style={{ background: tint.bg, color: tint.fg, fontSize: 11, fontWeight: 500, padding: "2px 9px", borderRadius: 999 }}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function RequestModal({ onClose, onDone }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [code, setCode] = useState(MODALITIES[0].code);
  const [priority, setPriority] = useState("routine");
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
      await createStudy({
        patientId: selected.id,
        patientName: `${selected.lastName}, ${selected.firstName}`,
        hospitalNo: selected.hospitalNo,
        code,
        priority,
      });
      await onDone();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Request study"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={busy || !selected}>
            {busy ? "Requesting…" : "Request"}
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
      <div style={{ maxHeight: 150, overflowY: "auto", marginBottom: 14 }}>
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
        {results.length === 0 && (
          <div style={{ fontSize: 12, color: "var(--muted)", padding: "8px 2px" }}>No patients match.</div>
        )}
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <Field label="Study">
            <select style={inputStyle} value={code} onChange={(e) => setCode(e.target.value)}>
              {MODALITIES.map((m) => (
                <option key={m.code} value={m.code}>
                  {m.name} ({m.modality})
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div style={{ width: 130 }}>
          <Field label="Priority">
            <select style={inputStyle} value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="routine">Routine</option>
              <option value="urgent">Urgent</option>
            </select>
          </Field>
        </div>
      </div>
    </Modal>
  );
}

function ReportModal({ study, onClose, onDone }) {
  const [report, setReport] = useState(study.report || "");
  const [urgent, setUrgent] = useState(study.urgentFinding || false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const save = async () => {
    if (!report.trim()) {
      setErr("Enter a report.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      await fileReport(study.id, { report, urgentFinding: urgent });
      await onDone();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title={`Report — ${study.name}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} disabled={busy}>
            {busy ? "Filing…" : "File report"}
          </Button>
        </>
      }
    >
      {err && <div style={errBox}>{err}</div>}
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>
        {study.patientName} · {study.hospitalNo} · {study.accession}
      </div>
      <Field label="Findings & impression">
        <textarea
          style={{ ...inputStyle, minHeight: 120, resize: "vertical", fontFamily: "var(--font-sans)" }}
          value={report}
          onChange={(e) => setReport(e.target.value)}
          placeholder="Clinical findings and radiological impression…"
        />
      </Field>
      <label style={urgentCheck}>
        <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} />
        Flag urgent finding — raises a critical alert
      </label>
    </Modal>
  );
}

const header = { display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 18 };
const toolbar = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 14,
  flexWrap: "wrap",
};
const chip = {
  font: "inherit",
  fontSize: 12,
  fontWeight: 500,
  padding: "6px 12px",
  borderRadius: 999,
  border: "1px solid var(--border-strong)",
  background: "var(--surface-2)",
  color: "var(--muted)",
  cursor: "pointer",
};
const chipActive = { background: "var(--ink-strong)", color: "#fff", borderColor: "var(--ink-strong)" };
const tableWrap = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, overflow: "auto" };
const th = { textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--muted)", padding: "11px 14px", background: "var(--surface)" };
const td = { padding: "11px 14px", fontSize: 13, verticalAlign: "middle" };
const emptyCell = { padding: "28px 14px", textAlign: "center", color: "var(--muted)", fontSize: 13 };
const urgentTag = {
  fontSize: 10,
  fontWeight: 600,
  color: "#8A5A17",
  background: "#FBF0DC",
  padding: "1px 6px",
  borderRadius: 5,
  marginLeft: 7,
};
const findingDot = {
  display: "inline-block",
  width: 7,
  height: 7,
  borderRadius: "50%",
  background: "#B0281F",
  marginLeft: 7,
  verticalAlign: "middle",
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
const resultRowActive = { background: "var(--accent-bg)", border: "1px solid var(--border-strong)" };
const urgentCheck = { display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink)", marginTop: 4, cursor: "pointer" };
const errBox = { background: "#F7E9E9", color: "#7A2E2E", fontSize: 12, padding: "8px 11px", borderRadius: 8, marginBottom: 14 };
const releasedBadge = { fontSize: 11, fontWeight: 600, color: "var(--good)", background: "var(--good-bg)", padding: "5px 10px", borderRadius: 7 };
const urgentNote = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12, padding: "8px 11px", borderRadius: 8, marginBottom: 14 };
