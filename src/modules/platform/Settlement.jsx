import { useEffect, useState, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import * as Icons from "lucide-react";
import {
  STATUS_TONE, listSettlements, closeCurrentCycle, advanceSettlement,
  settlementSummary, payoutAccount, listUsage, usageSummary, revenueMix,
  listPlatformInvoices, markPlatformInvoicePaid,
} from "./settlementService";
import { StatCard, Card, Pill, Button } from "../../lib/ui";

const naira = (n) => "\u20a6" + Math.round(n).toLocaleString();
const compact = (n) => n >= 1000000 ? (n / 1000000).toFixed(1) + "M" : n >= 1000 ? (n / 1000).toFixed(0) + "k" : String(n);

export default function Settlement() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  const refresh = useCallback(async () => {
    setErr("");
    try {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString();
      const now = new Date().toISOString();
      const [settlements, sum, payout, usage, uSum, mix, invoices] = await Promise.all([
        listSettlements(), settlementSummary(), payoutAccount(), listUsage(), usageSummary(), revenueMix(ninetyDaysAgo, now), listPlatformInvoices(),
      ]);
      setData({ settlements, sum, payout, usage, uSum, mix, invoices });
    } catch (e) {
      setErr(e.message);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const advance = async (id) => {
    setErr("");
    try { await advanceSettlement(id); await refresh(); } catch (e) { setErr(e.message); }
  };

  const markPaid = async (invoiceId) => {
    setErr("");
    try { await markPlatformInvoicePaid(invoiceId); await refresh(); } catch (e) { setErr(e.message); }
  };

  if (!data) return <div style={{ color: err ? "var(--bad)" : "var(--muted)", fontSize: 13 }}>{err || "Loading settlement…"}</div>;
  const { sum, uSum } = data;

  return (
    <div>
      {err && <div style={errBanner}>{err}</div>}

      <div style={{ ...sectionTitle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>Settlement centre</span>
        <Button
          icon="CircleCheck"
          onClick={async () => { setErr(""); try { await closeCurrentCycle(); await refresh(); } catch (e) { setErr(e.message); } }}
        >
          Close completed cycle
        </Button>
      </div>
      <div style={statGrid}>
        <StatCard label="Fees earned" value={naira(sum.lifetimeFees)} tone="good" sub="settled to date" />
        <StatCard label="Fees pending" value={naira(sum.pendingFees)} tone="warn" sub={`${sum.pendingCount} cycle(s)`} />
        <StatCard label="Gross processed" value={naira(sum.lifetimeGross)} sub="hospital collections" />
        <StatCard
          label="Blended fee rate"
          value={sum.blendedEffectiveRate === null ? "\u2014" : sum.blendedEffectiveRate.toFixed(2) + "%"}
          tone="accent"
          sub="commission now varies per tenant"
        />
      </div>

      <div style={row2}>
        <Card title="Platform fees — last 6 cycles">
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sum.trend} margin={{ top: 6, right: 6, left: -14, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted)" }} axisLine={false} tickLine={false} tickFormatter={compact} />
                <Tooltip contentStyle={tip} formatter={(v) => naira(v)} />
                <Bar dataKey="fee" radius={[4, 4, 0, 0]} fill="var(--chart-2)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Payout destination">
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {[
              ["Bank", data.payout.bank], ["Account name", data.payout.accountName],
              ["Account number", data.payout.accountNumber], ["Processor", data.payout.processor],
              ["Schedule", data.payout.schedule],
            ].map(([k, v]) => (
              <div key={k} style={kv}>
                <span style={{ color: "var(--muted)" }}>{k}</span>
                <span style={{ fontWeight: 600, color: "var(--ink-strong)", fontFamily: k === "Account number" ? "var(--font-mono)" : "inherit" }}>{v}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ marginTop: 14 }}>
        <Card title="Settlement cycles" pad={false}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>{["Ref", "Cycle", "Gross collected", "Fee (3.25%)", "Net to hospital", "Status", ""].map((h) => (
                <th key={h} style={{ ...th, textAlign: h.includes("Gross") || h.includes("Fee") || h.includes("Net") ? "right" : "left" }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {data.settlements.map((s) => (
                <tr key={s.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 11.5 }}>{s.ref}</td>
                  <td style={{ ...td, fontWeight: 600, color: "var(--ink-strong)" }}>
                    {s.month}
                    {s.paidAt && <div style={{ fontSize: 10.5, color: "var(--muted)", fontWeight: 400 }}>paid {s.paidAt}</div>}
                  </td>
                  <td style={{ ...td, ...num }}>{naira(s.gross)}</td>
                  <td style={{ ...td, ...num, color: "var(--good)", fontWeight: 700 }}>{naira(s.fee)}</td>
                  <td style={{ ...td, ...num, color: "var(--muted)" }}>{naira(s.net)}</td>
                  <td style={td}><Pill tone={STATUS_TONE[s.status]}>{s.status}</Pill></td>
                  <td style={{ ...td, textAlign: "right" }}>
                    {s.status !== "settled" && (
                      <Button onClick={() => advance(s.id)}>
                        {s.status === "pending" ? "Process" : s.status === "failed" ? "Retry" : "Mark settled"}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <div style={{ ...sectionTitle, marginTop: 26 }}>Usage analytics</div>
      <div style={statGrid}>
        <StatCard label="Seat utilisation" value={uSum.seatUtilisation + "%"} tone={uSum.seatUtilisation < 60 ? "warn" : "good"} sub={`${uSum.activeUsers}/${uSum.seats} seats active`} />
        <StatCard label="Encounters" value={compact(uSum.encounters)} sub="this cycle" />
        <StatCard label="Lab orders" value={compact(uSum.labOrders)} sub="this cycle" />
        <StatCard label="Prescriptions" value={compact(uSum.prescriptions)} sub="this cycle" />
        <StatCard label="Storage" value={uSum.storageGb + " GB"} sub="across tenants" />
        <StatCard label="API calls" value={compact(uSum.apiCalls)} sub="this cycle" />
      </div>

      {uSum.underused.length > 0 && (
        <div style={churnBox}>
          <Icons.TrendingDown size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <b>Seat under-utilisation — churn risk.</b>
            <div style={{ marginTop: 3 }}>
              {uSum.underused.map((u) => `${u.tenant} (${u.activeUsers}/${u.seats} seats)`).join(" · ")}
            </div>
            <div style={{ marginTop: 4, opacity: 0.85 }}>
              A tenant paying for seats it does not use is a tenant reconsidering at renewal.
            </div>
          </div>
        </div>
      )}

      <div style={row2}>
        <Card title="Usage by tenant" pad={false}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
              <thead>
                <tr>{["Tenant", "Plan", "Seats used", "Encounters", "Labs", "Storage"].map((h) => (
                  <th key={h} style={{ ...th, textAlign: h === "Tenant" || h === "Plan" ? "left" : "right" }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {data.usage.map((u) => (
                  <tr key={u.tenant} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ ...td, fontWeight: 600, color: "var(--ink-strong)" }}>{u.tenant}</td>
                    <td style={td}><Pill tone="muted">{u.plan}</Pill></td>
                    <td style={{ ...td, ...num }}>
                      <span style={{ color: u.seatUtilisation < 50 ? "var(--warn)" : "var(--ink)" }}>
                        {u.activeUsers}/{u.seats}
                      </span>
                      <div style={{ fontSize: 10, color: "var(--muted)" }}>{u.seatUtilisation}%</div>
                    </td>
                    <td style={{ ...td, ...num }}>{compact(u.encounters)}</td>
                    <td style={{ ...td, ...num }}>{compact(u.labOrders)}</td>
                    <td style={{ ...td, ...num, color: "var(--muted)" }}>{u.storageGb} GB</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Where hospital revenue comes from">
          {data.mix.bySource.length === 0 ? (
            <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6 }}>
              No invoice-linked payments in the last 90 days yet. Revenue mix can only be
              attributed to a module when a payment is routed through the invoice system —
              a direct payment with no invoice can't be traced back to a specific source.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {data.mix.bySource.map((m) => {
                const max = Math.max(...data.mix.bySource.map((x) => x.amount));
                return (
                  <div key={m.source}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                      <span style={{ color: "var(--ink)", fontWeight: 500 }}>{m.source}</span>
                      <span style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>{naira(m.amount)}</span>
                    </div>
                    <div style={track}><div style={{ ...fill, width: `${(m.amount / max) * 100}%` }} /></div>
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 12, lineHeight: 1.5 }}>
            {naira(data.mix.unattributedGross)} in the same period came from payments with no
            invoice attached, so it can't be broken down by module — shown here honestly
            rather than guessed at. The platform fee is charged on total collections either way.
          </div>
        </Card>
      </div>

      <div style={{ ...sectionTitle, marginTop: 24 }}>Platform invoices</div>
      <div style={tableWrap}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>{["Invoice", "Hospital", "Cycle", "Amount", "Status", "Issued", ""].map((h) => (
              <th key={h} style={{ ...th, textAlign: h === "Amount" ? "right" : "left" }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {data.invoices.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: "20px 14px", textAlign: "center", color: "var(--muted)", fontSize: 12.5 }}>No platform invoices yet — one is generated automatically for each hospital when a settlement cycle closes.</td></tr>
            ) : (
              data.invoices.map((inv) => (
                <tr key={inv.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 11.5 }}>{inv.invoiceNo}</td>
                  <td style={{ ...td, fontWeight: 500, color: "var(--ink-strong)" }}>{inv.tenantName}</td>
                  <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--muted)" }}>{inv.settlementCycleId.slice(0, 10)}</td>
                  <td style={{ ...td, textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 600 }}>{naira(inv.amount)}</td>
                  <td style={td}><Pill tone={inv.status === "paid" ? "good" : "warn"}>{inv.status}</Pill></td>
                  <td style={{ ...td, fontSize: 11.5, color: "var(--muted)" }}>{new Date(inv.issuedAt).toLocaleDateString()}</td>
                  <td style={{ ...td, textAlign: "right" }}>
                    {inv.status === "pending" && <Button variant="primary" onClick={() => markPaid(inv.id)}>Mark paid</Button>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const sectionTitle = { fontSize: 15, fontWeight: 700, color: "var(--ink-strong)", marginBottom: 12, letterSpacing: "-0.015em" };
const tableWrap = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, overflow: "auto" };
const statGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 14 };
const row2 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14, alignItems: "start" };
const th = { fontSize: 10.5, fontWeight: 700, color: "var(--muted)", padding: "10px 14px", background: "var(--surface)", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" };
const td = { padding: "11px 14px", fontSize: 12.5, verticalAlign: "middle" };
const num = { textAlign: "right", fontFamily: "var(--font-mono)" };
const kv = { display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "5px 0", borderTop: "1px solid var(--border)" };
const tip = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, boxShadow: "var(--shadow)" };
const track = { height: 7, borderRadius: 999, background: "var(--surface)", overflow: "hidden" };
const fill = { height: "100%", borderRadius: 999, background: "var(--chart-2)" };
const churnBox = { display: "flex", gap: 9, background: "var(--warn-bg)", color: "var(--warn)", fontSize: 12.5, padding: "11px 13px", borderRadius: 10, marginBottom: 14, lineHeight: 1.55 };
const errBanner = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 13, padding: "10px 14px", borderRadius: 10, marginBottom: 14 };
