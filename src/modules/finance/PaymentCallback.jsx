import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getOnlinePaymentStatus } from "./billingService";
import { PageHeader, Button, Card } from "../../lib/ui";

// Where the payment provider sends the browser back to after checkout.
// The provider itself confirms the payment via webhook, server to
// server — this page never trusts the redirect alone as proof of
// anything; it polls the real status the webhook is responsible for
// setting, and keeps polling for a short while since the webhook can
// genuinely arrive a few seconds after the browser redirect does.
export default function PaymentCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const reference = params.get("reference") || params.get("trxref");
  const [status, setStatus] = useState("checking");
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!reference) { setStatus("no-reference"); return; }
    let alive = true;
    let timer;

    const poll = async () => {
      try {
        const r = await getOnlinePaymentStatus(reference);
        if (!alive) return;
        if (r.status === "success") { setStatus("success"); return; }
        if (r.status === "failed") { setStatus("failed"); return; }
        setAttempts((a) => a + 1);
      } catch (e) {
        console.error(e);
      }
    };

    poll();
    timer = setInterval(poll, 3000);
    return () => { alive = false; clearInterval(timer); };
  }, [reference]);

  // Stop polling and tell the truth after a reasonable wait — the
  // webhook may simply not have arrived yet (or the provider isn't
  // configured at all), and an honest "still processing" beats a
  // spinner that never resolves.
  useEffect(() => {
    if (attempts >= 20 && status === "checking") setStatus("still-pending");
  }, [attempts, status]);

  return (
    <div>
      <PageHeader group="Finance & trade" title="Online payment" icon="CreditCard" />
      <Card>
        {status === "checking" && (
          <Message tone="muted" title="Confirming your payment…" body="This usually takes a few seconds while the payment provider notifies HospitalOS." />
        )}
        {status === "success" && (
          <Message tone="good" title="Payment confirmed" body="The payment has been recorded against the patient's account." />
        )}
        {status === "failed" && (
          <Message tone="bad" title="Payment did not succeed" body="The provider reported this transaction failed or was abandoned. No charge was recorded." />
        )}
        {status === "still-pending" && (
          <Message tone="warn" title="Still waiting for confirmation" body="HospitalOS hasn't received confirmation from the payment provider yet. This can happen if the provider isn't fully configured, or is just running slow — check Billing in a few minutes; the payment will appear there once confirmed." />
        )}
        {status === "no-reference" && (
          <Message tone="bad" title="No payment reference found" body="This page is meant to be reached by redirect from a payment provider, not visited directly." />
        )}
        <Button variant="primary" onClick={() => navigate("/finance/billing")} style={{ marginTop: 16 }}>
          Back to Billing
        </Button>
      </Card>
    </div>
  );
}

function Message({ tone, title, body }) {
  const color = { good: "var(--good)", bad: "var(--bad)", warn: "var(--warn)", muted: "var(--muted)" }[tone];
  return (
    <div style={{ textAlign: "center", padding: "24px 12px" }}>
      <div style={{ fontSize: 17, fontWeight: 600, color, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, color: "var(--muted)", maxWidth: 420, margin: "0 auto", lineHeight: 1.5 }}>{body}</div>
    </div>
  );
}
