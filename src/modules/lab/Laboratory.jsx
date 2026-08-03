import { useEffect, useState, useCallback } from "react";
import {
  TEST_CATALOGUE,
  STATUS_LABELS,
  listOrders,
  createOrder,
  collectSample,
  enterResults,
  verifyOrder,
  getTest,
  flagValue,
  orderHasCritical,
} from "./labService";
import { listPatients } from "../patients/patientService";
import { Button, Modal, Field, inputStyle, PageHeader } from "../../lib/ui";
import { useAuth } from "../../auth/AuthContext";
import { record, AUDIT_ACTIONS } from "../../lib/audit";
import { releaseResult, isReleased, releaseStatus } from "../../engines/results";
import LabReportPrint from "./LabReportPrint";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "ordered", label: "Ordered" },
  { id: "collected", label: "Collected" },
  { id: "resulted", label: "Resulted" },
  { id: "verified", label: "Verified" },
];

const FLAG_STYLE = {
  low: { color: "#1E5A8A", label: "Low" },
  high: { color: "#A35A2E", label: "High" },
  critical: { color: "#B0281F", label: "Critical" },
  normal: { color: "var(--muted)", label: "" },
};

export default function Laboratory() {
  const { may, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [showOrder, setShowOrder] = useState(false);
  const [resultFor, setResultFor] = useState(null);
  const [releaseFor, setReleaseFor] = useState(null);
  const [printFor, setPrintFor] = useState(null);
  const [releasedIds, setReleasedIds] = useState({});

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listOrders({ query, status });
      setOrders(rows);
      const verified = rows.filter((o) => o.status === "verified");
      const flags = {};
      await Promise.all(verified.map(async (o) => { flags[o.id] = await isReleased("lab", o.id); }));
      setReleasedIds((prev) => ({ ...prev, ...flags }));
    
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

  const act = async (fn, id) => {
    const o = orders.find((x) => x.id === id);
    await fn(id);
    if (o) {
      const verb = fn === verifyOrder ? "Verified" : "Collected sample for";
      record({ actor: user, action: AUDIT_ACTIONS.CLINICAL, entity: "lab-order", entityId: o.accession,
               detail: `${verb} ${o.testName} — ${o.patientName}`, severity: "info" });
    }
    await refresh();
  };

  return (
    <div>
      <PageHeader group="Diagnostics" title={<>Laboratory</>} icon="TestTube" actions={<><Button variant="primary" onClick={() => setShowOrder(true)}>
          + Order test
        </Button></>} />

      <div style={toolbar}>
        <input
          style={{ ...inputStyle, maxWidth: 280 }}
          placeholder="Search patient, hospital no. or accession"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div style={{ display: "flex", gap: 6 }}>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setStatus(f.id)}
              style={{ ...chip, ...(status === f.id ? chipActive : null) }}
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
              {["Accession", "Patient", "Test", "Dept", "Status", ""].map((h) => (
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
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} style={emptyCell}>
                  No orders match. Order a test to get started.
                </td>
              </tr>
            ) : (
              orders.map((o) => {
                const crit = orderHasCritical(o);
                return (
                  <tr key={o.id} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 12 }}>
                      {o.accession}
                      {crit && <span style={critDot} title="Critical result" />}
                    </td>
                    <td style={{ ...td, fontWeight: 500, color: "var(--ink-strong)" }}>
                      {o.patientName}
                    </td>
                    <td style={td}>{o.testName}</td>
                    <td style={{ ...td, color: "var(--muted)", fontSize: 12 }}>{o.department}</td>
                    <td style={td}>
                      <StatusChip status={o.status} />
                    </td>
                    <td style={{ ...td, textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: 6 }}>
                        {o.status === "ordered" && may("diagnostics:collect") && (
                          <Button onClick={() => act(collectSample, o.id)}>Collect</Button>
                        )}
                        {(o.status === "collected" || o.status === "resulted") && (
                          <Button onClick={() => setResultFor(o)}>
                            {o.status === "collected" ? "Enter results" : "Edit results"}
                          </Button>
                        )}
                        {o.status === "resulted" && may("diagnostics:verify") && (
                          <Button onClick={() => act(verifyOrder, o.id)}>Verify</Button>
                        )}
                        {o.status === "verified" && (
                          releasedIds[o.id] ? (
                            <>
                              <span style={releasedBadge}>Released ✓</span>
                              <Button onClick={() => setPrintFor(o)}>Print report</Button>
                            </>
                          ) : (
                            <Button variant="primary" onClick={() => setReleaseFor(o)}>Release result</Button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showOrder && (
        <OrderModal
          onClose={() => setShowOrder(false)}
          onDone={async () => {
            setShowOrder(false);
            await refresh();
          }}
        />
      )}

      {resultFor && (
        <ResultModal
          order={resultFor}
          onClose={() => setResultFor(null)}
          onDone={async () => {
            setResultFor(null);
            await refresh();
          }}
        />
      )}

      {releaseFor && (
        <ReleaseModal
          order={releaseFor}
          actor={user}
          onClose={() => setReleaseFor(null)}
          onDone={async () => {
            setReleaseFor(null);
            await refresh();
          }}
        />
      )}

      {printFor && <PrintWrapper order={printFor} onClose={() => setPrintFor(null)} />}
    </div>
  );
}

function PrintWrapper({ order, onClose }) {
  const [release, setRelease] = useState(null);
  useEffect(() => { releaseStatus("lab", order.id).then(setRelease).catch((e) => console.error(e)); }, [order.id]);
  return <LabReportPrint order={order} release={release} onClose={onClose} actor={useAuth().user} />;
}

function ReleaseModal({ order, actor, onClose, onDone }) {
  const [orderingClinician, setOrderingClinician] = useState(actor?.name || "");
  const [notifyPatient, setNotifyPatient] = useState(true);
  const [patientPhone, setPatientPhone] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const urgent = orderHasCritical(order);

  useEffect(() => {
    let alive = true;
    if (order.patientId) {
      import("../patients/patientService")
        .then(({ getPatient }) => getPatient(order.patientId).then((p) => { if (alive) setPatientPhone(p?.phone || null); }))
        .catch((e) => console.error(e));
    }
    return () => { alive = false; };
  }, [order.patientId]);

  const submit = async () => {
    setBusy(true); setErr("");
    try {
      await releaseResult({
        kind: "lab", id: order.id, patientName: order.patientName, patientPhone,
        hospitalNo: order.hospitalNo, testName: order.testName, orderingClinician,
        urgent, notifyPatient: notifyPatient && !!patientPhone, actor,
      });
      await onDone();
    } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title={`Release result — ${order.testName}`} onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Releasing…" : "Release"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>{order.patientName} &middot; {order.accession}</div>
      {urgent && (
        <div style={urgentNote}>This result contains a critical value. The clinician notification is flagged urgent.</div>
      )}
      <Field label="Ordering clinician (notified in-app)">
        <input style={inputStyle} value={orderingClinician} onChange={(e) => setOrderingClinician(e.target.value)} />
      </Field>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: patientPhone ? "var(--ink)" : "var(--muted)", cursor: patientPhone ? "pointer" : "not-allowed" }}>
        <input type="checkbox" checked={notifyPatient} disabled={!patientPhone} onChange={(e) => setNotifyPatient(e.target.checked)} />
        {patientPhone ? `Also notify the patient by SMS (${patientPhone})` : "No phone number on file \u2014 patient cannot be SMS'd"}
      </label>
    </Modal>
  );
}

function StatusChip({ status }) {
  const tint = {
    ordered: { bg: "#E3ECF7", fg: "#3A5170" },
    collected: { bg: "#E6EFDF", fg: "#4A6329" },
    resulted: { bg: "#FBF0DC", fg: "#8A5A17" },
    verified: { bg: "#D3E1F8", fg: "#1E3350" },
  }[status];
  return (
    <span
      style={{
        background: tint.bg,
        color: tint.fg,
        fontSize: 11,
        fontWeight: 500,
        padding: "2px 9px",
        borderRadius: 999,
      }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function OrderModal({ onClose, onDone }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [testCode, setTestCode] = useState(TEST_CATALOGUE[0].code);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      try { const rows = await listPatients({ query, status: "all" }); if (alive) setResults(rows.slice(0, 6)); } catch (e) { console.error(e); if (alive) setResults([]); }
    }, 180);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [query]);

  const submit = async () => {
    if (!selected) {
      setErr("Select a patient first.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      await createOrder({
        patientId: selected.id,
        patientName: `${selected.lastName}, ${selected.firstName}`,
        hospitalNo: selected.hospitalNo,
        testCode,
      });
      await onDone();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Order test"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={busy || !selected}>
            {busy ? "Ordering…" : "Order test"}
          </Button>
        </>
      }
    >
      {err && <div style={errBox}>{err}</div>}
      <Field label="Find patient">
        <input
          style={inputStyle}
          placeholder="Name or hospital no."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(null);
          }}
        />
      </Field>
      <div style={{ maxHeight: 160, overflowY: "auto", marginBottom: 14 }}>
        {results.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelected(p)}
            style={{ ...resultRow, ...(selected?.id === p.id ? resultRowActive : null) }}
          >
            <span style={{ fontWeight: 500, color: "var(--ink-strong)" }}>
              {p.lastName}, {p.firstName}
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>
              {p.hospitalNo}
            </span>
          </button>
        ))}
        {results.length === 0 && (
          <div style={{ fontSize: 12, color: "var(--muted)", padding: "8px 2px" }}>
            No patients match.
          </div>
        )}
      </div>
      <Field label="Test">
        <select style={inputStyle} value={testCode} onChange={(e) => setTestCode(e.target.value)}>
          {TEST_CATALOGUE.map((t) => (
            <option key={t.code} value={t.code}>
              {t.name} ({t.department})
            </option>
          ))}
        </select>
      </Field>
    </Modal>
  );
}

