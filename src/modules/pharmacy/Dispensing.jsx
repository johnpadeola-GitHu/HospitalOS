import { useEffect, useState, useCallback } from "react";
import {
  listDrugs,
  dispense,
  listDispenses,
} from "./pharmacyService";
import { listPatients } from "../patients/patientService";
import { Button, Modal, Field, inputStyle, PageHeader } from "../../lib/ui";
import { useAuth } from "../../auth/AuthContext";
import { checkAllergy } from "../records/recordsService";
import { priceFor } from "../../engines/pricing";

const STOCK_TINT = {
  ok: { bg: "#E6EFDF", fg: "#4A6329", label: "In stock" },
  low: { bg: "#FBF0DC", fg: "#8A5A17", label: "Low" },
  out: { bg: "#F7E4E2", fg: "#B0281F", label: "Out" },
};

export default function Dispensing() {
  const { may } = useAuth();
  const [drugs, setDrugs] = useState([]);
  const [dispenses, setDispenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [onlyLow, setOnlyLow] = useState(false);
  const [dispenseFor, setDispenseFor] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [d, h] = await Promise.all([listDrugs({ query, onlyLow }), listDispenses({ limit: 6 })]);
      setDrugs(d);
      setDispenses(h);
    
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [query, onlyLow]);

  useEffect(() => {
    const t = setTimeout(refresh, 180);
    return () => clearTimeout(t);
  }, [refresh]);

  return (
    <div>
      <PageHeader group="Pharmacy" title={<>Dispensing</>} icon="Pill" actions={<></>} />

      <div style={toolbar}>
        <input
          style={{ ...inputStyle, maxWidth: 280 }}
          placeholder="Search drug or NAFDAC no."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <label style={toggle}>
          <input type="checkbox" checked={onlyLow} onChange={(e) => setOnlyLow(e.target.checked)} />
          Low / out of stock only
        </label>
      </div>

      <div style={tableWrap}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Drug", "NAFDAC", "Stock", "Unit price", "Status", ""].map((h) => (
                <th key={h} style={th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={emptyCell}>
                  Loading inventory…
                </td>
              </tr>
            ) : drugs.length === 0 ? (
              <tr>
                <td colSpan={6} style={emptyCell}>
                  No drugs match.
                </td>
              </tr>
            ) : (
              drugs.map((d) => {
                const tint = STOCK_TINT[d.state];
                return (
                  <tr key={d.id} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ ...td, fontWeight: 500, color: "var(--ink-strong)" }}>
                      {d.name}
                      <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 400 }}>
                        {d.form}
                      </div>
                    </td>
                    <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 12 }}>
                      {d.nafdac}
                    </td>
                    <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 13 }}>
                      {d.stock.toLocaleString()}
                    </td>
                    <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 13 }}>
                      &#8358;{priceFor("pharmacy", d.id, d.price)}
                    </td>
                    <td style={td}>
                      <span
                        style={{
                          background: tint.bg,
                          color: tint.fg,
                          fontSize: 11,
                          fontWeight: 500,
                          padding: "2px 9px",
                          borderRadius: 999,
                        }}
                      >
                        {tint.label}
                      </span>
                    </td>
                    <td style={{ ...td, textAlign: "right" }}>
                      <Button onClick={() => setDispenseFor(d)} disabled={d.state === "out" || !may("pharmacy:dispense")}>
                        Dispense
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {dispenses.length > 0 && (
        <div style={{ marginTop: 22 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink-strong)", marginBottom: 10 }}>
            Recent dispenses
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {dispenses.map((r) => (
              <div key={r.id} style={dispRow}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", width: 92 }}>
                  {r.ref}
                </span>
                <span style={{ flex: 1, color: "var(--ink-strong)" }}>
                  {r.quantity} {r.unit} · {r.drugName}
                </span>
                <span style={{ color: "var(--muted)", fontSize: 12 }}>{r.patientName}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, width: 78, textAlign: "right" }}>
                  &#8358;{r.total.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {dispenseFor && (
        <DispenseModal
          drug={dispenseFor}
          onClose={() => setDispenseFor(null)}
          onDone={async () => {
            setDispenseFor(null);
            await refresh();
          }}
        />
      )}
    </div>
  );
}

