import { useState, useMemo } from "react";
import * as Icons from "lucide-react";
import { allCategories, allArticles, articlesIn, getArticle, searchArticles, useHelp } from "./index";
import { PageHeader, Card, EmptyState } from "../../lib/ui";
import { useEffect } from "react";

function Ico({ name, size = 16, color = "var(--muted)" }) {
  const C = Icons[name] || Icons.Circle;
  return <C size={size} strokeWidth={1.9} style={{ color, flexShrink: 0 }} />;
}

export default function Help() {
  const CATEGORIES = allCategories();
  const totalArticles = allArticles().length;
  const { requestedId, clearRequest } = useHelp();
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState(null);
  const [openCat, setOpenCat] = useState(null);

  const results = useMemo(() => searchArticles(query), [query]);
  const article = openId ? getArticle(openId) : null;
  const searching = query.trim().length > 0;
  // The hero (and the single search input inside it) stays mounted for as
  // long as no specific article or category is open — including while
  // actively typing a search query. Switching to a different <input>
  // element the moment `searching` became true was the actual bug: React
  // would unmount the hero's focused input and mount a new one in the
  // compact header on the very next render, so the field lost focus after
  // exactly one keystroke and every character after that went nowhere.
  const showHero = !article && !openCat;

  const open = (id) => { setOpenId(id); setQuery(""); };

  // A module called openHelp("...") — jump straight to that article.
  useEffect(() => {
    if (requestedId) { setOpenId(requestedId); setQuery(""); clearRequest(); }
  }, [requestedId, clearRequest]);
  const home = () => { setOpenId(null); setOpenCat(null); setQuery(""); };

  return (
    <div>
      {showHero ? (
        <HelpHero query={query} setQuery={setQuery} setOpenId={setOpenId} totalArticles={totalArticles} totalCategories={CATEGORIES.length} />
      ) : (
        <>
          <PageHeader
            group="Help"
            title="Help &amp; documentation"
            icon="BookOpen"
            subtitle="How HospitalOS works, and why it works that way"
          />
        </>
      )}

      {/* Breadcrumb */}
      {(openId || openCat) && !searching && (
        <div style={crumb}>
          <button style={crumbLink} onClick={home}>All topics</button>
          {article && (
            <>
              <Icons.ChevronRight size={13} style={{ color: "var(--muted)" }} />
              <button style={crumbLink} onClick={() => { setOpenId(null); setOpenCat(article.cat); }}>
                {CATEGORIES.find((c) => c.key === article.cat)?.label}
              </button>
              <Icons.ChevronRight size={13} style={{ color: "var(--muted)" }} />
              <span style={{ color: "var(--ink-strong)", fontWeight: 600 }}>{article.title}</span>
            </>
          )}
          {!article && openCat && (
            <>
              <Icons.ChevronRight size={13} style={{ color: "var(--muted)" }} />
              <span style={{ color: "var(--ink-strong)", fontWeight: 600 }}>
                {CATEGORIES.find((c) => c.key === openCat)?.label}
              </span>
            </>
          )}
        </div>
      )}

      {/* Search results */}
      {searching ? (
        results.length === 0 ? (
          <EmptyState icon="SearchX" title="No articles match" hint="Try a module name, a term, or an action." />
        ) : (
          <>
            <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 10 }}>
              {results.length} article{results.length > 1 ? "s" : ""} matching “{query}”
            </div>
            <div style={cardGrid}>
              {results.map((a) => <ArticleCard key={a.id} a={a} onOpen={open} />)}
            </div>
          </>
        )
      ) : article ? (
        <ArticleView article={article} onOpen={open} CATEGORIES={CATEGORIES} />
      ) : openCat ? (
        <div style={cardGrid}>
          {articlesIn(openCat).map((a) => <ArticleCard key={a.id} a={a} onOpen={open} />)}
        </div>
      ) : (
        <Landing onCat={setOpenCat} onOpen={open} CATEGORIES={CATEGORIES} />
      )}
    </div>
  );
}

