import { useEffect, useState, useCallback } from "react";
import {
  MODALITIES, TECH_FIELDS, STATUS_LABELS,
  listStudies, createStudy, scheduleStudy, markPerformed, fileReport, modalitiesIn,
} from "../radiology/radiologyService";
import { listPatients, getPatient } from "../patients/patientService";
import { PageHeader, StatCard, Pill, Button, Modal, Field, inputStyle, EmptyState } from "../../lib/ui";
import { priceFor } from "../../engines/pricing";
import { releaseResult, isReleased } from "../../engines/results";
import { useAuth } from "../../auth/AuthContext";

const naira = (n) => "\u20a6" + Math.round(n).toLocaleString();

/**
 * One workspace, reused by Ultrasound/CT/MRI. Each caller supplies its
 * modality group name, page icon, and subtitle. Studies are the SAME records
 * radiologyService and the generic Radiology worklist use — this is a
 * filtered lens on shared data, not a parallel list.
 */
export default function ModalityWorkspace({ modalityGroup, icon, subtitle }) {
  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequest, setShowRequest] = useState(false);
  const [performFor, setPerformFor] = useState(null);
  const [reportFor, setReportFor] = useState(null);
  const [releaseFor, setReleaseFor] = useState(null);
  const [releasedIds, setReleasedIds] = useState({});
  const modalityCodes = modalitiesIn(modalityGroup);
  const techFields = TECH_FIELDS[modalityGroup] || [];
  const { user } = useAuth();

  const refresh = useCallback(async () => {
    setLoading(true);
    const all = await listStudies({ status: "all" });
    const mine = all.filter((s) => s.modality === modalityGroup);
    setStudies(mine);
    const reportedOnes = mine.filter((s) => s.status === "reported");
    const flags = {};
    await Promise.all(reportedOnes.map(async (s) => { flags[s.id] = await isReleased("imaging", s.id); }));
    setReleasedIds((prev) => ({ ...prev, ...flags }));
    setLoading(false);
  }, [modalityGroup]);

  useEffect(() => { refresh(); }, [refresh]);

  const active = studies.filter((s) => s.status !== "reported");
  const reported = studies.filter((s) => s.status === "reported");
  const counts = {
    requested: studies.filter((s) => s.status === "requested").length,
    scheduled: studies.filter((s) => s.status === "scheduled").length,
    performed: studies.filter((s) => s.status === "performed").length,
    reported: reported.length,
  };

  return (
    <div>
      <PageHeader
        group="Diagnostics"
        title={modalityGroup}
        icon={icon}
        subtitle={subtitle}
        actions={<Button variant="primary" icon="Plus" onClick={() => setShowRequest(true)}>Request study</Button>}
      />

      <div style={statGrid}>
        <StatCard label="Requested" value={counts.requested} />
        <StatCard label="Scheduled" value={counts.scheduled} tone="info" />
        <StatCard label="Performed" value={counts.performed} tone="warn" sub="awaiting report" />
        <StatCard label="Reported" value={counts.reported} tone="good" />
        <StatCard label="Protocols" value={modalityCodes.length} sub="study types offered" />
      </div>

      {loading ? (
        <div style={{ color: "var(--muted)", fontSize: 13 }}>Loading worklist…</div>
      ) : active.length === 0 ? (
        <EmptyState icon={icon} title={`No ${modalityGroup.toLowerCase()} studies in progress`} hint="Request a study to populate the worklist." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
          {active.map((s) => (
            <StudyRow key={s.id} s={s} techFields={techFields}
              onSchedule={async () => { await scheduleStudy(s.id); await refresh(); }}
              onPerform={() => setPerformFor(s)}
              onReport={() => setReportFor(s)}
            />
          ))}
        </div>
      )}

      {reported.length > 0 && (
        <>
          <div style={sectionTitle}>Reported ({reported.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {reported.map((s) => (
              <div key={s.id} style={reportedRow}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontWeight: 600, color: "var(--ink-strong)" }}>{s.patientName}</span>
                  <span style={{ color: "var(--muted)" }}> — {s.name}</span>
                  {s.urgentFinding && <Pill tone="bad">Urgent finding</Pill>}
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", marginRight: 10 }}>{s.accession}</span>
                {releasedIds[s.id] ? (
                  <span style={releasedBadge}>Released ✓</span>
                ) : (
                  <Button variant="primary" onClick={() => setReleaseFor(s)}>Release result</Button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {showRequest && (
        <RequestModal modalityCodes={modalityCodes} onClose={() => setShowRequest(false)}
          onDone={async () => { setShowRequest(false); await refresh(); }} />
      )}
      {performFor && (
        <PerformModal study={performFor} techFields={techFields} onClose={() => setPerformFor(null)}
          onDone={async () => { setPerformFor(null); await refresh(); }} />
      )}
      {reportFor && (
        <ReportModal study={reportFor} onClose={() => setReportFor(null)}
          onDone={async () => { setReportFor(null); await refresh(); }} />
      )}
      {releaseFor && (
        <ReleaseModal study={releaseFor} actor={user} onClose={() => setReleaseFor(null)}
          onDone={async () => { setReleaseFor(null); await refresh(); }} />
      )}
    </div>
  );
}

function ReleaseModal({ study, actor, onClose, onDone }) {
  const [orderingClinician, setOrderingClinician] = useState(actor?.name || "");
  const [notifyPatient, setNotifyPatient] = useState(true);
  const [patientPhone, setPatientPhone] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    if (study.patientId) getPatient(study.patientId).then((p) => { if (alive) setPatientPhone(p?.phone || null); });
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

function StudyRow({ s, techFields, onSchedule, onPerform, onReport }) {
  const m = MODALITIES.find((x) => x.code === s.code);
  return (
    <div style={row}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink-strong)" }}>{s.name}</span>
          <Pill tone={s.priority === "urgent" ? "bad" : "muted"}>{s.priority}</Pill>
          <Pill tone={s.status === "performed" ? "warn" : "info"}>{STATUS_LABELS[s.status]}</Pill>
        </div>
        <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3 }}>
          {s.patientName} · <span style={{ fontFamily: "var(--font-mono)" }}>{s.accession}</span>
          {m && <> · {naira(priceFor("radiology", s.code, m.price))}</>}
        </div>
        {Object.keys(s.tech || {}).length > 0 && (
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
            {Object.entries(s.tech).map(([k, v]) => `${techFields.find((f) => f.key === k)?.label || k}: ${v}`).join(" · ")}
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        {s.status === "requested" && <Button onClick={onSchedule}>Schedule</Button>}
        {s.status === "scheduled" && <Button onClick={onPerform}>Mark performed</Button>}
        {s.status === "performed" && <Button variant="primary" onClick={onReport}>File report</Button>}
      </div>
    </div>
  );
}

function RequestModal({ modalityCodes, onClose, onDone }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [code, setCode] = useState(modalityCodes[0]?.code || "");
  const [priority, setPriority] = useState("routine");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      const r = await listPatients({ query, status: "all" });
      if (alive) setResults(r.slice(0, 5));
    }, 180);
    return () => { alive = false; clearTimeout(t); };
  }, [query]);

  const submit = async () => {
    if (!selected) { setErr("Select a patient first."); return; }
    setBusy(true); setErr("");
    try {
      await createStudy({ patientId: selected.id, patientName: `${selected.lastName}, ${selected.firstName}`, hospitalNo: selected.hospitalNo, code, priority });
      await onDone();
    } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title="Request study" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy || !selected}>{busy ? "Requesting…" : "Request"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="Find patient">
        <input style={inputStyle} placeholder="Name or hospital no." value={query} onChange={(e) => { setQuery(e.target.value); setSelected(null); }} />
      </Field>
      <div style={{ maxHeight: 130, overflowY: "auto", marginBottom: 14 }}>
        {results.map((p) => (
          <button key={p.id} onClick={() => setSelected(p)} style={{ ...resultRow, ...(selected?.id === p.id ? resultRowActive : null) }}>
            <span style={{ fontWeight: 500, color: "var(--ink-strong)" }}>{p.lastName}, {p.firstName}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>{p.hospitalNo}</span>
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <Field label="Protocol">
            <select style={inputStyle} value={code} onChange={(e) => setCode(e.target.value)}>
              {modalityCodes.map((m) => <option key={m.code} value={m.code}>{m.name} — {naira(priceFor("radiology", m.code, m.price))}</option>)}
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

function PerformModal({ study, techFields, onClose, onDone }) {
  const [vals, setVals] = useState(() => {
    const init = {};
    for (const f of techFields) init[f.key] = f.options[0];
    return init;
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setBusy(true); setErr("");
    try { await markPerformed(study.id, vals); await onDone(); }
    catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title={`Mark performed — ${study.name}`} onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Saving…" : "Confirm performed"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>
        {study.patientName} · {study.accession}
      </div>
      {techFields.length === 0 ? (
        <div style={{ fontSize: 13, color: "var(--muted)" }}>No technical parameters to record for this modality.</div>
      ) : techFields.map((f) => (
        <Field key={f.key} label={f.label}>
          <select style={inputStyle} value={vals[f.key]} onChange={(e) => setVals((v) => ({ ...v, [f.key]: e.target.value }))}>
            {f.options.map((o) => <option key={o}>{o}</option>)}
          </select>
        </Field>
      ))}
    </Modal>
  );
}

function ReportModal({ study, onClose, onDone }) {
  const [report, setReport] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const save = async () => {
    if (!report.trim()) { setErr("Enter a report."); return; }
    setBusy(true); setErr("");
    try { await fileReport(study.id, { report, urgentFinding: urgent }); await onDone(); }
    catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title={`Report — ${study.name}`} onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={save} disabled={busy}>{busy ? "Filing…" : "File report"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>{study.patientName} · {study.accession}</div>
      <Field label="Findings & impression">
        <textarea style={{ ...inputStyle, minHeight: 120, resize: "vertical", fontFamily: "var(--font-sans)" }}
          value={report} onChange={(e) => setReport(e.target.value)} placeholder="Clinical findings and radiological impression…" />
      </Field>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink)", marginTop: 4, cursor: "pointer" }}>
        <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} />
        Flag urgent finding — raises a critical alert
      </label>
    </Modal>
  );
}

const statGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: 18 };
const sectionTitle = { fontSize: 13, fontWeight: 700, color: "var(--ink-strong)", margin: "6px 0 10px" };
const row = { display: "flex", gap: 14, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "13px 16px", boxShadow: "var(--shadow-sm)" };
const reportedRow = { display: "flex", alignItems: "center", gap: 10, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: "9px 13px", fontSize: 12.5 };
const releasedBadge = { fontSize: 11, fontWeight: 600, color: "var(--good)", background: "var(--good-bg)", padding: "5px 10px", borderRadius: 7 };
const urgentNote = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12, padding: "8px 11px", borderRadius: 8, marginBottom: 14 };
const resultRow = { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", border: "1px solid transparent", borderRadius: 8, background: "none", cursor: "pointer", font: "inherit", fontSize: 13 };
const resultRowActive = { background: "var(--accent-bg)", border: "1px solid var(--border-strong)" };
const errBox = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12, padding: "8px 11px", borderRadius: 8, marginBottom: 14 };
