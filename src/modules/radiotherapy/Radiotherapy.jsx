import { useEffect, useState, useCallback } from "react";
import { INTENT, listCourses, createCourse, deliverFraction } from "./radiotherapyService";
import { listPatients } from "../patients/patientService";
import { Button, Modal, Field, inputStyle, PageHeader } from "../../lib/ui";

export default function Radiotherapy() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [err, setErr] = useState("");
  const refresh = useCallback(async () => {
    setLoading(true);
    try { setRows(await listCourses()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const deliver = async (id) => {
    setErr("");
    try { await deliverFraction(id); await refresh(); } catch (e) { setErr(e.message); }
  };

  return (
    <div>
      <PageHeader group="Diagnostics" title={<>Radiotherapy</>} icon="Radiation" actions={<><Button variant="primary" onClick={() => setShowNew(true)}>+ New course</Button></>} />
      {err && <div style={errBanner}>{err}</div>}
      {loading ? <div style={{ color: "var(--muted)", fontSize: 13 }}>Loading courses…</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map((c) => (
            <div key={c.id} style={card}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 14, color: "var(--ink-strong)" }}>{c.patientName} — {c.site}</div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
                  <span style={{ fontFamily: "var(--font-mono)" }}>{c.ref}</span> · {c.intent} · {c.machine} · {c.totalDose} Gy total
                </div>
                <div style={{ marginTop: 8 }}>
                  <div style={track}><div style={{ ...fill, width: `${(c.fractionsDone / c.fractionsPlanned) * 100}%` }} /></div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4, fontFamily: "var(--font-mono)" }}>
                    fraction {c.fractionsDone}/{c.fractionsPlanned}
                  </div>
                </div>
              </div>
              <div style={{ alignSelf: "center" }}>
                {c.complete ? <span style={donePill}>Complete</span> : <Button onClick={() => deliver(c.id)}>Deliver fraction</Button>}
              </div>
            </div>
          ))}
        </div>
      )}
      {showNew && <NewModal onClose={() => setShowNew(false)} onDone={async () => { setShowNew(false); await refresh(); }} />}
    </div>
  );
}

function NewModal({ onClose, onDone }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ site: "", intent: "Curative", dosePerFraction: "2", fractionsPlanned: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  useEffect(() => { let a = true; const t = setTimeout(async () => { const r = await listPatients({ query, status: "all" }); if (a) setResults(r.slice(0, 5)); }, 180); return () => { a = false; clearTimeout(t); }; }, [query]);
  const submit = async () => {
    if (!selected) { setErr("Select a patient."); return; }
    setBusy(true); setErr("");
    try { await createCourse({ patientName: `${selected.lastName}, ${selected.firstName}`, hospitalNo: selected.hospitalNo, ...form }); await onDone(); }
    catch (e) { setErr(e.message); setBusy(false); }
  };
  return (
    <Modal title="New radiotherapy course" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy || !selected}>{busy ? "Creating…" : "Create"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="Find patient"><input style={inputStyle} placeholder="Name or hospital no." value={query} onChange={(e) => { setQuery(e.target.value); setSelected(null); }} /></Field>
      <div style={{ maxHeight: 110, overflowY: "auto", marginBottom: 14 }}>
        {results.map((p) => (
          <button key={p.id} onClick={() => setSelected(p)} style={{ ...resultRow, ...(selected?.id === p.id ? resultRowActive : null) }}>
            <span style={{ fontWeight: 500, color: "var(--ink-strong)" }}>{p.lastName}, {p.firstName}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>{p.hospitalNo}</span>
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><Field label="Site"><input style={inputStyle} value={form.site} onChange={set("site")} placeholder="e.g. Prostate" /></Field></div>
        <div style={{ width: 130 }}><Field label="Intent"><select style={inputStyle} value={form.intent} onChange={set("intent")}>{INTENT.map((i) => <option key={i}>{i}</option>)}</select></Field></div>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><Field label="Dose/fraction (Gy)"><input type="number" step="0.01" style={inputStyle} value={form.dosePerFraction} onChange={set("dosePerFraction")} /></Field></div>
        <div style={{ flex: 1 }}><Field label="Fractions planned"><input type="number" min="1" style={inputStyle} value={form.fractionsPlanned} onChange={set("fractionsPlanned")} /></Field></div>
      </div>
    </Modal>
  );
}

const header = { display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 18 };
const card = { display: "flex", gap: 14, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 16px" };
const track = { height: 6, borderRadius: 999, background: "var(--surface)", overflow: "hidden", maxWidth: 320 };
const fill = { height: "100%", borderRadius: 999, background: "#2F4A6D" };
const donePill = { fontSize: 11, fontWeight: 500, color: "#4A6329", background: "#E6EFDF", padding: "2px 9px", borderRadius: 999 };
const resultRow = { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", border: "1px solid transparent", borderRadius: 8, background: "none", cursor: "pointer", font: "inherit", fontSize: 13 };
const resultRowActive = { background: "var(--accent-bg)", border: "1px solid var(--border-strong)" };
const errBanner = { background: "#F7E9E9", color: "#7A2E2E", fontSize: 13, padding: "10px 14px", borderRadius: 10, marginBottom: 14 };
const errBox = { background: "#F7E9E9", color: "#7A2E2E", fontSize: 12, padding: "8px 11px", borderRadius: 8, marginBottom: 14 };
