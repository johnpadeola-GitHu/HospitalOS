// Data import — bringing patient records in from an existing EMR/paper
// system. This is the honest, concrete answer to "can we migrate our data
// in": the mapping and validation logic below is real and works today. What
// is NOT yet real is persistent storage on the receiving end — imported
// patients land in the same in-memory patient list every other patient in
// this preview build lives in, and reset on reload, same as everything else.
// A production migration needs this same mapper wired to Cloudflare D1
// instead (see the Production Readiness Plan) — the parsing, column
// matching, and validation rules do not change when the storage does.

import { registerPatient } from "../patients/patientService";
import { record, AUDIT_ACTIONS } from "../../lib/audit";

const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));

// The fields HospitalOS actually requires vs. accepts optionally on import.
export const REQUIRED_FIELDS = ["firstName", "lastName", "sex", "dob"];
export const OPTIONAL_FIELDS = ["phone", "hospitalNo"];
export const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];

// Common column header variants from real EMR/Excel exports, so a hospital's
// existing export usually auto-maps without the admin renaming a single
// column by hand.
const HEADER_ALIASES = {
  firstName: ["firstname", "first name", "first_name", "given name", "givenname"],
  lastName: ["lastname", "last name", "last_name", "surname", "family name"],
  sex: ["sex", "gender"],
  dob: ["dob", "date of birth", "dateofbirth", "birthdate", "birth date"],
  phone: ["phone", "phone number", "mobile", "telephone", "contact"],
  hospitalNo: ["hospitalno", "hospital no", "hospital number", "patient id", "mrn", "record number"],
};

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const splitLine = (line) => {
    // Minimal CSV split honouring quoted commas — enough for a real Excel/EMR export.
    const cells = [];
    let cur = "", inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { inQuotes = !inQuotes; continue; }
      if (c === "," && !inQuotes) { cells.push(cur); cur = ""; continue; }
      cur += c;
    }
    cells.push(cur);
    return cells.map((c) => c.trim());
  };
  const headers = splitLine(lines[0]);
  const rows = lines.slice(1).map(splitLine);
  return { headers, rows };
}

/** Guess which CSV column maps to which HospitalOS field, using the alias table. */
export function autoMapColumns(headers) {
  const map = {};
  for (const field of ALL_FIELDS) {
    const aliases = HEADER_ALIASES[field] || [field];
    const idx = headers.findIndex((h) => aliases.includes(h.trim().toLowerCase()));
    map[field] = idx >= 0 ? idx : null;
  }
  return map;
}

/** Parse a CSV file's raw text into headers + rows, ready for mapping. */
export function readCsv(text) {
  return parseCsv(text);
}

function normaliseSex(raw) {
  const v = String(raw || "").trim().toLowerCase();
  if (["m", "male"].includes(v)) return "M";
  if (["f", "female"].includes(v)) return "F";
  return null;
}

function normaliseDob(raw) {
  const v = String(raw || "").trim();
  if (!v) return null;
  // Accept YYYY-MM-DD, DD/MM/YYYY, or MM/DD/YYYY — real exports are inconsistent.
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  if (iso.test(v)) return v;
  const slash = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const [, a, b, y] = slash;
    const day = parseInt(a, 10) > 12 ? a : b; // heuristic: whichever part >12 must be the day
    const month = parseInt(a, 10) > 12 ? b : a;
    return `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  return null;
}

/**
 * Validate every row against the column mapping BEFORE importing anything —
 * the fail-safe part: a preview always runs first, nothing is written until
 * the operator reviews exactly what will happen to every row.
 */
export function validateRows(rows, columnMap) {
  return rows.map((row, i) => {
    const get = (field) => (columnMap[field] != null ? row[columnMap[field]] : "");
    const firstName = get("firstName").trim();
    const lastName = get("lastName").trim();
    const sex = normaliseSex(get("sex"));
    const dob = normaliseDob(get("dob"));
    const phone = get("phone").trim();

    const errors = [];
    if (!firstName) errors.push("Missing first name");
    if (!lastName) errors.push("Missing last name");
    if (!sex) errors.push(`Unrecognised sex value ("${get("sex")}")`);
    if (!dob) errors.push(`Unrecognised date of birth ("${get("dob")}")`);

    return { rowNumber: i + 2, firstName, lastName, sex, dob, phone, errors, valid: errors.length === 0 };
  });
}

/**
 * Import only the rows that passed validation. Rows with errors are never
 * silently dropped into the patient list \u2014 they are excluded and reported
 * back so the operator can fix the source file and re-run just those.
 */
export async function importValidRows(validatedRows, actor) {
  await delay(200);
  const toImport = validatedRows.filter((r) => r.valid);
  const created = [];
  for (const r of toImport) {
    const patient = await registerPatient({ firstName: r.firstName, lastName: r.lastName, sex: r.sex, dob: r.dob, phone: r.phone });
    created.push(patient);
  }
  record({
    actor, action: AUDIT_ACTIONS.CREATE, entity: "data-import", entityId: `${created.length}-patients`,
    detail: `Imported ${created.length} patient record(s) from CSV \u2014 ${validatedRows.length - toImport.length} row(s) skipped for validation errors`,
    severity: "info",
  });
  return created;
}