function ResultModal({ order, onClose, onDone }) {
  const test = getTest(order.testCode);
  const [values, setValues] = useState(() => {
    const init = {};
    for (const a of test.analytes) init[a.key] = order.results?.[a.key] ?? "";
    return init;
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const save = async (thenVerify) => {
    const missing = test.analytes.some((a) => !String(values[a.key]).trim());
    if (missing) {
      setErr("Enter a value for every analyte.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      await enterResults(order.id, values);
      if (thenVerify) await verifyOrder(order.id);
      await onDone();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title={`Results — ${order.testName}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => save(false)} disabled={busy}>
            Save
          </Button>
          <Button variant="primary" onClick={() => save(true)} disabled={busy}>
            Save &amp; verify
          </Button>
        </>
      }
    >
      {err && <div style={errBox}>{err}</div>}
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>
        {order.patientName} · {order.hospitalNo} · {order.accession}
      </div>
      {test.analytes.map((a) => {
        const flag = values[a.key] ? flagValue(order.testCode, a, values[a.key]) : "normal";
        const fs = FLAG_STYLE[flag];
        return (
          <div key={a.key} style={analyteRow}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: "var(--ink-strong)" }}>{a.label}</div>
              {!a.qualitative && (
                <div style={{ fontSize: 11, color: "var(--muted)" }}>
                  Ref {a.low}–{a.high} {a.unit}
                </div>
              )}
            </div>
            <input
              style={{ ...inputStyle, width: 110 }}
              value={values[a.key]}
              onChange={set(a.key)}
              placeholder={a.qualitative ? "Pos / Neg" : a.unit}
            />
            <div style={{ width: 62, textAlign: "right" }}>
              {fs.label && (
                <span style={{ fontSize: 11, fontWeight: 600, color: fs.color }}>{fs.label}</span>
              )}
            </div>
          </div>
        );
      })}
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
const critDot = {
  display: "inline-block",
  width: 7,
  height: 7,
  borderRadius: "50%",
  background: "#B0281F",
  marginLeft: 7,
  verticalAlign: "middle",
};
const resultRow = {
  width: "100%",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "8px 10px",
  border: "1px solid transparent",
  borderRadius: 8,
  background: "none",
  cursor: "pointer",
  font: "inherit",
  fontSize: 13,
};
const resultRowActive = { background: "var(--accent-bg)", border: "1px solid var(--border-strong)" };
const analyteRow = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "8px 0",
  borderTop: "1px solid var(--border)",
};
const releasedBadge = { fontSize: 11, fontWeight: 600, color: "var(--good)", background: "var(--good-bg)", padding: "5px 10px", borderRadius: 7 };
const urgentNote = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12, padding: "8px 11px", borderRadius: 8, marginBottom: 14 };
const errBox = {
  background: "#F7E9E9",
  color: "#7A2E2E",
  fontSize: 12,
  padding: "8px 11px",
  borderRadius: 8,
  marginBottom: 14,
};
