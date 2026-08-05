import { useEffect, useState, useCallback } from "react";
import {
  BLOOD_GROUPS,
  listInventory,
  addUnit,
  listRequests,
  createRequest,
  issueRequest,
  completeTransfusion,
  compatibleDonors,
} from "./bloodBankService";
import { listPatients } from "../patients/patientService";
import { Button, Modal, Field, inputStyle, PageHeader } from "../../lib/ui";

export default function BloodBank() {
  const [tab, setTab] = useState("inventory");
  return (
    <div>
      <PageHeader group="Diagnostics" title={<>Blood bank &amp; transfusion</>} icon="Droplet" />

      <div style={tabs}>
        {[
          ["inventory", "Inventory"],
          ["requests", "Transfusion requests"],
        ].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ ...tabBtn, ...(tab === id ? tabActive : null) }}>
            {label}
          </button>
        ))}
      </div>

      {tab === "inventory" ? <InventoryTab /> : <RequestsTab />}
    </div>
  );
}

function InventoryTab() {
  const [inv, setInv] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setInv(await listInventory());
    
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <Button variant="primary" onClick={() => setShowAdd(true)}>
          + Add unit
        </Button>
      </div>

      {loading ? (
        <div style={{ color: "var(--muted)", fontSize: 13 }}>Loading inventory…</div>
      ) : (
        <div style={invGrid}>
          {inv.map((g) => (
            <div key={g.group} style={{ ...groupCard, ...(g.low ? groupLow : null) }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 600, color: "var(--ink-strong)" }}>
                  {g.group}
                </span>
                {g.low && <span style={lowPill}>Low</span>}
              </div>
              <div style={{ fontSize: 28, fontWeight: 600, fontFamily: "var(--font-mono)", color: g.low ? "#B0281F" : "var(--ink-strong)", margin: "4px 0" }}>
                {g.count}
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>
                reorder at {g.reorder}
                {g.nearExpiry > 0 && (
                  <span style={{ color: "#A35A2E" }}> · {g.nearExpiry} near expiry</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <AddUnitModal
          onClose={() => setShowAdd(false)}
          onDone={async () => {
            setShowAdd(false);
            await refresh();
          }}
        />
      )}
    </div>
  );
}

function AddUnitModal({ onClose, onDone }) {
  const [group, setGroup] = useState("O+");
  const [days, setDays] = useState("35");
  const [qty, setQty] = useState("1");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    const n = parseInt(qty, 10);
    if (!Number.isFinite(n) || n < 1 || n > 100) {
      setErr("Enter a quantity between 1 and 100.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      await addUnit({ group, expiryDaysAhead: parseInt(days, 10) || 35, quantity: n });
      await onDone();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Add blood unit"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={busy}>
            {busy ? "Adding…" : `Add ${(parseInt(qty,10) || 1) > 1 ? (parseInt(qty,10)+" units") : "unit"}`}
          </Button>
        </>
      }
    >
      {err && <div style={errBox}>{err}</div>}
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <Field label="Blood group">
            <select style={inputStyle} value={group} onChange={(e) => setGroup(e.target.value)}>
              {BLOOD_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div style={{ width: 150 }}>
          <Field label="Expires in (days)">
            <input type="number" min="1" style={inputStyle} value={days} onChange={(e) => setDays(e.target.value)} />
          </Field>
        </div>
        <div style={{ width: 110 }}>
          <Field label="Quantity">
            <input type="number" min="1" max="100" style={inputStyle} value={qty} onChange={(e) => setQty(e.target.value)} />
          </Field>
        </div>
      </div>
    </Modal>
  );
}

function RequestsTab() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setRequests(await listRequests());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const act = async (fn, id) => {
    await fn(id);
    await refresh();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <Button variant="primary" onClick={() => setShowNew(true)}>
          + New request
        </Button>
      </div>

      <div style={tableWrap}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Ref", "Recipient", "Group", "Unit", "Status", ""].map((h) => (
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
                  Loading…
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={6} style={emptyCell}>
                  No open transfusion requests.
                </td>
              </tr>
            ) : (
              requests.map((r) => (
                <tr key={r.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 12 }}>{r.ref}</td>
                  <td style={{ ...td, fontWeight: 500, color: "var(--ink-strong)" }}>{r.patientName}</td>
                  <td style={{ ...td, fontFamily: "var(--font-mono)" }}>{r.recipientGroup}</td>
                  <td style={{ ...td, fontSize: 12 }}>
                    <span style={{ fontFamily: "var(--font-mono)" }}>{r.unitTag}</span>{" "}
                    <span style={{ color: "var(--muted)" }}>({r.unitGroup})</span>
                  </td>
                  <td style={td}>
                    <ReqStatus status={r.status} />
                  </td>
                  <td style={{ ...td, textAlign: "right" }}>
                    {r.status === "crossmatched" && (
                      <Button onClick={() => act(issueRequest, r.id)}>Issue</Button>
                    )}
                    {r.status === "issued" && (
                      <Button variant="primary" onClick={() => act(completeTransfusion, r.id)}>
                        Record transfusion
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showNew && (
        <NewRequestModal
          onClose={() => setShowNew(false)}
          onDone={async () => {
            setShowNew(false);
            await refresh();
          }}
        />
      )}
    </div>
  );
}

function ReqStatus({ status }) {
  const tint = {
    crossmatched: { bg: "#FBF0DC", fg: "#8A5A17" },
    issued: { bg: "#E3ECF7", fg: "#3A5170" },
    transfused: { bg: "#E6EFDF", fg: "#4A6329" },
  }[status];
  const label = { crossmatched: "Crossmatched", issued: "Issued", transfused: "Transfused" }[status];
  return (
    <span style={{ background: tint.bg, color: tint.fg, fontSize: 11, fontWeight: 500, padding: "2px 9px", borderRadius: 0 }}>
      {label}
    </span>
  );
}

function NewRequestModal({ onClose, onDone }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [group, setGroup] = useState("O+");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      try { const rows = await listPatients({ query, status: "all" }); if (alive) setResults(rows.slice(0, 5)); } catch (e) { console.error(e); if (alive) setResults([]); }
    }, 180);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [query]);

  const submit = async () => {
    if (!selected) {
      setErr("Select a patient first.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      await createRequest({
        patientId: selected.id,
        patientName: `${selected.lastName}, ${selected.firstName}`,
        hospitalNo: selected.hospitalNo,
        recipientGroup: group,
      });
      await onDone();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title="New transfusion request"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={busy || !selected}>
            {busy ? "Requesting…" : "Crossmatch"}
          </Button>
        </>
      }
    >
      {err && <div style={errBox}>{err}</div>}
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
      <div style={{ maxHeight: 130, overflowY: "auto", marginBottom: 14 }}>
        {results.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelected(p)}
            style={{ ...resultRow, ...(selected?.id === p.id ? resultRowActive : null) }}
          >
            <span style={{ fontWeight: 500, color: "var(--ink-strong)" }}>
              {p.lastName}, {p.firstName}
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>{p.hospitalNo}</span>
          </button>
        ))}
      </div>
      <Field label="Recipient blood group">
        <select style={inputStyle} value={group} onChange={(e) => setGroup(e.target.value)}>
          {BLOOD_GROUPS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </Field>
      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
        Compatible donor units: {compatibleDonors(group).join(", ")}
      </div>
    </Modal>
  );
}

const tabs = { display: "flex", gap: 6, marginBottom: 16 };
const tabBtn = {
  font: "inherit",
  fontSize: 13,
  fontWeight: 500,
  padding: "7px 14px",
  borderRadius: 0,
  border: "1px solid var(--border-strong)",
  background: "var(--surface-2)",
  color: "var(--muted)",
  cursor: "pointer",
};
const tabActive = { background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" };
const invGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 12 };
const groupCard = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 0, padding: "14px 16px" };
const groupLow = { borderColor: "#E4B6B2", background: "#FCF4F3" };
const lowPill = { fontSize: 10, fontWeight: 600, color: "#B0281F", background: "#F7E4E2", padding: "1px 7px", borderRadius: 0 };
const tableWrap = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 0, overflow: "auto" };
const th = { textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--muted)", padding: "11px 14px", background: "var(--surface)" };
const td = { padding: "11px 14px", fontSize: 13, verticalAlign: "middle" };
const emptyCell = { padding: "28px 14px", textAlign: "center", color: "var(--muted)", fontSize: 13 };
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
const errBox = { background: "#F7E9E9", color: "#7A2E2E", fontSize: 12, padding: "8px 11px", borderRadius: 0, marginBottom: 14 };
