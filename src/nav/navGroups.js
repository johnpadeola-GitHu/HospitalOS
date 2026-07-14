// HospitalOS — Navigation config
// Workflow-ordered groups (LabOS convention).
// "Coming Soon" badges go on GROUP HEADERS only, never individual items.
// Standalone project: Laboratory and Pharmacy are native routes.

export const NAV_GROUPS = [
  {
    id: "overview",
    label: "Overview",
    icon: "layout-dashboard",
    items: [
      { id: "dashboard", label: "Dashboard", path: "/" },
      { id: "my-patients", label: "My patients", path: "/patients/mine" },
      { id: "worklist", label: "Worklist", path: "/worklist" },
      { id: "alerts", label: "Alerts & critical values", path: "/alerts" },
    ],
  },
  {
    id: "patient-care",
    label: "Patient care",
    icon: "stethoscope",
    items: [
      { id: "registration", label: "Registration & ADT", path: "/patients/adt" },
      { id: "outpatient", label: "Outpatient (GOPD & clinics)", path: "/outpatient" },
      { id: "emergency", label: "Emergency & observation", path: "/emergency" },
      { id: "wards", label: "Wards & bed management", path: "/wards" },
      { id: "critical-care", label: "ICU / HDU", path: "/critical-care" },
      { id: "theatre", label: "Theatre & day surgery", path: "/theatre" },
      { id: "maternity", label: "Maternity & neonatology", path: "/maternity" },
      { id: "specialties", label: "Specialist clinics", path: "/specialties" },
      { id: "oncology", label: "Oncology", path: "/oncology" },
      { id: "rehab", label: "Rehabilitation & therapy", path: "/rehab" },
    ],
  },
  {
    id: "diagnostics",
    label: "Diagnostics",
    icon: "microscope",
    items: [
      { id: "laboratory", label: "Laboratory", path: "/lab" },
      { id: "blood-bank", label: "Blood bank & transfusion", path: "/blood-bank" },
      { id: "radiology", label: "Radiology & imaging", path: "/radiology" },
      { id: "radiotherapy", label: "Radiotherapy", path: "/radiotherapy" },
      { id: "poct", label: "Point of care testing", path: "/poct" },
    ],
  },
  {
    id: "pharmacy",
    label: "Pharmacy",
    icon: "pill",
    items: [
      { id: "dispensing", label: "Dispensing", path: "/pharmacy/dispensing" },
      { id: "inventory", label: "Drug inventory", path: "/pharmacy/inventory" },
      { id: "formulary", label: "Formulary & NAFDAC", path: "/pharmacy/formulary" },
    ],
  },
  {
    id: "finance",
    label: "Finance & trade",
    icon: "cash",
    items: [
      { id: "billing", label: "Billing & invoicing", path: "/finance/billing" },
      { id: "payments", label: "Payments & cashiering", path: "/finance/payments" },
      { id: "claims", label: "Insurance & NHIS claims", path: "/finance/claims" },
      { id: "procurement", label: "Procurement & suppliers", path: "/finance/procurement" },
      { id: "stores", label: "Stores & assets", path: "/finance/stores" },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    icon: "settings-cog",
    items: [
      { id: "scheduling", label: "Scheduling & rosters", path: "/ops/scheduling" },
      { id: "cssd", label: "CSSD & sterile supply", path: "/ops/cssd" },
      { id: "biomedical", label: "Biomedical engineering", path: "/ops/biomedical" },
      { id: "facility", label: "Facility & waste", path: "/ops/facility" },
      { id: "fleet", label: "Ambulance & fleet", path: "/ops/fleet" },
      { id: "support", label: "Catering, laundry & mortuary", path: "/ops/support" },
      { id: "visitor", label: "Visitor & security", path: "/ops/visitor" },
    ],
  },
  {
    id: "academic",
    label: "Academic",
    icon: "school",
    comingSoon: true,
    items: [
      { id: "training", label: "Training & rotations", path: "/academic/training" },
      { id: "logbooks", label: "Clinical logbooks", path: "/academic/logbooks" },
      { id: "cme", label: "CME", path: "/academic/cme" },
      { id: "research", label: "Research & trials", path: "/academic/research" },
      { id: "ethics", label: "Ethics committee", path: "/academic/ethics" },
    ],
  },
  {
    id: "public-health",
    label: "Public health",
    icon: "heartbeat",
    comingSoon: true,
    items: [
      { id: "surveillance", label: "Disease surveillance", path: "/public-health/surveillance" },
      { id: "immunisation", label: "Immunisation programmes", path: "/public-health/immunisation" },
      { id: "outreach", label: "Outreach & community", path: "/public-health/outreach" },
      { id: "national-reporting", label: "National reporting", path: "/public-health/reporting" },
    ],
  },
  {
    id: "intelligence",
    label: "Intelligence",
    icon: "chart-line",
    items: [
      { id: "analytics", label: "Analytics & KPIs", path: "/intelligence/analytics" },
      { id: "forecasting", label: "Forecasting", path: "/intelligence/forecasting" },
      { id: "reports", label: "Reports", path: "/intelligence/reports" },
    ],
  },
  {
    id: "system",
    label: "System",
    icon: "adjustments",
    items: [
      { id: "users", label: "Users & roles", path: "/system/users" },
      { id: "facilities", label: "Facilities & sites", path: "/system/facilities" },
      { id: "integration", label: "Integrations (HL7/FHIR)", path: "/system/integration" },
      { id: "security", label: "Security & audit", path: "/system/security" },
      { id: "documents", label: "Documents & templates", path: "/system/documents" },
      { id: "settings", label: "Settings", path: "/system/settings" },
    ],
  },
];

// Flat list of every route, for the router.
export const ALL_ROUTES = NAV_GROUPS.flatMap((g) =>
  g.items.map((it) => ({ ...it, groupId: g.id, groupLabel: g.label }))
);
