import { useEffect, useState, useCallback } from "react";
import * as Icons from "lucide-react";
import {
  STATUS_TONE, listInstruments, listMessages, setInstrumentStatus,
  pendingForInstrument, postResultMessage, gatewaySummary,
} from "./instrumentsService";
import { PageHeader, StatCard, Card, Pill, Button, Modal, inputStyle, EmptyState } from "../../lib/ui";

function ago(iso) {
  const m = Math.round((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

export default function Instruments() {
  const [instruments, setInstruments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [receiveFor, setReceiveFor] = useState(null);
  const [err, setErr] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    const [i, m, s] = await Promise.all([listInstruments(), listMessages({ limit: 12 }), gatewaySummary()]);
    setInstruments(i); setMessages(m); setSummary(s); setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const cycleStatus = async (inst) => {
    setErr("");
    const order = ["online", "idle", "offline", "error"];
    await setInstrumentStatus(inst.id, order[(order.indexOf(inst.status) + 1) % order.length]);
    await refresh();
  };

  return (
    <div>
      <PageHeader group="Diagnostics" title="Instruments gateway" icon="Cable"
        subtitle="Analyzer interface — HL7 v2 result messages post directly into Laboratory" />

      <div style={note}>
        <Icons.Info size={14} style={{ color: "var(--muted)", flexShrink: 0, marginTop: 1 }} />
        <span>
          Live MLLP listening runs server-side. This screen manages and monitors the
          interface; <b>Receive result</b> simulates an inbound ORU^R01 through the same
          code path a real analyzer would use.
        </span>
      </div>

      {err && <div style={errBanner}>{err}</div>}

      {summary && (
        <div style={statGrid}>
          <StatCard label="Instruments" value={summary.total} />
          <StatCard label="Online" value={summary.online} tone="good" />
          <StatCard label="Errored" value={summary.errored} tone={summary.errored ? "bad" : "default"} />
          <StatCard label="Offline" value={summary.offline} />
          <StatCard label="Messages" value={summary.messages24h.toLocaleString()} sub="lifetime" />
          <StatCard label="Errors" value={summary.errors24h} tone={summary.errors24h ? "warn" : "default"} />
        </div>
      )}

      <div style={{ marginBottom: 14 }}>
        <Card title="Analyzer registry" pad={false}>
          {loading ? <div style={{ padding: 20, color: "var(--muted)", fontSize: 13 }}>Loading…</div> : (
            instruments.map((i, idx) => (
              <div key={i.id} style={{ ...row, borderTop: idx ? "1px solid var(--border)" : "none" }}>
                <div style={iconBox}><Icons.Cpu size={17} strokeWidth={1.9} style={{ color: "var(--accent)" }} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink-strong)" }}>{i.name}</span>
                    <Pill tone={STATUS_TONE[i.status]}>{i.status}</Pill>
                  </div>
                  <div style={meta}>{i.type} · {i.vendor}</div>
                  <div style={{ ...meta, fontFamily: "var(--font-mono)" }}>{i.ae} · {i.host} · {i.protocol}</div>
                  <div style={meta}>
                    Handles: {i.handles.length ? i.handles.join(", ") : "\u2014"} · {i.messages.toLocaleString()} msgs
                    {i.errors > 0 && <span style={{ color: "var(--warn)" }}> · {i.errors} errors</span>} · seen {ago(i.lastSeen)}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, alignSelf: "center", flexShrink: 0 }}>
                  {i.handles.length > 0 && i.status !== "offline" && (
                    <Button variant="primary" icon="Download" onClick={() => setReceiveFor(i)}>Receive result</Button>
                  )}
                  <Button onClick={() => cycleStatus(i)}>Set status</Button>
                </div>
              </div>
            ))
          )}
        </Card>
      </div>

      <Card title="HL7 message log" pad={false}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>{["Time", "Instrument", "Type", "Accession", "Ack", "Detail"].map((h) => <th key={h} style={th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {messages.map((m) => (
              <tr key={m.id} style={{ borderTop: "1px solid var(--border)" }}>
                <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--muted)" }}>{ago(m.at)}</td>
                <td style={{ ...td, fontWeight: 600, color: "var(--ink-strong)" }}>{m.instrument}</td>
                <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 11.5 }}>{m.type}</td>
                <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 11.5 }}>{m.accession}</td>
                <td style={td}><Pill tone={m.status === "ack" ? "good" : "bad"}>{m.status}</Pill></td>
                <td style={{ ...td, color: "var(--muted)", fontSize: 12 }}>{m.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {receiveFor && (
        <ReceiveModal instrument={receiveFor} onClose={() => setReceiveFor(null)}
          onDone={async () => { setReceiveFor(null); await refresh(); }} />
      )}
    </div>
  );
}

function ReceiveModal({ instrument, onClose, onDone }) {
  const [pending, setPending] = useState(null);
  const [orderId, setOrderId] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    pendingForInstrument(instrument.id).then((p) => {
      if (!alive) return;
      setPending(p); setOrderId(p[0]?.id || "");
    });
    return () => { alive = false; };
  }, [instrument.id]);

  const send = async () => {
    setBusy(true); setErr("");
    try { setResult(await postResultMessage({ instrumentId: instrument.id, orderId })); }
    catch (e) { setErr(e.message); setBusy(false); }
  };

  if (result) {
    return (
      <Modal title="Result message received" onClose={onDone}
        footer={<Button variant="primary" onClick={onDone}>Done</Button>}>
        <div style={{ fontSize: 13, marginBottom: 10 }}>
          <span style={{ color: "var(--muted)" }}>Posted to </span>
          <b style={{ color: "var(--ink-strong)" }}>{result.order.testName}</b>
          <span style={{ color: "var(--muted)" }}> for {result.order.patientName}</span>
        </div>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>RAW HL7 v2 MESSAGE</div>
        <pre style={hl7Box}>{result.hl7}</pre>
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 10 }}>
          Results are on the order in Laboratory, flagged against reference ranges.
          Any critical value has raised an alert.
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={`Receive result — ${instrument.name}`} onClose={onClose}
      footer={<>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={send} disabled={busy || !orderId}>{busy ? "Receiving…" : "Simulate ORU^R01"}</Button>
      </>}>
      {err && <div style={errBox}>{err}</div>}
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12, fontFamily: "var(--font-mono)" }}>
        {instrument.ae} · handles {instrument.handles.join(", ")}
      </div>
      {pending === null ? <div style={{ fontSize: 13, color: "var(--muted)" }}>Checking worklist…</div>
        : pending.length === 0 ? (
          <EmptyState icon="Inbox" title="No samples awaiting results"
            hint={`Order a ${instrument.handles.join(" or ")} in Laboratory and collect the sample first.`} />
        ) : (
          <>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--muted)", marginBottom: 5 }}>AWAITING RESULT</div>
            <select style={inputStyle} value={orderId} onChange={(e) => setOrderId(e.target.value)}>
              {pending.map((o) => <option key={o.id} value={o.id}>{o.accession} — {o.testName} — {o.patientName}</option>)}
            </select>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 10 }}>
              The analyzer will generate values and post them as an HL7 ORU^R01.
            </div>
          </>
        )}
    </Modal>
  );
}

const note = { display: "flex", gap: 8, background: "var(--accent-soft)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 13px", fontSize: 12, color: "var(--muted)", marginBottom: 16, lineHeight: 1.5 };
const statGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: 16 };
const row = { display: "flex", gap: 12, padding: "13px 16px" };
const iconBox = { width: 36, height: 36, borderRadius: 9, background: "var(--accent-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };
const meta = { fontSize: 11.5, color: "var(--muted)", marginTop: 3 };
const th = { textAlign: "left", fontSize: 10.5, fontWeight: 700, color: "var(--muted)", padding: "10px 16px", background: "var(--surface)", textTransform: "uppercase", letterSpacing: "0.05em" };
const td = { padding: "10px 16px", fontSize: 12.5, verticalAlign: "middle" };
const hl7Box = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: 10.5, lineHeight: 1.65, overflowX: "auto", whiteSpace: "pre", color: "var(--ink)" };
const errBanner = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 13, padding: "10px 14px", borderRadius: 10, marginBottom: 14 };
const errBox = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12, padding: "8px 11px", borderRadius: 8, marginBottom: 14 };
