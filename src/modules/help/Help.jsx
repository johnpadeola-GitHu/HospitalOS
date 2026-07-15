import { useState } from "react";
import * as Icons from "lucide-react";
import { ARTICLES, SECTIONS, searchArticles } from "./helpContent";
import { PageHeader, Card, inputStyle, EmptyState } from "../../lib/ui";

export default function Help() {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState(ARTICLES[0].id);

  const results = searchArticles(query);
  const article = ARTICLES.find((a) => a.id === openId);
  const sections = SECTIONS.filter((s) => results.some((a) => a.section === s));

  return (
    <div>
      <PageHeader
        group="Help"
        title="Help &amp; documentation"
        icon="BookOpen"
        subtitle="How HospitalOS works, module by module"
      />

      <div style={{ marginBottom: 16, maxWidth: 380 }}>
        <div style={{ position: "relative" }}>
          <Icons.Search size={14} style={{ position: "absolute", left: 11, top: 10, color: "var(--muted)" }} />
          <input
            style={{ ...inputStyle, paddingLeft: 32 }}
            placeholder="Search help…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {results.length === 0 ? (
        <EmptyState icon="SearchX" title="No articles match" hint="Try a different word — module names work well." />
      ) : (
        <div style={layout}>
          <div style={indexCol}>
            {sections.map((s) => (
              <div key={s} style={{ marginBottom: 14 }}>
                <div style={sectionLabel}>{s}</div>
                {results.filter((a) => a.section === s).map((a) => {
                  const C = Icons[a.icon] || Icons.FileText;
                  const active = a.id === openId;
                  return (
                    <button key={a.id} onClick={() => setOpenId(a.id)} style={{ ...indexItem, ...(active ? indexActive : null) }}>
                      <C size={14} strokeWidth={1.9} style={{ color: active ? "var(--accent)" : "var(--muted)", flexShrink: 0 }} />
                      <span style={{ flex: 1, textAlign: "left" }}>{a.title}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div>
            {article && (
              <Card>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={artIcon}>
                    {(() => {
                      const C = Icons[article.icon] || Icons.FileText;
                      return <C size={17} strokeWidth={2} style={{ color: "var(--accent)" }} />;
                    })()}
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {article.section}
                    </div>
                    <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--ink-strong)", letterSpacing: "-0.02em" }}>
                      {article.title}
                    </h2>
                  </div>
                </div>
                {article.body.map((p, i) => (
                  <p key={i} style={para}>{p}</p>
                ))}
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const layout = { display: "grid", gridTemplateColumns: "236px 1fr", gap: 16, alignItems: "start" };
const indexCol = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "12px 10px", boxShadow: "var(--shadow-sm)" };
const sectionLabel = { fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", padding: "0 6px 6px" };
const indexItem = { width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "7px 8px", fontSize: 12.5, color: "var(--ink)", background: "none", border: "none", borderRadius: 7, cursor: "pointer", font: "inherit", marginBottom: 1 };
const indexActive = { background: "var(--accent-bg)", color: "var(--accent)", fontWeight: 600 };
const artIcon = { width: 34, height: 34, borderRadius: 9, background: "var(--accent-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };
const para = { fontSize: 13.5, lineHeight: 1.7, color: "var(--ink)", marginBottom: 11 };
