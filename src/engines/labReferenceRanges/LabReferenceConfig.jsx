import { useEffect, useState, useCallback } from "react";
import * as Icons from "lucide-react";
import { listReferenceOverrides, setReferenceRange, clearReferenceRange } from "./index";
import { TEST_CATALOGUE } from "../../modules/lab/catalogue";
import { PageHeader, StatCard, Card, Button, Modal, Field, inputStyle, EmptyState } from "../../lib/ui";
import { useAuth } from "../../auth/AuthContext";

// Flatten the catalogue into one row per (test, analyte).
// Non-qualitative: numeric ranges exist or can be overridden.
// Qualitative: result is text (Positive/Negative etc.); a lab can define
// what the "normal" text result looks like for their workflow.
function flattenCatalogue(includeQualitative = false) {
  const rows = [];
  for (const t of TEST_CATALOGUE) {
    for (const a of t.analytes) {
      if (a.qualitative && !includeQualitative) continue;
      rows.push({
        testCode: t.code, testName: t.name, analyteKey: a.key, label: a.label, unit: a.unit || "",
        qualitative: !!a.qualitative,
        defaultLow: a.qualitative ? null : a.low,
        defaultHigh: a.qualitative ? null : a.high,
        defaultCritLow: a.qualitative ? null : a.critLow,
        defaultCritHigh: a.qualitative ? null : a.critHigh,
        curated: !!t.curated,
      });
    }
  }
  return rows;
}

const key = (testCode, analyteKey) => `${testCode}:${analyteKey}`;

