import { useEffect, useState, useCallback } from "react";
import { listSites, createSite, toggleSite } from "./sysAdminService";
import { Button, PageHeader, Modal, Field, inputStyle } from "../../lib/ui";

export default function Facilities() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setSites(await listSites());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const toggle = async (id) => { await toggleSite(id); await refresh(); };

  return (
    <div>
      <PageHeader group="Administration" title={<>Facilities &amp; sites</>} icon="Hospital"
        actions={<Button variant="primary" onClick={() => setShowAdd(true)}>+ Add site</Button>} />

      {loading ? (
        <div style={{ color: "var(--muted)", fontSize: 13 }}>Loading sites…</div>
      ) : sites.length === 0 ? (
        <div style={{ color: "var(--muted)", fontSize: 13, padding: "20px 2px" }}>No sites registered yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sites.map((s) => (
            <div key={s.id} style={{ ...card, opacity: s.active ? 1 : 0.6 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 14, color: "var(--ink-strong)" }}>{s.name}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{s.type}{s.beds > 0 ? ` · ${s.beds} beds` : ""}</div>
              </div>
              <span style={s.active ? activePill : inactivePill}>{s.active ? "Active" : "Inactive"}</span>
              <Button onClick={() => toggle(s.id)}>{s.active ? "Deactivate" : "Activate"}</Button>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <AddSiteModal
          onClose={() => setShowAdd(false)}
          onDone={async () => { setShowAdd(false); await refresh(); }}
        />
      )}
    </div>
  );
}

function AddSiteModal({ onClose, onDone }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [beds, setBeds] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setBusy(true);
    setErr("");
    try {
      await createSite({ name, type, beds });
      await onDone();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Add site"
      onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={submit} disabled={busy || !name.trim() || !type.trim()}>
          {busy ? "Adding\u2026" : "Add site"}
        </Button>
      </>}
    >
      {err && <div style={{ color: "var(--bad)", fontSize: 12.5, marginBottom: 12 }}>{err}</div>}
      <Field label="Site name">
        <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ibadan Teaching Hospital \u2014 Annex" autoFocus />
      </Field>
      <Field label="Type">
        <input style={inputStyle} value={type} onChange={(e) => setType(e.target.value)} placeholder="e.g. Satellite clinic" />
      </Field>
      <Field label="Beds (optional)">
        <input type="number" style={inputStyle} value={beds} onChange={(e) => setBeds(e.target.value)} />
      </Field>
      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>New sites start Active.</div>
    </Modal>
  );
}

const card = { display: "flex", gap: 12, alignItems: "center", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 0, padding: "12px 16px" };
const activePill = { fontSize: 11, fontWeight: 500, color: "#4A6329", background: "#E6EFDF", padding: "2px 9px", borderRadius: 0 };
const inactivePill = { fontSize: 11, fontWeight: 500, color: "var(--muted)", background: "var(--surface)", padding: "2px 9px", borderRadius: 0 };
