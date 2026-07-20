import { useEffect, useState, useCallback } from "react";
import { SPECIMEN_TYPES, STORAGE_UNITS, CONSENT_TYPES, listSpecimens, bankSpecimen, storageUtilisation, biobankSummary } from "./biobankService";
import { listPatients } from "../patients/patientService";
import { PageHeader, StatCard, Card, Pill, Button, Modal, Field, inputStyle, EmptyState } from "../../lib/ui";

export default function Biobank() {
  const [rows, setRows] = useState([]);
  const [storage, setStorage] = useState([]);
  const [summary, setSummary] = useState(null);
  const [query, setQuery] = useState("");
  const [unit, setUnit] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showBank, setShowBank] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [s, st, sum] = await Promise.all([listSpecimens({ query, unit }), storageUtilisation(), biobankSummary()]);
      setRows(s); setStorage(st); setSummary(sum); 
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [query, unit]);

  useEffect(() => { const t = setTimeout(refresh, 150); return () => clearTimeout(t); }, [refresh]);

  return (
    <div>
      <PageHeader group="Diagnostics" title="Biobanking" icon="Archive"
        subtitle="Long-term specimen repository — storage, consent, and research retention"
        actions={<Button variant="primary" icon="Plus" onClick={() => setShowBank(true)}>Bank specimen</Button>} />

      {summary && (
        <div style={statGrid}>
          <StatCard label="Specimens banked" value={summary.total} />
          <StatCard label="Research consent" value={summary.forResearch} tone="accent" />
          <StatCard label="Storage units" value={STORAGE_UNITS.length} />
        </div>
      )}

      <div style={row2}>
        <Card title="Storage utilisation">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {storage.map((u) => (
              <div key={u.key}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                  <span style={{ fontWeight: 500, color: "var(--ink)" }}>{u.label}</span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>{u.used}/{u.capacity}</span>
                </div>
                <div style={track}><div style={{ ...fill, width: `${u.pct}%`, background: u.pct >= 90 ? "var(--warn)" : "var(--chart-1)" }} /></div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="By specimen type">
          {summary && Object.keys(summary.byType).length === 0 ? (
            <div style={{ fontSize: 12.5, color: "var(--muted)" }}>No specimens yet.</div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {summary && Object.entries(summary.byType).map(([t, n]) => (
                <span key={t} style={typeChip}>{t} <b>{n}</b></span>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div style={{ ...toolbar, marginTop: 16 }}>
        <input style={{ ...inputStyle, maxWidth: 260 }} placeholder="Search patient, ref, study…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select style={{ ...inputStyle, maxWidth: 220 }} value={unit} onChange={(e) => setUnit(e.target.value)}>
          <option value="all">All storage units</option>
          {STORAGE_UNITS.map((u) => <option key={u.key} value={u.key}>{u.label}</option>)}
        </select>
      </div>

      <Card title="Specimen repository" pad={false}>
        {loading ? <div style={{ padding: 20, color: "var(--muted)", fontSize: 13 }}>Loading…</div> : rows.length === 0 ? (
          <div style={{ padding: 22 }}><EmptyState icon="Archive" title="No specimens match" /></div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Ref", "Patient", "Type", "Location", "Consent", "Collected"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 11.5 }}>{s.ref}</td>
                  <td style={{ ...td, fontWeight: 600, color: "var(--ink-strong)" }}>{s.patientName}</td>
                  <td style={td}>{s.type} <span style={{ color: "var(--muted)", fontSize: 11 }}>({s.volume})</span></td>
                  <td style={{ ...td, fontSize: 11.5, color: "var(--muted)" }}>{STORAGE_UNITS.find((u) => u.key === s.unit)?.label}</td>
                  <td style={td}><Pill tone={s.consent.startsWith("Research") ? "accent" : "muted"}>{s.consent}</Pill></td>
                  <td style={{ ...td, color: "var(--muted)", fontSize: 12 }}>{s.collected}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {showBank && <BankModal onClose={() => setShowBank(false)} onDone={async () => { setShowBank(false); await refresh(); }} />}
    </div>
  );
}

function BankModal({ onClose, onDone }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ type: SPECIMEN_TYPES[0], volume: "", unit: "F1", consent: CONSENT_TYPES[0], study: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    let a = true; const t = setTimeout(async () => { const r = await listPatients({ query, status: "all" }); if (a) setResults(r.slice(0, 5)); }, 180);
    return () => { a = false; clearTimeout(t); };
  }, [query]);

  const submit = async () => {
    if (!selected) { setErr("Select a patient first."); return; }
    setBusy(true); setErr("");
    try {
      await bankSpecimen({ patientName: `${selected.lastName}, ${selected.firstName}`, hospitalNo: selected.hospitalNo, ...form });
      await onDone();
    } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title="Bank specimen" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy || !selected}>{busy ? "Banking…" : "Bank specimen"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="Find patient">
        <input style={inputStyle} placeholder="Name or hospital no." value={query} onChange={(e) => { setQuery(e.target.value); setSelected(null); }} />
      </Field>
      <div style={{ maxHeight: 110, overflowY: "auto", marginBottom: 14 }}>
        {results.map((p) => (
          <button key={p.id} onClick={() => setSelected(p)} style={{ ...resultRow, ...(selected?.id === p.id ? resultRowActive : null) }}>
            <span style={{ fontWeight: 500, color: "var(--ink-strong)" }}>{p.lastName}, {p.firstName}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>{p.hospitalNo}</span>
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><Field label="Specimen type"><select style={inputStyle} value={form.type} onChange={set("type")}>{SPECIMEN_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field></div>
        <div style={{ width: 110 }}><Field label="Volume"><input style={inputStyle} value={form.volume} onChange={set("volume")} placeholder="2 mL" /></Field></div>
      </div>
      <Field label="Storage unit">
        <select style={inputStyle} value={form.unit} onChange={set("unit")}>{STORAGE_UNITS.map((u) => <option key={u.key} value={u.key}>{u.label}</option>)}</select>
      </Field>
      <Field label="Consent basis">
        <select style={inputStyle} value={form.consent} onChange={set("consent")}>{CONSENT_TYPES.map((c) => <option key={c}>{c}</option>)}</select>
      </Field>
      <Field label="Associated study (optional)"><input style={inputStyle} value={form.study} onChange={set("study")} /></Field>
    </Modal>
  );
}

const statGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 16 };
const row2 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 };
const toolbar = { display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" };
const track = { height: 7, borderRadius: 999, background: "var(--surface)", overflow: "hidden" };
const fill = { height: "100%", borderRadius: 999 };
const typeChip = { fontSize: 11.5, fontWeight: 500, color: "var(--ink)", background: "var(--surface)", border: "1px solid var(--border)", padding: "4px 10px", borderRadius: 999 };
const th = { textAlign: "left", fontSize: 10.5, fontWeight: 700, color: "var(--muted)", padding: "10px 14px", background: "var(--surface)", textTransform: "uppercase", letterSpacing: "0.05em" };
const td = { padding: "10px 14px", fontSize: 12.5, verticalAlign: "middle" };
const resultRow = { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", border: "1px solid transparent", borderRadius: 8, background: "none", cursor: "pointer", font: "inherit", fontSize: 13 };
const resultRowActive = { background: "var(--accent-bg)", border: "1px solid var(--border-strong)" };
const errBox = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12, padding: "8px 11px", borderRadius: 8, marginBottom: 14 };
