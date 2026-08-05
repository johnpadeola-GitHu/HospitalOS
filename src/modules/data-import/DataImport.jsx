import { useState, useRef } from "react";
import * as Icons from "lucide-react";
import { readCsv, autoMapColumns, validateRows, importValidRows, ALL_FIELDS, REQUIRED_FIELDS } from "./dataImportService";
import { PageHeader, StatCard, Card, Pill, Button, inputStyle } from "../../lib/ui";
import { useAuth } from "../../auth/AuthContext";

const FIELD_LABEL = { firstName: "First name", lastName: "Last name", sex: "Sex", dob: "Date of birth", phone: "Phone", hospitalNo: "Hospital no." };

export default function DataImport() {
  const { user } = useAuth();
  const [stage, setStage] = useState("upload"); // upload -> map -> preview -> done
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [columnMap, setColumnMap] = useState({});
  const [validated, setValidated] = useState([]);
  const [imported, setImported] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef(null);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setErr("");
    const reader = new FileReader();
    reader.onload = () => {
      const { headers: h, rows: r } = readCsv(String(reader.result));
      if (h.length === 0) { setErr("Could not read any rows from this file."); return; }
      setFileName(f.name); setHeaders(h); setRows(r);
      setColumnMap(autoMapColumns(h));
      setStage("map");
    };
    reader.readAsText(f);
  };

  const runPreview = () => {
    const missing = REQUIRED_FIELDS.filter((f) => columnMap[f] == null);
    if (missing.length) { setErr(`Map every required field first: ${missing.map((f) => FIELD_LABEL[f]).join(", ")}`); return; }
    setErr("");
    setValidated(validateRows(rows, columnMap));
    setStage("preview");
  };

  const doImport = async () => {
    setBusy(true); setErr("");
    try {
      const created = await importValidRows(validated, user);
      setImported(created);
      setStage("done");
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  const reset = () => {
    setStage("upload"); setFileName(""); setHeaders([]); setRows([]);
    setColumnMap({}); setValidated([]); setImported([]); setErr("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const validCount = validated.filter((r) => r.valid).length;
  const errorCount = validated.length - validCount;

  return (
    <div>
      <PageHeader group="Administration" title="Data import" icon="UploadCloud"
        subtitle="Bring patient records in from an existing system — CSV export, mapped and validated before anything is written" />

      <div style={note}>
        <Icons.Info size={14} style={{ color: "var(--muted)", flexShrink: 0, marginTop: 1 }} />
        <span>
          The mapping and validation logic here is real. What is not yet real is permanent storage on
          the receiving end — imported patients land in the same in-memory list every patient in this
          preview build lives in, and reset on reload. A production migration wires this same mapper to
          Cloudflare D1 instead; nothing about the mapping or validation changes when the storage does.
        </span>
      </div>

      {err && <div style={errBanner}>{err}</div>}

      {stage === "upload" && (
        <Card title="Step 1 — Upload a CSV export">
          <div style={dropZone} onClick={() => fileRef.current?.click()}>
            <Icons.UploadCloud size={22} style={{ color: "var(--muted)" }} />
            <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 6 }}>
              Click to choose a CSV file exported from your current system
            </div>
          </div>
          <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={onFile} />
          <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 12, lineHeight: 1.6 }}>
            Required columns: {REQUIRED_FIELDS.map((f) => FIELD_LABEL[f]).join(", ")}. Common header names
            (First Name, Surname, DOB, Gender, MRN, etc.) are recognised automatically — you will get a
            chance to fix the mapping before anything imports.
          </div>
        </Card>
      )}

      {stage === "map" && (
        <Card title={`Step 2 — Map columns (${fileName}, ${rows.length} rows)`}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {ALL_FIELDS.map((field) => (
              <div key={field} style={mapRow}>
                <div style={{ width: 140, fontSize: 12.5, fontWeight: 600, color: "var(--ink-strong)" }}>
                  {FIELD_LABEL[field]}
                  {REQUIRED_FIELDS.includes(field) && <span style={{ color: "var(--bad)" }}> *</span>}
                </div>
                <select
                  style={{ ...inputStyle, maxWidth: 260 }}
                  value={columnMap[field] ?? ""}
                  onChange={(e) => setColumnMap((m) => ({ ...m, [field]: e.target.value === "" ? null : parseInt(e.target.value, 10) }))}
                >
                  <option value="">Not mapped</option>
                  {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                </select>
                {columnMap[field] != null && rows[0] && (
                  <span style={{ fontSize: 11.5, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>e.g. "{rows[0][columnMap[field]]}"</span>
                )}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button onClick={reset}>Start over</Button>
            <Button variant="primary" onClick={runPreview}>Validate {rows.length} rows</Button>
          </div>
        </Card>
      )}

      {stage === "preview" && (
        <>
          <div style={statGrid}>
            <StatCard label="Total rows" value={validated.length} />
            <StatCard label="Ready to import" value={validCount} tone="good" />
            <StatCard label="Will be skipped" value={errorCount} tone={errorCount ? "bad" : "default"} />
          </div>
          <Card title="Step 3 — Review before importing" pad={false}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["Row", "Name", "Sex", "DOB", "Phone", "Status"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {validated.slice(0, 200).map((r) => (
                  <tr key={r.rowNumber} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--muted)" }}>{r.rowNumber}</td>
                    <td style={{ ...td, fontWeight: 600, color: "var(--ink-strong)" }}>{r.lastName}, {r.firstName}</td>
                    <td style={td}>{r.sex || "\u2014"}</td>
                    <td style={td}>{r.dob || "\u2014"}</td>
                    <td style={td}>{r.phone || "\u2014"}</td>
                    <td style={td}>
                      {r.valid ? <Pill tone="good">Ready</Pill> : <Pill tone="bad" title={r.errors.join("; ")}>{r.errors[0]}</Pill>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {validated.length > 200 && <div style={{ padding: 12, fontSize: 11.5, color: "var(--muted)" }}>Showing first 200 of {validated.length} rows.</div>}
          </Card>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <Button onClick={() => setStage("map")}>Back to mapping</Button>
            <Button variant="primary" onClick={doImport} disabled={busy || validCount === 0}>
              {busy ? "Importing…" : `Import ${validCount} valid row${validCount !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </>
      )}

      {stage === "done" && (
        <Card title="Import complete">
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <Icons.CheckCircle2 size={32} color="var(--good)" style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--ink-strong)" }}>{imported.length} patients imported</div>
            <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 4 }}>
              Each was assigned a new HospitalOS hospital number and now appears in Patient care → Registration & ADT.
            </div>
            {errorCount > 0 && (
              <div style={{ fontSize: 12.5, color: "var(--warn)", marginTop: 10 }}>
                {errorCount} row(s) were skipped for validation errors and were not imported.
              </div>
            )}
            <Button variant="primary" onClick={reset} style={{ marginTop: 16 }}>Import another file</Button>
          </div>
        </Card>
      )}
    </div>
  );
}

const note = { display: "flex", gap: 8, background: "var(--accent-soft)", border: "1px solid var(--border)", borderRadius: 0, padding: "10px 13px", fontSize: 12, color: "var(--muted)", marginBottom: 16, lineHeight: 1.55 };
const statGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 16 };
const dropZone = { border: "1.5px dashed var(--border-strong)", borderRadius: 0, padding: "26px 16px", textAlign: "center", cursor: "pointer", background: "var(--surface)" };
const mapRow = { display: "flex", alignItems: "center", gap: 12 };
const th = { textAlign: "left", fontSize: 10.5, fontWeight: 700, color: "var(--muted)", padding: "10px 14px", background: "var(--surface)", textTransform: "uppercase", letterSpacing: "0.05em" };
const td = { padding: "9px 14px", fontSize: 12.5, verticalAlign: "middle" };
const errBanner = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 13, padding: "10px 14px", borderRadius: 0, marginBottom: 14 };
