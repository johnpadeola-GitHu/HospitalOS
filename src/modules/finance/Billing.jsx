import { useEffect, useState, useCallback } from "react";
import { listAccounts, recordPayment, billingSummary, createInvoice, initializeOnlinePayment } from "./billingService";
import { Button, Modal, Field, inputStyle, PageHeader } from "../../lib/ui";
import { useAuth } from "../../auth/AuthContext";
import ReceiptPrint from "./ReceiptPrint";

import { naira } from "../../lib/money";

export default function Billing() {
  const { may } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailFor, setDetailFor] = useState(null);
  const [payFor, setPayFor] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [accs, sum] = await Promise.all([listAccounts(), billingSummary()]);
      setAccounts(accs);
      setSummary(sum);
      // Keep an open detail drawer in sync after a payment.
      setDetailFor((cur) => (cur ? accs.find((a) => a.patientId === cur.patientId) || null : null));
    
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
      <PageHeader group="Finance & trade" title={<>Billing &amp; invoicing</>} icon="ReceiptText" />

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
                      {a.balance > 0 && may("finance:take-payment") && (
                        <Button variant="primary" onClick={() => setPayFor({ account: a, invoice: null })}>Take payment</Button>
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
          onPay={(invoice) => setPayFor({ account: detailFor, invoice })}
        />
      )}

      {payFor && (
        <PaymentModal
          account={payFor.account}
          invoice={payFor.invoice}
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
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [invoice, setInvoice] = useState(null);

  const generateInvoice = async () => {
    setBusy(true);
    setErr("");
    try {
      const inv = await createInvoice(account.patientId, account.charges);
      setInvoice(inv);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={`Account — ${account.patientName}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          {!invoice && account.charges.length > 0 && (
            <Button onClick={generateInvoice} disabled={busy}>{busy ? "Generating…" : "Generate invoice"}</Button>
          )}
          {account.balance > 0 && (
            <Button variant="primary" onClick={() => onPay(invoice)}>
              Take payment
            </Button>
          )}
        </>
      }
    >
      {err && <div style={errBox}>{err}</div>}
      {invoice && (
        <div style={invoiceBanner}>
          Invoice <span style={mono}>{invoice.invoiceNo}</span> generated for {naira(invoice.totalAmount)} {"\u2014"}
          a permanent record of these charges, finalized and immutable from here.
        </div>
      )}
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

function PaymentModal({ account, invoice, onClose, onDone }) {
  const { user: actor } = useAuth();
  const defaultAmount = invoice ? invoice.totalAmount : account.balance;
  const [amount, setAmount] = useState(String(Math.round(defaultAmount)));
  const [method, setMethod] = useState("Cash");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [showPrint, setShowPrint] = useState(false);

  const submit = async () => {
    setBusy(true);
    setErr("");
    try {
      const r = await recordPayment(account.patientId, amount, method, invoice?.id || null);
      setReceipt(r);
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  // Online payment is fundamentally different from the other methods:
  // instead of recording something that already happened, this starts a
  // transaction with the provider and sends the browser to their
  // checkout page. Nothing is recorded here at all \u2014 confirmation
  // happens server-to-server via webhook once the patient actually
  // pays, handled by PaymentCallback.jsx when the browser returns.
  const submitOnline = async () => {
    setBusy(true);
    setErr("");
    try {
      const r = await initializeOnlinePayment(account.patientId, amount, invoice?.id || null);
      window.location.href = r.authorizationUrl;
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  if (receipt) {
    if (showPrint) {
      return <ReceiptPrint payment={receipt} account={account} onClose={onDone} actor={actor} />;
    }
    return (
      <Modal
        title="Payment recorded"
        onClose={onDone}
        footer={
          <>
            <Button onClick={() => setShowPrint(true)}>Print receipt</Button>
            <Button variant="primary" onClick={onDone}>
              Done
            </Button>
          </>
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
          {method === "Online Payment" ? (
            <Button variant="primary" onClick={submitOnline} disabled={busy}>
              {busy ? "Starting…" : "Pay online"}
            </Button>
          ) : (
            <Button variant="primary" onClick={submit} disabled={busy}>
              {busy ? "Recording…" : "Record payment"}
            </Button>
          )}
        </>
      }
    >
      {err && <div style={errBox}>{err}</div>}
      {invoice ? (
        <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14 }}>
          Against invoice <span style={{ fontFamily: "var(--font-mono)" }}>{invoice.invoiceNo}</span>:{" "}
          <span style={{ fontFamily: "var(--font-mono)", color: "#8A5A17", fontWeight: 600 }}>
            {naira(invoice.totalAmount)}
          </span>
        </div>
      ) : (
        <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14 }}>
          Outstanding balance:{" "}
          <span style={{ fontFamily: "var(--font-mono)", color: "#8A5A17", fontWeight: 600 }}>
            {naira(account.balance)}
          </span>
        </div>
      )}
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <Field label="Amount (₦)">
            <input type="number" min="1" style={inputStyle} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
        </div>
        <div style={{ width: 160 }}>
          <Field label="Method">
            <select style={inputStyle} value={method} onChange={(e) => setMethod(e.target.value)}>
              <option>Cash</option>
              <option>Card</option>
              <option>POS</option>
              <option>Bank Transfer</option>
              <option>Online Payment</option>
              <option>NHIA</option>
            </select>
          </Field>
        </div>
      </div>
      {method === "Online Payment" && (
        <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 10, lineHeight: 1.4 }}>
          This will send this browser to the payment provider's own checkout page. Nothing is
          recorded until the payment is confirmed {"\u2014"} you'll be brought back here automatically.
        </p>
      )}
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
const tableWrap = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, overflow: "auto" };
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
const invoiceBanner = {
  background: "#EEF3EA",
  color: "#3D5A2A",
  fontSize: 12.5,
  padding: "10px 13px",
  borderRadius: 8,
  marginBottom: 14,
  lineHeight: 1.5,
};
const errBox = {
  background: "#F7E9E9",
  color: "#7A2E2E",
  fontSize: 12,
  padding: "8px 11px",
  borderRadius: 8,
  marginBottom: 14,
};
