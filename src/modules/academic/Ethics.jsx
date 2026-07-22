import { useEffect, useState, useCallback } from "react";
import { ETHICS_STATUSES, ETHICS_TINT, STUDY_TYPES, listEthics, submitEthics, decideEthics } from "./academicService";
import { PageHeader, Card, Pill, Button, Modal, Field, inputStyle, EmptyState } from "../../lib/ui";
import { useAuth } from "../../auth/AuthContext";

export default function Ethics() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showSubmit, setShowSubmit] = useState(false);
  const [decideFor, setDecideFor] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [err, setErr] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await listEthics({ status }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <div>
      <PageHeader group="Academic" title="Ethics committee" icon="Scale"
        subtitle="Institutional Review Board — submission, review, and decision"
        actions={<Button variant="primary" icon="Plus" onClick={() => setShowSubmit(true)}>Submit for review</Button>} />

      {err && <div style={errBanner}>{err}</div>}

      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {["all", ...ETHICS_STATUSES].map((s) => (
          <button key={s} onClick={() => setStatus(s)} style={{ ...chip, ...(status === s ? chipActive : null) }}>
            {s === "all" ? "All" : ETHICS_TINT[s]?.label || s}
          </button>
        ))}
      </div>

      <Card title="Submissions" pad={false}>
        {loading ? <div style={{ padding: 20, color: "var(--muted)", fontSize: 13 }}>Loading…</div> : rows.length === 0 ? (
          <div style={{ padding: 22 }}><EmptyState icon="Scale" title="No submissions match" /></div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {rows.map((e, idx) => {
              const t = ETHICS_TINT[e.status];
              const open = expanded === e.id;
              const canDecide = e.status !== "approved" && e.status !== "rejected";
              return (
                <div key={e.id} style={{ borderTop: idx ? "1px solid var(--border)" : "none" }}>
                  <button style={row} onClick={() => setExpanded(open ? null : e.id)}>
                    <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--muted)" }}>{e.ref}</span>
                        <span style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink-strong)" }}>{e.title}</span>
                        <Pill tone="muted">{e.type}</Pill>
                      </div>
                      <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3 }}>
                        PI: {e.pi} · {e.dept} · submitted {e.submitted} · {e.comments.length} comment{e.comments.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <span style={{ background: t.bg, color: t.fg, fontSize: 11, fontWeight: 500, padding: "2px 9px", borderRadius: 999, flexShrink: 0 }}>{t.label}</span>
                  </button>

                  {open && (
                    <div style={detail}>
                      {e.comments.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          {e.comments.map((c, i) => (
                            <div key={i} style={commentRow}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-strong)" }}>{c.by} <span style={{ fontWeight: 400, color: "var(--muted)" }}>· {c.at}</span></div>
                              <div style={{ fontSize: 12.5, color: "var(--ink)", marginTop: 2 }}>{c.note}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      {canDecide && (
                        <div style={{ display: "flex", gap: 6 }}>
                          {e.status === "submitted" && <Button onClick={() => setDecideFor({ e, status: "under-review" })}>Begin review</Button>}
                          {e.status === "under-review" && <Button onClick={() => setDecideFor({ e, status: "revisions" })}>Request revisions</Button>}
                          {(e.status === "under-review" || e.status === "revisions") && (
                            <>
                              <Button variant="primary" onClick={() => setDecideFor({ e, status: "approved" })}>Approve</Button>
                              <Button onClick={() => setDecideFor({ e, status: "rejected" })}>Reject</Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {showSubmit && (
        <SubmitModal actor={user} onClose={() => setShowSubmit(false)} onDone={async () => { setShowSubmit(false); await refresh(); }} />
      )}
      {decideFor && (
        <DecideModal item={decideFor} actor={user} onClose={() => setDecideFor(null)}
          onDone={async () => { setDecideFor(null); await refresh(); }} onError={setErr} />
      )}
    </div>
  );
}

function SubmitModal({ actor, onClose, onDone }) {
  const [form, setForm] = useState({ title: "", type: STUDY_TYPES[0], pi: "", dept: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true); setErr("");
    try { await submitEthics({ ...form, actor }); await onDone(); } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title="Submit for ethics review" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Submitting…" : "Submit"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <Field label="Study title"><input style={inputStyle} value={form.title} onChange={set("title")} /></Field>
      <Field label="Study type"><select style={inputStyle} value={form.type} onChange={set("type")}>{STUDY_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><Field label="Principal investigator"><input style={inputStyle} value={form.pi} onChange={set("pi")} /></Field></div>
        <div style={{ flex: 1 }}><Field label="Department"><input style={inputStyle} value={form.dept} onChange={set("dept")} /></Field></div>
      </div>
    </Modal>
  );
}

function DecideModal({ item, actor, onClose, onDone, onError }) {
  const { e, status } = item;
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const needsComment = ["approved", "rejected", "revisions"].includes(status);
  const titleMap = { "under-review": "Begin review", revisions: "Request revisions", approved: "Approve submission", rejected: "Reject submission" };

  const submit = async () => {
    setBusy(true); setErr("");
    try { await decideEthics(e.id, { status, comment, actor }); await onDone(); }
    catch (ex) { setErr(ex.message); setBusy(false); onError?.(""); }
  };

  return (
    <Modal title={`${titleMap[status]} — ${e.ref}`} onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy || (needsComment && !comment.trim())}>{busy ? "Saving…" : titleMap[status]}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>{e.title} · {e.pi}</div>
      {needsComment ? (
        <Field label="Reviewer comment (required)">
          <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical", fontFamily: "var(--font-sans)" }} value={comment} onChange={(ev) => setComment(ev.target.value)} placeholder="Reasoning for this decision…" />
        </Field>
      ) : (
        <div style={{ fontSize: 13, color: "var(--muted)" }}>Moves this submission into active committee review.</div>
      )}
    </Modal>
  );
}

const chip = { font: "inherit", fontSize: 12, fontWeight: 500, padding: "6px 12px", borderRadius: 999, border: "1px solid var(--border-strong)", background: "var(--surface-2)", color: "var(--muted)", cursor: "pointer" };
const chipActive = { background: "var(--charcoal)", color: "#fff", borderColor: "var(--charcoal)" };
const row = { width: "100%", display: "flex", gap: 12, alignItems: "center", padding: "13px 16px", background: "none", border: "none", cursor: "pointer", font: "inherit" };
const detail = { padding: "0 16px 14px 16px" };
const commentRow = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 11px", marginBottom: 6 };
const errBanner = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 13, padding: "10px 14px", borderRadius: 10, marginBottom: 14 };
const errBox = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12, padding: "8px 11px", borderRadius: 8, marginBottom: 14 };
