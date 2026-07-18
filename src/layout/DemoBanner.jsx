import * as Icons from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { daysRemaining } from "../engines/onboarding";

// Shown to any signed-in account with a demoExpiresAt — a constant, honest
// reminder of how much runway is left, rather than letting the 30-day limit
// arrive as a surprise the day sign-in stops working.
export default function DemoBanner() {
  const { user } = useAuth();
  if (!user?.demoExpiresAt) return null;

  const days = daysRemaining(user.demoExpiresAt);
  const urgent = days <= 5;

  return (
    <div style={{ ...wrap, ...(urgent ? wrapUrgent : null) }} className="no-print">
      <Icons.Sparkles size={13} style={{ flexShrink: 0 }} />
      <span>
        {days > 0 ? (
          <>Demo account &middot; <b>{days} day{days !== 1 ? "s" : ""} remaining</b> &middot; upgrade any time from Administration to keep your data.</>
        ) : (
          <>Your demo has expired. Contact AgoroX to convert to a full account.</>
        )}
      </span>
    </div>
  );
}

const wrap = {
  display: "flex", alignItems: "center", gap: 8, background: "var(--accent-soft)", color: "var(--accent)",
  fontSize: 11.5, fontWeight: 500, padding: "6px 24px", borderBottom: "1px solid var(--border)",
};
const wrapUrgent = { background: "var(--warn-bg)", color: "var(--warn)" };
