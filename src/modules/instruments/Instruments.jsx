import { useEffect, useState, useCallback } from "react";
import * as Icons from "lucide-react";
import {
  DEVICE_CATEGORIES, STATUS_TONE, PRINT_JOB_TYPES,
  listInstruments, listMessages, setInstrumentStatus, gatewaySummary, registerInstrument,
  pendingForInstrument, postResultMessage,
  pendingForModality, receiveDicomStudy,
  pendingForRtMachine, confirmFractionDelivery,
  sendPrintJob,
} from "./instrumentsService";
import { PageHeader, StatCard, Card, Pill, Button, Modal, Field, inputStyle, EmptyState } from "../../lib/ui";
import { isDeviceDetectionSupported, isWebUsbSupported, isWebSerialSupported, detectUsbDevice, detectSerialDevice } from "./deviceDetection";
import { useAuth } from "../../auth/AuthContext";

const CATEGORY_ICON = { analyzer: "TestTube", imaging: "ScanFace", radiotherapy: "Radiation", printer: "Printer" };

function ago(iso) {
  const m = Math.round((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

export default function Instruments() {
  const { user } = useAuth();
  const [cat, setCat] = useState("all");
  const [devices, setDevices] = useState([]);
  const [messages, setMessages] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionFor, setActionFor] = useState(null); // { device, kind }
  const [showDetect, setShowDetect] = useState(false);
  const [err, setErr] = useState("");

  const refresh = useCallback(async ({ silent = false } = {}) => {
    // Only show the full-screen loading state on the FIRST load. Refreshes
    // triggered by an action (status change, device registration) run
    // silently so the screen doesn't flash "Loading…" on every small change.
    if (!silent) setLoading(true);
    try {
      const [d, m, s] = await Promise.all([
        listInstruments({ category: cat }),
        listMessages({ limit: 14, category: cat }),
        gatewaySummary(),
      ]);
      setDevices(d); setMessages(m); setSummary(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [cat]);

  useEffect(() => { refresh(); }, [refresh]);

  const cycleStatus = async (d) => {
    setErr("");
    const order = ["online", "idle", "offline", "error"];
    const nextStatus = order[(order.indexOf(d.status) + 1) % order.length];
    // Optimistic update: reflect the new status immediately in the list, then
    // reconcile with the server silently. The user sees an instant response
    // instead of a full-screen reload for a one-field change.
    setDevices((prev) => prev.map((x) => (x.id === d.id ? { ...x, status: nextStatus } : x)));
    try {
      await setInstrumentStatus(d.id, nextStatus);
      await refresh({ silent: true });
    } catch (e) {
      setErr(e.message);
    }
  };

  const actionLabel = { analyzer: "Receive result", imaging: "Receive DICOM study", radiotherapy: "Confirm fraction", printer: "Send print job" };

  return (
    <div>
      <PageHeader group="Diagnostics" title="Instruments &amp; devices gateway" icon="Cable"
        subtitle="Analyzers, imaging modalities, radiotherapy systems, and printers — one interoperability hub for old and modern equipment"
        actions={<Button variant="primary" icon="Usb" onClick={() => setShowDetect(true)}>Detect connected device</Button>} />

      <div style={note}>
        <Icons.Info size={14} style={{ color: "var(--muted)", flexShrink: 0, marginTop: 1 }} />
        <span>
          Real network listening (MLLP for HL7, a DICOM SCP) requires a small
          Gateway Agent installed on a PC at the hospital — Cloudflare's edge
          network cannot hold a persistent socket open the way these protocols
          need. Once a device is registered below, contact the AgoroX team to have
          the Gateway Agent installed on a PC next to that equipment — setup
          is hands-on for now, not a self-service download. Until it's
          installed for a given device, each "receive/confirm/send" action
          here runs the exact code path a real listener would call, so Lab,
          Radiology, and Alerts can't tell the difference — useful for
          testing the rest of the system before real hardware is connected.
        </span>
      </div>

      <Card title="Gateway Agent" pad={false}>
        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6, marginBottom: 12 }}>
            The small program that connects a real analyzer or printer to HospitalOS.
            Runs on any Windows PC on the same network as the equipment. Installed by the
            AgoroX team as part of onboarding — register the device below, then reach out
            to get it set up.
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Button variant="primary" icon="MessageCircle" onClick={() => window.open("https://wa.me/2348034129684", "_blank")}>
              Contact AgoroX to install
            </Button>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>
              Register a device first, then reach out with its name so we know which one to bring the agent for.
            </span>
          </div>
        </div>
      </Card>

      {err && <div style={errBanner}>{err}</div>}

      {summary && (
        <div style={statGrid}>
          <StatCard label="Devices" value={summary.total} />
          <StatCard label="Online" value={summary.online} tone="good" />
          <StatCard label="Errored" value={summary.errored} tone={summary.errored ? "bad" : "default"} />
          <StatCard label="Offline" value={summary.offline} />
          <StatCard label="Messages" value={summary.messages24h.toLocaleString()} sub="lifetime" />
          <StatCard label="Errors" value={summary.errors24h} tone={summary.errors24h ? "warn" : "default"} />
        </div>
      )}

      <div style={tabs}>
        <button onClick={() => setCat("all")} style={{ ...tabBtn, ...(cat === "all" ? tabActive : null) }}>
          All devices
        </button>
        {DEVICE_CATEGORIES.map((c) => (
          <button key={c.key} onClick={() => setCat(c.key)} style={{ ...tabBtn, ...(cat === c.key ? tabActive : null) }}>
            {c.label} <span style={catCount}>{summary?.byCategory[c.key] ?? "\u2026"}</span>
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 14 }}>
        <Card title="Device registry" pad={false}>
          {loading ? <div style={{ padding: 20, color: "var(--muted)", fontSize: 13 }}>Loading…</div> : devices.length === 0 ? (
            <div style={{ padding: 22 }}><EmptyState icon="Cable" title="No devices in this category" /></div>
          ) : (
            devices.map((d, idx) => (
              <div key={d.id} style={{ ...row, borderTop: idx ? "1px solid var(--border)" : "none" }}>
                <div style={iconBox}>
                  {(() => { const C = Icons[CATEGORY_ICON[d.category]] || Icons.Cpu; return <C size={17} strokeWidth={1.9} style={{ color: "var(--accent)" }} />; })()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink-strong)" }}>{d.name}</span>
                    <Pill tone={STATUS_TONE[d.status]}>{d.status}</Pill>
                    {d.year < 2012 && <Pill tone="muted">Legacy · {d.year}</Pill>}
                  </div>
                  <div style={meta}>{d.type} · {d.vendor}{d.year >= 2012 ? ` · ${d.year}` : ""}</div>
                  <div style={{ ...meta, fontFamily: "var(--font-mono)" }}>{d.ae} · {d.host} · {d.protocol}</div>
                  <div style={meta}>
                    Handles: {d.handles.length ? d.handles.join(", ") : "—"} · {d.messages.toLocaleString()} msgs
                    {d.errors > 0 && <span style={{ color: "var(--warn)" }}> · {d.errors} errors</span>} · seen {ago(d.lastSeen)}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, alignSelf: "center", flexShrink: 0 }}>
                  {d.status !== "offline" && (
                    <Button variant="primary" icon="ArrowDownToLine" onClick={() => setActionFor({ device: d, kind: d.category })}>
                      {actionLabel[d.category]}
                    </Button>
                  )}
                  <Button onClick={() => cycleStatus(d)}>Set status</Button>
                </div>
              </div>
            ))
          )}
        </Card>
      </div>

      <Card title="Message log" pad={false}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>{["Time", "Device", "Type", "Reference", "Ack", "Detail"].map((h) => <th key={h} style={th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {messages.map((m) => (
              <tr key={m.id} style={{ borderTop: "1px solid var(--border)" }}>
                <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--muted)" }}>{ago(m.at)}</td>
                <td style={{ ...td, fontWeight: 600, color: "var(--ink-strong)" }}>{m.device}</td>
                <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 11.5 }}>{m.type}</td>
                <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 11.5 }}>{m.ref}</td>
                <td style={td}><Pill tone={m.status === "ack" ? "good" : "bad"}>{m.status}</Pill></td>
                <td style={{ ...td, color: "var(--muted)", fontSize: 12 }}>{m.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {actionFor && (
        <ActionModal
          device={actionFor.device}
          kind={actionFor.kind}
          onClose={() => setActionFor(null)}
          onDone={async () => { setActionFor(null); await refresh({ silent: true }); }}
        />
      )}

      {showDetect && (
        <DetectDeviceModal actor={user} onClose={() => setShowDetect(false)} onDone={async () => { setShowDetect(false); await refresh({ silent: true }); }} />
      )}
    </div>
  );
}

function ActionModal({ device, kind, onClose, onDone }) {
  if (kind === "analyzer") return <AnalyzerAction device={device} onClose={onClose} onDone={onDone} />;
  if (kind === "imaging") return <ImagingAction device={device} onClose={onClose} onDone={onDone} />;
  if (kind === "radiotherapy") return <RtAction device={device} onClose={onClose} onDone={onDone} />;
  if (kind === "printer") return <PrinterAction device={device} onClose={onClose} onDone={onDone} />;
  return null;
}

// Detects a real, physically connected USB or serial device via the
// browser's own WebUSB/Web Serial APIs — genuine detection, not a
// simulation. What it deliberately does NOT do: install an operating
// system driver. No web page can do that on any browser; the honest
// alternative is direct browser-to-device communication for devices that
// speak standard USB/serial protocols, which is what these APIs provide.
function DetectDeviceModal({ actor, onClose, onDone }) {
  const [detected, setDetected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState(DEVICE_CATEGORIES[0].key);
  const [registered, setRegistered] = useState(null); // { deviceToken, name } once created

  const supported = isDeviceDetectionSupported();

  const runDetect = async (via) => {
    setErr(""); setBusy(true);
    try {
      const result = via === "usb" ? await detectUsbDevice() : await detectSerialDevice();
      setDetected(result);
      setName(result.productName !== "Unnamed USB device" ? result.productName : "");
      if (result.suggestedCategory) setCategory(result.suggestedCategory);
    } catch (e) {
      setErr(e.message);
    }
    setBusy(false);
  };

  const submit = async () => {
    setBusy(true); setErr("");
    try {
      const created = await registerInstrument({
        category, name, vendor: detected.manufacturerName,
        connectionType: detected.connectionType, vendorId: detected.vendorId, productId: detected.productId,
        actor,
      });
      // The token is returned ONLY on this response — it's never
      // fetchable again after this, same as any real API key. Show it
      // here instead of closing immediately.
      setRegistered({ deviceToken: created.deviceToken, name: created.name });
      setBusy(false);
    } catch (e) { setErr(e.message); setBusy(false); }
  };

  if (registered) {
    return (
      <Modal title="Device registered" onClose={onDone} footer={<Button variant="primary" onClick={onDone}>Done</Button>}>
        <div style={detectedBox}>
          <Icons.CheckCircle2 size={14} color="var(--good)" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 13, color: "var(--ink-strong)" }}>
            <strong>{registered.name}</strong> is registered. Save the token below — the AgoroX team
            will need it to set up the Gateway Agent on a PC next to this device.
          </div>
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", marginTop: 14, marginBottom: 4 }}>
          DEVICE TOKEN — shown once, copy it now
        </div>
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: 12.5, background: "var(--surface)",
          border: "1px solid var(--border)", borderRadius: 0, padding: "10px 12px",
          wordBreak: "break-all", userSelect: "all",
        }}>
          {registered.deviceToken}
        </div>
        <div style={{ fontSize: 11, color: "var(--warn)", marginTop: 8 }}>
          This won't be shown again. If you lose it, remove the device and register it again to get a new one.
        </div>
        <Button
          variant="secondary" icon="MessageCircle" onClick={() => window.open("https://wa.me/2348034129684", "_blank")}
          style={{ marginTop: 14 }}
        >
          Contact AgoroX to set up this device
        </Button>
      </Modal>
    );
  }

  return (
    <Modal title="Detect connected device" onClose={onClose} footer={detected ? (
      <>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={submit} disabled={busy || !name.trim()}>{busy ? "Registering\u2026" : "Register device"}</Button>
      </>
    ) : (
      <Button variant="ghost" onClick={onClose}>Close</Button>
    )}>
      {err && <div style={errBox}>{err}</div>}

      {!supported && (
        <div style={warnBox}>
          <Icons.AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            WebUSB and Web Serial — the browser features that let this page detect connected devices —
            aren't available in this browser. Use Chrome or Edge on desktop, or add this device manually below.
          </span>
        </div>
      )}

      {!detected ? (
        <>
          <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6, marginBottom: 14 }}>
            Connect the device to this computer, then choose how it's connected. Your browser will show its own
            device picker — select the device there to grant this page access.
          </p>
          <div style={{ display: "flex", gap: 10, marginBottom: 6 }}>
            <Button variant="primary" onClick={() => runDetect("usb")} disabled={busy || !isWebUsbSupported()}>
              {busy ? "Waiting for selection\u2026" : "Detect USB device"}
            </Button>
            <Button onClick={() => runDetect("serial")} disabled={busy || !isWebSerialSupported()}>
              Detect serial port
            </Button>
          </div>
        </>
      ) : (
        <>
          <div style={detectedBox}>
            <Icons.CheckCircle2 size={14} color="var(--good)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontWeight: 600, color: "var(--ink-strong)", fontSize: 13 }}>{detected.manufacturerName}</div>
              <div style={{ fontSize: 11.5, color: "var(--muted)", fontFamily: "var(--font-mono)", marginTop: 2 }}>
                {detected.connectionType.toUpperCase()} · vendor {detected.vendorId} · product {detected.productId}
              </div>
              {detected.matched ? (
                <div style={{ fontSize: 11.5, color: "var(--good)", marginTop: 4 }}>Recognised — category suggested below.</div>
              ) : (
                <div style={{ fontSize: 11.5, color: "var(--warn)", marginTop: 4 }}>
                  Not in the known-device list yet — confirm the category yourself; it'll be recognised automatically next time.
                </div>
              )}
            </div>
          </div>
          <Field label="Name this device"><input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Front desk label printer" /></Field>
          <Field label="Category">
            <select style={inputStyle} value={category} onChange={(e) => setCategory(e.target.value)}>
              {DEVICE_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </Field>
          <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.5 }}>
            Network-based devices (most analyzers, imaging modalities) still need their host/AE title configured
            after registering — detection confirms what's physically connected, not network setup.
          </div>
        </>
      )}
    </Modal>
  );
}

