import { useEffect, useState } from "react";
import { PageHeader, Card, Button, Modal, Field, inputStyle, Pill, EmptyState } from "../../lib/ui";
import { useAuth } from "../../auth/AuthContext";
import {
  listRules, createRule, updateRule, getEvaluationLog,
  CATEGORIES, TRIGGER_EVENTS, FACTS_BY_TRIGGER,
} from "./clinicalRulesService";

const OPS = ["eq", "neq", "gt", "gte", "lt", "lte", "in", "not_in", "exists", "not_exists"];
const SEVERITY_TONE = { block: "bad", warning: "warn", advisory: "info" };

function emptyLeaf() { return { fact: "", op: "eq", value: "" }; }

export default function ClinicalRules() {
  const { may } = useAuth();
  const canManage = may("system:configure");
  const canViewLog = may("system:view-audit");

  const [tab, setTab] = useState("rules");

  if (!canManage && !canViewLog) {
    return (
      <div>
        <PageHeader group="Administration" title="Clinical decision rules" icon="ShieldAlert" />
        <EmptyState icon="Lock" title="No access" hint="Your role doesn't have permission to view clinical rules." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        group="Administration"
        title="Clinical decision rules"
        icon="ShieldAlert"
        subtitle="Rules that block, warn, or advise across prescribing, theatre scheduling, and lab ordering."
      />
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {canManage && (
          <button style={tabBtn(tab === "rules")} onClick={() => setTab("rules")}>Rules</button>
        )}
        {canViewLog && (
          <button style={tabBtn(tab === "log")} onClick={() => setTab("log")}>Evaluation log</button>
        )}
      </div>
      {tab === "rules" && canManage ? <RulesTab /> : <LogTab />}
    </div>
  );
}

function tabBtn(active) {
  return {
    font: "inherit", fontSize: 12.5, fontWeight: 600, padding: "7px 13px",
    borderRadius: 8, cursor: "pointer", border: "1px solid var(--border-strong)",
    background: active ? "var(--accent)" : "var(--surface-2)",
    color: active ? "#fff" : "var(--ink)",
  };
}

function RulesTab() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [editing, setEditing] = useState(null); // rule object, or {} for new, or null

  async function refresh() {
    setLoading(true);
    try {
      setRules(await listRules({ category }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, [category]);

  return (
    <Card
      title="Rules"
      action={
        <div style={{ display: "flex", gap: 8 }}>
          <select style={{ ...inputStyle, width: "auto" }} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <Button variant="primary" icon="Plus" onClick={() => setEditing({})}>New rule</Button>
        </div>
      }
      pad={false}
    >
      {loading ? (
        <div style={{ padding: 20, color: "var(--muted)", fontSize: 13 }}>Loading…</div>
      ) : rules.length === 0 ? (
        <div style={{ padding: 20 }}>
          <EmptyState icon="ShieldAlert" title="No rules yet" hint="Create the first rule to start gating a workflow." />
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--muted)", fontSize: 11 }}>
              <th style={th}>Rule</th>
              <th style={th}>Category</th>
              <th style={th}>Severity</th>
              <th style={th}>Trigger</th>
              <th style={th}>Version</th>
              <th style={th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.id} style={{ borderTop: "1px solid var(--border)", cursor: "pointer" }} onClick={() => setEditing(r)}>
                <td style={td}>{r.rule_name}</td>
                <td style={td}>{r.category}</td>
                <td style={td}><Pill tone={SEVERITY_TONE[r.severity]}>{r.severity}</Pill></td>
                <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 11.5 }}>{r.trigger_event}</td>
                <td style={td}>v{r.version}</td>
                <td style={td}>{r.enabled ? <Pill tone="good">Enabled</Pill> : <Pill tone="muted">Disabled</Pill>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {editing !== null && (
        <RuleEditorModal
          rule={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refresh(); }}
        />
      )}
    </Card>
  );
}

const th = { padding: "9px 16px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" };
const td = { padding: "9px 16px" };

function RuleEditorModal({ rule, onClose, onSaved }) {
  const isNew = !rule.id;
  const [form, setForm] = useState({
    ruleName: rule.rule_name || "", category: rule.category || "medication",
    description: rule.description || "", severity: rule.severity || "warning",
    triggerEvent: rule.trigger_event || "medication.prescribe", enabled: rule.enabled === undefined ? true : !!rule.enabled,
    effectiveDate: rule.effective_date || "", reviewDate: rule.review_date || "",
    clinicalReference: rule.clinical_reference || "",
    message: rule.action_json ? JSON.parse(rule.action_json)?.message || "" : "",
    requiredPermissionToOverride: rule.action_json ? JSON.parse(rule.action_json)?.requiredPermissionToOverride || "" : "",
  });
  const initialCond = rule.condition_json ? JSON.parse(rule.condition_json) : { all: [emptyLeaf()] };
  const initialKey = initialCond.all ? "all" : initialCond.any ? "any" : "none";
  const [combinator, setCombinator] = useState(initialKey);
  const [leaves, setLeaves] = useState(initialCond[initialKey] || [emptyLeaf()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function updateLeaf(idx, patch) {
    setLeaves((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ruleName: form.ruleName, category: form.category, description: form.description,
        severity: form.severity, triggerEvent: form.triggerEvent,
        condition: { [combinator]: leaves },
        action: { message: form.message, requiredPermissionToOverride: form.requiredPermissionToOverride || null },
        enabled: form.enabled, effectiveDate: form.effectiveDate || null, reviewDate: form.reviewDate || null,
        clinicalReference: form.clinicalReference,
      };
      if (isNew) await createRule(payload); else await updateRule(rule.id, payload);
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const facts = FACTS_BY_TRIGGER[form.triggerEvent] || [];
  const triggerMeta = TRIGGER_EVENTS.find((t) => t.value === form.triggerEvent);

  return (
    <Modal
      title={isNew ? "New rule" : `Edit rule — v${rule.version}`}
      onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save rule"}</Button>
      </>}
    >
      {error && <div style={{ color: "var(--bad)", fontSize: 12.5, marginBottom: 10 }}>{error}</div>}

      <Field label="Rule name">
        <input style={inputStyle} value={form.ruleName} onChange={(e) => setForm({ ...form, ruleName: e.target.value })} />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Category">
          <select style={inputStyle} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Severity">
          <select style={inputStyle} value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
            <option value="block">Block</option>
            <option value="warning">Warning</option>
            <option value="advisory">Advisory</option>
          </select>
        </Field>
      </div>
      <Field label="Trigger event">
        <select style={inputStyle} value={form.triggerEvent} onChange={(e) => setForm({ ...form, triggerEvent: e.target.value })}>
          {TRIGGER_EVENTS.map((t) => <option key={t.value} value={t.value}>{t.label}{t.wired ? "" : " (not yet wired)"}</option>)}
        </select>
        {triggerMeta && !triggerMeta.wired && (
          <div style={{ fontSize: 11.5, color: "var(--warn)", marginTop: 4 }}>
            This trigger isn't called from a live backend route yet — this rule will sit inactive until it is.
          </div>
        )}
      </Field>
      <Field label="Description">
        <textarea style={{ ...inputStyle, minHeight: 56 }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </Field>
      <Field label="Clinical reference">
        <input style={inputStyle} value={form.clinicalReference} onChange={(e) => setForm({ ...form, clinicalReference: e.target.value })} />
      </Field>

      <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>Condition</div>
      <div style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 12, marginBottom: 14 }}>
        <select style={{ ...inputStyle, width: 180, marginBottom: 10 }} value={combinator} onChange={(e) => setCombinator(e.target.value)}>
          <option value="all">All of (AND)</option>
          <option value="any">Any of (OR)</option>
          <option value="none">None of (NOT)</option>
        </select>
        {leaves.map((leaf, idx) => (
          <div key={idx} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
            <select style={inputStyle} value={leaf.fact} onChange={(e) => updateLeaf(idx, { fact: e.target.value })}>
              <option value="">Select fact…</option>
              {facts.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
            <select style={{ ...inputStyle, width: 110 }} value={leaf.op} onChange={(e) => updateLeaf(idx, { op: e.target.value })}>
              {OPS.map((op) => <option key={op} value={op}>{op}</option>)}
            </select>
            {!["exists", "not_exists"].includes(leaf.op) && (
              <input style={inputStyle} placeholder="value (e.g. M)" value={leaf.value} onChange={(e) => updateLeaf(idx, { value: e.target.value })} />
            )}
            <Button variant="ghost" icon="X" onClick={() => setLeaves(leaves.filter((_, i) => i !== idx))} />
          </div>
        ))}
        <Button variant="secondary" icon="Plus" onClick={() => setLeaves([...leaves, emptyLeaf()])}>Add condition</Button>
      </div>

      <Field label="Message shown to the clinician">
        <textarea style={{ ...inputStyle, minHeight: 44 }} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
      </Field>
      {form.severity === "block" && (
        <Field label="Minimum role to override (e.g. doctor — leave blank for any signed-in user)">
          <input style={inputStyle} value={form.requiredPermissionToOverride} onChange={(e) => setForm({ ...form, requiredPermissionToOverride: e.target.value })} />
        </Field>
      )}
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, marginTop: 4 }}>
        <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />
        Enabled
      </label>
    </Modal>
  );
}

function LogTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [patientId, setPatientId] = useState("");

  async function refresh() {
    setLoading(true);
    try {
      setRows(await getEvaluationLog({ patientId }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  return (
    <Card
      title="Evaluation & override log"
      action={
        <div style={{ display: "flex", gap: 8 }}>
          <input style={{ ...inputStyle, width: 180 }} placeholder="Patient ID" value={patientId} onChange={(e) => setPatientId(e.target.value)} />
          <Button onClick={refresh}>Filter</Button>
        </div>
      }
      pad={false}
    >
      {loading ? (
        <div style={{ padding: 20, color: "var(--muted)", fontSize: 13 }}>Loading…</div>
      ) : rows.length === 0 ? (
        <div style={{ padding: 20 }}>
          <EmptyState icon="ShieldAlert" title="No evaluations in range" />
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--muted)", fontSize: 11 }}>
              <th style={th}>When</th>
              <th style={th}>Result</th>
              <th style={th}>Patient</th>
              <th style={th}>Overridden by</th>
              <th style={th}>Reason</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ borderTop: "1px solid var(--border)" }}>
                <td style={td}>{new Date(r.created_at).toLocaleString()}</td>
                <td style={td}><Pill tone={SEVERITY_TONE[r.result]}>{r.result}</Pill></td>
                <td style={td}>{r.patient_id || "—"}</td>
                <td style={td}>{r.overridden_by || "—"}</td>
                <td style={td}>{r.override_reason || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
