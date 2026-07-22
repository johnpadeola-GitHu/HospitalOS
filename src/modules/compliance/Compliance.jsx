import { useEffect, useState, useCallback } from "react";
import {
  LICENSE_BODIES, ACCREDITATION_TYPES, INSPECTION_OUTCOMES, OUTCOME_TONE,
  listLicenses, addLicense, renewLicense,
  listAccreditations, addAccreditation,
  listInspections, logInspection, complianceSummary,
} from "./complianceService";
import { listUsers } from "../system/systemService";
import { PageHeader, StatCard, Card, Pill, Button, Modal, Field, inputStyle, EmptyState } from "../../lib/ui";
import { useAuth } from "../../auth/AuthContext";

const STATUS_TONE = { current: "good", "expiring-soon": "warn", expired: "bad" };
const ROLE_OPTIONS = Object.keys(LICENSE_BODIES);

export default function Compliance() {
  const { user } = useAuth();
  const [tab, setTab] = useState("licenses");
  const [licenses, setLicenses] = useState([]);
  const [accreditations, setAccreditations] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddLicense, setShowAddLicense] = useState(false);
  const [renewFor, setRenewFor] = useState(null);
  const [showAddAcc, setShowAddAcc] = useState(false);
  const [showLogInsp, setShowLogInsp] = useState(false);
  const [err, setErr] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true); setErr("");
    try {
      const [l, a, i, s] = await Promise.all([listLicenses({}), listAccreditations(), listInspections(), complianceSummary()]);
      setLicenses(l); setAccreditations(a); setInspections(i); setSummary(s);
    } catch (e) { setErr(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <div>
      <PageHeader group="Compliance" title="Compliance &amp; accreditation" icon="ShieldCheck"
        subtitle="Practitioner licenses, facility accreditation, and regulatory inspections \u2014 the legal basis for operating"
        actions={
          tab === "licenses" ? <Button variant="primary" icon="Plus" onClick={() => setShowAddLicense(true)}>Add license</Button>
            : tab === "accreditation" ? <Button variant="primary" icon="Plus" onClick={() => setShowAddAcc(true)}>Add accreditation</Button>
              : <Button variant="primary" icon="Plus" onClick={() => setShowLogInsp(true)}>Log inspection</Button>
        } />

      {err && <div style={errBanner}>{err}</div>}

      {summary && (
        <div style={statGrid}>
          <StatCard label="Licenses tracked" value={summary.totalLicenses} />
          <StatCard label="Licenses expiring soon" value={summary.licensesExpiringSoon} tone={summary.licensesExpiringSoon ? "warn" : "default"} />
          <StatCard label="Licenses expired" value={summary.licensesExpired} tone={summary.licensesExpired ? "bad" : "default"} />
          <StatCard label="Accreditations expiring soon" value={summary.accreditationsExpiringSoon} tone={summary.accreditationsExpiringSoon ? "warn" : "default"} />
          <StatCard label="Accreditations expired" value={summary.accreditationsExpired} tone={summary.accreditationsExpired ? "bad" : "default"} />
        </div>
      )}

      <div style={tabs}>
        {[["licenses", "Practitioner licenses"], ["accreditation", "Facility accreditation"], ["inspections", "Inspections"]].map(([id, l]) => (
          <button key={id} onClick={() => setTab(id)} style={{ ...tabBtn, ...(tab === id ? tabActive : null) }}>{l}</button>
        ))}
      </div>

      {tab === "licenses" && (
        <Card title="Practitioner licenses" pad={false}>
          {loading ? <div style={{ padding: 20, color: "var(--muted)", fontSize: 13 }}>Loading\u2026</div> : licenses.length === 0 ? (
            <div style={{ padding: 22 }}><EmptyState icon="ShieldCheck" title="No licenses tracked" /></div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {licenses.map((l, i) => (
                <div key={l.id} style={{ ...row, borderTop: i ? "1px solid var(--border)" : "none" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink-strong)" }}>{l.staffName}</span>
                      <Pill tone="muted">{l.body.split(" (")[0]}</Pill>
                      <Pill tone={STATUS_TONE[l.status]}>
                        {l.status === "expired" ? `Expired ${Math.abs(l.daysLeft)}d ago` : l.status === "expiring-soon" ? `${l.daysLeft}d left` : "Current"}
                      </Pill>
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3 }}>
                      {l.licenseNumber} &middot; issued {l.issuedAt} &middot; expires {l.expiresAt}
                    </div>
                  </div>
                  <Button onClick={() => setRenewFor(l)}>Renew</Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === "accreditation" && (
        <Card title="Facility accreditation" pad={false}>
          {accreditations.length === 0 ? (
            <div style={{ padding: 22 }}><EmptyState icon="FileCheck" title="No accreditation records" /></div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {accreditations.map((a, i) => (
                <div key={a.id} style={{ ...row, borderTop: i ? "1px solid var(--border)" : "none" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink-strong)" }}>{a.type}</span>
                      <Pill tone={STATUS_TONE[a.status]}>
                        {a.status === "expired" ? `Expired ${Math.abs(a.daysLeft)}d ago` : a.status === "expiring-soon" ? `${a.daysLeft}d left` : "Current"}
                      </Pill>
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3 }}>
                      {a.certificateNumber} &middot; issued {a.issuedAt} &middot; expires {a.expiresAt}
                    </div>
                    {a.notes && <div style={{ fontSize: 12, color: "var(--ink)", marginTop: 4 }}>{a.notes}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === "inspections" && (
        <Card title="Regulatory inspections" pad={false}>
          {inspections.length === 0 ? (
            <div style={{ padding: 22 }}><EmptyState icon="ClipboardCheck" title="No inspections logged" /></div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {inspections.map((insp, i) => (
                <div key={insp.id} style={{ ...row, borderTop: i ? "1px solid var(--border)" : "none" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink-strong)" }}>{insp.body}</span>
                      <Pill tone={OUTCOME_TONE[insp.outcome]}>{insp.outcome}</Pill>
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3 }}>{insp.scheduledAt}</div>
                    {insp.notes && <div style={{ fontSize: 12, color: "var(--ink)", marginTop: 4 }}>{insp.notes}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {showAddLicense && <AddLicenseModal actor={user} tenantId={user.tenantId} onClose={() => setShowAddLicense(false)} onDone={async () => { setShowAddLicense(false); await refresh(); }} />}
      {renewFor && <RenewModal license={renewFor} actor={user} onClose={() => setRenewFor(null)} onDone={async () => { setRenewFor(null); await refresh(); }} />}
      {showAddAcc && <AddAccreditationModal actor={user} onClose={() => setShowAddAcc(false)} onDone={async () => { setShowAddAcc(false); await refresh(); }} />}
      {showLogInsp && <LogInspectionModal actor={user} onClose={() => setShowLogInsp(false)} onDone={async () => { setShowLogInsp(false); await refresh(); }} />}
    </div>
  );
}

function AddLicenseModal({ actor, tenantId, onClose, onDone }) {
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState({ staffId: "", staffName: "", role: "", licenseNumber: "", issuedAt: "", expiresAt: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    listUsers({ tenantId }).then((all) => {
      const licensable = all.filter((u) => ROLE_OPTIONS.includes(u.role));
      setStaff(licensable);
    }).catch((e) => console.error(e));
  }, [tenantId]);

  const pickStaff = (e) => {
    const person = staff.find((s) => s.id === e.target.value);
    setForm((f) => ({ ...f, staffId: e.target.value, staffName: person?.name || "", role: person?.role || "" }));
  };
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true); setErr("");
    try { await addLicense({ ...form, actor }); await onDone(); } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title="Add practitioner license" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy || !form.staffId}>{busy ? "Saving\u2026" : "Add"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="Staff member">
        <select style={inputStyle} value={form.staffId} onChange={pickStaff}>
          <option value="">Choose a staff account\u2026</option>
          {staff.map((s) => <option key={s.id} value={s.id}>{s.name} \u2014 {s.role}</option>)}
        </select>
      </Field>
      {staff.length === 0 && (
        <div style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 12, lineHeight: 1.5 }}>
          No staff accounts with a licensable role (doctor, nurse, lab scientist, radiographer, pharmacist)
          exist yet \u2014 add one in Administration \u2192 Users &amp; roles first.
        </div>
      )}
      {form.role && (
        <div style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 12 }}>
          Licensing body: <b>{LICENSE_BODIES[form.role]}</b>
        </div>
      )}
      <Field label="License number"><input style={inputStyle} value={form.licenseNumber} onChange={set("licenseNumber")} /></Field>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><Field label="Issued"><input type="date" style={inputStyle} value={form.issuedAt} onChange={set("issuedAt")} /></Field></div>
        <div style={{ flex: 1 }}><Field label="Expires"><input type="date" style={inputStyle} value={form.expiresAt} onChange={set("expiresAt")} /></Field></div>
      </div>
    </Modal>
  );
}

function RenewModal({ license, actor, onClose, onDone }) {
  const [licenseNumber, setLicenseNumber] = useState(license.licenseNumber);
  const [expiresAt, setExpiresAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setBusy(true); setErr("");
    try { await renewLicense(license.id, { licenseNumber, expiresAt, actor }); await onDone(); } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title={`Renew license \u2014 ${license.staffName}`} onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Saving\u2026" : "Renew"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="License number"><input style={inputStyle} value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} /></Field>
      <Field label="New expiry date"><input type="date" style={inputStyle} value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} /></Field>
    </Modal>
  );
}

function AddAccreditationModal({ actor, onClose, onDone }) {
  const [form, setForm] = useState({ type: ACCREDITATION_TYPES[0], certificateNumber: "", issuedAt: "", expiresAt: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true); setErr("");
    try { await addAccreditation({ ...form, actor }); await onDone(); } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title="Add facility accreditation" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Saving\u2026" : "Add"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="Accreditation type">
        <select style={inputStyle} value={form.type} onChange={set("type")}>
          {ACCREDITATION_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
      </Field>
      <Field label="Certificate number"><input style={inputStyle} value={form.certificateNumber} onChange={set("certificateNumber")} /></Field>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><Field label="Issued"><input type="date" style={inputStyle} value={form.issuedAt} onChange={set("issuedAt")} /></Field></div>
        <div style={{ flex: 1 }}><Field label="Expires"><input type="date" style={inputStyle} value={form.expiresAt} onChange={set("expiresAt")} /></Field></div>
      </div>
      <Field label="Notes"><textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical", fontFamily: "var(--font-sans)" }} value={form.notes} onChange={set("notes")} /></Field>
    </Modal>
  );
}

function LogInspectionModal({ actor, onClose, onDone }) {
  const [form, setForm] = useState({ body: "", scheduledAt: "", outcome: INSPECTION_OUTCOMES[0], notes: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true); setErr("");
    try { await logInspection({ ...form, actor }); await onDone(); } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title="Log a regulatory inspection" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Saving\u2026" : "Log"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="Inspecting body"><input style={inputStyle} value={form.body} onChange={set("body")} placeholder="e.g. Oyo State Ministry of Health" /></Field>
      <Field label="Date"><input type="date" style={inputStyle} value={form.scheduledAt} onChange={set("scheduledAt")} /></Field>
      <Field label="Outcome"><select style={inputStyle} value={form.outcome} onChange={set("outcome")}>{INSPECTION_OUTCOMES.map((o) => <option key={o}>{o}</option>)}</select></Field>
      <Field label="Notes"><textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical", fontFamily: "var(--font-sans)" }} value={form.notes} onChange={set("notes")} /></Field>
    </Modal>
  );
}

const statGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 16 };
const tabs = { display: "flex", gap: 6, marginBottom: 16 };
const tabBtn = { font: "inherit", fontSize: 12.5, fontWeight: 600, padding: "6px 13px", borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--surface-2)", color: "var(--muted)", cursor: "pointer" };
const tabActive = { background: "var(--charcoal)", color: "#fff", borderColor: "var(--charcoal)" };
const row = { display: "flex", gap: 14, padding: "13px 16px", alignItems: "center" };
const errBanner = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 13, padding: "10px 14px", borderRadius: 10, marginBottom: 14 };
const errBox = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12, padding: "8px 11px", borderRadius: 8, marginBottom: 14 };
