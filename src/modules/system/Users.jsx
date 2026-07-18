import { useEffect, useState, useCallback } from "react";
import { listUsers, createUser, updateUserRole, toggleUserActive } from "./systemService";
import { ROLES, AREAS, ACTIONS, roleLabel, canDo, areasFor } from "../../lib/rbac";
import { Button, Modal, Field, inputStyle, PageHeader } from "../../lib/ui";

const ROLE_KEYS = Object.keys(ROLES);

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showMatrix, setShowMatrix] = useState(false);
  const [err, setErr] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setUsers(await listUsers({ query }));
    setLoading(false);
  }, [query]);

  useEffect(() => {
    const t = setTimeout(refresh, 180);
    return () => clearTimeout(t);
  }, [refresh]);

  const changeRole = async (id, role) => {
    setErr("");
    try {
      await updateUserRole(id, role);
      await refresh();
    } catch (e) {
      setErr(e.message);
    }
  };

  const toggle = async (id) => {
    setErr("");
    try {
      await toggleUserActive(id);
      await refresh();
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div>
      <PageHeader
        group="Administration"
        title={<>Users &amp; roles</>}
        icon="UsersRound"
        actions={
          <>
            <Button onClick={() => setShowMatrix(true)}>Permission matrix</Button>
            <Button variant="primary" icon="Plus" onClick={() => setShowAdd(true)}>Add user</Button>
          </>
        }
      />

      {err && <div style={errBanner}>{err}</div>}

      <div style={{ marginBottom: 14 }}>
        <input
          style={{ ...inputStyle, maxWidth: 280 }}
          placeholder="Search name, email or role"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div style={tableWrap}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["User", "Role", "Status", ""].map((h) => (
                <th key={h} style={th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} style={emptyCell}>
                  Loading users…
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} style={{ borderTop: "1px solid var(--border)", opacity: u.active ? 1 : 0.55 }}>
                  <td style={td}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={avatar}>{u.name.split(" ").map((p) => p[0]).slice(-2).join("")}</div>
                      <div>
                        <div style={{ fontWeight: 500, color: "var(--ink-strong)" }}>{u.name}</div>
                        <div style={{ fontSize: 12, color: "var(--muted)" }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={td}>
                    <select
                      style={{ ...inputStyle, maxWidth: 180, padding: "6px 8px" }}
                      value={u.role}
                      onChange={(e) => changeRole(u.id, e.target.value)}
                    >
                      {ROLE_KEYS.map((rk) => (
                        <option key={rk} value={rk}>
                          {roleLabel(rk)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={td}>
                    <span style={u.active ? activePill : inactivePill}>{u.active ? "Active" : "Inactive"}</span>
                  </td>
                  <td style={{ ...td, textAlign: "right" }}>
                    <Button onClick={() => toggle(u.id)}>{u.active ? "Deactivate" : "Reactivate"}</Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <AddUserModal
          onClose={() => setShowAdd(false)}
          onDone={async () => {
            setShowAdd(false);
            await refresh();
          }}
        />
      )}

      {showMatrix && <MatrixModal onClose={() => setShowMatrix(false)} />}
    </div>
  );
}

function AddUserModal({ onClose, onDone }) {
  const [form, setForm] = useState({ name: "", email: "", role: "nurse" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true);
    setErr("");
    try {
      await createUser(form);
      await onDone();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Add user"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={busy}>
            {busy ? "Adding…" : "Add user"}
          </Button>
        </>
      }
    >
      {err && <div style={errBox}>{err}</div>}
      <Field label="Full name">
        <input style={inputStyle} value={form.name} onChange={set("name")} placeholder="Dr. Chioma Nwosu" />
      </Field>
      <Field label="Email">
        <input style={inputStyle} value={form.email} onChange={set("email")} placeholder="c.nwosu@hospitalos.ng" />
      </Field>
      <Field label="Role">
        <select style={inputStyle} value={form.role} onChange={set("role")}>
          {ROLE_KEYS.map((rk) => (
            <option key={rk} value={rk}>
              {roleLabel(rk)}
            </option>
          ))}
        </select>
      </Field>
      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
        Grants access to: {areasFor(form.role).map((k) => AREAS.find((a) => a.key === k)?.label).filter(Boolean).join(", ")}
      </div>
    </Modal>
  );
}

function MatrixModal({ onClose }) {
  const [tab, setTab] = useState("areas");
  const cols = tab === "areas" ? AREAS : ACTIONS;
  const has = (roleKey, key) => (tab === "areas" ? areasFor(roleKey).includes(key) : canDo(roleKey, key));

  return (
    <Modal
      title="Role permission matrix"
      onClose={onClose}
      footer={<Button variant="ghost" onClick={onClose}>Close</Button>}
    >
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {[["areas", "Areas"], ["actions", "Actions"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ ...tabBtn, ...(tab === id ? tabActive : null) }}>
            {label}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 10, lineHeight: 1.5 }}>
        {tab === "areas"
          ? "Areas gate the sidebar and routes \u2014 whether a role can reach a section at all."
          : "Actions gate the buttons within an area \u2014 what a role may actually do there."}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", fontSize: 11.5, width: "100%" }}>
          <thead>
            <tr>
              <th style={matrixCorner}>Role</th>
              {cols.map((c) => (
                <th key={c.key} style={matrixColHead} title={c.label}>{c.key.split(":").pop()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(ROLES).map(([key, r]) => (
              <tr key={key} style={{ borderTop: "1px solid var(--border)" }}>
                <td style={matrixRowHead}>{r.label}</td>
                {cols.map((c) => (
                  <td key={c.key} style={matrixCell}>
                    {has(key, c.key)
                      ? <span style={{ color: "var(--good)", fontWeight: 700 }}>&#10003;</span>
                      : <span style={{ color: "var(--border-strong)" }}>&middot;</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

const tabBtn = { font: "inherit", fontSize: 12, fontWeight: 600, padding: "5px 11px", borderRadius: 7, border: "1px solid var(--border-strong)", background: "var(--surface-2)", color: "var(--muted)", cursor: "pointer" };
const tabActive = { background: "var(--charcoal)", color: "#fff", borderColor: "var(--charcoal)" };

const header = { display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 18 };
const tableWrap = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, overflow: "auto" };
const th = { textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--muted)", padding: "11px 14px", background: "var(--surface)" };
const td = { padding: "11px 14px", fontSize: 13, verticalAlign: "middle" };
const emptyCell = { padding: "28px 14px", textAlign: "center", color: "var(--muted)", fontSize: 13 };
const avatar = {
  width: 34,
  height: 34,
  borderRadius: "50%",
  background: "var(--accent-bg)",
  color: "var(--ink-strong)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 12,
  fontWeight: 600,
  flexShrink: 0,
};
const activePill = { fontSize: 11, fontWeight: 500, color: "#4A6329", background: "#E6EFDF", padding: "2px 9px", borderRadius: 999 };
const inactivePill = { fontSize: 11, fontWeight: 500, color: "var(--muted)", background: "var(--surface)", padding: "2px 9px", borderRadius: 999 };
const errBanner = { background: "#F7E9E9", color: "#7A2E2E", fontSize: 13, padding: "10px 14px", borderRadius: 10, marginBottom: 14 };
const errBox = { background: "#F7E9E9", color: "#7A2E2E", fontSize: 12, padding: "8px 11px", borderRadius: 8, marginBottom: 14 };
const matrixCorner = { position: "sticky", left: 0, background: "var(--surface)", padding: "8px 10px", textAlign: "left", fontWeight: 600, color: "var(--muted)" };
const matrixColHead = { padding: "8px 6px", color: "var(--muted)", fontWeight: 500, fontSize: 10, whiteSpace: "nowrap", writingMode: "vertical-rl", transform: "rotate(180deg)", height: 70 };
const matrixRowHead = { position: "sticky", left: 0, background: "var(--surface-2)", padding: "8px 10px", fontWeight: 500, color: "var(--ink-strong)", whiteSpace: "nowrap" };
const matrixCell = { padding: "8px 6px", textAlign: "center" };
