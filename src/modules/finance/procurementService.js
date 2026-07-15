// Finance — procurement & stores service.
// Purchase orders to suppliers, and general (non-drug) store inventory.
// In-memory now; async API shaped for a later D1 swap.

const delay = (ms = 90) => new Promise((r) => setTimeout(r, ms));

/* -------- Procurement -------- */
export const PO_STATUS = ["draft", "ordered", "received"];
export const PO_TINT = {
  draft: { bg: "#E3ECF7", fg: "#3A5170", label: "Draft" },
  ordered: { bg: "#FBF0DC", fg: "#8A5A17", label: "Ordered" },
  received: { bg: "#E6EFDF", fg: "#4A6329", label: "Received" },
};

let _poSeq = 500;
const _pos = [
  { id: "po1", ref: "PO-0501", supplier: "Emzor Pharmaceuticals", items: "Paracetamol, Amoxicillin (bulk)", amount: 1850000, status: "ordered" },
  { id: "po2", ref: "PO-0502", supplier: "GE Healthcare", items: "CT contrast media", amount: 640000, status: "draft" },
  { id: "po3", ref: "PO-0503", supplier: "Fidson Healthcare", items: "IV fluids (Ringer's, NS)", amount: 420000, status: "received" },
];

export async function listPOs() { await delay(); return [..._pos]; }
export async function advancePO(id) {
  await delay(80);
  const p = _pos.find((x) => x.id === id);
  if (!p) throw new Error("PO not found");
  const i = PO_STATUS.indexOf(p.status);
  if (i < PO_STATUS.length - 1) p.status = PO_STATUS[i + 1];
  return p;
}
export async function createPO({ supplier, items, amount }) {
  await delay();
  if (!supplier || !supplier.trim()) throw new Error("Enter the supplier.");
  if (!items || !items.trim()) throw new Error("Enter the items.");
  const amt = parseFloat(amount);
  if (!amt || amt <= 0) throw new Error("Enter an amount.");
  _poSeq += 1;
  const po = { id: "po" + Date.now(), ref: "PO-" + String(_poSeq).padStart(4, "0"), supplier: supplier.trim(), items: items.trim(), amount: amt, status: "draft" };
  _pos.unshift(po);
  return po;
}

/* -------- Stores (non-drug consumables & assets) -------- */
const _stores = [
  { id: "st1", item: "Surgical gloves (box)", category: "Consumable", qty: 340, reorder: 100 },
  { id: "st2", item: "IV cannula 18G", category: "Consumable", qty: 85, reorder: 150 },
  { id: "st3", item: "Bed linen set", category: "Linen", qty: 220, reorder: 80 },
  { id: "st4", item: "Wheelchair", category: "Asset", qty: 12, reorder: 4 },
  { id: "st5", item: "Syringe 5ml", category: "Consumable", qty: 60, reorder: 200 },
];
export async function listStores() {
  await delay();
  return _stores.map((s) => ({ ...s, low: s.qty <= s.reorder }));
}
