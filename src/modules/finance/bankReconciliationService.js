// Bank reconciliation service — Phase 6 of the financial architecture
// review, frontend half. Ingestion is a statement import (see
// migrations/0055's header for why: no live bank feed API exists), so
// this is a CSV upload, parsed the same way data-import's own parser
// works — minimal, quoted-comma-aware, no external library.

const API_URL = "https://hospitalos-api.johnpadeola.workers.dev";

function authHeaders() {
  const token = localStorage.getItem("hospitalos_session_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiCall(path, { method = "GET", body } = {}) {
  let res, data;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: body ? JSON.stringify(body) : undefined,
    });
    data = await res.json();
  } catch {
    throw new Error("Couldn't reach the server. Check your connection and try again.");
  }
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

const HEADER_ALIASES = {
  bankRef: ["reference", "ref", "transaction ref", "transaction reference", "txn ref", "tran id"],
  amount: ["amount", "credit", "credit amount", "value"],
  transactionDate: ["date", "transaction date", "value date", "posting date"],
  senderName: ["sender", "sender name", "originator", "payer", "remitter"],
  narration: ["narration", "description", "remarks", "memo", "details"],
};
const REQUIRED_FIELDS = ["bankRef", "amount", "transactionDate"];

/** Same minimal quoted-comma-aware CSV split used by data-import's own parser. */
export function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const splitLine = (line) => {
    const cells = [];
    let cur = "", inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { inQuotes = !inQuotes; continue; }
      if (c === "," && !inQuotes) { cells.push(cur); cur = ""; continue; }
      cur += c;
    }
    cells.push(cur);
    return cells.map((c) => c.trim());
  };
  const headers = splitLine(lines[0]);
  const rows = lines.slice(1).map(splitLine);
  return { headers, rows };
}

/** Auto-detects which CSV column is which, using common bank-statement header names. Returns null for any field it can't find. */
export function autoMapColumns(headers) {
  const map = {};
  for (const field of Object.keys(HEADER_ALIASES)) {
    const aliases = HEADER_ALIASES[field];
    const idx = headers.findIndex((h) => aliases.includes(h.trim().toLowerCase()));
    map[field] = idx >= 0 ? idx : null;
  }
  return map;
}

export function missingRequiredColumns(columnMap) {
  return REQUIRED_FIELDS.filter((f) => columnMap[f] == null);
}

/** Turns parsed CSV rows + a column map into the transaction objects the import endpoint expects. */
export function rowsToTransactions(rows, columnMap) {
  return rows.map((r) => ({
    bankRef: columnMap.bankRef != null ? r[columnMap.bankRef] : null,
    amount: columnMap.amount != null ? parseFloat(r[columnMap.amount].replace(/,/g, "")) : null,
    transactionDate: columnMap.transactionDate != null ? r[columnMap.transactionDate] : null,
    senderName: columnMap.senderName != null ? r[columnMap.senderName] : null,
    narration: columnMap.narration != null ? r[columnMap.narration] : null,
  })).filter((t) => t.bankRef && t.amount > 0 && t.transactionDate);
}

export async function importBankTransactions(transactions) {
  return apiCall("/finance/bank-transactions/import", { method: "POST", body: { transactions } });
}

export async function listBankTransactions(status = "all") {
  return apiCall(`/finance/bank-transactions${status !== "all" ? `?status=${encodeURIComponent(status)}` : ""}`);
}

export async function listMatchCandidates(bankTxnId) {
  return apiCall(`/finance/bank-transactions/${encodeURIComponent(bankTxnId)}/candidates`);
}

export async function manualMatch(bankTxnId, paymentId) {
  return apiCall(`/finance/bank-transactions/${encodeURIComponent(bankTxnId)}/match`, { method: "PATCH", body: { paymentId } });
}

export async function markNoMatch(bankTxnId) {
  return apiCall(`/finance/bank-transactions/${encodeURIComponent(bankTxnId)}/no-match`, { method: "PATCH" });
}
