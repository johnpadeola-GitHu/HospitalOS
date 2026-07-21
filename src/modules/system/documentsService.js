// Documents & templates — tenant-uploaded files.
//
// GENUINELY REAL NOW, module 50. This was the one module deliberately
// left undone through this whole migration effort, because it needed
// actual infrastructure beyond what a migration task builds: a real
// Cloudflare R2 bucket. That bucket (hospitalos-documents) now exists.
// File bytes are uploaded to and served from R2 for real; metadata
// (name, category, uploader, size) lives in D1. A file uploaded today
// will still be there next week, from a different browser, on a
// different device — the actual test a session-only blob URL could
// never pass.

const API_URL = "https://hospitalos-api.johnpadeola.workers.dev";

function authHeaders() {
  const token = localStorage.getItem("hospitalos_session_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiCall(path, { method = "GET", body } = {}) {
  let res, data;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: body ? JSON.stringify(body) : undefined,
    });
    data = await res.json();
  } catch {
    throw new Error("Couldn't reach the server. Check your connection and try again.");
  }
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

export async function listDocuments({ category = "all", query = "" } = {}) {
  const params = new URLSearchParams();
  if (category !== "all") params.set("category", category);
  if (query.trim()) params.set("query", query.trim());
  const qs = params.toString();
  return apiCall(`/system/documents${qs ? `?${qs}` : ""}`);
}

export async function listCategories() {
  return apiCall("/system/documents/categories");
}

/**
 * Real multipart upload — the file's actual bytes go to R2, not a
 * browser-session-only object URL. category is free text, no fixed enum.
 */
export async function uploadDocument({ file, category }) {
  if (!file) throw new Error("Choose a file.");
  if (!category || !category.trim()) throw new Error("Enter or choose a category.");
  if (file.size > 15 * 1024 * 1024) throw new Error("File is larger than 15MB.");

  const form = new FormData();
  form.append("file", file);
  form.append("category", category.trim());

  let res, data;
  try {
    res = await fetch(`${API_URL}/system/documents`, { method: "POST", headers: authHeaders(), body: form });
    data = await res.json();
  } catch {
    throw new Error("Couldn't reach the server. Check your connection and try again.");
  }
  if (!res.ok) throw new Error(data.error || "Upload failed.");
  return data;
}

/**
 * Fetches the real file as a blob (with the auth header a plain <a href>
 * can't send) and triggers a normal browser download from it.
 */
export async function downloadDocument(id, filename) {
  let res;
  try {
    res = await fetch(`${API_URL}/system/documents/${encodeURIComponent(id)}/download`, { headers: authHeaders() });
  } catch {
    throw new Error("Couldn't reach the server. Check your connection and try again.");
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Download failed.");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function renameDocument(id, { name, category }) {
  return apiCall(`/system/documents/${encodeURIComponent(id)}`, { method: "PATCH", body: { name, category } });
}

export async function deleteDocument(id) {
  return apiCall(`/system/documents/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