// The LabOS-style hero: a dark banner with a centred headline, a live
// article/category count, and the search box embedded directly in the
// banner rather than sitting separately above the page. Only shown on the
// true landing state — once searching, browsing a category, or reading an
// article, the compact header takes over so the hero doesn't compete with
// actual content.
function HelpHero({ query, setQuery, setOpenId, totalArticles, totalCategories }) {
  return (
    <div style={hero}>
      <div style={heroKicker}>Help &amp; documentation</div>
      <h1 style={heroTitle}>How can we help?</h1>
      <p style={heroSubtitle}>
        Search across {totalArticles} articles in {totalCategories} categories, or browse by topic below.
      </p>
      <div style={heroSearchWrap}>
        <Icons.Search size={16} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
        <input
          style={heroSearchInput}
          placeholder="Search for articles, e.g. ‘releasing a lab result’"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpenId(null); }}
        />
      </div>
    </div>
  );
}

function Landing({ onCat, onOpen, CATEGORIES }) {
  return (
    <>
      <div style={heroRow}>
        {[
          { id: "orientation", icon: "Compass", t: "New here?", d: "How the system is laid out and why." },
          { id: "roles-explained", icon: "UsersRound", t: "What can I do?", d: "Roles, areas, and separation of duties." },
          { id: "limitations", icon: "TriangleAlert", t: "Before you rely on it", d: "What this build is, and is not." },
        ].map((h) => (
          <button key={h.id} style={heroCard} onClick={() => onOpen(h.id)}>
            <Ico name={h.icon} size={19} color="var(--charcoal)" />
            <div style={{ marginTop: 8, fontSize: 13.5, fontWeight: 700, color: "var(--ink-strong)" }}>{h.t}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2, lineHeight: 1.5 }}>{h.d}</div>
          </button>
        ))}
      </div>

      <div style={sectionLabel}>Browse by category</div>
      <div style={catGrid}>
        {CATEGORIES.map((c) => {
          const n = articlesIn(c.key).length;
          return (
            <button key={c.key} style={catCard} onClick={() => onCat(c.key)}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={catIcon}><Ico name={c.icon} size={16} color="var(--charcoal)" /></div>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink-strong)", flex: 1, textAlign: "left" }}>
                  {c.label}
                </span>
                <span style={countChip}>{n}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 7, lineHeight: 1.5, textAlign: "left" }}>
                {c.blurb}
              </div>
            </button>
          );
        })}
      </div>

      <a href="/guides/HospitalOS-Tenant-Guide.pdf" download style={guideBanner}>
        <div style={guideIcon}><Icons.FileDown size={18} color="#fff" /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink-strong)" }}>Download the full Tenant Guide (PDF)</div>
          <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>Every module, your role's permissions, pricing, branding, and current limitations \u2014 in one document</div>
        </div>
        <Icons.Download size={16} style={{ color: "var(--muted)", flexShrink: 0 }} />
      </a>
    </>
  );
}

function ArticleCard({ a, onOpen }) {
  return (
    <button style={artCard} onClick={() => onOpen(a.id)}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Ico name={a.icon} size={15} color="var(--charcoal)" />
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-strong)", textAlign: "left" }}>{a.title}</span>
      </div>
      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6, lineHeight: 1.55, textAlign: "left" }}>{a.lead}</div>
    </button>
  );
}

