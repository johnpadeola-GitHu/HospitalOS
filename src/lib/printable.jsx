import { useEffect, useState } from "react";
import * as Icons from "lucide-react";
import { getSettings } from "../modules/system/sysAdminService";

// Every generated document — a released lab result, a released imaging
// report, an invoice or receipt — needs to carry the hospital's own
// identity: name, logo, address, phone, email. This is the shared piece
// that makes that true everywhere at once, reading live from
// Administration -> Settings rather than being hardcoded per document.

export function useLetterhead() {
  const [settings, setSettings] = useState(null);
  useEffect(() => {
    let alive = true;
    getSettings().then((s) => alive && setSettings(s));
    return () => { alive = false; };
  }, []);
  return settings;
}

export function Letterhead({ settings }) {
  if (!settings) return null;
  const initials = settings.hospitalName
    .split(" ")
    .filter((w) => w.length > 2 || /^[A-Z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "H";

  return (
    <div style={letterheadWrap}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {settings.logoUrl ? (
          <img src={settings.logoUrl} alt="" style={logoImg} />
        ) : (
          <div style={logoFallback}>{initials}</div>
        )}
        <div>
          <div style={hospitalName}>{settings.hospitalName}</div>
          <div style={hospitalMeta}>{settings.address}</div>
          <div style={hospitalMeta}>{settings.phone} &middot; {settings.email}</div>
        </div>
      </div>
      <div style={{ borderTop: "2px solid #22272B", marginTop: 12 }} />
    </div>
  );
}

/**
 * A full-screen printable document. The toolbar (Print/Close) is marked
 * no-print so it disappears from paper; everything inside .print-area is
 * what actually prints, full-page, with no app chrome.
 */
export function PrintableOverlay({ title, onClose, children }) {
  return (
    <div style={overlay}>
      <div style={toolbar} className="no-print">
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-strong)" }}>{title}</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={printBtn} onClick={() => window.print()}>
            <Icons.Printer size={14} /> Print / Save as PDF
          </button>
          <button style={closeBtn} onClick={onClose}>
            <Icons.X size={14} /> Close
          </button>
        </div>
      </div>
      <div style={page} className="print-area">
        {children}
      </div>
    </div>
  );
}

export function DocFooterNote({ children }) {
  return <div style={footerNote}>{children}</div>;
}

const letterheadWrap = { marginBottom: 18 };
const logoImg = { width: 52, height: 52, borderRadius: 10, objectFit: "cover", border: "1px solid #E4E9F2", flexShrink: 0 };
const logoFallback = { width: 52, height: 52, borderRadius: 10, background: "#E8EFFB", color: "#1E3A6E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, flexShrink: 0 };
const hospitalName = { fontSize: 18, fontWeight: 700, color: "#22272B", letterSpacing: "-0.01em" };
const hospitalMeta = { fontSize: 11.5, color: "#5A6472", marginTop: 1 };
const overlay = { position: "fixed", inset: 0, background: "#fff", zIndex: 200, overflowY: "auto" };
const toolbar = {
  position: "sticky", top: 0, display: "flex", alignItems: "center", justifyContent: "space-between",
  padding: "12px 24px", borderBottom: "1px solid #E4E9F2", background: "#F8FAFC", zIndex: 2,
};
const printBtn = { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: "#fff", background: "#33393F", border: "none", borderRadius: 8, padding: "7px 14px", cursor: "pointer" };
const closeBtn = { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: "#5A6472", background: "#fff", border: "1px solid #CBD5E5", borderRadius: 8, padding: "7px 14px", cursor: "pointer" };
const page = { maxWidth: 720, margin: "0 auto", padding: "36px 40px 60px" };
const footerNote = { marginTop: 28, paddingTop: 14, borderTop: "1px solid #E4E9F2", fontSize: 10.5, color: "#7A8AA3", lineHeight: 1.6 };
