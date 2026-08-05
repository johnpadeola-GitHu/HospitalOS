import { useEffect, useState, useCallback, useRef } from "react";
import * as Icons from "lucide-react";
import { POLICY_CATEGORIES, REVIEW_CYCLE_MONTHS, listPolicies, addPolicy, markReviewed, policiesSummary } from "./policiesService";
import { PageHeader, StatCard, Card, Pill, Button, Modal, Field, inputStyle, EmptyState } from "../../lib/ui";
import { useAuth } from "../../auth/AuthContext";

const STATUS_TONE = { current: "good", "due-soon": "warn", overdue: "bad" };
const STATUS_LABEL = { current: "Current", "due-soon": "Review due soon", overdue: "Review overdue" };

export default function Policies() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState([]);
  const [summary, setSummary] = useState(null);
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [reviewFor, setReviewFor] = useState(null);
  const [err, setErr] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true); setErr("");
    try {
      const [p, s] = await Promise.all([listPolicies({ category }), policiesSummary()]);
      setPolicies(p); setSummary(s);
    } catch (e) { setErr(e.message); }
    setLoading(false);
  }, [category]);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <div>
      <PageHeader group="Compliance" title="Policies &amp; SOPs" icon="FileText"
        subtitle="Policy documents with a real review cycle — an out-of-date policy is its own compliance risk"
        actions={<Button variant="primary" icon="Plus" onClick={() => setShowAdd(true)}>Add policy</Button>} />

      {err && <div style={errBanner}>{err}</div>}

      {summary && (
        <div style={statGrid}>
          <StatCard label="Policies tracked" value={summary.total} />
          <StatCard label="Review due soon" value={summary.dueSoon} tone={summary.dueSoon ? "warn" : "default"} />
          <StatCard label="Review overdue" value={summary.overdue} tone={summary.overdue ? "bad" : "default"} />
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {["all", ...POLICY_CATEGORIES].map((c) => (
          <button key={c} onClick={() => setCategory(c)} style={{ ...chip, ...(category === c ? chipActive : null) }}>{c}</button>
        ))}
      </div>

      <Card title="Policies" pad={false}>
        {loading ? <div style={{ padding: 20, color: "var(--muted)", fontSize: 13 }}>Loading…</div> : policies.length === 0 ? (
          <div style={{ padding: 22 }}><EmptyState icon="FileText" title="No policies match" /></div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {policies.map((p, i) => (
              <div key={p.id} style={{ ...row, borderTop: i ? "1px solid var(--border)" : "none" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink-strong)" }}>{p.title}</span>
                    <Pill tone="muted">{p.category}</Pill>
                    <Pill tone={STATUS_TONE[p.status]}>{STATUS_LABEL[p.status]}</Pill>
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3 }}>
                    v{p.version} &middot; owner {p.owner} &middot; last reviewed {p.lastReviewedAt} &middot; next review {p.nextReview}
                  </div>
                  {p.fileUrl && (
                    <a href={p.fileUrl} download={p.fileName} style={fileLink}>
                      <Icons.FileDown size={12} /> {p.fileName}
                    </a>
                  )}
                </div>
                <Button onClick={() => setReviewFor(p)}>Mark reviewed</Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showAdd && <AddPolicyModal actor={user} onClose={() => setShowAdd(false)} onDone={async () => { setShowAdd(false); await refresh(); }} />}
      {reviewFor && <ReviewModal policy={reviewFor} actor={user} onClose={() => setReviewFor(null)} onDone={async () => { setReviewFor(null); await refresh(); }} />}
    </div>
  );
}

function AddPolicyModal({ actor, onClose, onDone }) {
  const [form, setForm] = useState({ title: "", category: POLICY_CATEGORIES[0], version: "1.0", owner: "", approvedBy: "", reviewCycleMonths: 12 });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true); setErr("");
    try { await addPolicy({ ...form, file, actor }); await onDone(); } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title="Add a policy" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Saving\u2026" : "Add"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="Policy title"><input style={inputStyle} value={form.title} onChange={set("title")} /></Field>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><Field label="Category"><select style={inputStyle} value={form.category} onChange={set("category")}>{POLICY_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field></div>
        <div style={{ width: 100 }}><Field label="Version"><input style={inputStyle} value={form.version} onChange={set("version")} /></Field></div>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><Field label="Owner"><input style={inputStyle} value={form.owner} onChange={set("owner")} /></Field></div>
        <div style={{ flex: 1 }}><Field label="Approved by"><input style={inputStyle} value={form.approvedBy} onChange={set("approvedBy")} /></Field></div>
      </div>
      <Field label="Review cycle">
        <select style={inputStyle} value={form.reviewCycleMonths} onChange={set("reviewCycleMonths")}>
          {REVIEW_CYCLE_MONTHS.map((m) => <option key={m} value={m}>Every {m} months</option>)}
        </select>
      </Field>
      <Field label="Document (optional)">
        <input ref={fileRef} type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} style={{ fontSize: 12.5 }} />
      </Field>
    </Modal>
  );
}

function ReviewModal({ policy, actor, onClose, onDone }) {
  const [version, setVersion] = useState(policy.version);
  const [approvedBy, setApprovedBy] = useState(policy.approvedBy);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setBusy(true);
    setErr("");
    try {
      await markReviewed(policy.id, { version, approvedBy, actor });
      await onDone();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <Modal title={`Mark reviewed \u2014 ${policy.title}`} onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Saving\u2026" : "Confirm review"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>
        This resets the review clock to today, using this policy's existing review cycle.
      </p>
      <Field label="Version (bump if the content changed)"><input style={inputStyle} value={version} onChange={(e) => setVersion(e.target.value)} /></Field>
      <Field label="Approved by"><input style={inputStyle} value={approvedBy} onChange={(e) => setApprovedBy(e.target.value)} /></Field>
    </Modal>
  );
}

const statGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 16 };
const chip = { font: "inherit", fontSize: 12, fontWeight: 500, padding: "6px 12px", borderRadius: 999, border: "1px solid var(--border-strong)", background: "var(--surface-2)", color: "var(--muted)", cursor: "pointer" };
const chipActive = { background: "var(--charcoal)", color: "#fff", borderColor: "var(--charcoal)" };
const row = { display: "flex", gap: 14, padding: "13px 16px", alignItems: "center" };
const fileLink = { display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "var(--accent)", marginTop: 5 };
const errBanner = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 13, padding: "10px 14px", borderRadius: 0, marginBottom: 14 };
const errBox = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12, padding: "8px 11px", borderRadius: 0, marginBottom: 14 };
