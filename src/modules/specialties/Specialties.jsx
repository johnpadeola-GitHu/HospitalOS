import { useEffect, useState, useCallback } from "react";
import {
  DEPARTMENTS,
  STATUS_LABELS,
  listDepartments,
  listReferrals,
  createReferral,
  advanceReferral,
  REFERRAL_STATUSES,
} from "./specialtiesService";
import { listPatients } from "../patients/patientService";
import { Button, Modal, Field, inputStyle, PageHeader } from "../../lib/ui";

export default function Specialties() {
  const [depts, setDepts] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [dept, setDept] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [d, r] = await Promise.all([listDepartments(), listReferrals({ deptCode: dept })]);
      setDepts(d);
      setReferrals(r);
    
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [dept]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const advance = async (id) => {
    await advanceReferral(id);
    await refresh();
  };

  return (
    <div>
      <PageHeader group="Patient care" title={<>Specialist clinics</>} icon="Stethoscope" actions={<><Button variant="primary" onClick={() => setShowNew(true)}>
          + New referral
        </Button></>} />

      <div style={{ marginBottom: 16 }}>
        <select style={{ ...inputStyle, maxWidth: 260 }} value={dept} onChange={(e) => setDept(e.target.value)}>
          <option value="all">All departments</option>
          <optgroup label="Medical">
            {DEPARTMENTS.filter((d) => d.kind === "Medical").map((d) => (
              <option key={d.code} value={d.code}>{d.name}</option>
            ))}
          </optgroup>
          <optgroup label="Surgical">
            {DEPARTMENTS.filter((d) => d.kind === "Surgical").map((d) => (
              <option key={d.code} value={d.code}>{d.name}</option>
            ))}
          </optgroup>
        </select>
      </div>

      {dept === "all" && (
        <div style={deptGrid}>
          {depts.map((d) => (
            <button key={d.code} style={deptCard} onClick={() => setDept(d.code)}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-strong)" }}>{d.name}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                {d.kind}
                {d.openReferrals > 0 && (
                  <span style={openBadge}>{d.openReferrals} open</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <div style={{ marginTop: dept === "all" ? 22 : 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-strong)", marginBottom: 10 }}>
          Referrals
        </div>
        <div style={tableWrap}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Ref", "Patient", "Department", "Reason", "Status", ""].map((h) => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={emptyCell}>Loading…</td></tr>
              ) : referrals.length === 0 ? (
                <tr><td colSpan={6} style={emptyCell}>No referrals for this filter.</td></tr>
              ) : (
                referrals.map((r) => {
                  const canAdvance = REFERRAL_STATUSES.indexOf(r.status) < REFERRAL_STATUSES.length - 1;
                  const nextLabel = canAdvance ? STATUS_LABELS[REFERRAL_STATUSES[REFERRAL_STATUSES.indexOf(r.status) + 1]] : null;
                  return (
                    <tr key={r.id} style={{ borderTop: "1px solid var(--border)" }}>
                      <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 12 }}>{r.ref}</td>
                      <td style={{ ...td, fontWeight: 500, color: "var(--ink-strong)" }}>{r.patientName}</td>
                      <td style={td}>{r.deptName}</td>
                      <td style={{ ...td, color: "var(--muted)", maxWidth: 220 }}>{r.reason}</td>
                      <td style={td}><RefStatus status={r.status} /></td>
                      <td style={{ ...td, textAlign: "right" }}>
                        {canAdvance && <Button onClick={() => advance(r.id)}>{nextLabel} →</Button>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showNew && (
        <ReferralModal onClose={() => setShowNew(false)} onDone={async () => { setShowNew(false); await refresh(); }} />
      )}
    </div>
  );
}

function RefStatus({ status }) {
  const tint = {
    referred: { bg: "#E3ECF7", fg: "#3A5170" },
    scheduled: { bg: "#FBF0DC", fg: "#8A5A17" },
    seen: { bg: "#E6EFDF", fg: "#4A6329" },
  }[status];
  return (
    <span style={{ background: tint.bg, color: tint.fg, fontSize: 11, fontWeight: 500, padding: "2px 9px", borderRadius: 0 }}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function ReferralModal({ onClose, onDone }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [deptCode, setDeptCode] = useState(DEPARTMENTS[0].code);
  const [reason, setReason] = useState("");
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
      await createReferral({
        patientName: `${selected.lastName}, ${selected.firstName}`,
        hospitalNo: selected.hospitalNo,
        deptCode,
        reason,
      });
      await onDone();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title="New referral"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={busy || !selected}>{busy ? "Referring…" : "Refer"}</Button>
        </>
      }
    >
      {err && <div style={errBox}>{err}</div>}
      <Field label="Find patient">
        <input style={inputStyle} placeholder="Name or hospital no." value={query} onChange={(e) => { setQuery(e.target.value); setSelected(null); }} />
      </Field>
      <div style={{ maxHeight: 120, overflowY: "auto", marginBottom: 14 }}>
        {results.map((p) => (
          <button key={p.id} onClick={() => setSelected(p)} style={{ ...resultRow, ...(selected?.id === p.id ? resultRowActive : null) }}>
            <span style={{ fontWeight: 500, color: "var(--ink-strong)" }}>{p.lastName}, {p.firstName}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>{p.hospitalNo}</span>
          </button>
        ))}
      </div>
      <Field label="Department">
        <select style={inputStyle} value={deptCode} onChange={(e) => setDeptCode(e.target.value)}>
          <optgroup label="Medical">
            {DEPARTMENTS.filter((d) => d.kind === "Medical").map((d) => <option key={d.code} value={d.code}>{d.name}</option>)}
          </optgroup>
          <optgroup label="Surgical">
            {DEPARTMENTS.filter((d) => d.kind === "Surgical").map((d) => <option key={d.code} value={d.code}>{d.name}</option>)}
          </optgroup>
        </select>
      </Field>
      <Field label="Reason for referral">
        <input style={inputStyle} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Brief clinical reason" />
      </Field>
    </Modal>
  );
}

const header = { display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 18 };
const deptGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 10 };
const deptCard = { textAlign: "left", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 0, padding: "12px 14px", cursor: "pointer", font: "inherit" };
const openBadge = { fontSize: 10, fontWeight: 600, color: "#8A5A17", background: "#FBF0DC", padding: "1px 6px", borderRadius: 0, marginLeft: 7 };
const tableWrap = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 0, overflow: "auto" };
const th = { textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--muted)", padding: "11px 14px", background: "var(--surface)" };
const td = { padding: "11px 14px", fontSize: 13, verticalAlign: "middle" };
const emptyCell = { padding: "28px 14px", textAlign: "center", color: "var(--muted)", fontSize: 13 };
const resultRow = { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", border: "1px solid transparent", borderRadius: 0, background: "none", cursor: "pointer", font: "inherit", fontSize: 13 };
const resultRowActive = { background: "var(--accent-bg)", border: "1px solid var(--border-strong)" };
const errBox = { background: "#F7E9E9", color: "#7A2E2E", fontSize: 12, padding: "8px 11px", borderRadius: 0, marginBottom: 14 };
