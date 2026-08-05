import * as Icons from "lucide-react";
import { PageHeader } from "../../lib/ui";

// The interactive, in-app Academy — a genuine certification framework
// (Foundation → Professional → Advanced → Expert/Leadership) — is
// scaffolded and routed here, work genuinely in progress. It will be a
// paid feature, locked until the build is complete; this screen shows
// the real credential structure honestly rather than a generic "coming
// soon" shell. The full certification blueprint already exists as a
// downloadable document today, ahead of the interactive version being
// built — see HospitalOS-Academy-Certification-Blueprint for the full
// detail behind every credential named here.
const PATHWAY = [
  { tier: "1 · Foundation", code: "HCU", name: "HospitalOS Certified User", who: "Every user, any role" },
  { tier: "2 · Professional", code: "HCDOP", name: "Certified Healthcare Digital Operations Professional", who: "Operations, finance & admin staff" },
  { tier: "2 · Professional", code: "HCSA", name: "Certified Healthcare Systems Administrator", who: "Hospital admins & Super Admins" },
  { tier: "3 · Advanced", code: "HCDWP", name: "Certified Clinical Digital Workflow Professional", who: "Doctors, nurses, diagnostics & pharmacy" },
  { tier: "4 · Expert / Leadership", code: "HCDTP", name: "Certified Healthcare Digital Transformation Professional", who: "Hospital leadership" },
];

export default function AcademyPlaceholder() {
  return (
    <div>
      <PageHeader group="Academy" title="HospitalOS Academy" icon="GraduationCap" />
      <div style={card}>
        <div style={badge}><Icons.Lock size={11} style={{ marginRight: 4 }} />Locked — in development</div>
        <h2 style={{ fontSize: 17, fontWeight: 600, color: "var(--ink-strong)", margin: "10px 0 8px" }}>
          A professional certification framework, not a generic manual
        </h2>
        <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6, maxWidth: 580, margin: 0 }}>
          Five credentials across four tiers, each with its own objectives, competency areas, and
          assessment — not a single one-size-fits-all course. This will be a paid feature and stays
          genuinely locked until the full curriculum is built, rather than opening early as an unfinished
          preview.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 18 }}>
          {PATHWAY.map((p) => (
            <div key={p.code} style={row}>
              <span style={tierTag}>{p.tier}</span>
              <span style={codeTag}>{p.code}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-strong)" }}>{p.name}</div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>{p.who}</div>
              </div>
            </div>
          ))}
        </div>

        <a href="/guides/HospitalOS-Academy-Certification-Blueprint.pdf" download style={link}>
          <Icons.FileDown size={15} style={{ flexShrink: 0 }} />
          The full certification blueprint — objectives, curriculum, and assessment approach for every credential — is already available as a download
        </a>
      </div>
    </div>
  );
}

const card = {
  background: "var(--surface-2)", border: "1px solid var(--border)",
  borderRadius: 0, padding: "22px 24px",
};
const badge = {
  display: "inline-flex", alignItems: "center", fontSize: 10.5, fontWeight: 700, color: "var(--warn)",
  background: "var(--warn-bg)", padding: "3px 9px", borderRadius: 0,
  textTransform: "uppercase", letterSpacing: "0.04em",
};
const row = {
  display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
  border: "1px solid var(--border)", borderRadius: 0, background: "var(--surface)",
};
const tierTag = {
  fontSize: 10, fontWeight: 600, color: "var(--muted)", flexShrink: 0, width: 118,
};
const codeTag = {
  fontSize: 11, fontWeight: 700, color: "var(--accent)", background: "var(--accent-bg)",
  padding: "3px 8px", borderRadius: 0, flexShrink: 0, fontFamily: "var(--font-mono)",
};
const link = {
  display: "inline-flex", alignItems: "center", gap: 7, marginTop: 18,
  fontSize: 13, fontWeight: 600, color: "var(--accent)", textDecoration: "none", lineHeight: 1.5,
};