function ArticleView({ article, onOpen, CATEGORIES }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14, maxWidth: 760 }}>
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 6 }}>
          <div style={artIcon}><Ico name={article.icon} size={18} color="var(--charcoal)" /></div>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {CATEGORIES.find((c) => c.key === article.cat)?.label}
            </div>
            <h2 style={{ fontSize: 19, fontWeight: 700, color: "var(--ink-strong)", letterSpacing: "-0.02em" }}>{article.title}</h2>
          </div>
        </div>
        <div style={lead}>{article.lead}</div>

        {article.body.map((b, i) => <Block key={i} b={b} />)}

        {article.related?.length > 0 && (
          <div style={relatedWrap}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
              Related
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {article.related.map((id) => {
                const r = getArticle(id);
                if (!r) return null;
                return (
                  <button key={id} style={relPill} onClick={() => onOpen(id)}>
                    <Ico name={r.icon} size={13} color="var(--charcoal)" />
                    {r.title}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <PrevNext article={article} onOpen={onOpen} CATEGORIES={CATEGORIES} />
      </Card>
    </div>
  );
}

/**
 * Sequential Back/Next through every article, in the same order they are
 * browsed: category order, then article order within each category.
 */
function flatArticleOrder(CATEGORIES) {
  return CATEGORIES.flatMap((c) => articlesIn(c.key));
}

function PrevNext({ article, onOpen, CATEGORIES }) {
  const order = useMemo(() => flatArticleOrder(CATEGORIES), [CATEGORIES]);
  const idx = order.findIndex((a) => a.id === article.id);
  const prev = idx > 0 ? order[idx - 1] : null;
  const next = idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null;
  if (!prev && !next) return null;

  return (
    <div style={prevNextWrap}>
      {prev ? (
        <button style={prevNextBtn} onClick={() => onOpen(prev.id)}>
          <Icons.ChevronLeft size={15} />
          <div style={{ textAlign: "left" }}>
            <div style={prevNextLabel}>Back</div>
            <div style={prevNextTitle}>{prev.title}</div>
          </div>
        </button>
      ) : <div />}
      {next ? (
        <button style={{ ...prevNextBtn, textAlign: "right" }} onClick={() => onOpen(next.id)}>
          <div style={{ textAlign: "right" }}>
            <div style={prevNextLabel}>Next</div>
            <div style={prevNextTitle}>{next.title}</div>
          </div>
          <Icons.ChevronRight size={15} />
        </button>
      ) : <div />}
    </div>
  );
}

function Block({ b }) {
  if (b.h) return <h3 style={h3}>{b.h}</h3>;
  if (b.p) return <p style={para}>{b.p}</p>;
  if (b.list) return (
    <ul style={{ margin: "0 0 12px", paddingLeft: 0, listStyle: "none" }}>
      {b.list.map((x, i) => (
        <li key={i} style={li}>
          <span style={bullet}>•</span>
          <span>{x}</span>
        </li>
      ))}
    </ul>
  );
  if (b.steps) return (
    <ol style={{ margin: "0 0 12px", paddingLeft: 0, listStyle: "none", counterReset: "s" }}>
      {b.steps.map((x, i) => (
        <li key={i} style={li}>
          <span style={stepNum}>{i + 1}</span>
          <span>{x}</span>
        </li>
      ))}
    </ol>
  );
  if (b.note) return (
    <div style={noteBox}>
      <Icons.Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
      <span>{b.note}</span>
    </div>
  );
  if (b.warn) return (
    <div style={warnBox}>
      <Icons.TriangleAlert size={14} style={{ flexShrink: 0, marginTop: 1 }} />
      <span>{b.warn}</span>
    </div>
  );
  if (b.table) return (
    <div style={{ overflowX: "auto", margin: "0 0 14px" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
        <thead>
          <tr>{b.table.head.map((h) => <th key={h} style={tth}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {b.table.rows.map((r, i) => (
            <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
              {r.map((c, j) => (
                <td key={j} style={{ ...ttd, fontWeight: j === 0 ? 600 : 400, color: j === 0 ? "var(--ink-strong)" : "var(--ink)" }}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  return null;
}

const crumb = { display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted)", marginBottom: 14, flexWrap: "wrap" };
const crumbLink = { font: "inherit", fontSize: 12, fontWeight: 600, color: "var(--charcoal)", background: "none", border: "none", cursor: "pointer", padding: 0 };

// Hero banner — the LabOS-style "How can we help?" treatment: a dark
// gradient using HospitalOS's own charcoal tokens (not LabOS's blue, to
// stay on-brand) with the search box embedded directly in the banner.
const hero = {
  background: "linear-gradient(135deg, #22272B 0%, #33393F 55%, #4A2422 100%)",
  borderRadius: 16, padding: "40px 32px 34px", textAlign: "center", marginBottom: 24,
};
const heroKicker = { fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 };
const heroTitle = { fontSize: 30, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", margin: "0 0 10px" };
const heroSubtitle = { fontSize: 13.5, color: "rgba(255,255,255,0.72)", maxWidth: 480, margin: "0 auto 22px", lineHeight: 1.6 };
const heroSearchWrap = { position: "relative", maxWidth: 520, margin: "0 auto" };
const heroSearchInput = {
  width: "100%", boxSizing: "border-box", border: "none", borderRadius: 12,
  padding: "13px 16px 13px 42px", fontSize: 13.5, font: "inherit", background: "#fff",
  color: "var(--ink-strong)", boxShadow: "0 6px 18px rgba(0,0,0,0.22)",
};

const sectionLabel = { fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "4px 0 12px" };
const heroRow = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 24 };
const guideBanner = {
  display: "flex", alignItems: "center", gap: 12, marginTop: 18,
  background: "var(--surface-2)", border: "1px solid var(--border-strong)", borderRadius: "var(--radius)",
  padding: "13px 16px", textDecoration: "none", boxShadow: "var(--shadow-sm)",
};
const guideIcon = { width: 34, height: 34, borderRadius: 9, background: "var(--charcoal)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };
const heroCard = { textAlign: "left", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "16px 16px 18px", cursor: "pointer", font: "inherit", boxShadow: "var(--shadow-sm)" };
const catGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 };
const catCard = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "14px 15px", cursor: "pointer", font: "inherit", boxShadow: "var(--shadow-sm)" };
const catIcon = { width: 30, height: 30, borderRadius: 8, background: "var(--charcoal-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };
const countChip = { fontSize: 10.5, fontWeight: 700, color: "var(--muted)", background: "var(--surface)", border: "1px solid var(--border)", padding: "1px 7px", borderRadius: 5 };
const cardGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 };
const artCard = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "13px 14px", cursor: "pointer", font: "inherit", boxShadow: "var(--shadow-sm)" };
const artIcon = { width: 36, height: 36, borderRadius: 9, background: "var(--charcoal-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };
const lead = { fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6, paddingBottom: 14, marginBottom: 4, borderBottom: "1px solid var(--border)", fontStyle: "italic" };
const h3 = { fontSize: 13.5, fontWeight: 700, color: "var(--ink-strong)", margin: "16px 0 8px", letterSpacing: "-0.01em" };
const para = { fontSize: 13.5, lineHeight: 1.75, color: "var(--ink)", marginBottom: 12 };
const li = { display: "flex", gap: 9, fontSize: 13.5, lineHeight: 1.7, color: "var(--ink)", marginBottom: 6 };
const bullet = { color: "var(--charcoal)", fontWeight: 700, flexShrink: 0 };
const stepNum = { flexShrink: 0, width: 19, height: 19, borderRadius: "50%", background: "var(--charcoal-bg)", color: "var(--charcoal-strong)", fontSize: 10.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2 };
const noteBox = { display: "flex", gap: 8, background: "var(--info-bg)", color: "var(--info)", fontSize: 12.5, padding: "10px 12px", borderRadius: 8, margin: "0 0 13px", lineHeight: 1.6 };
const warnBox = { display: "flex", gap: 8, background: "var(--warn-bg)", color: "var(--warn)", fontSize: 12.5, padding: "10px 12px", borderRadius: 8, margin: "0 0 13px", lineHeight: 1.6 };
const tth = { textAlign: "left", fontSize: 10.5, fontWeight: 700, color: "var(--muted)", padding: "8px 11px", background: "var(--surface)", textTransform: "uppercase", letterSpacing: "0.04em" };
const ttd = { padding: "8px 11px", verticalAlign: "top", lineHeight: 1.5 };
const relatedWrap = { marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--border)" };
const prevNextWrap = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 22, paddingTop: 16, borderTop: "1px solid var(--border)" };
const prevNextBtn = { display: "flex", alignItems: "center", gap: 8, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", cursor: "pointer", font: "inherit" };
const prevNextLabel = { fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" };
const prevNextTitle = { fontSize: 12.5, fontWeight: 600, color: "var(--ink-strong)", marginTop: 1 };
const relPill = { display: "inline-flex", alignItems: "center", gap: 6, font: "inherit", fontSize: 12, fontWeight: 600, color: "var(--ink-strong)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 999, padding: "5px 11px", cursor: "pointer" };
