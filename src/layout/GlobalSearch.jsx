import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import * as Icons from "lucide-react";
import { ALL_ROUTES } from "../nav/navGroups";
import { listPatients } from "../modules/patients/patientService";
import { searchWithExcerpt } from "../engines/help";
import { useAuth } from "../auth/AuthContext";
import { useHelp } from "../engines/help";

// Global search — a real command palette, not a decorative box.
// Searches three sources at once:
//   Navigation — any screen the current role can reach
//   Patients   — by name or hospital number
//   Help       — full-text across the documentation
// Results are permission-filtered: you cannot jump to an area you cannot open.

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ nav: [], patients: [], help: [] });
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { can } = useAuth();
  const { openHelp } = useHelp();

  // Ctrl+K / Cmd+K opens; Escape closes.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
    else { setQuery(""); setActive(0); }
  }, [open]);

  // Run the search across all three sources.
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) { setResults({ nav: [], patients: [], help: [] }); return; }
    let alive = true;

    const nav = ALL_ROUTES
      .filter((r) => can(r.groupId))
      .filter((r) => r.label.toLowerCase().includes(q) || r.groupLabel.toLowerCase().includes(q))
      .slice(0, 5);

    const help = searchWithExcerpt(q, 4);

    const t = setTimeout(async () => {
      let patients = [];
      // Only search patients if the role can reach patient care.
      if (can("patient-care")) {
        const rows = await listPatients({ query: q, status: "all" });
        patients = rows.slice(0, 5);
      }
      if (alive) setResults({ nav, patients, help });
    }, 140);

    setResults((r) => ({ ...r, nav, help }));
    return () => { alive = false; clearTimeout(t); };
  }, [query, can]);

  const flat = [
    ...results.nav.map((r) => ({ kind: "nav", ...r })),
    ...results.patients.map((p) => ({ kind: "patient", ...p })),
    ...results.help.map((h) => ({ kind: "help", ...h })),
  ];

  const choose = useCallback((item) => {
    if (!item) return;
    if (item.kind === "nav") navigate(item.path);
    else if (item.kind === "patient") navigate("/records");
    else if (item.kind === "help") { navigate("/help"); openHelp(item.id); }
    setOpen(false);
  }, [navigate, openHelp]);

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, flat.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter") { e.preventDefault(); choose(flat[active]); }
  };

  return (
    <>
      {/* Trigger — a real button, not a decorative div */}
      <button style={trigger} onClick={() => setOpen(true)} aria-label="Search">
        <Icons.Search size={14} style={{ color: "var(--muted)", flexShrink: 0 }} />
        <span style={{ fontSize: 12.5, color: "var(--muted)", flex: 1, textAlign: "left" }}>
          Search patients, screens, help…
        </span>
        <kbd style={kbd}>Ctrl K</kbd>
      </button>

      {open && (
        <div style={overlay} onClick={() => setOpen(false)}>
          <div style={palette} onClick={(e) => e.stopPropagation()}>
            <div style={inputRow}>
              <Icons.Search size={16} style={{ color: "var(--muted)", flexShrink: 0 }} />
              <input
                ref={inputRef}
                style={paletteInput}
                placeholder="Search patients, screens, help…"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setActive(0); }}
                onKeyDown={onKeyDown}
              />
              <kbd style={kbd}>Esc</kbd>
            </div>

            <div style={{ maxHeight: 400, overflowY: "auto" }}>
              {!query.trim() ? (
                <div style={hint}>
                  Type to search across your screens, patients, and the documentation.
                  <div style={{ marginTop: 8, display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <span><b style={kbdInline}>↑↓</b> navigate</span>
                    <span><b style={kbdInline}>↵</b> open</span>
                    <span><b style={kbdInline}>esc</b> close</span>
                  </div>
                </div>
              ) : flat.length === 0 ? (
                <div style={hint}>No matches for “{query}”.</div>
              ) : (
                <>
                  {results.nav.length > 0 && <Section label="Screens" />}
                  {results.nav.map((r) => {
                    const i = flat.findIndex((f) => f.kind === "nav" && f.id === r.id);
                    return (
                      <Row key={"n" + r.id} active={i === active} onClick={() => choose(flat[i])} onHover={() => setActive(i)}
                        icon={r.icon} title={r.label} sub={r.groupLabel} tag="Screen" />
                    );
                  })}

                  {results.patients.length > 0 && <Section label="Patients" />}
                  {results.patients.map((p) => {
                    const i = flat.findIndex((f) => f.kind === "patient" && f.id === p.id);
                    return (
                      <Row key={"p" + p.id} active={i === active} onClick={() => choose(flat[i])} onHover={() => setActive(i)}
                        icon="UserRound" title={`${p.lastName}, ${p.firstName}`} sub={`${p.hospitalNo} · ${p.status}`} tag="Patient" />
                    );
                  })}

                  {results.help.length > 0 && <Section label="Documentation" />}
                  {results.help.map((h) => {
                    const i = flat.findIndex((f) => f.kind === "help" && f.id === h.id);
                    return (
                      <Row key={"h" + h.id} active={i === active} onClick={() => choose(flat[i])} onHover={() => setActive(i)}
                        icon={h.icon} title={h.title} sub={h.excerpt} tag="Help" />
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Section({ label }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", padding: "10px 14px 5px" }}>
      {label}
    </div>
  );
}

function Row({ active, onClick, onHover, icon, title, sub, tag }) {
  const C = Icons[icon] || Icons.Circle;
  return (
    <button style={{ ...row, ...(active ? rowActive : null) }} onClick={onClick} onMouseEnter={onHover}>
      <C size={15} strokeWidth={1.9} style={{ color: active ? "var(--charcoal-strong)" : "var(--muted)", flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-strong)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
        <div style={{ fontSize: 11, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</div>
      </div>
      <span style={tagChip}>{tag}</span>
    </button>
  );
}

const trigger = {
  display: "flex", alignItems: "center", gap: 8, flex: "0 1 380px",
  background: "var(--surface)", border: "1px solid var(--border)",
  borderRadius: 8, padding: "7px 10px", cursor: "pointer", font: "inherit",
};
const kbd = {
  fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--muted)",
  background: "var(--surface-2)", border: "1px solid var(--border)",
  borderRadius: 4, padding: "2px 5px", flexShrink: 0,
};
const kbdInline = { fontFamily: "var(--font-mono)", color: "var(--charcoal)" };
const overlay = {
  position: "fixed", inset: 0, background: "rgba(22,35,59,0.32)",
  display: "flex", alignItems: "flex-start", justifyContent: "center",
  paddingTop: "12vh", zIndex: 100, backdropFilter: "blur(2px)",
};
const palette = {
  width: "100%", maxWidth: 560, background: "var(--surface-2)",
  border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden",
  boxShadow: "0 16px 48px rgba(22,35,59,0.22)",
};
const inputRow = {
  display: "flex", alignItems: "center", gap: 10,
  padding: "13px 15px", borderBottom: "1px solid var(--border)",
};
const paletteInput = {
  flex: 1, border: "none", outline: "none", font: "inherit",
  fontSize: 14.5, color: "var(--ink-strong)", background: "transparent",
};
const row = {
  width: "100%", display: "flex", alignItems: "center", gap: 10,
  padding: "8px 14px", background: "none", border: "none",
  cursor: "pointer", font: "inherit",
};
const rowActive = { background: "var(--charcoal-bg)" };
const tagChip = {
  fontSize: 9.5, fontWeight: 700, color: "var(--muted)", background: "var(--surface)",
  border: "1px solid var(--border)", padding: "1px 6px", borderRadius: 4,
  textTransform: "uppercase", letterSpacing: "0.04em", flexShrink: 0,
};
const hint = { padding: "22px 16px", fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6 };
