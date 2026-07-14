export function StatusBadge({ status }) {
  const map = {
    admitted: { bg: "#D3E1F8", fg: "#1E3350", label: "Admitted" },
    outpatient: { bg: "#E3ECF7", fg: "#3A5170", label: "Outpatient" },
    discharged: { bg: "#EDEFF2", fg: "#6B7C96", label: "Discharged" },
  };
  const s = map[status] || map.outpatient;
  return (
    <span
      style={{
        background: s.bg,
        color: s.fg,
        fontSize: 11,
        fontWeight: 500,
        padding: "2px 9px",
        borderRadius: 999,
        whiteSpace: "nowrap",
      }}
    >
      {s.label}
    </span>
  );
}

export function Button({ children, variant = "secondary", ...rest }) {
  const base = {
    font: "inherit",
    fontSize: 13,
    fontWeight: 500,
    padding: "8px 14px",
    borderRadius: 8,
    cursor: "pointer",
    border: "1px solid var(--border-strong)",
  };
  const variants = {
    primary: { background: "var(--ink-strong)", color: "#fff", borderColor: "var(--ink-strong)" },
    secondary: { background: "var(--surface-2)", color: "var(--ink)" },
    ghost: { background: "transparent", color: "var(--muted)", borderColor: "transparent" },
  };
  return (
    <button style={{ ...base, ...variants[variant] }} {...rest}>
      {children}
    </button>
  );
}

export function Modal({ title, onClose, children, footer }) {
  return (
    <div style={overlay} onClick={onClose}>
      <div style={sheet} onClick={(e) => e.stopPropagation()}>
        <div style={sheetHead}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--ink-strong)" }}>{title}</h2>
          <button onClick={onClose} style={closeBtn} aria-label="Close">
            &times;
          </button>
        </div>
        <div style={{ padding: "18px 20px" }}>{children}</div>
        {footer && <div style={sheetFoot}>{footer}</div>}
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <span style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 5 }}>
        {label}
      </span>
      {children}
    </label>
  );
}

export const inputStyle = {
  width: "100%",
  font: "inherit",
  fontSize: 13,
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid var(--border-strong)",
  background: "var(--surface-2)",
  color: "var(--ink)",
};

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(30,51,80,0.28)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
  zIndex: 50,
};
const sheet = {
  width: "100%",
  maxWidth: 440,
  background: "var(--surface-2)",
  borderRadius: 12,
  border: "1px solid var(--border)",
  overflow: "hidden",
};
const sheetHead = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "14px 20px",
  borderBottom: "1px solid var(--border)",
};
const sheetFoot = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 8,
  padding: "14px 20px",
  borderTop: "1px solid var(--border)",
};
const closeBtn = {
  background: "none",
  border: "none",
  fontSize: 22,
  lineHeight: 1,
  cursor: "pointer",
  color: "var(--muted)",
};
