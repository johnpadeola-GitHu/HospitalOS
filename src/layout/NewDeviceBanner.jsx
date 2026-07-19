import { useState } from "react";
import * as Icons from "lucide-react";
import { useAuth } from "../auth/AuthContext";

// Shown once, right after a sign-in from a device not previously seen on
// this account. Dismissible — this is a notice, not a block, since this
// preview build has no way to actually verify a new device (no email/SMS
// to send a real approval code to). See Administration -> Security & audit
// for the full device history, and the audit trail entry this sign-in
// already generated.
export default function NewDeviceBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  if (!user?.newDevice || dismissed) return null;

  return (
    <div style={wrap} className="no-print">
      <Icons.ShieldAlert size={13} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>
        Signed in from a device we haven't seen on this account before ({user.deviceLabel}). If this
        wasn't you, change your password and check Administration &rarr; Security &amp; audit.
      </span>
      <button onClick={() => setDismissed(true)} style={closeBtn} aria-label="Dismiss">
        <Icons.X size={13} />
      </button>
    </div>
  );
}

const wrap = {
  display: "flex", alignItems: "center", gap: 8, background: "var(--warn-bg)", color: "var(--warn)",
  fontSize: 11.5, fontWeight: 500, padding: "6px 24px", borderBottom: "1px solid var(--border)",
};
const closeBtn = { background: "none", border: "none", cursor: "pointer", color: "inherit", display: "flex", flexShrink: 0 };