function AnalyzerAction({ device, onClose, onDone }) {
  const [pending, setPending] = useState(null);
  const [orderId, setOrderId] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    pendingForInstrument(device.id)
      .then((p) => { if (alive) { setPending(p); setOrderId(p[0]?.id || ""); } })
      .catch((e) => { if (alive) { setErr(e.message); setPending([]); } });
    return () => { alive = false; };
  }, [device.id]);

  const send = async () => {
    setBusy(true); setErr("");
    try { setResult(await postResultMessage({ instrumentId: device.id, orderId })); }
    catch (e) { setErr(e.message); setBusy(false); }
  };

  if (result) {
    return (
      <Modal title="Result message received" onClose={onDone} footer={<Button variant="primary" onClick={onDone}>Done</Button>}>
        <div style={{ fontSize: 13, marginBottom: 10 }}>
          <span style={{ color: "var(--muted)" }}>Posted to </span><b style={{ color: "var(--ink-strong)" }}>{result.order.testName}</b>
          <span style={{ color: "var(--muted)" }}> for {result.order.patientName}</span>
        </div>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>RAW HL7 v2 MESSAGE</div>
        <pre style={codeBox}>{result.hl7}</pre>
      </Modal>
    );
  }

  return (
    <Modal title={`Receive result — ${device.name}`} onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={send} disabled={busy || !orderId}>{busy ? "Receiving…" : "Simulate ORU^R01"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12, fontFamily: "var(--font-mono)" }}>{device.ae} · handles {device.handles.join(", ")}</div>
      {pending === null ? <div style={{ fontSize: 13, color: "var(--muted)" }}>Checking worklist…</div>
        : pending.length === 0 ? <EmptyState icon="Inbox" title="No samples awaiting results" hint="Collect a sample this analyzer handles in Laboratory first." />
        : (
          <select style={inputStyle} value={orderId} onChange={(e) => setOrderId(e.target.value)}>
            {pending.map((o) => <option key={o.id} value={o.id}>{o.accession} — {o.testName} — {o.patientName}</option>)}
          </select>
        )}
    </Modal>
  );
}

