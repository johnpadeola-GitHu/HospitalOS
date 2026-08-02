import { useEffect, useState } from "react";
import {
  listPayments, billingSummary, getAccount,
  getMyCashSession, openCashSession, closeCashSession, createRefund, listRefundsForPayment,
  createChargeback, listChargebacksForPayment, listChargebacks, resolveChargeback,
} from "./billingService";
import { PageHeader, Button, Modal, Field } from "../../lib/ui";
import ReceiptPrint from "./ReceiptPrint";
import { useAuth } from "../../auth/AuthContext";

import { naira } from "../../lib/money";

function when(iso) {
  return new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [printFor, setPrintFor] = useState(null);
  const [showOpen, setShowOpen] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [refundFor, setRefundFor] = useState(null);
  const [chargebackFor, setChargebackFor] = useState(null);
  const [openChargebacks, setOpenChargebacks] = useState([]);
  const { may } = useAuth();

  const refresh = () => {
    return Promise.all([listPayments(), billingSummary(), getMyCashSession(), listChargebacks("open")])
      .then(([p, s, sess, cbs]) => { setPayments(p); setSummary(s); setSession(sess); setOpenChargebacks(cbs); })
      .catch((e) => console.error(e));
  };

  useEffect(() => {
    let alive = true;
    setLoading(true);
    refresh().finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  return (
    <div>
      <PageHeader
        group="Finance & trade"
        title={<>Payments &amp; cashiering</>}
        icon="Banknote"
        actions={
          session
            ? <Button variant="ghost" onClick={() => setShowClose(true)}>Close cash session</Button>
            : <Button variant="primary" onClick={() => setShowOpen(true)}>Open cash session</Button>
        }
      />

      <div style={sessionBar}>
        {session ? (
          <>
            <span style={sessionDot} />
            <span><strong>{session.tillLabel}</strong> open since {when(session.openedAt)} — opening balance {naira(session.openingBalance)}</span>
          </>
        ) : (
          <span style={{ color: "var(--muted)" }}>No cash session open — open one before taking a Cash payment. Other payment methods don't need one.</span>
        )}
      </div>

      {summary && (
        <div style={statRow}>
          <Stat label="Collected" value={naira(summary.collected)} />
          <Stat label="Outstanding" value={naira(summary.outstanding)} accent={summary.outstanding > 0} />
          <Stat label="Receipts" value={payments.length} />
        </div>
      )}

      {openChargebacks.length > 0 && (
        <div style={chargebackPanel}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--warn)", marginBottom: 8 }}>
            {openChargebacks.length} open chargeback{openChargebacks.length > 1 ? "s" : ""} awaiting resolution
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {openChargebacks.map((cb) => (
              <div key={cb.id} style={chargebackRow}>
                <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {naira(cb.amount)} — {cb.reason}
                </span>
                <span style={{ fontSize: 11, color: "var(--muted)", marginRight: 8 }}>{when(cb.raisedAt)}</span>
                <ResolveChargebackButtons chargeback={cb} onDone={refresh} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={tableWrap}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Receipt", "Patient", "Method", "Settlement", "When", "Amount", ""].map((h) => (
                <th key={h} style={{ ...th, textAlign: h === "Amount" ? "right" : "left" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={emptyCell}>
                  Loading payments…
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={7} style={emptyCell}>
                  No payments recorded yet. Take a payment from Billing to see it here.
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.receipt} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 12 }}>{p.receipt}</td>
                  <td style={{ ...td, fontWeight: 500, color: "var(--ink-strong)" }}>
                    {p.patientName}
                    <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-mono)", fontWeight: 400 }}>
                      {p.hospitalNo}
                    </div>
                  </td>
                  <td style={td}>
                    <span style={methodPill}>{p.method}</span>
                  </td>
                  <td style={td}>
                    <span style={p.settlementStatus === "settled" ? settledPill : pendingPill}>
                      {p.settlementStatus === "settled" ? "Settled" : "Pending"}
                    </span>
                  </td>
                  <td style={{ ...td, color: "var(--muted)", fontSize: 12 }}>{when(p.at)}</td>
                  <td style={{ ...td, textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 600, color: "#4A6329" }}>
                    {naira(p.amount)}
                  </td>
                  <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }}>
                    <Button onClick={() => setPrintFor(p)}>Reprint</Button>
                    {may("finance:refund") && (
                      <>
                        <Button variant="ghost" onClick={() => setRefundFor(p)} style={{ marginLeft: 6 }}>Refund</Button>
                        {["Card", "POS", "Online Payment"].includes(p.method) && (
                          <Button variant="ghost" onClick={() => setChargebackFor(p)} style={{ marginLeft: 6 }}>Chargeback</Button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {printFor && <PaymentPrintWrapper payment={printFor} onClose={() => setPrintFor(null)} />}
      {showOpen && <OpenSessionModal onClose={() => setShowOpen(false)} onDone={() => { setShowOpen(false); refresh(); }} />}
      {showClose && session && <CloseSessionModal session={session} onClose={() => setShowClose(false)} onDone={() => { setShowClose(false); refresh(); }} />}
      {refundFor && <RefundModal payment={refundFor} onClose={() => setRefundFor(null)} onDone={() => { setRefundFor(null); refresh(); }} />}
      {chargebackFor && <ChargebackModal payment={chargebackFor} onClose={() => setChargebackFor(null)} onDone={() => { setChargebackFor(null); refresh(); }} />}
    </div>
  );
}

function OpenSessionModal({ onClose, onDone }) {
  const [tillLabel, setTillLabel] = useState("Main till");
  const [openingBalance, setOpeningBalance] = useState("0");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setBusy(true);
    setErr("");
    try {
      await openCashSession(openingBalance, tillLabel);
      await onDone();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <Modal title="Open cash session" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Opening…" : "Open session"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="Till"><input style={inputStyle} value={tillLabel} onChange={(e) => setTillLabel(e.target.value)} /></Field>
      <Field label="Opening balance"><input style={inputStyle} type="number" min="0" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} /></Field>
      <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
        Count the float in the drawer before you start and enter it here — this is what expected cash gets measured against when you close out.
      </p>
    </Modal>
  );
}

function CloseSessionModal({ session, onClose, onDone }) {
  const [actualCash, setActualCash] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState(null);

  const submit = async () => {
    setBusy(true);
    setErr("");
    try {
      const closed = await closeCashSession(session.id, actualCash);
      setResult(closed);
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  if (result) {
    return (
      <Modal title="Session closed" onClose={onDone} footer={<Button variant="primary" onClick={onDone}>Done</Button>}>
        <p style={{ fontSize: 13, marginBottom: 10 }}>Expected: <strong>{naira(result.expectedCash)}</strong></p>
        <p style={{ fontSize: 13, marginBottom: 10 }}>Counted: <strong>{naira(result.actualCash)}</strong></p>
        <p style={{ fontSize: 13 }}>
          Variance: <strong style={{ color: result.variance === 0 ? "var(--good)" : "var(--bad)" }}>{naira(result.variance)}</strong>
          {result.variance !== 0 && " \u2014 a supervisor can review this from the session history."}
        </p>
      </Modal>
    );
  }

  return (
    <Modal title={`Close ${session.tillLabel}`} onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Closing…" : "Close session"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="Actual cash counted"><input style={inputStyle} type="number" min="0" value={actualCash} onChange={(e) => setActualCash(e.target.value)} autoFocus /></Field>
      <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
        Count every note and coin in the drawer right now and enter the total — expected cash is calculated automatically from this session's own Cash payments.
      </p>
    </Modal>
  );
}

function RefundModal({ payment, onClose, onDone }) {
  const [amount, setAmount] = useState(String(payment.amount));
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [prior, setPrior] = useState(null);

  useEffect(() => {
    let alive = true;
    listRefundsForPayment(payment.id).then((r) => { if (alive) setPrior(r); }).catch((e) => console.error(e));
    return () => { alive = false; };
  }, [payment]);

  const alreadyRefunded = prior ? prior.reduce((s, r) => s + r.amount, 0) : 0;
  const remaining = Math.round((payment.amount - alreadyRefunded) * 100) / 100;

  const submit = async () => {
    setBusy(true);
    setErr("");
    try {
      await createRefund(payment.id, amount, reason);
      await onDone();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <Modal title={`Refund \u2014 ${payment.receipt}`} onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Processing…" : "Issue refund"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 10 }}>
        Original payment of {naira(payment.amount)} ({payment.method}).
        {alreadyRefunded > 0 && ` ${naira(alreadyRefunded)} already refunded \u2014 ${naira(remaining)} left to refund.`}
        {" "}This creates a new refund record — the original payment stays exactly as it was.
      </p>
      <Field label="Refund amount"><input style={inputStyle} type="number" min="0" max={remaining} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
      <Field label="Reason"><textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical", fontFamily: "var(--font-sans)" }} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this being refunded?" /></Field>
    </Modal>
  );
}

function ChargebackModal({ payment, onClose, onDone }) {
  const [amount, setAmount] = useState(String(payment.amount));
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [prior, setPrior] = useState(null);

  useEffect(() => {
    let alive = true;
    listChargebacksForPayment(payment.id).then((c) => { if (alive) setPrior(c); }).catch((e) => console.error(e));
    return () => { alive = false; };
  }, [payment]);

  const submit = async () => {
    setBusy(true);
    setErr("");
    try {
      await createChargeback(payment.id, amount, reason);
      await onDone();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <Modal title={`Raise chargeback — ${payment.receipt}`} onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Recording…" : "Raise chargeback"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 10 }}>
        Original payment of {naira(payment.amount)} ({payment.method}). Record this when the
        card issuer notifies you of a dispute — the amount stays with the hospital until this
        is actually resolved against the hospital.
      </p>
      {prior && prior.length > 0 && (
        <p style={{ fontSize: 12, color: "var(--warn)", marginBottom: 10 }}>
          This payment already has {prior.length} chargeback record(s) on file.
        </p>
      )}
      <Field label="Chargeback amount"><input style={inputStyle} type="number" min="0" max={payment.amount} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
      <Field label="Issuer's reason"><textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical", fontFamily: "var(--font-sans)" }} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="What did the card issuer cite?" /></Field>
    </Modal>
  );
}

function ResolveChargebackButtons({ chargeback, onDone }) {
  const [busy, setBusy] = useState(false);

  const resolve = async (outcome) => {
    setBusy(true);
    try { await resolveChargeback(chargeback.id, outcome); await onDone(); }
    catch (e) { console.error(e); setBusy(false); }
  };

  return (
    <div style={{ display: "inline-flex", gap: 6, flexShrink: 0 }}>
      <Button onClick={() => resolve("won")} disabled={busy}>Won</Button>
      <Button onClick={() => resolve("lost")} disabled={busy}>Lost</Button>
    </div>
  );
}

function PaymentPrintWrapper({ payment, onClose }) {
  const [account, setAccount] = useState(null);
  useEffect(() => { getAccount(payment.patientId).then(setAccount).catch((e) => console.error(e)); }, [payment.patientId]);
  return <ReceiptPrint payment={payment} account={account} onClose={onClose} actor={useAuth().user} />;
}

function Stat({ label, value, accent }) {
  return (
    <div style={statCard}>
      <div style={{ fontSize: 12, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600, fontFamily: "var(--font-mono)", color: accent ? "#8A5A17" : "var(--ink-strong)", marginTop: 2 }}>
        {value}
      </div>
    </div>
  );
}

const statRow = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 18 };
const statCard = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px" };
const tableWrap = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, overflow: "auto" };
const th = { fontSize: 11, fontWeight: 600, color: "var(--muted)", padding: "11px 14px", background: "var(--surface)" };
const td = { padding: "11px 14px", fontSize: 13, verticalAlign: "middle" };
const emptyCell = { padding: "28px 14px", textAlign: "center", color: "var(--muted)", fontSize: 13 };
const methodPill = { fontSize: 11, fontWeight: 500, color: "var(--ink)", background: "var(--surface)", padding: "2px 9px", borderRadius: 999 };
const settledPill = { fontSize: 11, fontWeight: 500, color: "var(--good)", background: "var(--good-bg)", padding: "2px 9px", borderRadius: 999 };
const pendingPill = { fontSize: 11, fontWeight: 500, color: "var(--warn)", background: "var(--warn-bg)", padding: "2px 9px", borderRadius: 999 };
const sessionBar = { display: "flex", alignItems: "center", gap: 8, fontSize: 13, padding: "10px 14px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, marginBottom: 16 };
const sessionDot = { width: 8, height: 8, borderRadius: 999, background: "var(--good)", flexShrink: 0 };
const inputStyle = { width: "100%", padding: "9px 11px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 13, fontFamily: "var(--font-sans)", background: "var(--surface-2)", color: "var(--ink)" };
const errBox = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12, padding: "8px 11px", borderRadius: 8, marginBottom: 14 };
