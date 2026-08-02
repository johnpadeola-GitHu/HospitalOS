// Shared money formatting for the app. Previously each module defined its own
// local `naira()`, with small inconsistencies (some rounded, some didn't; two
// different ways of writing the ₦ sign). This is the single source of truth.
//
// The backend returns money as naira numbers (alongside integer-kobo fields
// during the kobo transition). These helpers format a NAIRA number for display.
// When the backend eventually returns only kobo, add formatFromKobo() here and
// this stays the one place display formatting lives.

/**
 * Format a naira amount for display, e.g. 1500 -> "₦1,500". Rounds to whole
 * naira, matching how the app has always shown figures. Guards against
 * null/undefined/NaN so a missing value renders as "₦0" rather than "₦NaN".
 */
export function naira(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "\u20a60";
  return "\u20a6" + Math.round(v).toLocaleString();
}

/**
 * Format integer kobo for display, e.g. 150075 -> "₦1,500.75". For when a
 * screen starts reading a kobo field directly. Shows kobo only when non-zero,
 * matching the backend's formatNaira. Not yet used — provided so the eventual
 * frontend kobo switch has a ready, consistent home.
 */
export function formatFromKobo(kobo) {
  const k = Number(kobo);
  if (!Number.isFinite(k)) return "\u20a60";
  const whole = k % 100 === 0;
  return "\u20a6" + (k / 100).toLocaleString("en-NG", {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  });
}
