import { useEffect, useState, useCallback } from "react";
import { CHANNELS, TEMPLATES, STATUS_TONE, listMessages, compose, commsSummary } from "./commsService";
import { PageHeader, StatCard, Card, Pill, Button, Modal, Field, inputStyle, EmptyState } from "../../lib/ui";

function ago(iso) {
  if (!iso) return "\u2014";
  const m = Math.round((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return "just now";
  return m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`;
}

export default function Communication() {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [channel, setChannel] = useState("all");
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [m, s] = await Promise.all([listMessages({ channel, status, query }), commsSummary()]);
      setRows(m); setSummary(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [channel, status, query]);

  useEffect(() => { const t = setTimeout(refresh, 150); return () => clearTimeout(t); }, [refresh]);
  useEffect(() => { const t = setInterval(refresh, 2000); return () => clearInterval(t); }, [refresh]);

  return (
    <div>
      <PageHeader group="Overview" title="Communication hub" icon="MessagesSquare"
        subtitle="SMS, WhatsApp, email and in-app delivery queue"
        actions={<Button variant="primary" icon="Send" onClick={() => setShowCompose(true)}>Compose</Button>} />

      {summary && (
        <div style={statGrid}>
          <StatCard label="Total" value={summary.total} />
          <StatCard label="Delivered" value={summary.delivered} tone="good" />
          <StatCard label="Queued" value={summary.queued} tone="info" />
          <StatCard label="Failed" value={summary.failed} tone={summary.failed ? "bad" : "default"} />
          {summary.byChannel.map((c) => <StatCard key={c.channel} label={c.channel} value={c.n} />)}
        </div>
      )}

      <div style={toolbar}>
        <input style={{ ...inputStyle, maxWidth: 240 }} placeholder="Search recipient or message…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select style={{ ...inputStyle, maxWidth: 160 }} value={channel} onChange={(e) => setChannel(e.target.value)}>
          <option value="all">All channels</option>
          {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select style={{ ...inputStyle, maxWidth: 160 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          {["queued", "delivered", "failed"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <Card title="Delivery queue" pad={false}>
        {loading ? <div style={{ padding: 20, color: "var(--muted)", fontSize: 13 }}>Loading…</div> : rows.length === 0 ? (
          <div style={{ padding: 22 }}><EmptyState icon="MessagesSquare" title="No messages match" /></div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Ref", "Channel", "Recipient", "Template", "Message", "Status", "Sent"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 11.5 }}>{m.ref}</td>
                  <td style={td}><Pill tone="muted">{m.channel}</Pill></td>
                  <td style={{ ...td, fontWeight: 600, color: "var(--ink-strong)" }}>{m.recipient}</td>
                  <td style={{ ...td, fontSize: 12, color: "var(--muted)" }}>{m.template}</td>
                  <td style={{ ...td, fontSize: 12, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.message}</td>
                  <td style={td}><Pill tone={STATUS_TONE[m.status]}>{m.status}</Pill></td>
                  <td style={{ ...td, fontSize: 11.5, color: "var(--muted)" }}>{ago(m.sent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {showCompose && <ComposeModal onClose={() => setShowCompose(false)} onDone={async () => { setShowCompose(false); await refresh(); }} />}
    </div>
  );
}

function ComposeModal({ onClose, onDone }) {
  const [form, setForm] = useState({ channel: CHANNELS[0], recipient: "", templateKey: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => {
    const v = e.target.value;
    setForm((f) => {
      const next = { ...f, [k]: v };
      if (k === "templateKey") {
        const t = TEMPLATES.find((x) => x.key === v);
        if (t) next.channel = t.channel;
      }
      return next;
    });
  };

  const submit = async () => {
    setBusy(true); setErr("");
    try { await compose(form); await onDone(); } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title="Compose message" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Sending…" : "Send"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="Template">
        <select style={inputStyle} value={form.templateKey} onChange={set("templateKey")}>
          <option value="">Custom message</option>
          {TEMPLATES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
      </Field>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ width: 140 }}><Field label="Channel"><select style={inputStyle} value={form.channel} onChange={set("channel")}>{CHANNELS.map((c) => <option key={c}>{c}</option>)}</select></Field></div>
        <div style={{ flex: 1 }}><Field label="Recipient"><input style={inputStyle} value={form.recipient} onChange={set("recipient")} placeholder="Name" /></Field></div>
      </div>
      <Field label="Message">
        <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical", fontFamily: "var(--font-sans)" }} value={form.message} onChange={set("message")} />
      </Field>
    </Modal>
  );
}

const statGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 10, marginBottom: 16 };
const toolbar = { display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" };
const th = { textAlign: "left", fontSize: 10.5, fontWeight: 700, color: "var(--muted)", padding: "10px 14px", background: "var(--surface)", textTransform: "uppercase", letterSpacing: "0.05em" };
const td = { padding: "10px 14px", fontSize: 12.5, verticalAlign: "middle" };
const errBox = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12, padding: "8px 11px", borderRadius: 0, marginBottom: 14 };
