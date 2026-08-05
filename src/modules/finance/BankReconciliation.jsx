import { useEffect, useState, useRef, useCallback } from "react";
import {
  parseCsv, autoMapColumns, missingRequiredColumns, rowsToTransactions,
  importBankTransactions, listBankTransactions, listMatchCandidates, manualMatch, markNoMatch,
} from "./bankReconciliationService";
import { PageHeader, Button, Modal, Pill } from "../../lib/ui";

import { naira } from "../../lib/money";
const when = (iso) => new Date(iso).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });

const STATUS_TONE = { unmatched: "warn", auto_matched: "good", manually_matched: "good", no_match: "bad" };
const STATUS_LABEL = { unmatched: "Needs review", auto_matched: "Auto-matched", manually_matched: "Matched", no_match: "No match" };

export default function BankReconciliation() {
  const [txns, setTxns] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [reviewFor, setReviewFor] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setTxns(await listBankTransactions(filter));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { refresh(); }, [refresh]);

  const unmatchedCount = txns.filter((t) => t.matchStatus === "unmatched").length;

  return (
    <div>
      <PageHeader
        group="Finance & trade"
        title="Bank reconciliation"
        icon="Landmark"
        subtitle="Import a bank statement and match it against pending Bank Transfer payments — never marked reconciled just because a payment was recorded"
        actions={<Button variant="primary" onClick={() => setShowImport(true)}>Import statement</Button>}
      />

      <div style={filterRow}>
        {["all", "unmatched", "auto_matched", "manually_matched", "no_match"].map((s) => (
          <button key={s} onClick={() => setFilter(s)} style={{ ...filterChip, ...(filter === s ? filterChipActive : null) }}>
            {s === "all" ? "All" : STATUS_LABEL[s]}
          </button>
        ))}
        {unmatchedCount > 0 && filter !== "unmatched" && (
          <span style={{ fontSize: 12, color: "var(--warn)", marginLeft: 4 }}>{unmatchedCount} awaiting review</span>
        )}
      </div>

      <div style={tableWrap}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Bank ref", "Date", "Sender", "Narration", "Amount", "Status", ""].map((h) => (
                <th key={h} style={{ ...th, textAlign: h === "Amount" ? "right" : "left" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={emptyCell}>Loading…</td></tr>
            ) : txns.length === 0 ? (
              <tr><td colSpan={7} style={emptyCell}>No bank transactions imported yet.</td></tr>
            ) : (
              txns.map((t) => (
                <tr key={t.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 12 }}>{t.bankRef}</td>
                  <td style={{ ...td, fontSize: 12, color: "var(--muted)" }}>{when(t.transactionDate)}</td>
                  <td style={td}>{t.senderName || "\u2014"}</td>
                  <td style={{ ...td, fontSize: 12, color: "var(--muted)", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.narration || "\u2014"}
                  </td>
                  <td style={{ ...td, textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 600 }}>{naira(t.amount)}</td>
                  <td style={td}><Pill tone={STATUS_TONE[t.matchStatus]}>{STATUS_LABEL[t.matchStatus]}</Pill></td>
                  <td style={{ ...td, textAlign: "right" }}>
                    {t.matchStatus === "unmatched" && <Button onClick={() => setReviewFor(t)}>Review</Button>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showImport && <ImportModal onClose={() => setShowImport(false)} onDone={() => { setShowImport(false); refresh(); }} />}
      {reviewFor && <ReviewModal txn={reviewFor} onClose={() => setReviewFor(null)} onDone={() => { setReviewFor(null); refresh(); }} />}
    </div>
  );
}

function ImportModal({ onClose, onDone }) {
  const [fileName, setFileName] = useState("");
  const [transactions, setTransactions] = useState(null);
  const [missing, setMissing] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setErr("");
    const reader = new FileReader();
    reader.onload = () => {
      const { headers, rows } = parseCsv(String(reader.result));
      if (headers.length === 0) { setErr("Could not read any rows from this file."); return; }
      const columnMap = autoMapColumns(headers);
      const missingCols = missingRequiredColumns(columnMap);
      setMissing(missingCols);
      if (missingCols.length > 0) {
        setErr(`Couldn't find a column for: ${missingCols.join(", ")}. Expected headers like "Reference", "Amount", and "Date".`);
        setTransactions(null);
        return;
      }
      setFileName(f.name);
      setTransactions(rowsToTransactions(rows, columnMap));
    };
    reader.readAsText(f);
  };

  const submit = async () => {
    setBusy(true);
    setErr("");
    try {
      const r = await importBankTransactions(transactions);
      setResult(r);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (result) {
    const autoMatched = result.imported.filter((t) => t.matchStatus === "auto_matched").length;
    return (
      <Modal title="Statement imported" onClose={onDone} footer={<Button variant="primary" onClick={onDone}>Done</Button>}>
        <p style={{ fontSize: 13, marginBottom: 8 }}>Imported <strong>{result.imported.length}</strong> transaction(s).</p>
        <p style={{ fontSize: 13, marginBottom: 8 }}>Auto-matched to a pending payment: <strong>{autoMatched}</strong></p>
        {result.skipped.length > 0 && (
          <p style={{ fontSize: 13, color: "var(--warn)" }}>Skipped {result.skipped.length} row(s) — duplicates or missing data.</p>
        )}
      </Modal>
    );
  }

  return (
    <Modal
      title="Import bank statement"
      onClose={onClose}
      footer={<>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={submit} disabled={busy || !transactions || missing.length > 0}>
          {busy ? "Importing…" : transactions ? `Import ${transactions.length} transaction(s)` : "Import"}
        </Button>
      </>}
    >
      {err && <div style={errBox}>{err}</div>}
      <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 14 }}>
        Export a CSV from your bank's online portal and upload it here. Columns are detected
        automatically from common headers — Reference, Amount, and Date are required; Sender
        and Narration are used if present.
      </p>
      <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={onFile} style={{ fontSize: 13 }} />
      {fileName && transactions && (
        <p style={{ fontSize: 12.5, color: "var(--good)", marginTop: 12 }}>
          {fileName} — {transactions.length} row(s) ready to import.
        </p>
      )}
    </Modal>
  );
}

function ReviewModal({ txn, onClose, onDone }) {
  const [candidates, setCandidates] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    listMatchCandidates(txn.id).then((c) => { if (alive) setCandidates(c); }).catch((e) => setErr(e.message));
    return () => { alive = false; };
  }, [txn]);

  const doMatch = async (paymentId) => {
    setBusy(true);
    setErr("");
    try { await manualMatch(txn.id, paymentId); await onDone(); }
    catch (e) { setErr(e.message); setBusy(false); }
  };

  const doNoMatch = async () => {
    setBusy(true);
    setErr("");
    try { await markNoMatch(txn.id); await onDone(); }
    catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal
      title={`Review \u2014 ${txn.bankRef}`}
      onClose={onClose}
      footer={<>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={doNoMatch} disabled={busy}>No matching payment</Button>
      </>}
    >
      {err && <div style={errBox}>{err}</div>}
      <div style={{ fontSize: 13, marginBottom: 14 }}>
        <strong>{naira(txn.amount)}</strong> from {txn.senderName || "an unnamed sender"} on {when(txn.transactionDate)}
        {txn.narration && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>{txn.narration}</div>}
      </div>
      <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>
        No automatic match was found — select the pending Bank Transfer payment this corresponds to, or confirm there isn't one.
      </p>
      {candidates === null ? (
        <div style={{ fontSize: 13, color: "var(--muted)" }}>Loading candidates…</div>
      ) : candidates.length === 0 ? (
        <div style={{ fontSize: 13, color: "var(--muted)" }}>No pending Bank Transfer payments to match against right now.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 280, overflow: "auto" }}>
          {candidates.map((c) => (
            <div key={c.id} style={candidateRow}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-strong)" }}>{c.patientName}</div>
                <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>{c.hospitalNo} · {when(c.at)}</div>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, marginRight: 10 }}>{naira(c.amount)}</div>
              <Button variant="primary" onClick={() => doMatch(c.id)} disabled={busy}>Match</Button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

const filterRow = { display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" };
const filterChip = { fontSize: 12, fontWeight: 500, padding: "6px 12px", borderRadius: 0, border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--muted)", cursor: "pointer" };
const filterChipActive = { background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" };
const tableWrap = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 0, overflow: "auto" };
const th = { fontSize: 11, fontWeight: 600, color: "var(--muted)", padding: "11px 14px", background: "var(--surface)" };
const td = { padding: "11px 14px", fontSize: 13, verticalAlign: "middle" };
const emptyCell = { padding: "28px 14px", textAlign: "center", color: "var(--muted)", fontSize: 13 };
const errBox = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12, padding: "8px 11px", borderRadius: 0, marginBottom: 14 };
const candidateRow = { display: "flex", alignItems: "center", padding: "9px 10px", border: "1px solid var(--border)", borderRadius: 0 };
