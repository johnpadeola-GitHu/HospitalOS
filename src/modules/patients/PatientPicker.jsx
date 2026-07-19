import { useState, useEffect, useRef } from "react";
import * as Icons from "lucide-react";
import { listPatients } from "./patientService";
import { inputStyle } from "../../lib/ui";

// The single, real way to attach a patient to anything anywhere in the
// app — search-and-select against the actual Master Patient Index
// (patientService), never a free-typed name. This exists because an audit
// found 14 modules across the app letting staff type a patient's name and
// hospital number as plain text, completely disconnected from the real
// registry: a typo, or an unregistered walk-in name, could produce a
// record that looks like a patient but isn't linked to any real one.
//
// Matches real hospital practice: a patient is registered once, ever,
// anywhere in the hospital — every other department finds and reuses that
// same record rather than re-registering them.
export default function PatientPicker({ value, onChange, placeholder = "Search by name or hospital no.…", allowUnregistered = false }) {
  const [query, setQuery] = useState(value?.patientName || "");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      setLoading(true);
      setResults(await listPatients({ query, status: "all" }));
      setLoading(false);
    }, 180);
    return () => clearTimeout(t);
  }, [query, open]);

  useEffect(() => {
    const onClick = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const pick = (p) => {
    const fullName = `${p.firstName} ${p.lastName}`;
    setQuery(fullName);
    setOpen(false);
    onChange({ patientId: p.id, patientName: fullName, hospitalNo: p.hospitalNo });
  };

  const clear = () => {
    setQuery("");
    onChange({ patientId: null, patientName: "", hospitalNo: "" });
  };

  return (
    <div ref={boxRef} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <Icons.Search size={14} style={{ position: "absolute", left: 10, top: 11, color: "var(--muted)" }} />
        <input
          style={{ ...inputStyle, paddingLeft: 30, paddingRight: value?.patientId ? 30 : 10 }}
          value={query}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (value?.patientId) onChange({ patientId: null, patientName: e.target.value, hospitalNo: "" });
          }}
        />
        {value?.patientId && (
          <button type="button" onClick={clear} style={clearBtn} aria-label="Clear patient" title="Clear">
            <Icons.X size={13} />
          </button>
        )}
      </div>

      {value?.patientId ? (
        <div style={linkedNote}>
          <Icons.CheckCircle2 size={12} color="var(--good)" /> Linked to {value.hospitalNo}
        </div>
      ) : query.trim() && !open ? (
        <div style={unlinkedNote}>
          <Icons.AlertTriangle size={12} /> Not linked to a registered patient
          {allowUnregistered ? " — allowed here, but confirm this is intentional." : " — select one from the list."}
        </div>
      ) : null}

      {open && (
        <div style={dropdown}>
          {loading ? (
            <div style={emptyRow}>Searching…</div>
          ) : results.length === 0 ? (
            <div style={emptyRow}>
              {query.trim() ? "No registered patient matches." : "Type a name or hospital number to search."}
              {" "}Not registered yet? Use Patient care → Registration & ADT first.
            </div>
          ) : (
            results.slice(0, 8).map((p) => (
              <button key={p.id} type="button" style={optionRow} onClick={() => pick(p)}>
                <span style={{ fontWeight: 600, color: "var(--ink-strong)" }}>{p.firstName} {p.lastName}</span>
                <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>{p.hospitalNo}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const clearBtn = { position: "absolute", right: 6, top: 6, background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex", padding: 4 };
const linkedNote = { display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--good)", marginTop: 4 };
const unlinkedNote = { display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--warn)", marginTop: 4, lineHeight: 1.4 };
const dropdown = {
  position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 20,
  background: "var(--surface-2)", border: "1px solid var(--border-strong)", borderRadius: 10,
  boxShadow: "0 8px 24px rgba(22,35,59,0.14)", maxHeight: 220, overflowY: "auto", padding: 4,
};
const optionRow = {
  width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "8px 10px", borderRadius: 7, border: "none", background: "none", cursor: "pointer", font: "inherit", fontSize: 12.5,
};
const emptyRow = { padding: "12px 10px", fontSize: 12, color: "var(--muted)", lineHeight: 1.5 };
