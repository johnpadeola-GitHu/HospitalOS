import { useEffect, useState, useCallback } from "react";
import * as Icons from "lucide-react";
import {
  NOTE_TYPES, ICD_CATALOGUE, SEVERITY,
  listNotes, fileNote, listDiagnoses, addDiagnosis, resolveDiagnosis,
  listAllergies, addAllergy, recordSummary,
} from "./recordsService";
import { listPatients, ageFromDob } from "../patients/patientService";
import { listOrders } from "../lab/labService";
import { PageHeader, Card, Pill, Button, Modal, Field, inputStyle, EmptyState } from "../../lib/ui";
import { useAuth } from "../../auth/AuthContext";

const SEV_TONE = { mild: "info", moderate: "warn", severe: "bad" };
const DX_TONE = { active: "warn", chronic: "info", resolved: "muted" };

function when(iso) {
  return new Date(iso).toLocaleString([], { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function Records() {
  const { user, may } = useAuth();
  const [patients, setPatients] = useState([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [chart, setChart] = useState(null);
  const [tab, setTab] = useState("notes");
  const [modal, setModal] = useState(null); // 'note' | 'dx' | 'allergy' | {amend: note}
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      const rows = await listPatients({ query, status: "all" });
      if (alive) setPatients(rows.slice(0, 8));
    }, 180);
    return () => { alive = false; clearTimeout(t); };
  }, [query]);

  const loadChart = useCallback(async (p) => {
    if (!p) return setChart(null);
    const [notes, diagnoses, allergies, summary, labs] = await Promise.all([
      listNotes(p.id), listDiagnoses(p.id), listAllergies(p.id), recordSummary(p.id), listOrders({ status: "all" }),
    ]);
    setChart({ notes, diagnoses, allergies, summary, labs: labs.filter((l) => l.patientId === p.id) });
  }, []);

  useEffect(() => { loadChart(selected); }, [selected, loadChart]);

  const pick = (p) => { setSelected(p); setTab("notes"); setErr(""); };
  const refresh = () => loadChart(selected);

  return (
    <div>
      <PageHeader
        group="Patient care"
        title="Medical records"
        icon="FileHeart"
        subtitle="Clinical notes, problem list and allergies — the patient chart"
      />

      {err && <div style={errBanner}>{err}</div>}

      <div style={layout}>
        {/* Patient picker */}
        <div style={pickerCol}>
          <div style={{ position: "relative", marginBottom: 10 }}>
            <Icons.Search size={14} style={{ position: "absolute", left: 10, top: 10, color: "var(--muted)" }} />
            <input style={{ ...inputStyle, paddingLeft: 31 }} placeholder="Find patient…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          {patients.map((p) => {
            const active = selected?.id === p.id;
            return (
              <button key={p.id} onClick={() => pick(p)} style={{ ...pickRow, ...(active ? pickActive : null) }}>
                <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-strong)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.lastName}, {p.firstName}
                  </div>
                  <div style={{ fontSize: 10.5, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>{p.hospitalNo}</div>
                </div>
              </button>
            );
          })}
          {patients.length === 0 && <div style={{ fontSize: 12, color: "var(--muted)", padding: 8 }}>No patients match.</div>}
        </div>

        {/* Chart */}
        <div>
          {!selected ? (
            <EmptyState icon="FileHeart" title="Select a patient" hint="Choose someone from the list to open their chart." />
          ) : !chart ? (
            <div style={{ color: "var(--muted)", fontSize: 13 }}>Loading chart…</div>
          ) : (
            <>
              {/* Banner */}
              <div style={banner}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: "var(--ink-strong)", letterSpacing: "-0.02em" }}>
                    {selected.lastName}, {selected.firstName}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                    <span style={{ fontFamily: "var(--font-mono)" }}>{selected.hospitalNo}</span> · {ageFromDob(selected.dob)}y {selected.sex} · {selected.status}
                    {selected.status === "admitted" && ` · ${selected.ward} ${selected.bed}`}
                  </div>
                </div>
                {chart.allergies.length > 0 && (
                  <div style={allergyFlag}>
                    <Icons.TriangleAlert size={14} />
                    <span>
                      <b>Allergies:</b> {chart.allergies.map((a) => a.substance).join(", ")}
                    </span>
                  </div>
                )}
              </div>

              <div style={tabs}>
                {[["notes", `Notes (${chart.summary.notes})`], ["dx", `Problem list (${chart.summary.activeDiagnoses})`], ["allergy", `Allergies (${chart.summary.allergies})`], ["labs", `Results (${chart.labs.length})`]].map(([id, label]) => (
                  <button key={id} onClick={() => setTab(id)} style={{ ...tabBtn, ...(tab === id ? tabActive : null) }}>{label}</button>
                ))}
              </div>

              {tab === "notes" && (
                <Card
                  title="Clinical notes"
                  action={may("patient-care:note") ? <Button variant="primary" icon="Plus" onClick={() => setModal("note")}>File note</Button> : null}
                >
                  {chart.notes.length === 0 ? (
                    <EmptyState icon="NotebookPen" title="No notes filed" hint="Clinical notes appear here once written." />
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {chart.notes.map((n) => (
                        <div key={n.id} style={noteCard}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7, flexWrap: "wrap" }}>
                            <Pill tone={n.type === "amendment" ? "warn" : "accent"}>
                              {NOTE_TYPES.find((t) => t.key === n.type)?.label || n.type}
                            </Pill>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-strong)" }}>{n.author}</span>
                            <span style={{ fontSize: 11, color: "var(--muted)" }}>{when(n.at)}</span>
                            {n.amendsId && <span style={{ fontSize: 10.5, color: "var(--warn)" }}>amends earlier note</span>}
                            <span style={{ flex: 1 }} />
                            {may("patient-care:note") && (
                              <button style={amendBtn} onClick={() => setModal({ amend: n })}>Amend</button>
                            )}
                          </div>
                          {n.subjective && <NoteLine label="S" text={n.subjective} />}
                          {n.objective && <NoteLine label="O" text={n.objective} />}
                          <NoteLine label="A" text={n.assessment} strong />
                          {n.plan && <NoteLine label="P" text={n.plan} />}
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={immutableNote}>
                    <Icons.Lock size={12} style={{ flexShrink: 0, marginTop: 1 }} />
                    Filed notes cannot be edited or deleted. Corrections are recorded as amendments, leaving the original visible.
                  </div>
                </Card>
              )}

              {tab === "dx" && (
                <Card
                  title="Problem list"
                  action={may("patient-care:note") ? <Button variant="primary" icon="Plus" onClick={() => setModal("dx")}>Add diagnosis</Button> : null}
                >
                  {chart.diagnoses.length === 0 ? (
                    <EmptyState icon="Stethoscope" title="No diagnoses recorded" />
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {chart.diagnoses.map((d) => (
                        <div key={d.id} style={dxRow}>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--muted)", width: 58 }}>{d.code}</span>
                          <span style={{ flex: 1, fontSize: 13, color: "var(--ink-strong)", fontWeight: 500 }}>{d.label}</span>
                          <span style={{ fontSize: 11, color: "var(--muted)" }}>{d.onset}</span>
                          <Pill tone={DX_TONE[d.status]}>{d.status}</Pill>
                          {d.status !== "resolved" && may("patient-care:note") && (
                            <button style={amendBtn} onClick={async () => { await resolveDiagnosis(d.id, user); refresh(); }}>Resolve</button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )}

              {tab === "allergy" && (
                <Card
                  title="Allergies"
                  action={may("patient-care:note") ? <Button variant="primary" icon="Plus" onClick={() => setModal("allergy")}>Record allergy</Button> : null}
                >
                  {chart.allergies.length === 0 ? (
                    <EmptyState icon="ShieldCheck" title="No known allergies" hint="Recording an allergy warns staff before dispensing." />
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {chart.allergies.map((a) => (
                        <div key={a.id} style={dxRow}>
                          <Icons.TriangleAlert size={14} style={{ color: a.severity === "severe" ? "var(--bad)" : "var(--warn)", flexShrink: 0 }} />
                          <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "var(--ink-strong)" }}>{a.substance}</span>
                          <span style={{ fontSize: 12, color: "var(--muted)", flex: 1 }}>{a.reaction}</span>
                          <Pill tone={SEV_TONE[a.severity]}>{a.severity}</Pill>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )}

              {tab === "labs" && (
                <Card title="Results history" pad={false}>
                  {chart.labs.length === 0 ? (
                    <div style={{ padding: 22 }}><EmptyState icon="TestTube" title="No investigations" /></div>
                  ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead><tr>{["Accession", "Test", "Status", "Ordered"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
                      <tbody>
                        {chart.labs.map((l) => (
                          <tr key={l.id} style={{ borderTop: "1px solid var(--border)" }}>
                            <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 11.5 }}>{l.accession}</td>
                            <td style={{ ...td, fontWeight: 600, color: "var(--ink-strong)" }}>{l.testName}</td>
                            <td style={td}><Pill tone={l.status === "verified" ? "good" : "info"}>{l.status}</Pill></td>
                            <td style={{ ...td, color: "var(--muted)", fontSize: 12 }}>{new Date(l.orderedAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      {modal && selected && (
        <RecordModal
          kind={modal}
          patient={selected}
          actor={user}
          onClose={() => setModal(null)}
          onDone={async () => { setModal(null); await refresh(); }}
          onError={(m) => setErr(m)}
        />
      )}
    </div>
  );
}

function NoteLine({ label, text, strong }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 3 }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 700, color: "var(--muted)", width: 12, flexShrink: 0, marginTop: 2 }}>{label}</span>
      <span style={{ fontSize: 12.5, lineHeight: 1.6, color: strong ? "var(--ink-strong)" : "var(--ink)", fontWeight: strong ? 600 : 400 }}>{text}</span>
    </div>
  );
}

function RecordModal({ kind, patient, actor, onClose, onDone, onError }) {
  const amend = typeof kind === "object" ? kind.amend : null;
  const type = amend ? "amendment" : kind;
  const [form, setForm] = useState({
    type: "consultation", subjective: "", objective: "", assessment: "", plan: "",
    code: ICD_CATALOGUE[0].code, status: "active",
    substance: "", reaction: "", severity: "moderate",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true); setErr("");
    try {
      if (type === "note" || type === "amendment") {
        await fileNote({
          patientId: patient.id,
          type: amend ? "amendment" : form.type,
          subjective: form.subjective, objective: form.objective,
          assessment: form.assessment, plan: form.plan,
          actor, amendsId: amend ? amend.id : null,
        });
      } else if (type === "dx") {
        await addDiagnosis({ patientId: patient.id, code: form.code, status: form.status, actor });
      } else if (type === "allergy") {
        await addAllergy({ patientId: patient.id, substance: form.substance, reaction: form.reaction, severity: form.severity, actor });
      }
      await onDone();
    } catch (e) { setErr(e.message); setBusy(false); }
  };

  const titles = { note: "File clinical note", amendment: "Amend note", dx: "Add diagnosis", allergy: "Record allergy" };

  return (
    <Modal
      title={`${titles[type]} — ${patient.lastName}, ${patient.firstName}`}
      onClose={onClose}
      footer={<>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
      </>}
    >
      {err && <div style={errBox}>{err}</div>}

      {amend && (
        <div style={amendBanner}>
          <Icons.Info size={13} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>The original note stays on the record. This amendment is filed alongside it.</span>
        </div>
      )}

      {(type === "note" || type === "amendment") && (
        <>
          {!amend && (
            <Field label="Note type">
              <select style={inputStyle} value={form.type} onChange={set("type")}>
                {NOTE_TYPES.filter((t) => t.key !== "amendment").map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </Field>
          )}
          <Field label="Subjective — what the patient reports">
            <textarea style={ta} value={form.subjective} onChange={set("subjective")} placeholder="History, symptoms…" />
          </Field>
          <Field label="Objective — examination findings">
            <textarea style={ta} value={form.objective} onChange={set("objective")} placeholder="Vitals, examination…" />
          </Field>
          <Field label="Assessment (required)">
            <textarea style={ta} value={form.assessment} onChange={set("assessment")} placeholder="Clinical impression…" />
          </Field>
          <Field label="Plan">
            <textarea style={ta} value={form.plan} onChange={set("plan")} placeholder="Investigations, treatment, follow-up…" />
          </Field>
        </>
      )}

      {type === "dx" && (
        <>
          <Field label="Diagnosis (ICD-10)">
            <select style={inputStyle} value={form.code} onChange={set("code")}>
              {ICD_CATALOGUE.map((c) => <option key={c.code} value={c.code}>{c.code} — {c.label}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select style={inputStyle} value={form.status} onChange={set("status")}>
              <option value="active">Active</option>
              <option value="chronic">Chronic</option>
            </select>
          </Field>
        </>
      )}

      {type === "allergy" && (
        <>
          <Field label="Substance"><input style={inputStyle} value={form.substance} onChange={set("substance")} placeholder="e.g. Penicillin" /></Field>
          <Field label="Reaction"><input style={inputStyle} value={form.reaction} onChange={set("reaction")} placeholder="e.g. Urticarial rash" /></Field>
          <Field label="Severity">
            <select style={inputStyle} value={form.severity} onChange={set("severity")}>
              {SEVERITY.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </>
      )}
    </Modal>
  );
}

const layout = { display: "grid", gridTemplateColumns: "222px 1fr", gap: 16, alignItems: "start" };
const pickerCol = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 10, boxShadow: "var(--shadow-sm)" };
const pickRow = { width: "100%", display: "flex", padding: "7px 8px", background: "none", border: "none", borderRadius: 7, cursor: "pointer", font: "inherit", marginBottom: 1 };
const pickActive = { background: "var(--charcoal-bg)" };
const banner = { display: "flex", gap: 14, alignItems: "center", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "14px 16px", marginBottom: 12, boxShadow: "var(--shadow-sm)", flexWrap: "wrap" };
const allergyFlag = { display: "flex", alignItems: "center", gap: 7, background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12, padding: "7px 11px", borderRadius: 8 };
const tabs = { display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" };
const tabBtn = { font: "inherit", fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--surface-2)", color: "var(--muted)", cursor: "pointer" };
const tabActive = { background: "var(--charcoal)", color: "#fff", borderColor: "var(--charcoal)" };
const noteCard = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 9, padding: "11px 13px" };
const dxRow = { display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderTop: "1px solid var(--border)" };
const amendBtn = { font: "inherit", fontSize: 11, fontWeight: 600, color: "var(--accent)", background: "none", border: "none", cursor: "pointer" };
const immutableNote = { display: "flex", gap: 7, marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border)", fontSize: 11, color: "var(--muted)", lineHeight: 1.5 };
const amendBanner = { display: "flex", gap: 7, background: "var(--warn-bg)", color: "var(--warn)", fontSize: 12, padding: "9px 11px", borderRadius: 8, marginBottom: 14 };
const ta = { ...inputStyle, minHeight: 58, resize: "vertical", fontFamily: "var(--font-sans)", lineHeight: 1.5 };
const th = { textAlign: "left", fontSize: 10.5, fontWeight: 700, color: "var(--muted)", padding: "10px 14px", background: "var(--surface)", textTransform: "uppercase", letterSpacing: "0.05em" };
const td = { padding: "10px 14px", fontSize: 12.5, verticalAlign: "middle" };
const errBanner = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 13, padding: "10px 14px", borderRadius: 10, marginBottom: 14 };
const errBox = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12, padding: "8px 11px", borderRadius: 8, marginBottom: 14 };
