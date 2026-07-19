// Policies & SOPs.
// Distinct from Administration -> Documents & templates on purpose:
// Documents is a general file cabinet (discharge summary templates,
// consent forms, whatever a hospital wants to keep on hand). A policy is a
// different kind of document — it has an owner, a version, and a review
// date it must not silently pass, because an out-of-date infection control
// policy or medication safety policy is itself a compliance risk. Nothing
// in the general Documents module tracked that; this does.
// In-memory now; async API shaped for a later D1 swap.

import { record, AUDIT_ACTIONS } from "../../lib/audit";

const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));

export const POLICY_CATEGORIES = ["Clinical", "Infection control", "Medication safety", "Health & safety", "HR & conduct", "Administrative"];
export const REVIEW_CYCLE_MONTHS = [12, 24, 36];

let _seq = 600;
function polRef() { _seq += 1; return "POL-" + String(_seq).padStart(5, "0"); }

const _policies = [
  {
    id: "p1", ref: "POL-00601", title: "Hand Hygiene Policy", category: "Infection control",
    version: "2.1", owner: "IPC Lead", approvedBy: "Medical Director",
    lastReviewedAt: new Date(Date.now() - 300 * 86400000).toISOString().slice(0, 10),
    reviewCycleMonths: 12, fileUrl: null, fileName: null,
  },
];

function nextReviewDate(lastReviewedAt, cycleMonths) {
  const d = new Date(lastReviewedAt);
  d.setMonth(d.getMonth() + cycleMonths);
  return d.toISOString().slice(0, 10);
}

export async function listPolicies({ category = "all", query = "" } = {}) {
  await delay();
  const q = query.trim().toLowerCase();
  const today = new Date().toISOString().slice(0, 10);
  return _policies
    .filter((p) => (category === "all" ? true : p.category === category))
    .filter((p) => !q || p.title.toLowerCase().includes(q) || p.ref.toLowerCase().includes(q))
    .map((p) => {
      const nextReview = nextReviewDate(p.lastReviewedAt, p.reviewCycleMonths);
      const daysToReview = Math.ceil((new Date(nextReview) - new Date(today)) / 86400000);
      const status = daysToReview < 0 ? "overdue" : daysToReview <= 60 ? "due-soon" : "current";
      return { ...p, nextReview, daysToReview, status };
    })
    .sort((a, b) => a.daysToReview - b.daysToReview);
}

export async function addPolicy({ title, category, version, owner, approvedBy, reviewCycleMonths, file, actor }) {
  await delay(150);
  if (!title || !title.trim()) throw new Error("Enter the policy title.");
  if (!POLICY_CATEGORIES.includes(category)) throw new Error("Choose a category.");
  if (!owner || !owner.trim()) throw new Error("Enter the policy owner.");
  if (!REVIEW_CYCLE_MONTHS.includes(Number(reviewCycleMonths))) throw new Error("Choose a review cycle.");
  const pol = {
    id: "p" + Date.now(), ref: polRef(), title: title.trim(), category,
    version: version || "1.0", owner: owner.trim(), approvedBy: approvedBy || "\u2014",
    lastReviewedAt: new Date().toISOString().slice(0, 10), reviewCycleMonths: Number(reviewCycleMonths),
    fileUrl: file ? URL.createObjectURL(file) : null, fileName: file ? file.name : null,
  };
  _policies.unshift(pol);
  record({ actor, action: AUDIT_ACTIONS.CREATE, entity: "policy", entityId: pol.ref, detail: `${pol.title} added \u2014 v${pol.version}, owner ${pol.owner}`, severity: "info" });
  return pol;
}

export async function markReviewed(id, { version, approvedBy, actor }) {
  await delay(80);
  const pol = _policies.find((x) => x.id === id);
  if (!pol) throw new Error("Policy not found");
  pol.lastReviewedAt = new Date().toISOString().slice(0, 10);
  if (version) pol.version = version;
  if (approvedBy) pol.approvedBy = approvedBy;
  record({ actor, action: AUDIT_ACTIONS.UPDATE, entity: "policy", entityId: pol.ref, detail: `Reviewed \u2014 ${pol.title}, now v${pol.version}`, severity: "info" });
  return pol;
}

export async function listOverduePolicies() {
  await delay(60);
  const all = await listPolicies({});
  return all.filter((p) => p.status === "overdue" || p.status === "due-soon");
}

export async function policiesSummary() {
  await delay(60);
  const all = await listPolicies({});
  return {
    total: all.length,
    dueSoon: all.filter((p) => p.status === "due-soon").length,
    overdue: all.filter((p) => p.status === "overdue").length,
  };
}
