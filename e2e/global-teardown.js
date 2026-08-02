// e2e/global-teardown.js
//
// Runs once, automatically, after the full E2E suite finishes (pass or
// fail). Deletes every patient the suite creates — identified by the
// unmistakable naming convention the specs already use (firstName
// "E2EAllergy" / "E2EAudit" / "E2E", lastName "AllergyCheck*" /
// "AuditCheck*" / "TestPatient*") — plus every child record across the
// tables that can reference a patient, in dependency-safe order.
//
// WHY THIS EXISTS: the specs register real patients through the live UI
// (there is no isolated test tenant), so without this teardown every test
// run leaves permanent rows behind — which is exactly what happened before
// this was added. This does NOT add any new delete capability to the
// running app; it uses `wrangler d1 execute` directly against the D1
// database, the same tool and the same statements used for the one-time
// manual cleanup. No new API route, no new attack surface in production.
//
// If wrangler isn't available in the environment this runs in (e.g. a CI
// runner without Cloudflare credentials configured), the cleanup is
// skipped with a warning rather than failing the whole test run — a
// missed cleanup is a nuisance, not a reason to redden the build.

import { execSync } from "child_process";

const TEST_PATIENT_WHERE = `
  first_name IN ('E2EAllergy','E2EAudit','E2E')
  OR last_name LIKE 'AllergyCheck%'
  OR last_name LIKE 'AuditCheck%'
  OR last_name LIKE 'TestPatient%'
`;

// Every table that can reference a test patient, in an order safe for
// foreign keys (children before parents). beds/invoice_items use different
// relationships (occupant_id / invoice_id) so they're handled separately.
const CHILD_TABLES = [
  "scd_crises", "vitals", "clinical_notes", "diagnoses", "lab_orders",
  "ed_encounters", "dispenses", "prescriptions", "payment_attempts",
  "payments", "radiology_studies", "theatre_cases", "transfusion_requests",
  "dental_visits", "dialysis_sessions", "bookings", "outpatient_visits",
  "referrals_inbound", "referrals_outbound", "allergies",
  "claims", // discovered missing in production: a real patient_id FK that
            // silently blocked cleanup for hours before being traced down
            // via binary search on 2026-08-02 — see conversation history
            // if this ever needs re-diagnosing.
];

function statements() {
  const s = [];
  s.push(`DELETE FROM invoice_items WHERE invoice_id IN (SELECT id FROM invoices WHERE patient_id IN (SELECT id FROM patients WHERE ${TEST_PATIENT_WHERE}));`);
  for (const t of CHILD_TABLES) {
    s.push(`DELETE FROM ${t} WHERE patient_id IN (SELECT id FROM patients WHERE ${TEST_PATIENT_WHERE});`);
  }
  s.push(`DELETE FROM invoices WHERE patient_id IN (SELECT id FROM patients WHERE ${TEST_PATIENT_WHERE});`);
  s.push(`UPDATE beds SET occupant_id = NULL, since = NULL WHERE occupant_id IN (SELECT id FROM patients WHERE ${TEST_PATIENT_WHERE});`);
  s.push(`DELETE FROM patients WHERE ${TEST_PATIENT_WHERE};`);
  return s;
}

export default async function globalTeardown() {
  const dbName = process.env.E2E_D1_DATABASE || "hospitalos";
  try {
    for (const sql of statements()) {
      execSync(`npx wrangler d1 execute ${dbName} --remote --command "${sql.replace(/"/g, '\\"')}"`, {
        stdio: "pipe",
        timeout: 30000,
      });
    }
    console.log("[e2e] Test-patient cleanup complete.");
  } catch (err) {
    // A cleanup failure should never fail the build — it just means a
    // manual pass is needed. Surface it loudly so it isn't missed silently.
    console.warn("[e2e] WARNING: automatic test-patient cleanup did not complete.");
    console.warn("[e2e] Run manually: wrangler d1 execute " + dbName + " --remote --file=e2e/cleanup-test-patients.sql");
    console.warn(String(err.message || err));
  }
}
