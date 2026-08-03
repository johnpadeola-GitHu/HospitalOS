import { useEffect, useState, useCallback } from "react";
import * as Icons from "lucide-react";
import { listReferenceOverrides, setReferenceRange, clearReferenceRange } from "./index";
import { TEST_CATALOGUE } from "../../modules/lab/catalogue";
import { PageHeader, StatCard, Card, Button, Modal, Field, inputStyle, EmptyState } from "../../lib/ui";
import { useAuth } from "../../auth/AuthContext";

// Flatten the catalogue into one row per (test, analyte) — only
// non-qualitative analytes have a numeric range to override.
function flattenCatalogue() {
  const rows = [];
  for (const t of TEST_CATALOGUE) {
    for (const a of t.analytes) {
      if (a.qualitative) continue;
      rows.push({
        testCode: t.code, testName: t.name, analyteKey: a.key, label: a.label, unit: a.unit,
        defaultLow: a.low, defaultHigh: a.high, defaultCritLow: a.critLow, defaultCritHigh: a.critHigh,
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
  const [err, setErr] = useState("");

  const catalogue = flattenCatalogue();

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

      <div style={{ marginBottom: 14 }}>
        <input style={{ ...inputStyle, maxWidth: 280 }} placeholder="Search test or analyte…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

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
                    <div style={{ fontSize: 10.5, color: "var(--muted)", fontFamily: "var(--font-mono)", fontWeight: 400 }}>{it.testCode} \u00b7 {it.testName}</div>
                  </td>
                  <td style={{ ...td, textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--muted)" }}>{fmtRange(it.defaultLow, it.defaultHigh)}</td>
                  <td style={{ ...td, textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700, color: it.override ? "var(--accent)" : "var(--ink-strong)" }}>
                    {fmtRange(it.override ? it.override.low : it.defaultLow, it.override ? it.override.high : it.defaultHigh)}
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
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setBusy(true); setErr("");
    try {
      await setReferenceRange({
        testCode: item.testCode, analyteKey: item.analyteKey, label: item.label,
        low: low === "" ? null : low, high: high === "" ? null : high,
        critLow: critLow === "" ? null : critLow, critHigh: critHigh === "" ? null : critHigh,
        actor: user,
      });
      await onDone();
    } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title={`Set reference range \u2014 ${item.label}`} onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Saving\u2026" : "Save range"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>
        Catalogue default: {item.defaultLow ?? "\u2014"}\u2013{item.defaultHigh ?? "\u2014"} {item.unit}
        {(item.defaultCritLow != null || item.defaultCritHigh != null) && (
          <> \u00b7 critical outside {item.defaultCritLow ?? "\u2014"}\u2013{item.defaultCritHigh ?? "\u2014"}</>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label={`Low (${item.unit || "\u2014"})`}>
          <input type="number" style={inputStyle} value={low} onChange={(e) => setLow(e.target.value)} autoFocus />
        </Field>
        <Field label={`High (${item.unit || "\u2014"})`}>
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
    </Modal>
  );
}

const note = { display: "flex", gap: 8, background: "var(--accent-soft)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 13px", fontSize: 12, color: "var(--muted)", marginBottom: 16, lineHeight: 1.5 };
const statGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 16 };
const th = { fontSize: 10.5, fontWeight: 700, color: "var(--muted)", padding: "10px 14px", background: "var(--surface)", textTransform: "uppercase", letterSpacing: "0.05em" };
const td = { padding: "10px 14px", fontSize: 12.5, verticalAlign: "top" };
const errBanner = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 13, padding: "10px 14px", borderRadius: 10, marginBottom: 14 };
const errBox = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12, padding: "8px 11px", borderRadius: 8, marginBottom: 14 };