function DispenseModal({ drug, onClose, onDone }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [qty, setQty] = useState("1");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [allergies, setAllergies] = useState([]);
  const [allergyCheckFailed, setAllergyCheckFailed] = useState(false);

  // Safety: warn if the selected patient has a recorded allergy to this drug.
  // If the check itself fails to load, fail closed (block dispensing) rather
  // than silently showing an empty allergy list as if the check passed.
  useEffect(() => {
    if (!selected) { setAllergies([]); setAllergyCheckFailed(false); return; }
    let alive = true;
    setAllergyCheckFailed(false);
    checkAllergy(selected.id, drug.name)
      .then((a) => { if (alive) setAllergies(a); })
      .catch((e) => {
        console.error(e);
        if (alive) { setAllergies([]); setAllergyCheckFailed(true); }
      });
    return () => { alive = false; };
  }, [selected, drug.name]);

  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      try { const rows = await listPatients({ query, status: "all" }); if (alive) setResults(rows.slice(0, 6)); } catch (e) { console.error(e); if (alive) setResults([]); }
    }, 180);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [query]);

  const n = parseInt(qty, 10) || 0;
  const overStock = n > drug.stock;
  const effectivePrice = priceFor("pharmacy", drug.id, drug.price);
  const total = n > 0 ? n * effectivePrice : 0;

  const submit = async () => {
    if (!selected) {
      setErr("Select a patient first.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      await dispense({
        drugId: drug.id,
        patientId: selected.id,
        patientName: `${selected.lastName}, ${selected.firstName}`,
        hospitalNo: selected.hospitalNo,
        quantity: n,
      });
      await onDone();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title={`Dispense — ${drug.name}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={busy || !selected || overStock || n < 1 || allergyCheckFailed || allergies.some((a) => a.severity === "severe")}>
            {busy ? "Dispensing…" : "Dispense"}
          </Button>
        </>
      }
    >
      {err && <div style={errBox}>{err}</div>}
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>
        {drug.nafdac} · {drug.stock.toLocaleString()} {drug.unit}(s) in stock
      </div>

      <Field label="Find patient">
        <input
          style={inputStyle}
          placeholder="Name or hospital no."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(null);
          }}
        />
      </Field>
      <div style={{ maxHeight: 150, overflowY: "auto", marginBottom: 14 }}>
        {results.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelected(p)}
            style={{ ...resultRow, ...(selected?.id === p.id ? resultRowActive : null) }}
          >
            <span style={{ fontWeight: 500, color: "var(--ink-strong)" }}>
              {p.lastName}, {p.firstName}
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>
              {p.hospitalNo}
            </span>
          </button>
        ))}
        {results.length === 0 && (
          <div style={{ fontSize: 12, color: "var(--muted)", padding: "8px 2px" }}>
            No patients match.
          </div>
        )}
      </div>

      {allergyCheckFailed && (
        <div style={allergyWarn}>
          <span style={{ fontWeight: 700 }}>⚠ Allergy check unavailable</span>
          <div style={{ marginTop: 3 }}>
            Couldn't verify this patient's allergies. Dispensing is blocked until the check succeeds — try again.
          </div>
        </div>
      )}

      {allergies.length > 0 && (
        <div style={allergyWarn}>
          <span style={{ fontWeight: 700 }}>⚠ Allergy alert</span>
          {allergies.map((a) => (
            <div key={a.id} style={{ marginTop: 3 }}>
              {a.substance} — {a.reaction || "reaction recorded"} ({a.severity})
            </div>
          ))}
          {allergies.some((a) => a.severity === "severe") && (
            <div style={{ marginTop: 5, fontWeight: 600 }}>
              Severe allergy on record. Dispensing is blocked.
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
        <div style={{ width: 120 }}>
          <Field label="Quantity">
            <input
              type="number"
              min="1"
              style={{ ...inputStyle, borderColor: overStock ? "#E4B6B2" : undefined }}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </Field>
        </div>
        <div style={{ flex: 1, paddingBottom: 14 }}>
          {overStock ? (
            <span style={{ fontSize: 12, color: "#B0281F" }}>Exceeds available stock</span>
          ) : (
            <span style={{ fontSize: 13, color: "var(--muted)" }}>
              Total:{" "}
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink-strong)", fontWeight: 500 }}>
                &#8358;{total.toLocaleString()}
              </span>
            </span>
          )}
        </div>
      </div>
    </Modal>
  );
}

const header = { display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 18 };
const toolbar = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 14,
  flexWrap: "wrap",
};
const toggle = { display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "var(--muted)", cursor: "pointer" };
const tableWrap = {
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: 0,
  overflow: "auto",
};
const th = {
  textAlign: "left",
  fontSize: 11,
  fontWeight: 600,
  color: "var(--muted)",
  padding: "11px 14px",
  background: "var(--surface)",
};
const td = { padding: "11px 14px", fontSize: 13, verticalAlign: "middle" };
const emptyCell = { padding: "28px 14px", textAlign: "center", color: "var(--muted)", fontSize: 13 };
const dispRow = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  fontSize: 13,
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: 0,
  padding: "9px 12px",
};
const resultRow = {
  width: "100%",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "8px 10px",
  border: "1px solid transparent",
  borderRadius: 0,
  background: "none",
  cursor: "pointer",
  font: "inherit",
  fontSize: 13,
};
const resultRowActive = { background: "var(--accent-bg)", border: "1px solid var(--border-strong)" };
const allergyWarn = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12, padding: "10px 12px", borderRadius: 0, marginBottom: 14, lineHeight: 1.5 };
const errBox = {
  background: "#F7E9E9",
  color: "#7A2E2E",
  fontSize: 12,
  padding: "8px 11px",
  borderRadius: 0,
  marginBottom: 14,
};
