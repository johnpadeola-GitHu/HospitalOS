// HospitalOS — Navigation config
// Workflow-ordered groups (LabOS convention).
// "Coming Soon" badges go on GROUP HEADERS only, never individual items.
// Standalone project: Laboratory and Pharmacy are native routes.

export const NAV_GROUPS = [
  {
    id: "overview",
    label: "Overview",
    icon: "LayoutGrid",
    noCollapse: true, // always expanded — the orientation group should never hide
    items: [
      { id: "dashboard", label: "Dashboard", path: "/" , icon: "LayoutDashboard" },
      { id: "my-patients", label: "My patients", path: "/patients/mine" , icon: "UserRound" },
      { id: "worklist", label: "Worklist", path: "/worklist" , icon: "ListChecks" },
      { id: "alerts", label: "Alerts & critical values", path: "/alerts" , icon: "BellRing" },
      { id: "communication", label: "Communication hub", path: "/communication" , icon: "MessagesSquare" },
      { id: "bookings", label: "Online bookings", path: "/bookings" , icon: "CalendarPlus" },
      { id: "referrals", label: "Referrals", path: "/referrals" , icon: "ArrowLeftRight" },
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
      { id: "renal", label: "Renal & dialysis", path: "/renal" , icon: "Droplets" },
      { id: "geriatric", label: "Geriatric unit", path: "/geriatric" , icon: "Users" },
      { id: "mental-health", label: "Mental health unit", path: "/mental-health" , icon: "Brain" },
      { id: "vip-services", label: "VIP services", path: "/vip-services" , icon: "Crown" },
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
      { id: "instruments", label: "Instruments & devices gateway", path: "/instruments" , icon: "Cable" },
    ],
  },
  {
    id: "pharmacy",
    label: "Pharmacy",
    icon: "Pill",
    items: [
      { id: "dispensing", label: "Dispensing", path: "/pharmacy/dispensing" , icon: "Pill" },
      { id: "prescriptions", label: "Prescriptions", path: "/pharmacy/prescriptions" , icon: "ClipboardList" },
      { id: "inventory", label: "Drug inventory", path: "/pharmacy/inventory" , icon: "Package" },
      { id: "formulary", label: "Formulary & NAFDAC", path: "/pharmacy/formulary" , icon: "BookMarked" },
    ],
  },
  {
    id: "specialty-services",
    label: "Specialty services",
    icon: "Layers",
    items: [
      { id: "nutrition", label: "Nutrition & dietetics", path: "/nutrition" , icon: "Apple" },
      { id: "sickle-cell", label: "Sickle cell centre", path: "/sickle-cell" , icon: "Droplet" },
      { id: "dental", label: "Dental & oral health", path: "/dental" , icon: "Smile" },
      { id: "ipc", label: "Infection prevention & control", path: "/ipc" , icon: "ShieldAlert" },
      { id: "social-work", label: "Medical social services", path: "/social-work" , icon: "HeartHandshake" },
      { id: "occ-health", label: "Occupational health", path: "/occupational-health" , icon: "ShieldPlus" },
      { id: "chaplaincy", label: "Chaplaincy & pastoral care", path: "/chaplaincy" , icon: "Church" },
    ],
  },
  {
    id: "finance",
    label: "Finance & trade",
    icon: "Wallet",
    items: [
      { id: "billing", label: "Billing & invoicing", path: "/finance/billing" , icon: "ReceiptText" },
      { id: "payments", label: "Payments & cashiering", path: "/finance/payments" , icon: "Banknote" },
      { id: "claims", label: "Insurance & NHIA claims", path: "/finance/claims" , icon: "FileCheck" },
      { id: "procurement", label: "Procurement & suppliers", path: "/finance/procurement" , icon: "ShoppingCart" },
      { id: "stores", label: "Stores & assets", path: "/finance/stores" , icon: "Boxes" },
      { id: "bank-reconciliation", label: "Bank reconciliation", path: "/finance/bank-reconciliation" , icon: "Landmark" },
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
    icon: "ShieldPlus",
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
    icon: "Gauge",
    items: [
      { id: "analytics", label: "Analytics & KPIs", path: "/intelligence/analytics" , icon: "ChartLine" },
      { id: "forecasting", label: "Forecasting", path: "/intelligence/forecasting" , icon: "TrendingUp" },
      { id: "reports", label: "Reports", path: "/intelligence/reports" , icon: "FileText" },
    ],
  },
  {
    id: "compliance",
    label: "Compliance",
    icon: "ShieldCheck",
    items: [
      { id: "compliance", label: "Compliance & accreditation", path: "/compliance" , icon: "ShieldCheck" },
      { id: "incident-risk", label: "Incident & risk management", path: "/incident-risk" , icon: "TriangleAlert" },
      { id: "policies", label: "Policies & SOPs", path: "/policies" , icon: "FileText" },
    ],
  },
  {
    id: "system",
    label: "Administration",
    icon: "SlidersHorizontal",
    items: [
      { id: "users", label: "Users & roles", path: "/system/users" , icon: "UsersRound" },
      { id: "facilities", label: "Facilities & sites", path: "/system/facilities" , icon: "Hospital" },
      { id: "integration", label: "Instruments gateway", path: "/instruments" , icon: "Cable" },
      { id: "pricing", label: "Pricing", path: "/system/pricing" , icon: "Tags" },
      { id: "documents", label: "Documents & templates", path: "/system/documents" , icon: "Files" },
      { id: "privacy", label: "Privacy & consent", path: "/system/privacy" , icon: "ShieldCheck" },
      { id: "fhir", label: "FHIR interoperability", path: "/system/fhir" , icon: "Share2" },
      { id: "security", label: "Security & audit", path: "/system/security" , icon: "ShieldCheck" },
      { id: "clinical-rules", label: "Clinical decision rules", path: "/system/clinical-rules" , icon: "ShieldAlert" },
      { id: "data-import", label: "Data import", path: "/system/data-import" , icon: "UploadCloud" },
      { id: "settings", label: "Settings", path: "/system/settings" , icon: "Settings" },
    ],
  },
  {
    id: "academy",
    label: "Academy",
    icon: "GraduationCap",
    comingSoon: true,
    items: [
      { id: "academy-home", label: "HospitalOS Academy", path: "/academy" , icon: "GraduationCap" },
    ],
  },
];

// Flat list of every route, for the router.
export const ALL_ROUTES = NAV_GROUPS.flatMap((g) =>
  g.items.map((it) => ({ ...it, groupId: g.id, groupLabel: g.label }))
);
