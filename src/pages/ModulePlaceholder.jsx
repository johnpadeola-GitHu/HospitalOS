export default function ModulePlaceholder({ title, group }) {
  return (
    <div style={card}>
      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>{group}</div>
      <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--ink-strong)" }}>{title}</h1>
      <p style={{ marginTop: 10, color: "var(--muted)", fontSize: 13, maxWidth: 460 }}>
        This module is scaffolded and routed. Build starts here when it reaches the
        sequence.
      </p>
    </div>
  );
}

const card = {
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: 0,
  padding: "22px 24px",
};
