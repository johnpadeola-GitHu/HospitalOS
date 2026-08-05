// Help engine — standalone documentation service.
//
// This is an ENGINE, not a module: it owns no clinical data and depends on no
// other module. The relationship runs one way — modules may register articles
// with the engine, but the engine never imports from a module.
//
// Three things it provides:
//   1. A registry. Any module can call registerArticles() at import time to
//      contribute its own documentation, so a new module ships its help with it.
//   2. A context. useHelp() gives any screen openHelp("article-id"), so a
//      question mark next to a control can open the exact article explaining it.
//   3. A search index across every registered article, including table contents.

import { createContext, useContext, useState, useMemo } from "react";
import { CATEGORIES as BASE_CATEGORIES, ARTICLES as BASE_ARTICLES } from "./content";

/* ------------------------------------------------------------------ */
/* Registry                                                            */
/* ------------------------------------------------------------------ */

const _categories = [...BASE_CATEGORIES];
const _articles = [...BASE_ARTICLES];

/**
 * Register a category. Ignored if the key already exists, so a module can
 * safely declare a category it shares with another.
 */
export function registerCategory(cat) {
  if (!cat?.key || _categories.some((c) => c.key === cat.key)) return;
  _categories.push(cat);
}

/**
 * Register articles from a module. Called at import time.
 * Later registrations of the same id replace earlier ones, so a module can
 * override a stub article shipped with the engine.
 */
export function registerArticles(articles) {
  for (const a of articles || []) {
    if (!a?.id) continue;
    const i = _articles.findIndex((x) => x.id === a.id);
    if (i >= 0) _articles[i] = a;
    else _articles.push(a);
  }
}

export function allCategories() {
  // Only surface categories that actually have articles.
  return _categories.filter((c) => _articles.some((a) => a.cat === c.key));
}

export function allArticles() {
  return [..._articles];
}

export function articlesIn(cat) {
  return _articles.filter((a) => a.cat === cat);
}

export function getArticle(id) {
  return _articles.find((a) => a.id === id) || null;
}

/* ------------------------------------------------------------------ */
/* Search                                                              */
/* ------------------------------------------------------------------ */

function haystack(a) {
  const blocks = a.body.flatMap((b) => [
    b.p, b.h, b.note, b.warn,
    ...(b.list || []),
    ...(b.steps || []),
    ...(b.table ? [...b.table.head, ...b.table.rows.flat()] : []),
  ]);
  return [a.title, a.lead, ...blocks].filter(Boolean).join(" ").toLowerCase();
}

export function searchArticles(q) {
  const t = String(q || "").trim().toLowerCase();
  if (!t) return [];
  return _articles.filter((a) => haystack(a).includes(t));
}

/**
 * Search result shaped for the global search bar: returns a short excerpt
 * around the match so the user sees why it hit.
 */
export function searchWithExcerpt(q, limit = 5) {
  const t = String(q || "").trim().toLowerCase();
  if (!t) return [];
  return searchArticles(t)
    .slice(0, limit)
    .map((a) => {
      const hay = haystack(a);
      const i = hay.indexOf(t);
      const start = Math.max(0, i - 40);
      const excerpt = (start > 0 ? "…" : "") + hay.slice(start, i + t.length + 60).trim() + "…";
      return { id: a.id, title: a.title, icon: a.icon, cat: a.cat, excerpt };
    });
}

/* ------------------------------------------------------------------ */
/* Context — lets any screen open help at a specific article           */
/* ------------------------------------------------------------------ */

const HelpContext = createContext(null);

export function HelpProvider({ children }) {
  const [requestedId, setRequestedId] = useState(null);

  const value = useMemo(() => ({
    requestedId,
    openHelp: (id) => setRequestedId(id || null),
    clearRequest: () => setRequestedId(null),
  }), [requestedId]);

  return <HelpContext.Provider value={value}>{children}</HelpContext.Provider>;
}

export function useHelp() {
  const ctx = useContext(HelpContext);
  // Degrade rather than crash if a screen is rendered outside the provider.
  if (!ctx) return { requestedId: null, openHelp: () => {}, clearRequest: () => {} };
  return ctx;
}

/**
 * Small question-mark button that opens the help engine at a given article.
 * Drop beside any control that needs explaining.
 */
export function HelpLink({ articleId, label = "What's this?" }) {
  const { openHelp } = useHelp();
  const a = getArticle(articleId);
  if (!a) return null;
  return (
    <button
      onClick={() => openHelp(articleId)}
      title={a.title}
      aria-label={`Help: ${a.title}`}
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        font: "inherit", fontSize: 11, fontWeight: 600,
        color: "var(--muted)", background: "none", border: "none",
        cursor: "pointer", padding: 0,
      }}
    >
      <span style={{
        width: 14, height: 14, borderRadius: 0,
        border: "1px solid var(--border-strong)", fontSize: 9,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
      }}>?</span>
      {label}
    </button>
  );
}
