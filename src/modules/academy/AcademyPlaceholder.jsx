import * as Icons from "lucide-react";
import { PageHeader } from "../../lib/ui";

// The interactive, in-app Academy — role-based professional
// certification tracks (Courses → Modules → Lessons → Practical
// Exercises → Knowledge Checks → Assessments → Certification) — is
// scaffolded and routed here, work genuinely in progress. It will be a
// paid feature, locked until the build is complete; this screen says
// so honestly rather than showing an empty shell with no real story.
// The full curriculum content already exists as a downloadable
// document today, ahead of the interactive version being built.
export default function AcademyPlaceholder() {
  const tracks = ["Doctor", "Nurse", "Lab Scientist", "Radiographer", "Pharmacist", "Cashier", "Records Officer", "Super Admin"];
  return (
    <div>
      <PageHeader group="Academy" title="HospitalOS Academy" icon="GraduationCap" />
      <div style={card}>
        <div style={badge}><Icons.Lock size={11} style={{ marginRight: 4 }} />Locked — in development</div>
        <h2 style={{ fontSize: 17, fontWeight: 600, color: "var(--ink-strong)", margin: "10px 0 8px" }}>
          Role-based professional certification, not a generic manual
        </h2>
        <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6, maxWidth: 560, margin: 0 }}>
          Each role gets its own certification track — a structured sequence of Courses, Modules, and
          Lessons through Beginner, Intermediate, and Advanced levels, with practical exercises, knowledge
          checks, and a real assessment gating certification at the end. This will be a paid feature and
          stays locked until the build is genuinely complete, rather than opening early as an unfinished
          preview.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
          {tracks.map((t) => (
            <span key={t} style={trackChip}>{t}</span>
          ))}
        </div>
        <a href="/guides/HospitalOS-Academy.pdf" download style={link}>
          <Icons.FileDown size={15} style={{ flexShrink: 0 }} />
          The full curriculum content is already available as a download, ahead of this interactive version
        </a>
      </div>
    </div>
  );
}

const card = {
  background: "var(--surface-2)", border: "1px solid var(--border)",
  borderRadius: 12, padding: "22px 24px",
};
const badge = {
  display: "inline-flex", alignItems: "center", fontSize: 10.5, fontWeight: 700, color: "var(--warn)",
  background: "var(--warn-bg)", padding: "3px 9px", borderRadius: 999,
  textTransform: "uppercase", letterSpacing: "0.04em",
};
const trackChip = {
  fontSize: 11.5, fontWeight: 500, color: "var(--ink)", background: "var(--surface)",
  border: "1px solid var(--border)", padding: "4px 10px", borderRadius: 999,
};
const link = {
  display: "inline-flex", alignItems: "center", gap: 7, marginTop: 18,
  fontSize: 13, fontWeight: 600, color: "var(--accent)", textDecoration: "none",
};
