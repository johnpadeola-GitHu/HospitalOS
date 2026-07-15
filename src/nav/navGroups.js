// HospitalOS — Navigation config
// Workflow-ordered groups (LabOS convention).
// "Coming Soon" badges go on GROUP HEADERS only, never individual items.
// Standalone project: Laboratory and Pharmacy are native routes.

export const NAV_GROUPS = [
  {
    id: "overview",
    label: "Overview",
    icon: "LayoutGrid",
    items: [
      { id: "dashboard", label: "Dashboard", path: "/" , icon: "LayoutDashboard" },
      { id: "my-patients", label: "My patients", path: "/patients/mine" , icon: "UserRound" },
      { id: "worklist", label: "Worklist", path: "/worklist" , icon: "ListChecks" },
      { id: "alerts", label: "Alerts & critical values", path: "/alerts" , icon: "BellRing" },
      { id: "help", label: "Help & documentation", path: "/help" , icon: "BookOpen" },
      { id: "communication", label: "Communication hub", path: "/communication" , icon: "MessagesSquare" },
    ],
  },
  {
    id: "patient-care",
    label: "Patient care",
    icon: "HeartPulse",
    items: [
      { id: "registration", label: "Registration & ADT", path: "/patients/adt" , icon: "UserPlus" },
      { id: "records", label: "Medical records", path: "/records" , icon: "FileHeart" },
      { id: "outpatient", label: "Outpatient (GOPD & clinics)", path: "/outpatient" , icon: "ClipboardList" },
      { id: "emergency", label: "Emergency & observation", path: "/emergency" , icon: "Siren" },
      { id: "wards", label: "Wards & bed management", path: "/wards" , icon: "BedDouble" },
      { id: "critical-care", label: "ICU / HDU", path: "/critical-care" , icon: "Activity" },
      { id: "theatre", label: "Theatre & day surgery", path: "/theatre" , icon: "Scissors" },
      { id: "maternity", label: "Maternity & neonatology", path: "/maternity" , icon: "Baby" },
      { id: "specialties", label: "Specialist clinics", path: "/specialties" , icon: "Stethoscope" },
      { id: "oncology", label: "Oncology", path: "/oncology" , icon: "Ribbon" },
      { id: "rehab", label: "Rehabilitation & therapy", path: "/rehab" , icon: "Accessibility" },
      { id: "bookings", label: "Online bookings", path: "/bookings" , icon: "CalendarPlus" },
    ],
  },
  {
    id: "diagnostics",
    label: "Diagnostics",
    icon: "Microscope",
    items: [
      { id: "laboratory", label: "Laboratory", path: "/lab" , icon: "TestTube" },
      { id: "blood-bank", label: "Blood bank & transfusion", path: "/blood-bank" , icon: "Droplet" },
      { id: "radiology", label: "Radiology & imaging", path: "/radiology" , icon: "ScanLine" },
      { id: "ultrasound", label: "Ultrasound", path: "/ultrasound" , icon: "Waves" },
      { id: "ct-scan", label: "CT scan", path: "/ct-scan" , icon: "ScanFace" },
      { id: "mri", label: "MRI", path: "/mri" , icon: "Magnet" },
      { id: "radiotherapy", label: "Radiotherapy", path: "/radiotherapy" , icon: "Radiation" },
      { id: "poct", label: "Point of care testing", path: "/poct" , icon: "Timer" },
      { id: "lab-utilities", label: "Lab utilities", path: "/lab-utilities" , icon: "Calculator" },
      { id: "biobank", label: "Biobanking", path: "/biobank" , icon: "Archive" },
      { id: "diagnostic-intel", label: "Diagnostic intelligence", path: "/diagnostic-intel" , icon: "Brain" },
    ],
  },
  {
    id: "pharmacy",
    label: "Pharmacy",
    icon: "Pill",
    items: [
      { id: "dispensing", label: "Dispensing", path: "/pharmacy/dispensing" , icon: "Pill" },
      { id: "inventory", label: "Drug inventory", path: "/pharmacy/inventory" , icon: "Package" },
      { id: "formulary", label: "Formulary & NAFDAC", path: "/pharmacy/formulary" , icon: "BookMarked" },
    ],
  },
  {
    id: "finance",
    label: "Finance & trade",
    icon: "Wallet",
    items: [
      { id: "billing", label: "Billing & invoicing", path: "/finance/billing" , icon: "ReceiptText" },
      { id: "payments", label: "Payments & cashiering", path: "/finance/payments" , icon: "Banknote" },
      { id: "claims", label: "Insurance & NHIS claims", path: "/finance/claims" , icon: "FileCheck" },
      { id: "procurement", label: "Procurement & suppliers", path: "/finance/procurement" , icon: "ShoppingCart" },
      { id: "stores", label: "Stores & assets", path: "/finance/stores" , icon: "Boxes" },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    icon: "Cog",
    items: [
      { id: "scheduling", label: "Scheduling & rosters", path: "/ops/scheduling" , icon: "CalendarClock" },
      { id: "cssd", label: "CSSD & sterile supply", path: "/ops/cssd" , icon: "Recycle" },
      { id: "biomedical", label: "Biomedical engineering", path: "/ops/biomedical" , icon: "Wrench" },
      { id: "facility", label: "Facility & waste", path: "/ops/facility" , icon: "Building2" },
      { id: "fleet", label: "Ambulance & fleet", path: "/ops/fleet" , icon: "Ambulance" },
      { id: "support", label: "Catering, laundry & mortuary", path: "/ops/support" , icon: "UtensilsCrossed" },
      { id: "visitor", label: "Visitor & security", path: "/ops/visitor" , icon: "IdCard" },
    ],
  },
  {
    id: "academic",
    label: "Academic",
    icon: "GraduationCap",
    comingSoon: true,
    items: [
      { id: "training", label: "Training & rotations", path: "/academic/training" , icon: "GraduationCap" },
      { id: "logbooks", label: "Clinical logbooks", path: "/academic/logbooks" , icon: "NotebookPen" },
      { id: "cme", label: "CME", path: "/academic/cme" , icon: "Award" },
      { id: "research", label: "Research & trials", path: "/academic/research" , icon: "FlaskConical" },
      { id: "ethics", label: "Ethics committee", path: "/academic/ethics" , icon: "Scale" },
    ],
  },
  {
    id: "public-health",
    label: "Public health",
    icon: "Globe",
    comingSoon: true,
    items: [
      { id: "surveillance", label: "Disease surveillance", path: "/public-health/surveillance" , icon: "Radar" },
      { id: "immunisation", label: "Immunisation programmes", path: "/public-health/immunisation" , icon: "Syringe" },
      { id: "outreach", label: "Outreach & community", path: "/public-health/outreach" , icon: "Users" },
      { id: "national-reporting", label: "National reporting", path: "/public-health/reporting" , icon: "FileBarChart" },
    ],
  },
  {
    id: "intelligence",
    label: "Intelligence",
    icon: "ChartNoAxesCombined",
    items: [
      { id: "analytics", label: "Analytics & KPIs", path: "/intelligence/analytics" , icon: "ChartLine" },
      { id: "forecasting", label: "Forecasting", path: "/intelligence/forecasting" , icon: "TrendingUp" },
      { id: "reports", label: "Reports", path: "/intelligence/reports" , icon: "FileText" },
    ],
  },
  {
    id: "system",
    label: "Administration",
    icon: "SlidersHorizontal",
    items: [
      { id: "users", label: "Users & roles", path: "/system/users" , icon: "UsersRound" },
      { id: "facilities", label: "Facilities & sites", path: "/system/facilities" , icon: "Hospital" },
      { id: "integration", label: "Integrations (HL7/FHIR)", path: "/system/integration" , icon: "Network" },
      { id: "security", label: "Security & audit", path: "/system/security" , icon: "ShieldCheck" },
      { id: "documents", label: "Documents & templates", path: "/system/documents" , icon: "Files" },
      { id: "settings", label: "Settings", path: "/system/settings" , icon: "Settings" },
    ],
  },
];

// Flat list of every route, for the router.
export const ALL_ROUTES = NAV_GROUPS.flatMap((g) =>
  g.items.map((it) => ({ ...it, groupId: g.id, groupLabel: g.label }))
);
