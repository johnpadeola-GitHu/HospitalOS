import { useAuth } from "../auth/AuthContext";

export default function NoAccess({ group }) {
  const { roleLabel } = useAuth();
  return (
    <div style={card}>
      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>Access restricted</div>
      <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--ink-strong)" }}>
        You don't have access to this area
      </h1>
      <p style={{ marginTop: 10, color: "var(--muted)", fontSize: 13, maxWidth: 460 }}>
        Your role ({roleLabel}) doesn't include the {group} permission. Ask a
        system administrator if you need access.
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
