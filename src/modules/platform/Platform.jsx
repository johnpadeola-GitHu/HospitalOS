import { useEffect, useState, useCallback } from "react";
import * as Icons from "lucide-react";
import {
  PLAN_TONE, SERVICE_TONE, listTenants, setTenantStatus, platformSummary,
  listServices, listFlags, toggleFlag, listDeployments, getCommercialPlan, setCommercialPlan,
} from "./platformService";
import { daysRemaining } from "../../engines/onboarding";
import { PageHeader, StatCard, Card, Pill, Button, Modal, Field, inputStyle } from "../../lib/ui";
import Settlement from "./Settlement";
import ActivationCodes from "./ActivationCodes";
import EnterpriseRecommendations from "./EnterpriseRecommendations";

import { naira } from "../../lib/money";
const ago = (iso) => {
  const m = Math.round((Date.now() - new Date(iso)) / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
};

export default function Platform() {
  const [tab, setTab] = useState("overview");
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [planFor, setPlanFor] = useState(null);

  const refresh = useCallback(async () => {
    setErr("");
    try {
      const [tenants, summary, services, flags, deployments] = await Promise.all([
        listTenants(), platformSummary(), listServices(), listFlags(), listDeployments(),
      ]);
      setData({ tenants, summary, services, flags, deployments });
    } catch (e) {
      setErr(e.message);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const cycleTenant = async (t) => {
    setErr("");
    const order = ["active", "trial", "suspended"];
    try {
      await setTenantStatus(t.id, order[(order.indexOf(t.status) + 1) % order.length]);
      await refresh();
    } catch (e) { setErr(e.message); }
  };

  const flip = async (id) => { await toggleFlag(id); await refresh(); };

  if (!data) {
    return (
      <div>
        <PageHeader group="Platform" title="Platform admin" icon="ShieldCheck" />
        <div style={{ color: err ? "var(--bad)" : "var(--muted)", fontSize: 13 }}>
          {err || "Loading platform…"}
        </div>
      </div>
    );
  }

  const s = data.summary;

  return (
    <div>
      <PageHeader
        group="AgoroX Platform"
        title="Platform admin"
        icon="ShieldCheck"
        subtitle="Tenant management and platform health across all HospitalOS deployments"
        actions={
          <>
            <a href="/guides/HospitalOS-Platform-Admin-Guide.pdf" download style={guideLink}>
              <Icons.FileDown size={14} /> Platform Admin Guide
            </a>
            <a href="/guides/HospitalOS-Production-Readiness-Plan.pdf" download style={guideLink}>
              <Icons.FileDown size={14} /> Readiness Plan
            </a>
            <Pill tone="accent">support@agorox.africa</Pill>
          </>
        }
      />

      <div style={tabs}>
        {[["overview", "Overview"], ["settlement", "Settlement & usage"], ["codes", "Activation codes"], ["enterprise", "Enterprise recommendations"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ ...tabBtn, ...(tab === id ? tabActive : null) }}>{label}</button>
        ))}
      </div>

      {tab === "settlement" && <Settlement />}
      {tab === "codes" && <ActivationCodes />}
      {tab === "enterprise" && <EnterpriseRecommendations />}

      {tab === "overview" && <>
      {err && <div style={errBanner}>{err}</div>}

      <div style={statGrid}>
        <StatCard label="Tenants" value={s.tenants} sub={`${s.active} active · ${s.trials} trial`} />
        <StatCard label="Suspended" value={s.suspended} tone={s.suspended ? "bad" : "default"} />
        <StatCard label="Seats" value={s.seats} sub="licensed" />
        <StatCard label="Active users" value={s.activeUsers} tone="accent" sub="across tenants" />
        <StatCard label="MRR" value={naira(s.mrr)} tone="good" sub="recurring revenue" />
        <StatCard label="Uptime" value="99.9%" tone="good" sub="30-day average" />
      </div>

      <div style={{ marginBottom: 14 }}>
        <Card title="Tenants" pad={false}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>{["Hospital", "Plan", "Billing", "Seats", "Active", "MRR", "Status", ""].map((h) => (
                <th key={h} style={{ ...th, textAlign: ["Seats", "Active", "MRR"].includes(h) ? "right" : "left" }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {data.tenants.map((t) => (
                <tr key={t.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ ...td, fontWeight: 600, color: "var(--ink-strong)" }}>
                    {t.name}
                    <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 400 }}>
                      {t.subdomain} &middot; since {t.since} &middot; seen {ago(t.lastSeen)}
                    </div>
                  </td>
                  <td style={td}><Pill tone={PLAN_TONE[t.plan]}>{t.plan}</Pill></td>
                  <td style={{ ...td, fontSize: 12 }}>
                    {t.billingType === "flat" ? (
                      <span style={{ color: "var(--accent)", fontWeight: 600 }}>Flat annual</span>
                    ) : (
                      <span>{t.commissionPct}% commission</span>
                    )}
                    {t.demoExpiresAt && (
                      <div style={{ fontSize: 10.5, color: daysRemaining(t.demoExpiresAt) <= 5 ? "var(--bad)" : "var(--muted)" }}>
                        {daysRemaining(t.demoExpiresAt) > 0 ? `${daysRemaining(t.demoExpiresAt)}d left` : "Expired"}
                      </div>
                    )}
                  </td>
                  <td style={{ ...td, textAlign: "right", fontFamily: "var(--font-mono)" }}>{t.seats}</td>
                  <td style={{ ...td, textAlign: "right", fontFamily: "var(--font-mono)" }}>{t.activeUsers}</td>
                  <td style={{ ...td, textAlign: "right", fontFamily: "var(--font-mono)" }}>{t.mrr ? naira(t.mrr) : "\u2014"}</td>
                  <td style={td}>
                    <Pill tone={STATUS_TONE[t.status] || "muted"}>{t.status}</Pill>
                  </td>
                  <td style={{ ...td, textAlign: "right" }}>
                    <Button onClick={() => setPlanFor(t)} style={{ marginRight: 6 }}>Plan</Button>
                    <Button onClick={() => cycleTenant(t)}>
                      {t.status === "pending-payment" ? "Confirm payment" : "Change"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <div style={row2}>
        <Card title="Platform health">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {data.services.map((sv) => (
              <div key={sv.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ ...dot, background: sv.status === "operational" ? "var(--good)" : sv.status === "degraded" ? "var(--warn)" : "var(--bad)" }} />
                <span style={{ flex: 1, fontSize: 12.5, color: "var(--ink-strong)", fontWeight: 500 }}>{sv.name}</span>
                <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>{sv.latency}</span>
                <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-mono)", width: 52, textAlign: "right" }}>{sv.uptime}</span>
                <Pill tone={SERVICE_TONE[sv.status]}>{sv.status}</Pill>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Feature flags">
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {data.flags.map((f) => (
              <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink-strong)" }}>{f.label}</div>
                  <div style={{ fontSize: 10.5, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>{f.key} · {f.tiers.join(", ")}</div>
                </div>
                <button onClick={() => flip(f.id)} style={{ ...track, background: f.enabled ? "var(--accent)" : "var(--border-strong)" }} aria-pressed={f.enabled}>
                  <span style={{ ...knob, transform: f.enabled ? "translateX(16px)" : "translateX(0)" }} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ marginTop: 14 }}>
        <Card title="Recent deployments" pad={false}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["When", "Commit", "Change", "Status"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {data.deployments.map((d) => (
                <tr key={d.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ ...td, color: "var(--muted)", fontSize: 12 }}>{ago(d.at)}</td>
                  <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 11.5 }}>{d.ref}</td>
                  <td style={{ ...td, color: "var(--ink-strong)" }}>{d.note}</td>
                  <td style={td}><Pill tone="good">{d.status}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
      </>}
      {planFor && (
        <CommercialPlanModal
          tenant={planFor}
          onClose={() => setPlanFor(null)}
          onDone={async () => { setPlanFor(null); await refresh(); }}
        />
      )}
    </div>
  );
}

const tabs = { display: "flex", gap: 6, marginBottom: 16 };
const STATUS_TONE = { active: "good", trial: "warn", demo: "info", "pending-payment": "warn", suspended: "bad" };
const guideLink = {
  display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none",
  fontSize: 12, fontWeight: 600, color: "var(--charcoal-strong)",
  background: "var(--surface-2)", border: "1px solid var(--border-strong)",
  borderRadius: 8, padding: "7px 12px",
};
const tabBtn = { font: "inherit", fontSize: 12.5, fontWeight: 600, padding: "6px 13px", borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--surface-2)", color: "var(--muted)", cursor: "pointer" };
const tabActive = { background: "var(--charcoal)", color: "#fff", borderColor: "var(--charcoal)" };
const statGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 16 };
const row2 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14, alignItems: "start" };
const th = { fontSize: 10.5, fontWeight: 700, color: "var(--muted)", padding: "10px 16px", background: "var(--surface)", textTransform: "uppercase", letterSpacing: "0.05em" };
const td = { padding: "11px 16px", fontSize: 12.5, verticalAlign: "middle" };
const dot = { width: 7, height: 7, borderRadius: "50%", flexShrink: 0 };
const track = { width: 36, height: 20, borderRadius: 999, border: "none", cursor: "pointer", padding: 2, display: "flex", alignItems: "center", flexShrink: 0 };
const knob = { width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "transform .15s" };
const errBanner = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 13, padding: "10px 14px", borderRadius: 10, marginBottom: 14 };

function CommercialPlanModal({ tenant, onClose, onDone }) {
  const [loading, setLoading] = useState(true);
  const [planType, setPlanType] = useState("simple");
  const [minMonthlyFee, setMinMonthlyFee] = useState("");
  const [maxMonthlyFee, setMaxMonthlyFee] = useState("");
  const [promoPct, setPromoPct] = useState("");
  const [promoStart, setPromoStart] = useState("");
  const [promoEnd, setPromoEnd] = useState("");
  const [tiers, setTiers] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    getCommercialPlan(tenant.id).then((plan) => {
      if (!alive || !plan) { setLoading(false); return; }
      setPlanType(plan.planType || "simple");
      setMinMonthlyFee(plan.minMonthlyFee ?? "");
      setMaxMonthlyFee(plan.maxMonthlyFee ?? "");
      setPromoPct(plan.promoPct ?? "");
      setPromoStart(plan.promoStart ? plan.promoStart.slice(0, 10) : "");
      setPromoEnd(plan.promoEnd ? plan.promoEnd.slice(0, 10) : "");
      setTiers(plan.tiers && plan.tiers.length ? plan.tiers : []);
      setLoading(false);
    }).catch((e) => { console.error(e); setLoading(false); });
    return () => { alive = false; };
  }, [tenant]);

  const addTier = () => setTiers((t) => [...t, { minVolume: "", maxVolume: "", pct: "" }]);
  const updateTier = (i, field, value) => setTiers((t) => t.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)));
  const removeTier = (i) => setTiers((t) => t.filter((_, idx) => idx !== i));

  const submit = async () => {
    setErr("");
    if (planType === "tiered" && tiers.some((t) => t.minVolume === "" || t.pct === "")) {
      setErr("Every tier needs at least a starting volume and a rate.");
      return;
    }
    setBusy(true);
    try {
      await setCommercialPlan(tenant.id, {
        planType,
        minMonthlyFee: minMonthlyFee === "" ? null : parseFloat(minMonthlyFee),
        maxMonthlyFee: maxMonthlyFee === "" ? null : parseFloat(maxMonthlyFee),
        promoPct: promoPct === "" ? null : parseFloat(promoPct),
        promoStart: promoStart || null,
        promoEnd: promoEnd || null,
        tiers: planType === "tiered" ? tiers.map((t) => ({
          minVolume: parseFloat(t.minVolume), maxVolume: t.maxVolume === "" ? null : parseFloat(t.maxVolume), pct: parseFloat(t.pct),
        })) : [],
      });
      await onDone();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  if (loading) {
    return <Modal title={`Commercial plan — ${tenant.name}`} onClose={onClose} footer={<Button variant="ghost" onClick={onClose}>Close</Button>}>
      <div style={{ fontSize: 13, color: "var(--muted)" }}>Loading…</div>
    </Modal>;
  }

  return (
    <Modal
      title={`Commercial plan — ${tenant.name}`}
      onClose={onClose}
      footer={<>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Saving…" : "Save plan"}</Button>
      </>}
    >
      {err && <div style={errBanner}>{err}</div>}
      <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14, lineHeight: 1.5 }}>
        This is a true-up applied at settlement close, on top of {tenant.name}'s own {tenant.billingType === "flat" ? "flat" : `${tenant.commissionPct}%`} rate — leave everything blank to just use that rate as-is.
      </p>

      <Field label="Plan type">
        <select style={inputStyle} value={planType} onChange={(e) => setPlanType(e.target.value)}>
          <option value="simple">Simple (use the rate above, with optional floor/cap/promo)</option>
          <option value="tiered">Tiered (progressive rate by volume)</option>
        </select>
      </Field>

      {planType === "tiered" && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>Tiers (progressive, like tax brackets)</div>
          {tiers.map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
              <input style={{ ...inputStyle, flex: 1 }} type="number" placeholder="From ₦" value={t.minVolume} onChange={(e) => updateTier(i, "minVolume", e.target.value)} />
              <input style={{ ...inputStyle, flex: 1 }} type="number" placeholder="To ₦ (blank = no limit)" value={t.maxVolume} onChange={(e) => updateTier(i, "maxVolume", e.target.value)} />
              <input style={{ ...inputStyle, width: 90 }} type="number" placeholder="%" value={t.pct} onChange={(e) => updateTier(i, "pct", e.target.value)} />
              <Button onClick={() => removeTier(i)}>✕</Button>
            </div>
          ))}
          <Button onClick={addTier}>+ Add tier</Button>
        </div>
      )}

      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <Field label="Minimum monthly fee (₦, optional)">
            <input style={inputStyle} type="number" min="0" value={minMonthlyFee} onChange={(e) => setMinMonthlyFee(e.target.value)} placeholder="No floor" />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Maximum monthly fee (₦, optional)">
            <input style={inputStyle} type="number" min="0" value={maxMonthlyFee} onChange={(e) => setMaxMonthlyFee(e.target.value)} placeholder="No cap" />
          </Field>
        </div>
      </div>

      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", margin: "14px 0 6px" }}>Promotional rate (optional, overrides everything above while active)</div>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ width: 100 }}>
          <Field label="Rate %"><input style={inputStyle} type="number" min="0" value={promoPct} onChange={(e) => setPromoPct(e.target.value)} /></Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="From"><input style={inputStyle} type="date" value={promoStart} onChange={(e) => setPromoStart(e.target.value)} /></Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Until"><input style={inputStyle} type="date" value={promoEnd} onChange={(e) => setPromoEnd(e.target.value)} /></Field>
        </div>
      </div>
    </Modal>
  );
}
