import { useEffect, useState, useCallback } from "react";
import {
  listPatients,
  registerPatient,
  admitPatient,
  transferPatient,
  dischargePatient,
  ageFromDob,
} from "./patientService";
import { WARD_NAMES, freeBedsForWard } from "../wards/bedService";
import { StatusBadge, Button, Modal, Field, inputStyle, PageHeader } from "../../lib/ui";
import { useAuth } from "../../auth/AuthContext";
import { record, AUDIT_ACTIONS } from "../../lib/audit";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "admitted", label: "Admitted" },
  { id: "outpatient", label: "Outpatient" },
  { id: "discharged", label: "Discharged" },
];

export default function RegistrationADT() {
  const { may, user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [showRegister, setShowRegister] = useState(false);
  const [adt, setAdt] = useState(null); // { patient, action }

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listPatients({ query, status });
      setPatients(rows);
    
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [query, status]);

  useEffect(() => {
    const t = setTimeout(refresh, 180);
    return () => clearTimeout(t);
  }, [refresh]);

  return (
    <div>
      <PageHeader group="Patient care" title={<>Registration &amp; ADT</>} icon="UserPlus" actions={<><Button variant="primary" onClick={() => setShowRegister(true)}>
          + Register patient
        </Button></>} />

      <div style={toolbar}>
        <input
          style={{ ...inputStyle, maxWidth: 280 }}
          placeholder="Search name, hospital no. or phone"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div style={{ display: "flex", gap: 6 }}>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setStatus(f.id)}
              style={{
                ...chip,
                ...(status === f.id ? chipActive : null),
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div style={tableWrap}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Hospital no.", "Patient", "Age / Sex", "Status", "Location", ""].map((h) => (
                <th key={h} style={th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={emptyCell}>
                  Loading…
                </td>
              </tr>
            ) : patients.length === 0 ? (
              <tr>
                <td colSpan={6} style={emptyCell}>
                  No patients match. Register one to get started.
                </td>
              </tr>
            ) : (
              patients.map((p) => (
                <tr key={p.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 12 }}>
                    {p.hospitalNo}
                  </td>
                  <td style={{ ...td, fontWeight: 500, color: "var(--ink-strong)" }}>
                    {p.lastName}, {p.firstName}
                  </td>
                  <td style={td}>
                    {ageFromDob(p.dob)} / {p.sex}
                  </td>
                  <td style={td}>
                    <StatusBadge status={p.status} />
                  </td>
                  <td style={{ ...td, color: "var(--muted)" }}>
                    {p.status === "admitted" ? `${p.ward} · ${p.bed}` : "—"}
                  </td>
                  <td style={{ ...td, textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: 6 }}>
                      {p.status !== "admitted" && p.status !== "discharged" && may("patient-care:admit") && (
                        <Button onClick={() => setAdt({ patient: p, action: "admit" })}>Admit</Button>
                      )}
                      {p.status === "admitted" && (
                        <>
                          {may("patient-care:transfer") && (
                            <Button onClick={() => setAdt({ patient: p, action: "transfer" })}>Transfer</Button>
                          )}
                          {may("patient-care:discharge") && (
                            <Button onClick={() => setAdt({ patient: p, action: "discharge" })}>Discharge</Button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showRegister && (
        <RegisterModal
          actor={user}
          onClose={() => setShowRegister(false)}
          onSaved={async () => {
            setShowRegister(false);
            await refresh();
          }}
        />
      )}

      {adt && (
        <AdtModal
          actor={user}
          patient={adt.patient}
          action={adt.action}
          onClose={() => setAdt(null)}
          onDone={async () => {
            setAdt(null);
            await refresh();
          }}
        />
      )}
    </div>
  );
}

function RegisterModal({ onClose, onSaved, actor }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    sex: "F",
    dob: "",
    phone: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setErr("First and last name are required.");
      return;
    }
    if (!form.dob) {
      setErr("Date of birth is required.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const created = await registerPatient(form);
      record({ actor, action: AUDIT_ACTIONS.CREATE, entity: "patient", entityId: created.hospitalNo,
               detail: `Registered ${created.lastName}, ${created.firstName}`, severity: "info" });
      await onSaved();
    } catch (e) {
      setErr(e.message || "Could not register patient.");
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Register patient"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={busy}>
            {busy ? "Saving…" : "Register"}
          </Button>
        </>
      }
    >
      {err && <div style={errBox}>{err}</div>}
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <Field label="First name">
            <input style={inputStyle} value={form.firstName} onChange={set("firstName")} />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Last name">
            <input style={inputStyle} value={form.lastName} onChange={set("lastName")} />
          </Field>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ width: 110 }}>
          <Field label="Sex">
            <select style={inputStyle} value={form.sex} onChange={set("sex")}>
              <option value="F">F</option>
              <option value="M">M</option>
            </select>
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Date of birth">
            <input type="date" style={inputStyle} value={form.dob} onChange={set("dob")} />
          </Field>
        </div>
      </div>
      <Field label="Phone">
        <input style={inputStyle} value={form.phone} onChange={set("phone")} placeholder="0803 …" />
      </Field>
    </Modal>
  );
}

function AdtModal({ patient, action, onClose, onDone, actor }) {
  const [ward, setWard] = useState(patient.ward || WARD_NAMES[0]);
  const [bed, setBed] = useState("");
  const [freeBeds, setFreeBeds] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // Load free beds whenever the ward changes (skip for discharge).
  useEffect(() => {
    if (action === "discharge") return;
    let alive = true;
    freeBedsForWard(ward)
      .then((beds) => {
        if (!alive) return;
        setFreeBeds(beds);
        setBed(beds[0] || "");
      })
      .catch((e) => console.error(e));
    return () => {
      alive = false;
    };
  }, [ward, action]);

  const titles = {
    admit: "Admit patient",
    transfer: "Transfer patient",
    discharge: "Discharge patient",
  };

  const run = async () => {
    setBusy(true);
    setErr("");
    try {
      if (action === "admit") {
        await admitPatient(patient.id, { ward, bed });
        record({ actor, action: AUDIT_ACTIONS.CLINICAL, entity: "admission", entityId: patient.hospitalNo,
                 detail: `Admitted ${patient.lastName} to ${ward} ${bed}`, severity: "info" });
      } else if (action === "transfer") {
        await transferPatient(patient.id, { ward, bed });
        record({ actor, action: AUDIT_ACTIONS.CLINICAL, entity: "transfer", entityId: patient.hospitalNo,
                 detail: `Transferred ${patient.lastName} to ${ward} ${bed}`, severity: "info" });
      } else if (action === "discharge") {
        await dischargePatient(patient.id);
        record({ actor, action: AUDIT_ACTIONS.CLINICAL, entity: "discharge", entityId: patient.hospitalNo,
                 detail: `Discharged ${patient.lastName}`, severity: "info" });
      }
      await onDone();
    } catch (e) {
      setErr(e.message || "Action failed.");
      setBusy(false);
    }
  };

  return (
    <Modal
      title={titles[action]}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={run}
            disabled={busy || (action !== "discharge" && !bed)}
          >
            {busy ? "Working…" : titles[action].split(" ")[0]}
          </Button>
        </>
      }
    >
      {err && <div style={errBox}>{err}</div>}
      <div style={{ marginBottom: 16, fontSize: 13 }}>
        <span style={{ color: "var(--muted)" }}>Patient: </span>
        <span style={{ fontWeight: 500, color: "var(--ink-strong)" }}>
          {patient.lastName}, {patient.firstName}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)" }}>
          {"  "}
          {patient.hospitalNo}
        </span>
      </div>

      {action === "discharge" ? (
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          This will discharge the patient from {patient.ward} ({patient.bed}) and free the bed.
        </p>
      ) : (
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <Field label="Ward">
              <select style={inputStyle} value={ward} onChange={(e) => setWard(e.target.value)}>
                {WARD_NAMES.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div style={{ width: 140 }}>
            <Field label="Bed">
              <select
                style={inputStyle}
                value={bed}
                onChange={(e) => setBed(e.target.value)}
                disabled={freeBeds.length === 0}
              >
                {freeBeds.length === 0 ? (
                  <option value="">No free beds</option>
                ) : (
                  freeBeds.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))
                )}
              </select>
            </Field>
          </div>
        </div>
      )}
    </Modal>
  );
}

const header = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  marginBottom: 18,
};
const toolbar = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 14,
  flexWrap: "wrap",
};
const chip = {
  font: "inherit",
  fontSize: 12,
  fontWeight: 500,
  padding: "6px 12px",
  borderRadius: 999,
  border: "1px solid var(--border-strong)",
  background: "var(--surface-2)",
  color: "var(--muted)",
  cursor: "pointer",
};
const chipActive = { background: "var(--ink-strong)", color: "#fff", borderColor: "var(--ink-strong)" };
const tableWrap = {
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  overflow: "auto",
};
const th = {
  textAlign: "left",
  fontSize: 11,
  fontWeight: 600,
  color: "var(--muted)",
  padding: "11px 14px",
  background: "var(--surface)",
};
const td = { padding: "11px 14px", fontSize: 13, verticalAlign: "middle" };
const emptyCell = { padding: "28px 14px", textAlign: "center", color: "var(--muted)", fontSize: 13 };
const errBox = {
  background: "#F7E9E9",
  color: "#7A2E2E",
  fontSize: 12,
  padding: "8px 11px",
  borderRadius: 8,
  marginBottom: 14,
};
