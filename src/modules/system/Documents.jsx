import { useEffect, useState, useCallback, useRef } from "react";
import * as Icons from "lucide-react";
import { listDocuments, listCategories, uploadDocument, renameDocument, deleteDocument, formatSize } from "./documentsService";
import { PageHeader, Card, Button, Modal, Field, inputStyle, EmptyState } from "../../lib/ui";
import { useAuth } from "../../auth/AuthContext";

export default function Documents() {
  const { user } = useAuth();
  const [docs, setDocs] = useState([]);
  const [cats, setCats] = useState([]);
  const [cat, setCat] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [editDoc, setEditDoc] = useState(null);
  const [err, setErr] = useState("");
  const fileRef = useRef(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [d, c] = await Promise.all([listDocuments({ category: cat, query }), listCategories()]);
    setDocs(d); setCats(c); setLoading(false);
  }, [cat, query]);

  useEffect(() => { const t = setTimeout(refresh, 150); return () => clearTimeout(t); }, [refresh]);

  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setUploadFile(f);
  };

  const del = async (id) => {
    setErr("");
    try { await deleteDocument(id, user); await refresh(); } catch (e) { setErr(e.message); }
  };

  return (
    <div>
      <PageHeader group="Administration" title="Documents &amp; templates" icon="Files"
        subtitle="Upload and manage your own documents and templates — any category, any file"
        actions={<Button variant="primary" icon="Upload" onClick={() => fileRef.current?.click()}>Upload</Button>} />

      <input ref={fileRef} type="file" style={{ display: "none" }} onChange={(e) => { if (e.target.files?.[0]) setUploadFile(e.target.files[0]); e.target.value = ""; }} />

      {err && <div style={errBanner}>{err}</div>}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        style={{ ...dropZone, ...(dragOver ? dropZoneActive : null) }}
        onClick={() => fileRef.current?.click()}
      >
        <Icons.UploadCloud size={22} style={{ color: dragOver ? "var(--accent)" : "var(--muted)" }} />
        <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 6 }}>
          Drag a file here, or click to browse. Up to 15MB.
        </div>
      </div>

      <div style={toolbar}>
        <input style={{ ...inputStyle, maxWidth: 240 }} placeholder="Search documents…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select style={{ ...inputStyle, maxWidth: 200 }} value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="all">All categories</option>
          {cats.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <Card title="Your documents" pad={false}>
        {loading ? <div style={{ padding: 20, color: "var(--muted)", fontSize: 13 }}>Loading…</div> : docs.length === 0 ? (
          <div style={{ padding: 22 }}><EmptyState icon="Files" title="No documents match" hint="Upload a file to get started." /></div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {docs.map((d, i) => (
              <div key={d.id} style={{ ...row, borderTop: i ? "1px solid var(--border)" : "none" }}>
                <div style={fileIcon}><Icons.FileText size={16} style={{ color: "var(--accent)" }} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-strong)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                    {d.category} · {formatSize(d.sizeBytes)} · {d.uploadedBy} · {new Date(d.uploadedAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <a href={d.url} download={d.name} style={{ textDecoration: "none" }}>
                    <Button icon="Download">Download</Button>
                  </a>
                  <Button onClick={() => setEditDoc(d)}>Rename</Button>
                  <Button onClick={() => del(d.id)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {uploadFile && (
        <UploadModal file={uploadFile} categories={cats} actor={user}
          onClose={() => setUploadFile(null)}
          onDone={async () => { setUploadFile(null); await refresh(); }} />
      )}
      {editDoc && (
        <EditModal doc={editDoc} actor={user}
          onClose={() => setEditDoc(null)}
          onDone={async () => { setEditDoc(null); await refresh(); }} />
      )}
    </div>
  );
}

function UploadModal({ file, categories, actor, onClose, onDone }) {
  const [category, setCategory] = useState(categories[0] || "");
  const [customCat, setCustomCat] = useState("");
  const [useCustom, setUseCustom] = useState(categories.length === 0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    const cat = useCustom ? customCat : category;
    setBusy(true); setErr("");
    try { await uploadDocument({ file, category: cat, actor }); await onDone(); }
    catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title="Upload document" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Uploading…" : "Upload"}</Button>
    </>}>
      {err && <div style={errBox}>{err}</div>}
      <div style={fileSummary}>
        <Icons.FileText size={16} style={{ color: "var(--accent)", flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: "var(--ink-strong)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</span>
      </div>
      {categories.length > 0 && !useCustom ? (
        <Field label="Category">
          <select style={inputStyle} value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
      ) : (
        <Field label="New category">
          <input style={inputStyle} value={customCat} onChange={(e) => setCustomCat(e.target.value)} placeholder="e.g. Policies, Consent, Statutory…" autoFocus />
        </Field>
      )}
      {categories.length > 0 && (
        <button style={linkBtn} onClick={() => setUseCustom((v) => !v)}>
          {useCustom ? "Choose an existing category instead" : "+ Create a new category instead"}
        </button>
      )}
    </Modal>
  );
}

function EditModal({ doc, actor, onClose, onDone }) {
  const [name, setName] = useState(doc.name);
  const [category, setCategory] = useState(doc.category);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    await renameDocument(doc.id, { name, category, actor });
    await onDone();
  };

  return (
    <Modal title="Edit document" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={submit} disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
    </>}>
      <Field label="File name"><input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label="Category"><input style={inputStyle} value={category} onChange={(e) => setCategory(e.target.value)} /></Field>
    </Modal>
  );
}

const dropZone = {
  border: "1.5px dashed var(--border-strong)", borderRadius: 12, padding: "22px 16px",
  textAlign: "center", cursor: "pointer", marginBottom: 16, background: "var(--surface)",
};
const dropZoneActive = { borderColor: "var(--accent)", background: "var(--accent-soft)" };
const toolbar = { display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" };
const row = { display: "flex", gap: 12, alignItems: "center", padding: "12px 16px" };
const fileIcon = { width: 32, height: 32, borderRadius: 8, background: "var(--accent-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };
const fileSummary = { display: "flex", alignItems: "center", gap: 8, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 11px", marginBottom: 14 };
const linkBtn = { font: "inherit", fontSize: 11.5, fontWeight: 600, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", padding: "6px 0 0" };
const errBanner = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 13, padding: "10px 14px", borderRadius: 10, marginBottom: 14 };
const errBox = { background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12, padding: "8px 11px", borderRadius: 8, marginBottom: 14 };
