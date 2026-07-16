// Documents & templates — tenant-uploaded files.
//
// Previously a hardcoded list of titles with nothing behind them. This is now
// real upload: pick or drop a file, it is stored (as an in-memory object URL
// for this session) and immediately downloadable, renameable, and deletable.
// Categories are free text a tenant defines as they go, not a fixed enum.
//
// HONEST LIMIT: there is no backend yet, so storage is per-session — files do
// not survive a reload. This is the same in-memory pattern as every other
// service in the app; when Cloudflare R2 lands, uploadDocument() posts the
// file there instead and everything downstream (list, download, delete) is
// unchanged. Do not rely on this for anything you cannot re-upload.

import { record, AUDIT_ACTIONS } from "../../lib/audit";

const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));

// Seed a few starter categories so the screen isn't empty on first load, but
// with real (tiny, generated) files behind them rather than fake titles.
function seedFile(name, category, text) {
  const blob = new Blob([text], { type: "text/plain" });
  return {
    id: "doc" + Math.random().toString(36).slice(2),
    name,
    category,
    sizeBytes: blob.size,
    mimeType: "text/plain",
    url: URL.createObjectURL(blob),
    uploadedBy: "System",
    uploadedAt: new Date().toISOString(),
  };
}

let _docs = [
  seedFile("Discharge Summary Template.txt", "Clinical", "Discharge Summary\n\nPatient: \nAdmission date: \nDischarge date: \nDiagnosis: \nSummary of admission: \nMedications on discharge: \nFollow-up plan: \n"),
  seedFile("Consent for Surgery.txt", "Consent", "CONSENT FOR SURGICAL PROCEDURE\n\nI, the undersigned, consent to the procedure described to me by my surgeon...\n"),
  seedFile("NHIA Claim Form.txt", "Finance", "NHIA CLAIM FORM\n\nProvider: \nEnrollee ID: \nService date: \nDiagnosis code: \nAmount claimed: \n"),
];

export async function listDocuments({ category = "all", query = "" } = {}) {
  await delay();
  const q = query.trim().toLowerCase();
  return _docs
    .filter((d) => (category === "all" ? true : d.category === category))
    .filter((d) => !q || d.name.toLowerCase().includes(q))
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
    .map((d) => ({ ...d }));
}

export async function listCategories() {
  await delay(40);
  return [...new Set(_docs.map((d) => d.category))].sort();
}

/**
 * Upload a real File/Blob from an <input type="file"> or a drop event.
 * category is free text — a tenant can create as many as they like, there is
 * no fixed enum to request a change to.
 */
export async function uploadDocument({ file, category, actor }) {
  await delay(150);
  if (!file) throw new Error("Choose a file.");
  if (!category || !category.trim()) throw new Error("Enter or choose a category.");
  if (file.size > 15 * 1024 * 1024) throw new Error("File is larger than 15MB.");
  const doc = {
    id: "doc" + Date.now(),
    name: file.name,
    category: category.trim(),
    sizeBytes: file.size,
    mimeType: file.type || "application/octet-stream",
    url: URL.createObjectURL(file),
    uploadedBy: actor?.name || "Unknown",
    uploadedAt: new Date().toISOString(),
  };
  _docs.unshift(doc);
  record({ actor, action: AUDIT_ACTIONS.CREATE, entity: "document", entityId: doc.id, detail: `Uploaded ${doc.name} (${doc.category})`, severity: "info" });
  return doc;
}

export async function renameDocument(id, { name, category, actor }) {
  await delay(60);
  const d = _docs.find((x) => x.id === id);
  if (!d) throw new Error("Document not found");
  if (name && name.trim()) d.name = name.trim();
  if (category && category.trim()) d.category = category.trim();
  record({ actor, action: AUDIT_ACTIONS.UPDATE, entity: "document", entityId: id, detail: `Renamed to ${d.name}`, severity: "info" });
  return d;
}

export async function deleteDocument(id, actor) {
  await delay(60);
  const d = _docs.find((x) => x.id === id);
  if (!d) throw new Error("Document not found");
  URL.revokeObjectURL(d.url);
  _docs = _docs.filter((x) => x.id !== id);
  record({ actor, action: AUDIT_ACTIONS.DELETE, entity: "document", entityId: id, detail: `Deleted ${d.name}`, severity: "warn" });
  return true;
}

export function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
