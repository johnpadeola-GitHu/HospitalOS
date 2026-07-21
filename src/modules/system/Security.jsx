import { useState, useCallback, useEffect } from "react";
import * as Icons from "lucide-react";
import { AUDIT_ACTIONS } from "../../lib/audit";
import { listAuditEntries, verifyChain, auditStats, auditActors } from "./securityAuditService";
import { listUsers } from "./systemService";
import { listKnownDevices } from "../../lib/deviceFingerprint";
import { PageHeader, StatCard, Card, Pill, Button, inputStyle, EmptyState } from "../../lib/ui";
import { useAuth } from "../../auth/AuthContext";

const ACTION_TONE = {
  "sign-in": "info", "sign-out": "muted", "access-denied": "bad",
  create: "good", update: "info", delete: "bad",
  clinical: "accent", financial: "warn", view: "muted",
};

function when(iso) {
  const d = new Date(iso);
  return d.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function Security() {
  const { may } = useAuth();
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [chain, setChain] = useState(null);
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("all");
  const [actor, setActor] = useState("all");
  const [actors, setActors] = useState([]);
  const [devices, setDevices] = useState([]);

  const [loadErr, setLoadErr] = useState("");

  const refresh = useCallback(async () => {
    setLoadErr("");
    try {
      const [rowsRes, statsRes, chainRes, actorsRes] = await Promise.all([
        listAuditEntries({ limit: 200, action, actor, query }),
        auditStats(),
        verifyChain(),
        auditActors(),
      ]);
      setRows(rowsRes);
      setStats(statsRes);
      setChain(chainRes);
      setActors(actorsRes);
      const staff = await listUsers();
      const tenantEmails = staff.map((a) => a.email);
      setDevices(listKnownDevices(tenantEmails));
    } catch (e) {
      setLoadErr(e.message);
    }
  }, [action, actor, query]);

  useEffect(() => {
    const t = setTimeout(refresh, 120);
    return () => clearTimeout(t);
  }, [refresh]);

  if (!may("system:view-audit")) {
    return (
      <div>
        <PageHeader group="Administration" title="Security &amp; audit" icon="ShieldCheck" />
        <EmptyState icon="Lock" title="Not permitted" hint="Your role does not include audit access." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        group="Administration"
        title="Security &amp; audit"
        icon="ShieldCheck"
        subtitle="Append-only, hash-chained record of every consequential action"
        actions={<Button icon="RefreshCw" onClick={refresh}>Refresh</Button>}
      />

      {loadErr && (
        <div style={{ ...chainBar, ...chainBad }}>
          <Icons.ShieldAlert size={15} />
          <span>{loadErr}</span>
        </div>
      )}

      {chain && (
        <div style={{ ...chainBar, ...(chain.valid ? chainOk : chainBad) }}>
          {chain.valid ? <Icons.ShieldCheck size={15} /> : <Icons.ShieldAlert size={15} />}
          <span style={{ flex: 1 }}>
            {chain.valid ? (
              <>
                <b>Chain intact.</b> All {chain.length} entries verify against their predecessor.
                Any alteration to a past record would break this check.
              </>
            ) : (
              <>
                <b>Chain broken at entry #{chain.brokenAt}.</b> A record has been altered or removed.
              </>
            )}
          </span>
        </div>
      )}

      {stats && (
        <div style={statGrid}>
          <StatCard label="Entries" value={stats.total} sub="since session start" />
          <StatCard label="Actors" value={stats.actors} sub="distinct users" />
          <StatCard label="Clinical" value={stats.byAction.clinical || 0} tone="accent" />
          <StatCard label="Financial" value={stats.byAction.financial || 0} tone="warn" />
          <StatCard label="Denials" value={stats.byAction["access-denied"] || 0} tone={(stats.byAction["access-denied"] || 0) ? "bad" : "default"} />
          <StatCard label="Integrity" value={chain?.valid ? "OK" : "FAIL"} tone={chain?.valid ? "good" : "bad"} />
        </div>
      )}

      <div style={toolbar}>
        <input style={{ ...inputStyle, maxWidth: 260 }} placeholder="Search detail, entity, user…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select style={{ ...inputStyle, maxWidth: 170 }} value={action} onChange={(e) => setAction(e.target.value)}>
          <option value="all">All actions</option>
          {Object.values(AUDIT_ACTIONS).map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select style={{ ...inputStyle, maxWidth: 220 }} value={actor} onChange={(e) => setActor(e.target.value)}>
          <option value="all">All users</option>
          {actors.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <Card title="Audit log" pad={false}>
        {rows.length === 0 ? (
          <div style={{ padding: 24 }}>
            <EmptyState icon="SearchX" title="No entries match" hint="Adjust the filters above." />
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
              <thead>
                <tr>{["#", "Time", "User", "Action", "Entity", "Detail", "Hash"].map((h) => <th key={h} style={th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.seq} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>{e.seq}</td>
                    <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap" }}>{when(e.at)}</td>
                    <td style={td}>
                      <div style={{ fontWeight: 600, color: "var(--ink-strong)", fontSize: 12.5 }}>{e.actorName}</div>
                      <div style={{ fontSize: 10.5, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>{e.actorEmail}</div>
                    </td>
                    <td style={td}><Pill tone={ACTION_TONE[e.action] || "muted"}>{e.action}</Pill></td>
                    <td style={{ ...td, fontSize: 12 }}>
                      {e.entity}
                      {e.entityId && <div style={{ fontSize: 10.5, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>{e.entityId}</div>}
                    </td>
                    <td style={{ ...td, fontSize: 12, color: "var(--ink)" }}>{e.detail}</td>
                    <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)" }} title={`prev: ${e.prevHash}`}>
                      {e.hash}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Trusted devices" pad={false}>
        {devices.length === 0 ? (
          <div style={{ padding: 22 }}><EmptyState icon="Smartphone" title="No device history yet" /></div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Staff", "Device", "First seen", "Last seen"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {devices.map((d, i) => (
                <tr key={d.fingerprint + d.email} style={{ borderTop: i ? "1px solid var(--border)" : "none" }}>
                  <td style={td}>{d.email}</td>
                  <td style={{ ...td, fontWeight: 600, color: "var(--ink-strong)" }}>{d.label}</td>
                  <td style={{ ...td, fontSize: 12, color: "var(--muted)" }}>{when(d.firstSeenAt)}</td>
                  <td style={{ ...td, fontSize: 12, color: "var(--muted)" }}>{when(d.lastSeenAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div style={{ ...note, borderTop: "1px solid var(--border)", borderRadius: 0, margin: 0 }}>
          <Icons.Info size={13} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            A best-effort browser fingerprint, not a hardware-verified one \u2014 good enough to notice an
            unfamiliar sign-in and log it, not a hard security boundary. A first-ever sign-in for an
            account is not flagged as "new"; every device after that is.
          </span>
        </div>
      </Card>

      <div style={note}>
        <Icons.Info size={13} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          Entries are frozen on write and hash-chained — each links to its predecessor,
          so editing history breaks verification. There is no update or delete API.
          This is tamper-<b>evident</b>, not tamper-proof: true immutability requires
          server-side append-only storage, which the same chain design carries over to.
        </span>
      </div>
    </div>
  );
}

const statGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: 16 };
const toolbar = { display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" };
const th = { textAlign: "left", fontSize: 10.5, fontWeight: 700, color: "var(--muted)", padding: "10px 14px", background: "var(--surface)", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" };
const td = { padding: "10px 14px", fontSize: 12.5, verticalAlign: "top" };
const chainBar = { display: "flex", alignItems: "center", gap: 9, borderRadius: 10, padding: "10px 14px", fontSize: 12.5, marginBottom: 16 };
const chainOk = { background: "var(--good-bg)", color: "var(--good)" };
const chainBad = { background: "var(--bad-bg)", color: "var(--bad)" };
const note = { display: "flex", gap: 8, marginTop: 14, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 13px", fontSize: 11.5, color: "var(--muted)", lineHeight: 1.6 };
