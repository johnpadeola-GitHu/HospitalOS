import { useEffect, useState, useCallback } from "react";
import * as Icons from "lucide-react";
import { VIP_TIERS, listProfiles, createProfile, updateProfile, closeProfile, vipSummary } from "./vipServicesService";
import { PageHeader, StatCard, Card, Pill, Button, Modal, Field, inputStyle, EmptyState } from "../../lib/ui";
import { useAuth } from "../../auth/AuthContext";
import PatientPicker from "../patients/PatientPicker";

export default function VipServices() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editFor, setEditFor] = useState(null);
  const [err, setErr] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([listProfiles({}), vipSummary()]);
      setProfiles(p); setSummary(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const discharge = async (id) => {
    setErr("");
    try { await closeProfile(id, user); await refresh(); } catch (e) { setErr(e.message); }
  };

  return (
    <div>
      <PageHeader group="Patient care" title="VIP services" icon="Crown"
        subtitle="What actually differentiates VIP care beyond the room — consultant of choice, concierge, and privacy"
        actions={<Button variant="primary" icon="Plus" onClick={() => setShowCreate(true)}>Create service profile</Button>} />

      {err && <div style={errBanner}>{err}</div>}

      <div style={note}>
        <Icons.Info size={14} style={{ color: "var(--muted)", flexShrink: 0, marginTop: 1 }} />
        <span>
          Private Suite, VIP Suite, and Executive Suite are accommodation tiers set in
          Administration \u2192 Pricing \u2014 that is what a patient is billed. This screen is the
          service that comes with the room: a named consultant, a concierge contact, and a
          privacy flag that actually changes how the patient is handled, not just what they pay.
        </span>
      </div>

      {summary && (
        <div style={statGrid}>
          <StatCard label="Active VIP patients" value={summary.active} />
          <StatCard label="Privacy flagged" value={summary.withPrivacyFlag} tone={summary.withPrivacyFlag ? "accent" : "default"} />
          {summary.byTier.map((t) => <StatCard key={t.tier} label={t.tier} value={t.count} />)}
        </div>
      )}

      <Card title="Active VIP service profiles" pad={false}>
        {loading ? <div style={{ padding: 20, color: "var(--muted)", fontSize: 13 }}>Loading…</div> : profiles.length === 0 ? (
          <div style={{ padding: 22 }}><EmptyState icon="Crown" title="No active VIP profiles" /></div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {profiles.map((p, i) => (
              <div key={p.id} style={{ ...row, borderTop: i ? "1px solid var(--border)" : "none" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink-strong)" }}>{p.patientName}</span>
                    <Pill tone="accent">{p.tier}</Pill>
                    {p.privacyFlag && <Pill tone="bad">Privacy flagged</Pill>}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3 }}>
                    {p.bed} &middot; Consultant of choice: {p.consultantOfChoice} &middot; {p.conciergeContact}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>Diet: {p.dietaryPreference}</div>
                  {p.notes && <div style={{ fontSize: 12, color: "var(--ink)", marginTop: 4 }}>{p.notes}</div>}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <Button onClick={() => setEditFor(p)}>Edit</Button>
                  <Button onClick={() => discharge(p.id)}>Discharge</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showCreate && <CreateModal actor={user} onClose={() => setShowCreate(false)} onDone={async () => { setShowCreate(false); await refresh(); }} />}
      {editFor && <EditModal profile={editFor} actor={user} onClose={() => setEditFor(null)} onDone={async () => { setEditFor(null); await refresh(); }} />}
    </div>
  );
}

function CreateModal({ actor, onClose, onDone }) {
  const [form, setForm] = useState({ patientId: null, patientName: "", hospitalNo: "", tier: VIP_TIERS[0], bed: "", consultantOfChoice: "", conciergeContact: "", dietaryPreference: "", privacyFlag: false, notes: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true); setErr("");
    try { await createProfile({ ...form, actor }); await onDone(); } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title="Create VIP service profile" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Creating…" : "Create"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="Patient"><PatientPicker value={form} onChange={(p) => setForm((f) => ({ ...f, ...p }))} /></Field>
        <div style={{ display: "flex", gap: 12 }}>
        <div style={{ width: 100 }}><Field label="Bed"><input style={inputStyle} value={form.bed} onChange={set("bed")} /></Field></div>
        </div>
      <Field label="Accommodation tier"><select style={inputStyle} value={form.tier} onChange={set("tier")}>{VIP_TIERS.map((t) => <option key={t}>{t}</option>)}</select></Field>
      <Field label="Consultant of choice"><input style={inputStyle} value={form.consultantOfChoice} onChange={set("consultantOfChoice")} /></Field>
      <Field label="Concierge contact"><input style={inputStyle} value={form.conciergeContact} onChange={set("conciergeContact")} /></Field>
      <Field label="Dietary preference"><input style={inputStyle} value={form.dietaryPreference} onChange={set("dietaryPreference")} /></Field>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink)", marginBottom: 12, cursor: "pointer" }}>
        <input type="checkbox" checked={form.privacyFlag} onChange={(e) => setForm((f) => ({ ...f, privacyFlag: e.target.checked }))} />
        Flag for strict privacy (no visitor list disclosure, no media/press access)
      </label>
      <Field label="Notes"><textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical", fontFamily: "var(--font-sans)" }} value={form.notes} onChange={set("notes")} /></Field>
    </Modal>
  );
}

function EditModal({ profile, actor, onClose, onDone }) {
  const [consultantOfChoice, setConsultant] = useState(profile.consultantOfChoice);
  const [conciergeContact, setConcierge] = useState(profile.conciergeContact);
  const [dietaryPreference, setDiet] = useState(profile.dietaryPreference);
  const [notes, setNotes] = useState(profile.notes);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setBusy(true);
    setErr("");
    try {
      await updateProfile(profile.id, { consultantOfChoice, conciergeContact, dietaryPreference, notes }, actor);
      await onDone();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <Modal title={`Edit — ${profile.patientName}`} onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="Consultant of choice"><input style={inputStyle} value={consultantOfChoice} onChange={(e) => setConsultant(e.target.value)} /></Field>
      <Field label="Concierge contact"><input style={inputStyle} value={conciergeContact} onChange={(e) => setConcierge(e.target.value)} /></Field>
      <Field label="Dietary preference"><input style={inputStyle} value={dietaryPreference} onChange={(e) => setDiet(e.target.value)} /></Field>
      <Field label="Notes"><textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical", fontFamily: "var(--font-sans)" }} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
    </Modal>
  );
}

const note = { display: "flex", gap: 8, background: "var(--accent-soft)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 13px", fontSize: 12, color: "var(--muted)", marginBottom: 16, lineHeight: 1.55 };
const statGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 16 };
const row = { display: "flex", gap: 14, padding: "13px 16px", alignItems: "center" };
const errBanner = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 13, padding: "10px 14px", borderRadius: 10, marginBottom: 14 };
const errBox = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12, padding: "8px 11px", borderRadius: 8, marginBottom: 14 };
