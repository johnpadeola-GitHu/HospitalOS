import { useEffect, useState, useCallback } from "react";
import {
  INSURERS,
  STATUS_LABELS,
  listClaims,
  createClaim,
  setClaimStatus,
  claimsSummary,
} from "./claimsService";
import { Button, Modal, Field, inputStyle, PageHeader } from "../../lib/ui";
import { useAuth } from "../../auth/AuthContext";
import PatientPicker from "../patients/PatientPicker";
import { record, AUDIT_ACTIONS } from "../../lib/audit";

const naira = (n) => "\u20a6" + Math.round(n).toLocaleString();

const FILTERS = [
  { id: "all", label: "All" },
  { id: "submitted", label: "Submitted" },
  { id: "approved", label: "Approved" },
  { id: "paid", label: "Paid" },
  { id: "rejected", label: "Rejected" },
];

export default function Claims() {
  const { may, user } = useAuth();
  const [claims, setClaims] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [showNew, setShowNew] = useState(false);
  const [err, setErr] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    const [c, s] = await Promise.all([listClaims({ status }), claimsSummary()]);
    setClaims(c);
    setSummary(s);
    setLoading(false);
  }, [status]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const act = async (id, next) => {
    setErr("");
    try {
      const c = claims.find((x) => x.id === id);
      await setClaimStatus(id, next);
      record({ actor: user, action: AUDIT_ACTIONS.FINANCIAL, entity: "claim", entityId: c?.ref || id,
               detail: `Claim ${next} — ${c?.insurer || ""} ${c ? "\u20a6" + c.amount.toLocaleString() : ""}`, severity: "info" });
      await refresh();
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div>
      <PageHeader group="Finance & trade" title={<>Insurance &amp; NHIA claims</>} icon="FileCheck" actions={<><Button variant="primary" onClick={() => setShowNew(true)}>
          + New claim
        </Button></>} />

      {summary && (
        <div style={statRow}>
          <Stat label="Submitted" value={naira(summary.submittedValue)} />
          <Stat label="Approved" value={naira(summary.approvedValue)} />
          <Stat label="Paid" value={naira(summary.paidValue)} accent />
          <Stat label="Rejected" value={naira(summary.rejectedValue)} />
        </div>
      )}

      {err && <div style={errBanner}>{err}</div>}

      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {FILTERS.map((f) => (
          <button key={f.id} onClick={() => setStatus(f.id)} style={{ ...chip, ...(status === f.id ? chipActive : null) }}>
            {f.label}
          </button>
        ))}
      </div>

      <div style={tableWrap}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Ref", "Patient", "Insurer", "Amount", "Status", ""].map((h) => (
                <th key={h} style={{ ...th, textAlign: h === "Amount" ? "right" : "left" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={emptyCell}>
                  Loading claims…
                </td>
              </tr>
            ) : claims.length === 0 ? (
              <tr>
                <td colSpan={6} style={emptyCell}>
                  No claims match.
                </td>
              </tr>
            ) : (
              claims.map((c) => (
                <tr key={c.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 12 }}>{c.ref}</td>
                  <td style={{ ...td, fontWeight: 500, color: "var(--ink-strong)" }}>{c.patientName}</td>
                  <td style={td}>{c.insurer}</td>
                  <td style={{ ...td, textAlign: "right", fontFamily: "var(--font-mono)" }}>{naira(c.amount)}</td>
                  <td style={td}>
                    <ClaimStatus status={c.status} />
                  </td>
                  <td style={{ ...td, textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: 6 }}>
                      {c.status === "submitted" && may("finance:approve-claim") && (
                        <>
                          <Button onClick={() => act(c.id, "approved")}>Approve</Button>
                          <Button onClick={() => act(c.id, "rejected")}>Reject</Button>
                        </>
                      )}
                      {c.status === "approved" && (
                        <Button variant="primary" onClick={() => act(c.id, "paid")}>
                          Mark paid
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showNew && (
        <NewClaimModal
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

function ClaimStatus({ status }) {
  const tint = {
    submitted: { bg: "#E3ECF7", fg: "#3A5170" },
    approved: { bg: "#FBF0DC", fg: "#8A5A17" },
    paid: { bg: "#E6EFDF", fg: "#4A6329" },
    rejected: { bg: "#F7E4E2", fg: "#B0281F" },
  }[status];
  return (
    <span style={{ background: tint.bg, color: tint.fg, fontSize: 11, fontWeight: 500, padding: "2px 9px", borderRadius: 999 }}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function NewClaimModal({ onClose, onDone }) {
  const [form, setForm] = useState({ patientId: null, patientName: "", hospitalNo: "", insurer: "NHIA", amount: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true);
    setErr("");
    try {
      await createClaim(form);
      await onDone();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title="New insurance claim"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={busy}>
            {busy ? "Submitting…" : "Submit claim"}
          </Button>
        </>
      }
    >
      {err && <div style={errBox}>{err}</div>}
      <Field label="Patient">
        <PatientPicker value={form} onChange={(p) => setForm((f) => ({ ...f, ...p }))} />
      </Field>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ width: 150 }}>
          <Field label="Amount (\u20a6)">
            <input type="number" min="1" style={inputStyle} value={form.amount} onChange={set("amount")} />
          </Field>
        </div>
      </div>
      <Field label="Insurer">
        <select style={inputStyle} value={form.insurer} onChange={set("insurer")}>
          {INSURERS.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
      </Field>
    </Modal>
  );
}

const header = { display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 18 };
const statRow = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 18 };
const statCard = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px" };
const chip = {
  font: "inherit",
  fontSize: 12,
  fontWeight: 500,
  padding: "6px 12px",
  borderRadius: 999,
  border: "1px solid var(--border-strong)",
  background: "var(--surface-2)",
  color: "var(--muted)",
  cursor: "pointer",
};
const chipActive = { background: "var(--ink-strong)", color: "#fff", borderColor: "var(--ink-strong)" };
const tableWrap = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, overflow: "auto" };
const th = { fontSize: 11, fontWeight: 600, color: "var(--muted)", padding: "11px 14px", background: "var(--surface)" };
const td = { padding: "11px 14px", fontSize: 13, verticalAlign: "middle" };
const emptyCell = { padding: "28px 14px", textAlign: "center", color: "var(--muted)", fontSize: 13 };
function Stat({ label, value, accent }) {
  return (
    <div style={statCard}>
      <div style={{ fontSize: 12, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 600, fontFamily: "var(--font-mono)", color: accent ? "#4A6329" : "var(--ink-strong)", marginTop: 2 }}>
        {value}
      </div>
    </div>
  );
}
const errBanner = { background: "#F7E9E9", color: "#7A2E2E", fontSize: 13, padding: "10px 14px", borderRadius: 10, marginBottom: 14 };
const errBox = { background: "#F7E9E9", color: "#7A2E2E", fontSize: 12, padding: "8px 11px", borderRadius: 8, marginBottom: 14 };
