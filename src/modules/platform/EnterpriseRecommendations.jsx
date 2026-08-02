import { useEffect, useState, useCallback } from "react";
import * as Icons from "lucide-react";
import { listEnterpriseRecommendations } from "./settlementService";
import { StatCard, Card, Pill, EmptyState } from "../../lib/ui";
import { naira } from "../../lib/money";

// Enterprise Savings Advisor — platform-wide view. For every Community
// (commission-billed) tenant, projects this year's commission from real
// data actually paid so far (YTD \u00f7 months elapsed \u00d7 12) and compares it
// to the flat Enterprise annual licence. Advisory only \u2014 nothing here
// changes a tenant's plan; a human decides whether to reach out and offer
// the upgrade.
export default function EnterpriseRecommendations() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  const refresh = useCallback(async () => {
    setErr("");
    try {
      setData(await listEnterpriseRecommendations());
    } catch (e) {
      setErr(e.message);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  if (err) return <div style={{ color: "var(--bad)", fontSize: 13 }}>{err}</div>;
  if (!data) return <div style={{ color: "var(--muted)", fontSize: 13 }}>Loading\u2026</div>;

  const { tenants, enterpriseAnnualKobo, readyForUpgrade } = data;

  return (
    <div>
      <div style={note}>
        <Icons.Info size={13} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          Projected from each tenant's actual commission paid so far this year, annualised \u2014
          not a forecast model. A tenant only appears as "ready" once real data shows their
          projected commission would exceed the Enterprise licence. This never changes a
          tenant's plan; it's a prompt for a human conversation.
        </span>
      </div>

      <div style={statGrid}>
        <StatCard label="Community tenants" value={tenants.length} sub="commission-billed" />
        <StatCard label="Ready for upgrade" value={readyForUpgrade} tone={readyForUpgrade ? "accent" : "default"} sub="projected savings > 0" />
        <StatCard label="Enterprise licence" value={naira(enterpriseAnnualKobo / 100)} sub="annual, flat" />
      </div>

      {tenants.length === 0 ? (
        <EmptyState icon="TrendingUp" title="No Community tenants yet" hint="Recommendations appear once a commission-billed tenant has payment history." />
      ) : (
        <Card pad={false}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Hospital", "YTD commission", "Projected annual", "Enterprise licence", "Est. savings", ""].map((h) => (
                  <th key={h} style={{ ...th, textAlign: h === "Hospital" ? "left" : "right" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.tenantId} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ ...td, fontWeight: 600, color: "var(--ink-strong)" }}>{t.tenantName}</td>
                  <td style={{ ...td, ...num }}>{naira(t.ytdCommissionKobo / 100)}</td>
                  <td style={{ ...td, ...num, fontWeight: 700 }}>{naira(t.projectedAnnualCommissionKobo / 100)}</td>
                  <td style={{ ...td, ...num, color: "var(--muted)" }}>{naira(t.enterpriseAnnualKobo / 100)}</td>
                  <td style={{ ...td, ...num, fontWeight: 700, color: t.recommend ? "var(--good)" : "var(--muted)" }}>
                    {t.estimatedSavingsKobo >= 0 ? "+" : ""}{naira(t.estimatedSavingsKobo / 100)}
                  </td>
                  <td style={{ ...td, textAlign: "right" }}>
                    {t.recommend && <Pill tone="good">Ready</Pill>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

const note = { display: "flex", gap: 8, background: "var(--accent-soft)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 13px", fontSize: 12, color: "var(--muted)", marginBottom: 16, lineHeight: 1.5 };
const statGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 16 };
const th = { fontSize: 10.5, fontWeight: 700, color: "var(--muted)", padding: "10px 14px", background: "var(--surface)", textTransform: "uppercase", letterSpacing: "0.05em" };
const td = { padding: "10px 14px", fontSize: 12.5, verticalAlign: "top" };
const num = { textAlign: "right", fontFamily: "var(--font-mono)" };