function ImagingAction({ device, onClose, onDone }) {
  const [pending, setPending] = useState(null);
  const [studyId, setStudyId] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    pendingForModality(device.id)
      .then((p) => { if (alive) { setPending(p); setStudyId(p[0]?.id || ""); } })
      .catch((e) => { if (alive) { setErr(e.message); setPending([]); } });
    return () => { alive = false; };
  }, [device.id]);

  const send = async () => {
    setBusy(true); setErr("");
    try { setResult(await receiveDicomStudy({ instrumentId: device.id, studyId })); }
    catch (e) { setErr(e.message); setBusy(false); }
  };

  if (result) {
    return (
      <Modal title="DICOM study received" onClose={onDone} footer={<Button variant="primary" onClick={onDone}>Done</Button>}>
        <div style={{ fontSize: 13, marginBottom: 10 }}>
          <b style={{ color: "var(--ink-strong)" }}>{result.study.name}</b>
          <span style={{ color: "var(--muted)" }}> for {result.study.patientName}</span>
        </div>
        <div style={dicomStat}>
          <div><span style={{ fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums", fontSize: 20, fontWeight: 700 }}>{result.series}</span><div style={{ fontSize: 11, color: "var(--muted)" }}>series</div></div>
          <div><span style={{ fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums", fontSize: 20, fontWeight: 700 }}>{result.images}</span><div style={{ fontSize: 11, color: "var(--muted)" }}>images</div></div>
        </div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 10 }}>Study status moved to Performed — ready for reporting.</div>
      </Modal>
    );
  }

  return (
    <Modal title={`Receive DICOM study — ${device.name}`} onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={send} disabled={busy || !studyId}>{busy ? "Receiving…" : "Simulate C-STORE"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12, fontFamily: "var(--font-mono)" }}>{device.ae}</div>
      {pending === null ? <div style={{ fontSize: 13, color: "var(--muted)" }}>Checking worklist…</div>
        : pending.length === 0 ? <EmptyState icon="Inbox" title="No studies awaiting this modality" hint="Request a study this device performs from the relevant imaging screen first." />
        : (
          <select style={inputStyle} value={studyId} onChange={(e) => setStudyId(e.target.value)}>
            {pending.map((s) => <option key={s.id} value={s.id}>{s.accession} — {s.name} — {s.patientName}</option>)}
          </select>
        )}
    </Modal>
  );
}

