import { useEffect, useState, useCallback } from "react";
import { CSSD_STAGES, CSSD_LABELS, listCssd, createCssdBatch, advanceCssd } from "./operationsService";
import { Button, Modal, Field, inputStyle, PageHeader } from "../../lib/ui";

const STAGE_TINT = {
  loaded: { bg: "#E3ECF7", fg: "#3A5170" },
  sterilizing: { bg: "#FBF0DC", fg: "#8A5A17" },
  ready: { bg: "#E6EFDF", fg: "#4A6329" },
  issued: { bg: "#EDEFF2", fg: "#6B7C96" },
};

export default function CSSD() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setBatches(await listCssd());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const advance = async (id) => {
    await advanceCssd(id);
    await refresh();
  };

  return (
    <div>
      <PageHeader group="Operations" title={<>CSSD &amp; sterile supply</>} icon="Recycle" actions={<><Button variant="primary" onClick={() => setShowAdd(true)}>
          + New batch
        </Button></>} />

      <div style={tableWrap}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Batch", "Contents", "Autoclave", "Stage", ""].map((h) => (
                <th key={h} style={th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={emptyCell}>
                  Loading…
                </td>
              </tr>
            ) : batches.length === 0 ? (
              <tr><td colSpan={5} style={emptyCell}>No sterilisation batches yet.</td></tr>
            ) : (
              batches.map((b) => {
                const tint = STAGE_TINT[b.stage];
                const canAdvance = CSSD_STAGES.indexOf(b.stage) < CSSD_STAGES.length - 1;
                const next = canAdvance ? CSSD_LABELS[CSSD_STAGES[CSSD_STAGES.indexOf(b.stage) + 1]] : null;
                return (
                  <tr key={b.id} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 12 }}>{b.batch}</td>
                    <td style={{ ...td, fontWeight: 500, color: "var(--ink-strong)" }}>{b.contents}</td>
                    <td style={{ ...td, color: "var(--muted)" }}>{b.autoclave}</td>
                    <td style={td}>
                      <span style={{ background: tint.bg, color: tint.fg, fontSize: 11, fontWeight: 500, padding: "2px 9px", borderRadius: 999 }}>
                        {CSSD_LABELS[b.stage]}
                      </span>
                    </td>
                    <td style={{ ...td, textAlign: "right" }}>
                      {canAdvance && <Button onClick={() => advance(b.id)}>{next} →</Button>}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <AddModal
          onClose={() => setShowAdd(false)}
          onDone={async () => {
            setShowAdd(false);
            await refresh();
          }}
        />
      )}
    </div>
  );
}

function AddModal({ onClose, onDone }) {
  const [contents, setContents] = useState("");
  const [autoclave, setAutoclave] = useState("Autoclave 1");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setBusy(true);
    setErr("");
    try {
      await createCssdBatch({ contents, autoclave });
      await onDone();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title="New sterilization batch"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={busy}>
            {busy ? "Loading…" : "Load batch"}
          </Button>
        </>
      }
    >
      {err && <div style={errBox}>{err}</div>}
      <Field label="Contents">
        <input style={inputStyle} value={contents} onChange={(e) => setContents(e.target.value)} placeholder="e.g. Theatre set B (minor)" />
      </Field>
      <Field label="Autoclave">
        <select style={inputStyle} value={autoclave} onChange={(e) => setAutoclave(e.target.value)}>
          <option>Autoclave 1</option>
          <option>Autoclave 2</option>
          <option>Autoclave 3</option>
        </select>
      </Field>
    </Modal>
  );
}

const header = { display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 18 };
const tableWrap = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, overflow: "auto" };
const th = { textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--muted)", padding: "11px 14px", background: "var(--surface)" };
const td = { padding: "11px 14px", fontSize: 13, verticalAlign: "middle" };
const emptyCell = { padding: "28px 14px", textAlign: "center", color: "var(--muted)", fontSize: 13 };
const errBox = { background: "#F7E9E9", color: "#7A2E2E", fontSize: 12, padding: "8px 11px", borderRadius: 8, marginBottom: 14 };
