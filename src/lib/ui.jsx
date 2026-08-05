import * as Icons from "lucide-react";

/* ---------- Page header: boxed icon + title + actions (LabOS signature) ---------- */
export function PageHeader({ group, title, icon = "Circle", subtitle, actions }) {
  const C = Icons[icon] || Icons.Circle;
  return (
    <div style={ph.wrap}>
      <div style={ph.iconBox}>
        <C size={19} strokeWidth={2} style={{ color: "var(--accent)" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {group && <div style={ph.group}>{group}</div>}
        <h1 style={ph.title}>{title}</h1>
        {subtitle && <div style={ph.sub}>{subtitle}</div>}
      </div>
      {actions && <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>{actions}</div>}
    </div>
  );
}

const ph = {
  wrap: { display: "flex", alignItems: "center", gap: 12, marginBottom: 20 },
  iconBox: {
    width: 38, height: 38, borderRadius: 0, background: "var(--accent-bg)",
    border: "1px solid var(--border)", display: "flex", alignItems: "center",
    justifyContent: "center", flexShrink: 0,
  },
  group: { fontSize: 10.5, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" },
  title: { fontSize: 22, fontWeight: 700, color: "var(--ink-strong)", letterSpacing: "-0.025em", lineHeight: 1.2 },
  sub: { fontSize: 12.5, color: "var(--muted)", marginTop: 2 },
};

/* ---------- Stat card: big number + semantic colour + sub-label ---------- */
export function StatCard({ label, value, sub, tone = "default", onClick }) {
  const tones = {
    default: "var(--ink-strong)",
    good: "var(--good)",
    warn: "var(--warn)",
    bad: "var(--bad)",
    accent: "var(--accent)",
  };
  const Tag = onClick ? "button" : "div";
  return (
    <Tag style={{ ...stat.card, ...(onClick ? stat.clickable : null) }} onClick={onClick}>
      <div style={stat.label}>{label}</div>
      <div style={{ ...stat.value, color: tones[tone] }}>{value}</div>
      {sub && <div style={stat.sub}>{sub}</div>}
    </Tag>
  );
}

const stat = {
  card: {
    background: "var(--surface-2)", border: "1px solid var(--border)",
    borderRadius: 0, padding: "14px 16px", boxShadow: "var(--shadow-sm)",
    textAlign: "left", font: "inherit", display: "block", width: "100%",
  },
  clickable: { cursor: "pointer" },
  label: { fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" },
  value: { fontSize: 28, fontWeight: 700, fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", margin: "5px 0 1px" },
  sub: { fontSize: 11.5, color: "var(--muted)" },
};

/* ---------- Card ---------- */
export function Card({ title, action, children, pad = true }) {
  return (
    <div style={card.wrap}>
      {(title || action) && (
        <div style={card.head}>
          <span style={card.title}>{title}</span>
          {action}
        </div>
      )}
      <div style={{ padding: pad ? "14px 16px" : 0 }}>{children}</div>
    </div>
  );
}

const card = {
  wrap: {
    background: "var(--surface-2)", border: "1px solid var(--border)",
    borderRadius: 0, boxShadow: "var(--shadow-sm)", overflow: "hidden",
  },
  head: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "12px 16px", borderBottom: "1px solid var(--border)",
  },
  title: { fontSize: 13.5, fontWeight: 700, color: "var(--ink-strong)", letterSpacing: "-0.01em" },
};

/* ---------- Status pill ---------- */
export function Pill({ tone = "info", children }) {
  const tones = {
    good: { bg: "var(--good-bg)", fg: "var(--good)" },
    warn: { bg: "var(--warn-bg)", fg: "var(--warn)" },
    bad: { bg: "var(--bad-bg)", fg: "var(--bad)" },
    info: { bg: "var(--info-bg)", fg: "var(--info)" },
    muted: { bg: "var(--surface)", fg: "var(--muted)" },
  };
  const t = tones[tone] || tones.info;
  return (
    <span style={{
      background: t.bg, color: t.fg, fontSize: 10.5, fontWeight: 700,
      padding: "3px 9px", borderRadius: 0, whiteSpace: "nowrap",
      textTransform: "uppercase", letterSpacing: "0.04em",
    }}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const map = {
    admitted: ["info", "Admitted"],
    outpatient: ["muted", "Outpatient"],
    discharged: ["muted", "Discharged"],
  };
  const [tone, label] = map[status] || ["muted", status];
  return <Pill tone={tone}>{label}</Pill>;
}

/* ---------- Button ---------- */
export function Button({ children, variant = "secondary", icon, ...rest }) {
  const C = icon ? Icons[icon] : null;
  const base = {
    font: "inherit", fontSize: 12.5, fontWeight: 600, padding: "8px 13px",
    borderRadius: 0, cursor: "pointer", border: "1px solid var(--border-strong)",
    display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
    transition: "background .12s",
  };
  const variants = {
    primary: { background: "var(--accent)", color: "#fff", borderColor: "var(--accent)", boxShadow: "var(--shadow-sm)" },
    secondary: { background: "var(--surface-2)", color: "var(--ink)" },
    ghost: { background: "transparent", color: "var(--muted)", borderColor: "transparent" },
    danger: { background: "var(--bad)", color: "#fff", borderColor: "var(--bad)" },
  };
  return (
    <button style={{ ...base, ...variants[variant] }} {...rest}>
      {C && <C size={14} strokeWidth={2.2} />}
      {children}
    </button>
  );
}

/* ---------- Modal ---------- */
export function Modal({ title, onClose, children, footer }) {
  return (
    <div style={overlay} onClick={onClose}>
      <div style={sheet} onClick={(e) => e.stopPropagation()}>
        <div style={sheetHead}>
          <h2 style={{ fontSize: 15.5, fontWeight: 700, color: "var(--ink-strong)", letterSpacing: "-0.015em" }}>{title}</h2>
          <button onClick={onClose} style={closeBtn} aria-label="Close"><Icons.X size={15} strokeWidth={2.4} /></button>
        </div>
        <div style={sheetBody}>{children}</div>
        {footer && <div style={sheetFoot}>{footer}</div>}
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <span style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "var(--muted)", marginBottom: 5 }}>{label}</span>
      {children}
    </label>
  );
}

export const inputStyle = {
  width: "100%", font: "inherit", fontSize: 13, padding: "8px 10px",
  borderRadius: 0, border: "1px solid var(--border-strong)",
  background: "var(--surface-2)", color: "var(--ink)",
};

/* ---------- Empty state ---------- */
export function EmptyState({ icon = "Inbox", title, hint }) {
  const C = Icons[icon] || Icons.Inbox;
  return (
    <div style={{ background: "var(--surface-2)", border: "1px dashed var(--border-strong)", borderRadius: 0, padding: "34px 24px", textAlign: "center" }}>
      <C size={26} strokeWidth={1.6} style={{ color: "var(--muted)", marginBottom: 8 }} />
      <div style={{ fontWeight: 700, color: "var(--ink-strong)", marginBottom: 3 }}>{title}</div>
      {hint && <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{hint}</div>}
    </div>
  );
}

const overlay = {
  position: "fixed", inset: 0, background: "rgba(22,35,59,0.35)",
  display: "flex", alignItems: "center", justifyContent: "center",
  padding: 20, zIndex: 50, backdropFilter: "blur(2px)",
};
const sheet = {
  width: "100%", maxWidth: 460, maxHeight: "88vh", background: "var(--surface-2)",
  borderRadius: 0, border: "1px solid var(--border)", overflow: "hidden",
  boxShadow: "0 12px 40px rgba(22,35,59,0.18)", display: "flex", flexDirection: "column",
};
const sheetBody = { padding: "18px 20px", overflowY: "auto", flex: "1 1 auto", WebkitOverflowScrolling: "touch" };
const sheetHead = {
  display: "flex", alignItems: "center", justifyContent: "space-between",
  padding: "14px 20px", borderBottom: "1px solid var(--border)", flexShrink: 0,
};
const sheetFoot = {
  display: "flex", justifyContent: "flex-end", gap: 8,
  padding: "13px 20px", borderTop: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0,
};
const closeBtn = {
  background: "var(--bad)", border: "none", cursor: "pointer",
  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
  width: 26, height: 26, borderRadius: 0, flexShrink: 0,
  boxShadow: "0 1px 2px rgba(176,40,31,0.35)",
};