function RtAction({ device, onClose, onDone }) {
  const [pending, setPending] = useState(null);
  const [courseId, setCourseId] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    pendingForRtMachine()
      .then((p) => { if (alive) { setPending(p); setCourseId(p[0]?.id || ""); } })
      .catch((e) => { if (alive) { setErr(e.message); setPending([]); } });
    return () => { alive = false; };
  }, []);

  const send = async () => {
    setBusy(true); setErr("");
    try { setResult(await confirmFractionDelivery({ instrumentId: device.id, courseId })); }
    catch (e) { setErr(e.message); setBusy(false); }
  };

  if (result) {
    return (
      <Modal title="Fraction delivery confirmed" onClose={onDone} footer={<Button variant="primary" onClick={onDone}>Done</Button>}>
        <div style={{ fontSize: 13 }}>
          <b style={{ color: "var(--ink-strong)" }}>{result.course.patientName}</b> — {result.course.site}
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums", color: "var(--ink-strong)", margin: "8px 0" }}>
          {result.course.fractionsDone}/{result.course.fractionsPlanned}
        </div>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>fractions delivered</div>
      </Modal>
    );
  }

  return (
    <Modal title={`Confirm fraction delivery — ${device.name}`} onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={send} disabled={busy || !courseId}>{busy ? "Confirming…" : "Confirm delivery"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      {pending === null ? <div style={{ fontSize: 13, color: "var(--muted)" }}>Checking active courses…</div>
        : pending.length === 0 ? <EmptyState icon="Inbox" title="No active radiotherapy courses" hint="Start a course in Radiotherapy first." />
        : (
          <select style={inputStyle} value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            {pending.map((c) => <option key={c.id} value={c.id}>{c.ref} — {c.patientName} — {c.fractionsDone}/{c.fractionsPlanned}</option>)}
          </select>
        )}
    </Modal>
  );
}

