import { useEffect, useState, useCallback } from "react";
import {
  GENOTYPES, CRISIS_TYPES, CRISIS_SEVERITY, SEVERITY_TONE,
  listPatients, registerPatient, toggleHydroxyurea, toggleTransfusionProgramme,
  listCrises, logCrisis, resolveCrisis, scdSummary,
} from "./sickleCellService";
import { PageHeader, StatCard, Card, Pill, Button, Modal, Field, inputStyle, EmptyState } from "../../lib/ui";
import { useAuth } from "../../auth/AuthContext";
import PatientPicker from "../patients/PatientPicker";

function ago(iso) {
  const d = Math.round((Date.now() - new Date(iso)) / 86400000);
  return d < 1 ? "today" : d === 1 ? "1 day ago" : `${d} days ago`;
}

export default function SickleCell() {
  const { user } = useAuth();
  const [tab, setTab] = useState("registry");
  const [patients, setPatients] = useState([]);
  const [crises, setCrises] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [crisisFor, setCrisisFor] = useState(null);
  const [err, setErr] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    const [p, c, s] = await Promise.all([listPatients({}), listCrises({}), scdSummary()]);
    setPatients(p); setCrises(c); setSummary(s); setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const act = async (fn, ...args) => {
    setErr("");
    try { await fn(...args); await refresh(); } catch (e) { setErr(e.message); }
  };

  return (
    <div>
      <PageHeader group="Specialty services" title="Sickle cell centre" icon="Droplet"
        subtitle="Genotype registry, crisis management, and disease-modifying therapy tracking"
        actions={<Button variant="primary" icon="Plus" onClick={() => setShowRegister(true)}>Register patient</Button>} />

      {err && <div style={errBanner}>{err}</div>}

      {summary && (
        <div style={statGrid}>
          <StatCard label="Registered" value={summary.registered} />
          <StatCard label="On hydroxyurea" value={summary.onHydroxyurea} tone="accent" />
          <StatCard label="On transfusion programme" value={summary.onTransfusion} tone="info" />
          <StatCard label="Active crises" value={summary.activeCrises} tone={summary.activeCrises ? "warn" : "default"} />
          <StatCard label="Severe, unresolved" value={summary.severeActive} tone={summary.severeActive ? "bad" : "default"} />
        </div>
      )}

      <div style={tabs}>
        {[["registry", "Patient registry"], ["crises", "Crisis log"]].map(([id, l]) => (
          <button key={id} onClick={() => setTab(id)} style={{ ...tabBtn, ...(tab === id ? tabActive : null) }}>{l}</button>
        ))}
      </div>

      {tab === "registry" && (
        <Card title="Registered patients" pad={false}>
          {loading ? <div style={{ padding: 20, color: "var(--muted)", fontSize: 13 }}>Loading…</div> : patients.length === 0 ? (
            <div style={{ padding: 22 }}><EmptyState icon="Droplet" title="No patients registered" /></div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {patients.map((p, i) => (
                <div key={p.id} style={{ ...row, borderTop: i ? "1px solid var(--border)" : "none" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink-strong)" }}>{p.patientName}</span>
                      <Pill tone="muted">{p.genotype}</Pill>
                      {p.onHydroxyurea && <Pill tone="accent">Hydroxyurea</Pill>}
                      {p.onTransfusionProgramme && <Pill tone="info">Transfusion programme</Pill>}
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3 }}>
                      Registered {p.registeredAt} &middot; last crisis {p.lastCrisisAt ? ago(p.lastCrisisAt) : "none recorded"}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <Button onClick={() => act(toggleHydroxyurea, p.id, user)}>{p.onHydroxyurea ? "Stop" : "Start"} hydroxyurea</Button>
                    <Button onClick={() => act(toggleTransfusionProgramme, p.id, user)}>{p.onTransfusionProgramme ? "Stop" : "Enrol"} transfusion</Button>
                    <Button variant="primary" onClick={() => setCrisisFor(p)}>Log crisis</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === "crises" && (
        <Card title="Crisis log" pad={false}>
          {crises.length === 0 ? (
            <div style={{ padding: 22 }}><EmptyState icon="TriangleAlert" title="No crises logged" /></div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {crises.map((c, i) => (
                <div key={c.id} style={{ ...row, borderTop: i ? "1px solid var(--border)" : "none" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>{c.ref}</span>
                      <span style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink-strong)" }}>{c.patientName}</span>
                      <Pill tone="muted">{c.type}</Pill>
                      <Pill tone={SEVERITY_TONE[c.severity]}>{c.severity}</Pill>
                      <Pill tone={c.resolvedAt ? "good" : "warn"}>{c.resolvedAt ? "Resolved" : "Active"}</Pill>
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3 }}>
                      Admitted {ago(c.admittedAt)}{c.resolvedAt ? ` \u00b7 resolved ${ago(c.resolvedAt)}` : ""}
                    </div>
                    {c.notes && <div style={{ fontSize: 12, color: "var(--ink)", marginTop: 4 }}>{c.notes}</div>}
                  </div>
                  {!c.resolvedAt && <Button variant="primary" onClick={() => act(resolveCrisis, c.id, "", user)}>Mark resolved</Button>}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {showRegister && <RegisterModal actor={user} onClose={() => setShowRegister(false)} onDone={async () => { setShowRegister(false); await refresh(); }} />}
      {crisisFor && <CrisisModal patient={crisisFor} actor={user} onClose={() => setCrisisFor(null)} onDone={async () => { setCrisisFor(null); setTab("crises"); await refresh(); }} />}
    </div>
  );
}

function RegisterModal({ actor, onClose, onDone }) {
  const [form, setForm] = useState({ patientId: null, patientName: "", hospitalNo: "", genotype: GENOTYPES[0] });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true); setErr("");
    try { await registerPatient({ ...form, actor }); await onDone(); } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title="Register patient" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Registering…" : "Register"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="Patient"><PatientPicker value={form} onChange={(p) => setForm((f) => ({ ...f, ...p }))} /></Field>
      <Field label="Genotype"><select style={inputStyle} value={form.genotype} onChange={set("genotype")}>{GENOTYPES.map((g) => <option key={g}>{g}</option>)}</select></Field>
    </Modal>
  );
}

function CrisisModal({ patient, actor, onClose, onDone }) {
  const [type, setType] = useState(CRISIS_TYPES[0]);
  const [severity, setSeverity] = useState(CRISIS_SEVERITY[0]);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setBusy(true); setErr("");
    try { await logCrisis({ patientId: patient.id, type, severity, notes, actor }); await onDone(); }
    catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title={`Log crisis — ${patient.patientName}`} onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Saving…" : "Log crisis"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="Crisis type"><select style={inputStyle} value={type} onChange={(e) => setType(e.target.value)}>{CRISIS_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
      <Field label="Severity"><select style={inputStyle} value={severity} onChange={(e) => setSeverity(e.target.value)}>{CRISIS_SEVERITY.map((s) => <option key={s}>{s}</option>)}</select></Field>
      <Field label="Notes"><textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical", fontFamily: "var(--font-sans)" }} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
    </Modal>
  );
}

const statGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 16 };
const tabs = { display: "flex", gap: 6, marginBottom: 16 };
const tabBtn = { font: "inherit", fontSize: 12.5, fontWeight: 600, padding: "6px 13px", borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--surface-2)", color: "var(--muted)", cursor: "pointer" };
const tabActive = { background: "var(--charcoal)", color: "#fff", borderColor: "var(--charcoal)" };
const row = { display: "flex", gap: 14, padding: "13px 16px", alignItems: "center" };
const errBanner = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 13, padding: "10px 14px", borderRadius: 10, marginBottom: 14 };
const errBox = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12, padding: "8px 11px", borderRadius: 8, marginBottom: 14 };
