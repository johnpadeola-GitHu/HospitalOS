import { useEffect, useState } from "react";
import * as Icons from "lucide-react";
import { buildPatientBundle, bundleResourceCounts, FHIR_INFO } from "./index";
import { listPatients } from "../../modules/patients/patientService";
import { PageHeader, Card, Pill, Button, inputStyle, EmptyState } from "../../lib/ui";

export default function FhirExport() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      const r = await listPatients({ query, status: "all" });
      if (alive) setResults(r.slice(0, 6));
    }, 180);
    return () => { alive = false; clearTimeout(t); };
  }, [query]);

  const pick = async (p) => {
    setSelected(p); setBundle(null); setLoading(true); setErr("");
    try { setBundle(await buildPatientBundle(p.id)); }
    catch (e) { setErr(e.message); }
    setLoading(false);
  };

  const download = () => {
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/fhir+json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${selected.hospitalNo}-fhir-bundle.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const counts = bundle ? bundleResourceCounts(bundle) : null;

  return (
    <div>
      <PageHeader group="Administration" title="FHIR interoperability" icon="Share2"
        subtitle={`HL7 FHIR R4 (${FHIR_INFO.version}) resource export — the standards-shaped record another system can ingest`} />

      <div style={note}>
        <Icons.Info size={14} style={{ color: "var(--muted)", flexShrink: 0, marginTop: 1 }} />
        <span>
          A browser cannot host a live FHIR REST endpoint \u2014 that is server territory, same
          limitation as the instruments gateway's device listeners. What this screen produces is
          the real substance of interoperability: a correctly mapped, standards-compliant FHIR
          Bundle for a patient, ready to hand to another system today by file, and identical to
          what a future REST endpoint would serve.
        </span>
      </div>

      <div style={layout}>
        <div style={pickerCol}>
          <div style={{ position: "relative", marginBottom: 10 }}>
            <Icons.Search size={14} style={{ position: "absolute", left: 10, top: 10, color: "var(--muted)" }} />
            <input style={{ ...inputStyle, paddingLeft: 31 }} placeholder="Find patient…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          {results.map((p) => (
            <button key={p.id} onClick={() => pick(p)} style={{ ...pickRow, ...(selected?.id === p.id ? pickActive : null) }}>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-strong)" }}>{p.lastName}, {p.firstName}</div>
                <div style={{ fontSize: 10.5, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>{p.hospitalNo}</div>
              </div>
            </button>
          ))}
        </div>

        <div>
          {!selected ? (
            <EmptyState icon="Share2" title="Select a patient" hint="Choose someone to generate their FHIR Bundle." />
          ) : loading ? (
            <div style={{ color: "var(--muted)", fontSize: 13 }}>Building bundle…</div>
          ) : err ? (
            <div style={errBox}>{err}</div>
          ) : bundle && (
            <>
              <Card title={`Bundle \u2014 ${selected.lastName}, ${selected.firstName}`}
                action={<Button variant="primary" icon="Download" onClick={download}>Download JSON</Button>}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                  {Object.entries(counts).map(([type, n]) => (
                    <span key={type} style={countChip}><b>{n}</b>&nbsp;{type}</span>
                  ))}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 6 }}>BUNDLE PREVIEW (JSON)</div>
                <pre style={codeBox}>{JSON.stringify(bundle, null, 2).slice(0, 2400)}
{JSON.stringify(bundle).length > 2400 ? "\n\u2026 (truncated preview \u2014 download for the full bundle)" : ""}</pre>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const note = { display: "flex", gap: 8, background: "var(--accent-soft)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 13px", fontSize: 12, color: "var(--muted)", marginBottom: 16, lineHeight: 1.55 };
const layout = { display: "grid", gridTemplateColumns: "220px 1fr", gap: 16, alignItems: "start" };
const pickerCol = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 10, boxShadow: "var(--shadow-sm)" };
const pickRow = { width: "100%", display: "flex", padding: "7px 8px", background: "none", border: "none", borderRadius: 7, cursor: "pointer", font: "inherit", marginBottom: 1 };
const pickActive = { background: "var(--charcoal-bg)" };
const countChip = { fontSize: 11.5, color: "var(--ink)", background: "var(--surface)", border: "1px solid var(--border)", padding: "4px 10px", borderRadius: 999 };
const codeBox = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: 10, lineHeight: 1.6, overflowX: "auto", whiteSpace: "pre-wrap", color: "var(--ink)", maxHeight: 420, overflowY: "auto" };
const errBox = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12, padding: "8px 11px", borderRadius: 8 };