function PrinterAction({ device, onClose, onDone }) {
  const [jobType, setJobType] = useState(device.handles[0] || PRINT_JOB_TYPES[0]);
  const [reference, setReference] = useState("");
  const [copies, setCopies] = useState("1");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");

  const send = async () => {
    setBusy(true); setErr("");
    try { setResult(await sendPrintJob({ instrumentId: device.id, jobType, reference, copies: parseInt(copies, 10) || 1 })); }
    catch (e) { setErr(e.message); setBusy(false); }
  };

  if (result) {
    return (
      <Modal title="Print job sent" onClose={onDone} footer={<Button variant="primary" onClick={onDone}>Done</Button>}>
        <div style={{ fontSize: 13, color: "var(--ink-strong)" }}>{result.message.detail}</div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>via {device.name} · {device.protocol}</div>
      </Modal>
    );
  }

  return (
    <Modal title={`Send print job — ${device.name}`} onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={send} disabled={busy}>{busy ? "Sending…" : "Send to printer"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12, fontFamily: "var(--font-mono)" }}>{device.host} · {device.protocol}</div>
      <label style={{ display: "block", marginBottom: 12 }}>
        <span style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "var(--muted)", marginBottom: 5 }}>Job type</span>
        <select style={inputStyle} value={jobType} onChange={(e) => setJobType(e.target.value)}>
          {device.handles.map((h) => <option key={h} value={h}>{h}</option>)}
        </select>
      </label>
      <div style={{ display: "flex", gap: 12 }}>
        <label style={{ flex: 1 }}>
          <span style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "var(--muted)", marginBottom: 5 }}>Reference</span>
          <input style={inputStyle} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Hospital no. / accession" />
        </label>
        <label style={{ width: 90 }}>
          <span style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "var(--muted)", marginBottom: 5 }}>Copies</span>
          <input type="number" min="1" style={inputStyle} value={copies} onChange={(e) => setCopies(e.target.value)} />
        </label>
      </div>
    </Modal>
  );
}

