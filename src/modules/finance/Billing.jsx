import { useEffect, useState, useCallback } from "react";
import { listAccounts, recordPayment, billingSummary } from "./billingService";
import { Button, Modal, Field, inputStyle } from "../../lib/ui";

const naira = (n) => "\u20a6" + Math.round(n).toLocaleString();

export default function Billing() {
  const [accounts, setAccounts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailFor, setDetailFor] = useState(null);
  const [payFor, setPayFor] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [accs, sum] = await Promise.all([listAccounts(), billingSummary()]);
    setAccounts(accs);
    setSummary(sum);
    // Keep an open detail drawer in sync after a payment.
    setDetailFor((cur) => (cur ? accs.find((a) => a.patientId === cur.patientId) || null : null));
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, color: "var(--muted)" }}>Finance &amp; trade</div>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--ink-strong)" }}>Billing &amp; invoicing</h1>
      </div>

      {summary && (
        <div style={statRow}>
          <Stat label="Accounts" value={summary.accounts} />
          <Stat label="Billed" value={naira(summary.billed)} />
          <Stat label="Collected" value={naira(summary.collected)} />
          <Stat label="Outstanding" value={naira(summary.outstanding)} accent={summary.outstanding > 0} />
        </div>
      )}

      <div style={tableWrap}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Patient", "Charges", "Paid", "Balance", ""].map((h) => (
                <th key={h} style={{ ...th, textAlign: h === "Patient" ? "left" : "right" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={emptyCell}>
                  Loading accounts…
                </td>
              </tr>
            ) : accounts.length === 0 ? (
              <tr>
                <td colSpan={5} style={emptyCell}>
                  No billable activity yet. Lab orders and dispenses appear here as charges.
                </td>
              </tr>
            ) : (
              accounts.map((a) => (
                <tr key={a.patientId} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ ...td, fontWeight: 500, color: "var(--ink-strong)" }}>
                    {a.patientName}
                    <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-mono)", fontWeight: 400 }}>
                      {a.hospitalNo}
                    </div>
                  </td>
                  <td style={{ ...td, ...num }}>{naira(a.chargeTotal)}</td>
                  <td style={{ ...td, ...num, color: "var(--muted)" }}>{naira(a.paid)}</td>
                  <td style={{ ...td, ...num, fontWeight: 600, color: a.balance > 0 ? "#8A5A17" : "#4A6329" }}>
                    {naira(a.balance)}
                  </td>
                  <td style={{ ...td, textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: 6 }}>
                      <Button onClick={() => setDetailFor(a)}>View</Button>
                      {a.balance > 0 && (
                        <Button variant="primary" onClick={() => setPayFor(a)}>
                          Take payment
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

      {detailFor && (
        <DetailModal
          account={detailFor}
          onClose={() => setDetailFor(null)}
          onPay={() => setPayFor(detailFor)}
        />
      )}

      {payFor && (
        <PaymentModal
          account={payFor}
          onClose={() => setPayFor(null)}
          onDone={async () => {
            setPayFor(null);
            await refresh();
          }}
        />
      )}
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div style={statCard}>
      <div style={{ fontSize: 12, color: "var(--muted)" }}>{label}</div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 600,
          fontFamily: "var(--font-mono)",
          color: accent ? "#8A5A17" : "var(--ink-strong)",
          marginTop: 2,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function DetailModal({ account, onClose, onPay }) {
  return (
    <Modal
      title={`Account — ${account.patientName}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          {account.balance > 0 && (
            <Button variant="primary" onClick={onPay}>
              Take payment
            </Button>
          )}
        </>
      }
    >
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>
        {account.hospitalNo}
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {account.charges.map((c, i) => (
          <div key={i} style={chargeRow}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: "var(--ink-strong)" }}>{c.description}</div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>
                {c.source} · <span style={{ fontFamily: "var(--font-mono)" }}>{c.reference}</span>
              </div>
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--ink-strong)" }}>
              {naira(c.amount)}
            </div>
          </div>
        ))}
      </div>
      <div style={totalRow}>
        <span>Charges</span>
        <span style={mono}>{naira(account.chargeTotal)}</span>
      </div>
      <div style={{ ...totalRow, color: "var(--muted)" }}>
        <span>Paid</span>
        <span style={mono}>{naira(account.paid)}</span>
      </div>
      <div style={{ ...totalRow, fontWeight: 600, color: account.balance > 0 ? "#8A5A17" : "#4A6329" }}>
        <span>Balance</span>
        <span style={mono}>{naira(account.balance)}</span>
      </div>
    </Modal>
  );
}

function PaymentModal({ account, onClose, onDone }) {
  const [amount, setAmount] = useState(String(Math.round(account.balance)));
  const [method, setMethod] = useState("Cash");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [receipt, setReceipt] = useState(null);

  const submit = async () => {
    setBusy(true);
    setErr("");
    try {
      const r = await recordPayment(account.patientId, amount, method);
      setReceipt(r);
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  if (receipt) {
    return (
      <Modal
        title="Payment recorded"
        onClose={onDone}
        footer={
          <Button variant="primary" onClick={onDone}>
            Done
          </Button>
        }
      >
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)" }}>
            {receipt.receipt}
          </div>
          <div style={{ fontSize: 26, fontWeight: 600, color: "#4A6329", margin: "6px 0" }}>
            {naira(receipt.amount)}
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            {receipt.method} · {account.patientName}
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title={`Take payment — ${account.patientName}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={busy}>
            {busy ? "Recording…" : "Record payment"}
          </Button>
        </>
      }
    >
      {err && <div style={errBox}>{err}</div>}
      <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14 }}>
        Outstanding balance:{" "}
        <span style={{ fontFamily: "var(--font-mono)", color: "#8A5A17", fontWeight: 600 }}>
          {naira(account.balance)}
        </span>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <Field label="Amount (\u20a6)">
            <input type="number" min="1" style={inputStyle} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
        </div>
        <div style={{ width: 140 }}>
          <Field label="Method">
            <select style={inputStyle} value={method} onChange={(e) => setMethod(e.target.value)}>
              <option>Cash</option>
              <option>Card</option>
              <option>Transfer</option>
              <option>NHIS</option>
            </select>
          </Field>
        </div>
      </div>
    </Modal>
  );
}

const statRow = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 12,
  marginBottom: 18,
};
const statCard = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px" };
const tableWrap = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" };
const th = { fontSize: 11, fontWeight: 600, color: "var(--muted)", padding: "11px 14px", background: "var(--surface)" };
const td = { padding: "11px 14px", fontSize: 13, verticalAlign: "middle" };
const num = { textAlign: "right", fontFamily: "var(--font-mono)" };
const mono = { fontFamily: "var(--font-mono)" };
const emptyCell = { padding: "28px 14px", textAlign: "center", color: "var(--muted)", fontSize: 13 };
const chargeRow = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "9px 0",
  borderTop: "1px solid var(--border)",
};
const totalRow = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: 13,
  padding: "7px 0",
  borderTop: "1px solid var(--border)",
  marginTop: 0,
};
const errBox = {
  background: "#F7E9E9",
  color: "#7A2E2E",
  fontSize: 12,
  padding: "8px 11px",
  borderRadius: 8,
  marginBottom: 14,
};