export default function LabReferenceConfig() {
  const { user, may } = useAuth();
  const [overrides, setOverrides] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [err, setErr] = useState("");

  const catalogue = flattenCatalogue(showAll);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setOverrides(await listReferenceOverrides());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  if (!may("system:configure")) {
    return (
      <div>
        <PageHeader group="Administration" title="Laboratory reference ranges" icon="TestTube" />
        <EmptyState icon="Lock" title="Not permitted" hint="Your role does not include reference range configuration." />
      </div>
    );
  }

  const overrideMap = new Map(overrides.map((o) => [key(o.testCode, o.analyteKey), o]));
  const items = catalogue
    .filter((c) => c.label.toLowerCase().includes(query.toLowerCase()) || c.testName.toLowerCase().includes(query.toLowerCase()))
    .map((c) => ({ ...c, override: overrideMap.get(key(c.testCode, c.analyteKey)) || null }));

  const reset = async (testCode, analyteKey, label) => {
    setErr("");
    try { await clearReferenceRange({ testCode, analyteKey, label, actor: user }); await refresh(); }
    catch (e) { setErr(e.message); }
  };

  const fmtRange = (low, high) => (low == null && high == null ? "\u2014" : `${low ?? "\u2014"}\u2013${high ?? "\u2014"}`);

  return (
    <div>
      <PageHeader group="Administration" title="Laboratory reference ranges" icon="TestTube"
        subtitle="Configure this hospital's reference and critical-value ranges for lab analytes" />

      <div style={note}>
        <Icons.Info size={13} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          Every result flag (low/normal/high/critical) reads through here.
          An unset analyte flags against the catalogue default; overriding it here changes
          what counts as normal or critical for this hospital, immediately, everywhere.
        </span>
      </div>

      {err && <div style={errBanner}>{err}</div>}

      <div style={statGrid}>
        <StatCard label="Analytes" value={catalogue.length} sub="with a numeric range" />
        <StatCard label="Overridden" value={overrides.length} tone={overrides.length ? "accent" : "default"} sub="custom ranges set" />
        <StatCard label="Default" value={catalogue.length - overrides.length} sub="at catalogue range" />
      </div>

      <div style={{ marginBottom: 14, display: "flex", gap: 10, alignItems: "center" }}>
        <input style={{ ...inputStyle, maxWidth: 280 }} placeholder="Search test or analyte…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <button
          onClick={() => setShowAll(v => !v)}
          style={{ font: "inherit", fontSize: 12.5, fontWeight: 600, padding: "6px 12px", border: "1px solid var(--border-strong)", background: showAll ? "var(--accent)" : "var(--surface)", color: showAll ? "#fff" : "var(--ink-strong)", cursor: "pointer" }}
        >
          {showAll ? "All tests (inc. qualitative)" : "Numeric ranges only"}
        </button>
      </div>
      {showAll && (
        <div style={{ ...note, marginBottom: 14 }}>
          <Icons.Info size={13} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>Qualitative tests (positive/negative, detected/not detected) are shown below. You can add a reference range to define the normal result text for your laboratory — for example "Not detected" or "Negative" — so result entry is consistent across staff.</span>
        </div>
      )}

      <Card title="Reference ranges" pad={false}>
        {loading ? <div style={{ padding: 20, color: "var(--muted)", fontSize: 13 }}>Loading…</div> : items.length === 0 ? (
          <div style={{ padding: 22 }}><EmptyState icon="TestTube" title="No analytes match" /></div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Analyte", "Catalogue range", "Current range", ""].map((h) => <th key={h} style={{ ...th, textAlign: h.includes("range") ? "right" : "left" }}>{h}</th>)}</tr></thead>
            <tbody>
              {items.map((it) => (
                <tr key={key(it.testCode, it.analyteKey)} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ ...td, fontWeight: 600, color: "var(--ink-strong)" }}>
                    {it.label} {it.unit ? <span style={{ color: "var(--muted)", fontWeight: 400 }}>({it.unit})</span> : null}
                    <div style={{ fontSize: 10.5, color: "var(--muted)", fontFamily: "var(--font-mono)", fontWeight: 400 }}>{it.testCode} · {it.testName}</div>
                    {it.qualitative && <div style={{ fontSize: 10.5, color: "var(--info)", marginTop: 2 }}>Qualitative</div>}
                    {!it.curated && !it.qualitative && <div style={{ fontSize: 10.5, color: "var(--warn)", marginTop: 2 }}>Needs lab-director verification</div>}
                  </td>
                  <td style={{ ...td, textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
                    {it.qualitative ? "—" : fmtRange(it.defaultLow, it.defaultHigh)}
                  </td>
                  <td style={{ ...td, textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700, color: it.override ? "var(--accent)" : "var(--ink-strong)" }}>
                    {it.qualitative
                      ? (it.override?.normalText || <span style={{ color: "var(--muted)", fontWeight: 400 }}>not set</span>)
                      : fmtRange(it.override ? it.override.low : it.defaultLow, it.override ? it.override.high : it.defaultHigh)}
                    {it.override && <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 400, fontFamily: "var(--font-sans)" }}>by {it.override.updatedBy}</div>}
                  </td>
                  <td style={{ ...td, textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: 6 }}>
                      <Button onClick={() => setEditItem(it)}>Edit</Button>
                      {it.override && <Button onClick={() => reset(it.testCode, it.analyteKey, it.label)}>Reset</Button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {editItem && (
        <EditModal item={editItem} onClose={() => setEditItem(null)}
          onDone={async () => { setEditItem(null); await refresh(); }} />
      )}
    </div>
  );
}

function EditModal({ item, onClose, onDone }) {
  const { user } = useAuth();
  const o = item.override;
  const [low, setLow] = useState(String(o ? o.low ?? "" : item.defaultLow ?? ""));
  const [high, setHigh] = useState(String(o ? o.high ?? "" : item.defaultHigh ?? ""));
  const [critLow, setCritLow] = useState(String(o ? o.critLow ?? "" : item.defaultCritLow ?? ""));
  const [critHigh, setCritHigh] = useState(String(o ? o.critHigh ?? "" : item.defaultCritHigh ?? ""));
  const [normalText, setNormalText] = useState(o?.normalText || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setBusy(true); setErr("");
    try {
      await setReferenceRange({
        testCode: item.testCode, analyteKey: item.analyteKey, label: item.label,
        qualitative: item.qualitative,
        ...(item.qualitative
          ? { normalText: normalText.trim() }
          : { low: low === "" ? null : low, high: high === "" ? null : high,
              critLow: critLow === "" ? null : critLow, critHigh: critHigh === "" ? null : critHigh }),
        actor: user,
      });
      await onDone();
    } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title={`Set reference range — ${item.label}`} onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Saving…" : "Save range"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      {item.qualitative ? (
        <>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>
            This is a qualitative test. Define the normal result text your lab uses — e.g. "Negative", "Not detected", or "No growth".
          </div>
          <Field label="Normal result text">
            <input style={inputStyle} value={normalText} onChange={(e) => setNormalText(e.target.value)} placeholder='e.g. "Negative" or "Not detected"' autoFocus />
          </Field>
        </>
      ) : (
        <>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>
            Catalogue default: {item.defaultLow ?? "—"}–{item.defaultHigh ?? "—"} {item.unit}
            {(item.defaultCritLow != null || item.defaultCritHigh != null) && (
              <> · critical outside {item.defaultCritLow ?? "—"}–{item.defaultCritHigh ?? "—"}</>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label={`Low (${item.unit || "—"})`}>
              <input type="number" style={inputStyle} value={low} onChange={(e) => setLow(e.target.value)} autoFocus />
            </Field>
            <Field label={`High (${item.unit || "—"})`}>
              <input type="number" style={inputStyle} value={high} onChange={(e) => setHigh(e.target.value)} />
            </Field>
            <Field label="Critical low">
              <input type="number" style={inputStyle} value={critLow} onChange={(e) => setCritLow(e.target.value)} />
            </Field>
            <Field label="Critical high">
              <input type="number" style={inputStyle} value={critHigh} onChange={(e) => setCritHigh(e.target.value)} />
            </Field>
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 10 }}>Leave a field blank to use the catalogue default for that boundary.</div>
        </>
      )}
    </Modal>
  );
}

const note = { display: "flex", gap: 8, background: "var(--accent-soft)", border: "1px solid var(--border)", borderRadius: 0, padding: "10px 13px", fontSize: 12, color: "var(--muted)", marginBottom: 16, lineHeight: 1.5 };
const statGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 16 };
const th = { fontSize: 10.5, fontWeight: 700, color: "var(--muted)", padding: "10px 14px", background: "var(--surface)", textTransform: "uppercase", letterSpacing: "0.05em" };
const td = { padding: "10px 14px", fontSize: 12.5, verticalAlign: "top" };
const errBanner = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 13, padding: "10px 14px", borderRadius: 0, marginBottom: 14 };
const errBox = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12, padding: "8px 11px", borderRadius: 0, marginBottom: 14 };
