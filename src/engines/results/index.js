// Result release & delivery engine.
//
// Verifying a lab result or filing an imaging report previously did nothing
// beyond changing a status field — no one was told. This is the missing
// piece: an explicit release action that (a) notifies the ordering clinician
// through the app's notification system, (b) optionally messages the
// patient through the Communication hub, and (c) records who released what,
// when, to whom.
//
// This is an ENGINE like Help/Pricing/FHIR: it owns its own release-log
// state, is imported BY Lab and Radiology (and, by the same pattern, could
// be imported by any future result-producing module), and never imports a
// screen. Lab orders and imaging studies stay the source of truth for the
// result itself — this engine only tracks WHETHER and TO WHOM it has been
// released, and produces the notification.

import { record, AUDIT_ACTIONS } from "../../lib/audit";
import { compose } from "../../modules/communication/commsService";

const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));

// key = `${kind}:${id}` -> release record
const _releases = new Map();

function key(kind, id) {
  return `${kind}:${id}`;
}

export async function releaseStatus(kind, id) {
  await delay(30);
  return _releases.get(key(kind, id)) || null;
}

/**
 * Release a result. Always notifies the ordering clinician in-app (a
 * Communication hub "In-app" message, matching the pattern the rest of the
 * app uses for internal notices). Optionally also messages the patient by
 * SMS/WhatsApp if a phone number and consent to be contacted are available.
 *
 * Urgent/critical results are flagged in the message itself — release does
 * not replace the Alerts feed, which already fires the instant a critical
 * value or urgent finding is saved; this is the follow-up notification that
 * closes the loop with the specific clinician and patient, not just the
 * hospital-wide feed.
 */
export async function releaseResult({
  kind, id, patientName, patientPhone, hospitalNo,
  testName, orderingClinician, urgent, notifyPatient, actor,
}) {
  await delay(120);
  if (!["lab", "imaging"].includes(kind)) throw new Error("Unknown result kind.");
  const k = key(kind, id);
  if (_releases.has(k)) throw new Error("This result has already been released.");

  const urgentTag = urgent ? "URGENT \u2014 " : "";
  const clinicianMsg = await compose({
    channel: "In-app",
    recipient: orderingClinician || "Ordering clinician",
    templateKey: "result-ready",
    message: `${urgentTag}${testName} result for ${patientName} (${hospitalNo}) is now available.`,
  });

  let patientMsg = null;
  if (notifyPatient && patientPhone && patientPhone !== "\u2014") {
    patientMsg = await compose({
      channel: "SMS",
      recipient: patientName,
      templateKey: "result-ready",
      message: `Your ${testName} result is ready. Please contact the hospital or visit to discuss with your doctor.`,
    });
  }

  const release = {
    kind, id, releasedAt: new Date().toISOString(), releasedBy: actor?.name || "Unknown",
    orderingClinician: orderingClinician || null,
    clinicianNotified: true, clinicianMessageId: clinicianMsg.id,
    patientNotified: !!patientMsg, patientMessageId: patientMsg?.id || null,
  };
  _releases.set(k, release);

  record({
    actor, action: AUDIT_ACTIONS.CLINICAL, entity: `${kind}-release`, entityId: id,
    detail: `Released ${testName} for ${patientName}${patientMsg ? " \u2014 clinician + patient notified" : " \u2014 clinician notified"}`,
    severity: urgent ? "warn" : "info",
  });

  return release;
}

export async function isReleased(kind, id) {
  await delay(20);
  return _releases.has(key(kind, id));
}