const note = { display: "flex", gap: 8, background: "var(--accent-soft)", border: "1px solid var(--border)", borderRadius: 0, padding: "10px 13px", fontSize: 12, color: "var(--muted)", marginBottom: 16, lineHeight: 1.55 };
const statGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 10, marginBottom: 16 };
const tabs = { display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" };
const tabBtn = { font: "inherit", fontSize: 12.5, fontWeight: 600, padding: "6px 12px", borderRadius: 0, border: "1px solid var(--border-strong)", background: "var(--surface-2)", color: "var(--muted)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 };
const tabActive = { background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" };
const catCount = { fontSize: 10, fontWeight: 700, opacity: 0.75 };
const row = { display: "flex", gap: 12, padding: "13px 16px" };
const iconBox = { width: 36, height: 36, borderRadius: 0, background: "var(--accent-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };
const meta = { fontSize: 11.5, color: "var(--muted)", marginTop: 3 };
const th = { textAlign: "left", fontSize: 10.5, fontWeight: 700, color: "var(--muted)", padding: "10px 16px", background: "var(--surface)", textTransform: "uppercase", letterSpacing: "0.05em" };
const td = { padding: "10px 16px", fontSize: 12.5, verticalAlign: "middle" };
const codeBox = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 0, padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: 10.5, lineHeight: 1.65, overflowX: "auto", whiteSpace: "pre", color: "var(--ink)" };
const dicomStat = { display: "flex", gap: 24, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 0, padding: "12px 16px" };
const errBanner = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 13, padding: "10px 14px", borderRadius: 0, marginBottom: 14 };
const errBox = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12, padding: "8px 11px", borderRadius: 0, marginBottom: 14 };
const warnBox = { display: "flex", gap: 8, background: "var(--warn-bg)", color: "var(--warn)", fontSize: 12, padding: "10px 12px", borderRadius: 0, marginBottom: 14, lineHeight: 1.5 };
const detectedBox = { display: "flex", gap: 9, background: "var(--good-bg)", padding: "11px 12px", borderRadius: 0, marginBottom: 14 };
