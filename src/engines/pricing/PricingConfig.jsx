import { useEffect, useState, useCallback } from "react";
import * as Icons from "lucide-react";
import { CATEGORIES, listOverrides, setPrice, clearOverride } from "./index";
import { TEST_CATALOGUE } from "../../modules/lab/catalogue";
import { listDrugs } from "../../modules/pharmacy/pharmacyService";
import { MODALITIES } from "../../modules/radiology/radiologyService";
import { PROCEDURES } from "../../modules/theatre/theatreService";
import { TIER_LIST } from "../../modules/wards/bedService";
import { PageHeader, StatCard, Card, Button, Modal, Field, inputStyle, EmptyState } from "../../lib/ui";
import { useAuth } from "../../auth/AuthContext";

const naira = (n) => "\u20a6" + Math.round(n).toLocaleString();

// Each category's catalogue, normalised to { code, label, defaultPrice }.
async function catalogueFor(category) {
  if (category === "lab") return TEST_CATALOGUE.map((t) => ({ code: t.code, label: t.name, defaultPrice: t.price }));
  if (category === "pharmacy") return (await listDrugs({})).map((d) => ({ code: d.id, label: d.name, defaultPrice: d.price }));
  if (category === "radiology") return MODALITIES.map((m) => ({ code: m.code, label: `${m.name} (${m.modality})`, defaultPrice: m.price }));
  if (category === "theatre") return PROCEDURES.map((p) => ({ code: p.code, label: p.name, defaultPrice: p.price }));
  if (category === "accommodation") return TIER_LIST.map((t) => ({ code: t.key, label: t.label, defaultPrice: t.rate }));
  return [];
}

export default function PricingConfig() {
  const { user, may } = useAuth();
  const [cat, setCat] = useState("lab");
  const [catalogue, setCatalogue] = useState([]);
  const [overrides, setOverrides] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState(null);
  const [err, setErr] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [c, o] = await Promise.all([catalogueFor(cat), listOverrides(cat)]);
      setCatalogue(c);
      setOverrides(o);
    
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [cat]);

  useEffect(() => { refresh(); }, [refresh]);

  if (!may("system:configure")) {
    return (
      <div>
        <PageHeader group="Administration" title="Pricing" icon="Tags" />
        <EmptyState icon="Lock" title="Not permitted" hint="Your role does not include pricing configuration." />
      </div>
    );
  }

  const overrideMap = new Map(overrides.map((o) => [o.code, o]));
  const items = catalogue
    .filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    .map((c) => ({ ...c, override: overrideMap.get(c.code) || null }));

  const reset = async (code) => {
    setErr("");
    try { await clearOverride({ category: cat, code, actor: user }); await refresh(); }
    catch (e) { setErr(e.message); }
  };

  return (
    <div>
      <PageHeader group="Administration" title="Pricing" icon="Tags"
        subtitle="Configure this hospital's prices for tests, medication, imaging, procedures, and ward accommodation" />

      <div style={note}>
        <Icons.Info size={13} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          Every price shown to staff and billed to patients reads through here.
          An unset item bills at its catalogue default; overriding it here changes
          what this hospital actually charges, immediately, everywhere.
        </span>
      </div>

      {err && <div style={errBanner}>{err}</div>}

      <div style={statGrid}>
        <StatCard label="This category" value={catalogue.length} sub="priceable items" />
        <StatCard label="Overridden" value={overrides.length} tone={overrides.length ? "accent" : "default"} sub="custom prices set" />
        <StatCard label="Default" value={catalogue.length - overrides.length} sub="at catalogue price" />
      </div>

      <div style={tabs}>
        {CATEGORIES.map((c) => (
          <button key={c.key} onClick={() => setCat(c.key)} style={{ ...tabBtn, ...(cat === c.key ? tabActive : null) }}>{c.label}</button>
        ))}
      </div>

      <div style={{ marginBottom: 14 }}>
        <input style={{ ...inputStyle, maxWidth: 280 }} placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <Card title={CATEGORIES.find((c) => c.key === cat)?.label} pad={false}>
        {loading ? <div style={{ padding: 20, color: "var(--muted)", fontSize: 13 }}>Loading…</div> : items.length === 0 ? (
          <div style={{ padding: 22 }}><EmptyState icon="Tags" title="No items match" /></div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Item", "Catalogue default", "Current price", ""].map((h) => <th key={h} style={{ ...th, textAlign: h.includes("price") || h.includes("default") ? "right" : "left" }}>{h}</th>)}</tr></thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.code} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ ...td, fontWeight: 600, color: "var(--ink-strong)" }}>
                    {it.label}
                    <div style={{ fontSize: 10.5, color: "var(--muted)", fontFamily: "var(--font-mono)", fontWeight: 400 }}>{it.code}</div>
                  </td>
                  <td style={{ ...td, textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--muted)" }}>{naira(it.defaultPrice)}</td>
                  <td style={{ ...td, textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700, color: it.override ? "var(--accent)" : "var(--ink-strong)" }}>
                    {naira(it.override ? it.override.price : it.defaultPrice)}
                    {it.override && <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 400, fontFamily: "var(--font-sans)" }}>by {it.override.updatedBy}</div>}
                  </td>
                  <td style={{ ...td, textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: 6 }}>
                      <Button onClick={() => setEditItem(it)}>Edit</Button>
                      {it.override && <Button onClick={() => reset(it.code)}>Reset</Button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {editItem && (
        <EditModal item={editItem} category={cat} onClose={() => setEditItem(null)}
          onDone={async () => { setEditItem(null); await refresh(); }} />
      )}
    </div>
  );
}

function EditModal({ item, category, onClose, onDone }) {
  const { user } = useAuth();
  const [price, setPriceVal] = useState(String(item.override ? item.override.price : item.defaultPrice));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setBusy(true); setErr("");
    try { await setPrice({ category, code: item.code, label: item.label, price, actor: user }); await onDone(); }
    catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title={`Set price — ${item.label}`} onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Saving…" : "Save price"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>
        Catalogue default: {naira(item.defaultPrice)}
      </div>
      <Field label="Price (\u20a6)">
        <input type="number" min="0" style={inputStyle} value={price} onChange={(e) => setPriceVal(e.target.value)} autoFocus />
      </Field>
    </Modal>
  );
}

const note = { display: "flex", gap: 8, background: "var(--accent-soft)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 13px", fontSize: 12, color: "var(--muted)", marginBottom: 16, lineHeight: 1.5 };
const statGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 16 };
const tabs = { display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" };
const tabBtn = { font: "inherit", fontSize: 12.5, fontWeight: 600, padding: "6px 13px", borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--surface-2)", color: "var(--muted)", cursor: "pointer" };
const tabActive = { background: "var(--charcoal)", color: "#fff", borderColor: "var(--charcoal)" };
const th = { fontSize: 10.5, fontWeight: 700, color: "var(--muted)", padding: "10px 14px", background: "var(--surface)", textTransform: "uppercase", letterSpacing: "0.05em" };
const td = { padding: "10px 14px", fontSize: 12.5, verticalAlign: "top" };
const errBanner = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 13, padding: "10px 14px", borderRadius: 10, marginBottom: 14 };
const errBox = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12, padding: "8px 11px", borderRadius: 8, marginBottom: 14 };
