// Help content — searchable articles covering every area of HospitalOS.

export const ARTICLES = [
  {
    id: "getting-started", section: "Getting started", icon: "Rocket",
    title: "How HospitalOS is organised",
    body: [
      "HospitalOS is arranged by workflow, not by org chart. The sidebar has ten groups, ordered roughly the way work flows through a hospital: Overview, Patient care, Diagnostics, Pharmacy, Finance & trade, Operations, Academic, Public health, Intelligence, and System.",
      "You only see the groups your role grants. A pharmacist sees Overview and Pharmacy; a cashier sees Overview and Finance. Nothing is hidden to be secretive — it's to keep your sidebar to what you actually use.",
      "Start on the Dashboard. Every stat card is a link into the module behind it.",
    ],
  },
  {
    id: "signing-in", section: "Getting started", icon: "LogIn",
    title: "Signing in and roles",
    body: [
      "Sign in with your hospital email. Your role determines what you can reach — it's set by a System administrator under System → Users & roles.",
      "There are eight built-in roles: Super Admin, Doctor, Nurse, Lab Scientist, Radiographer, Pharmacist, Cashier, and Records Officer. The permission matrix on that screen shows exactly what each can access.",
      "If you need access to an area you can't see, ask a System administrator rather than sharing an account.",
    ],
  },
  {
    id: "register-patient", section: "Patient care", icon: "UserPlus",
    title: "Registering and admitting a patient",
    body: [
      "Go to Patient care → Registration & ADT. Click 'Register patient' and enter name, sex, and date of birth. A hospital number is assigned automatically (H001005, and so on).",
      "Once registered, a patient can be admitted. Click Admit, choose a ward, then pick a bed — the list only shows beds that are actually free, so you cannot double-book.",
      "Transfer moves an admitted patient to another bed and releases the old one. Discharge frees the bed entirely. Both are one click from the same row.",
    ],
  },
  {
    id: "beds", section: "Patient care", icon: "BedDouble",
    title: "Reading the bed board",
    body: [
      "Patient care → Wards & bed management shows every bed in the hospital. Occupied beds are tinted and show the patient's surname; free beds are pale.",
      "The strip along the top gives total, occupied, free, and occupancy percentage. A ward at or above 90% turns amber on the Dashboard so you can see pressure building.",
      "The bed board and the ADT screen share one registry — admitting someone in ADT shows them here immediately.",
    ],
  },
  {
    id: "emergency", section: "Patient care", icon: "Siren",
    title: "Running the emergency board",
    body: [
      "Emergency & observation orders patients by triage acuity, not arrival time — level 1 (Resuscitation) sits above level 5 (Non-urgent), and within the same level the longest wait comes first.",
      "You can present an unregistered patient. Tick 'Unregistered patient' for trauma arrivals with no record yet, and register them properly later.",
      "Move patients Waiting → In treatment → Observation, then Dispose (admit, discharge, or transfer). Disposed encounters leave the board but stay in history.",
    ],
  },
  {
    id: "lab-order", section: "Diagnostics", icon: "TestTube",
    title: "Ordering a test and entering results",
    body: [
      "Diagnostics → Laboratory. Click 'Order test', search for the patient, pick a test. An accession number is generated (LAB-000242).",
      "The lifecycle is strict: Ordered → Collected → Resulted → Verified. You cannot enter results before collecting the sample, and cannot verify before results exist. This is deliberate.",
      "As you type each value it is flagged live against the reference range — Low, High, or Critical. A critical value puts a red dot on the accession and raises a hospital-wide alert immediately.",
    ],
  },
  {
    id: "instruments", section: "Diagnostics", icon: "Cable",
    title: "How the instruments gateway works",
    body: [
      "Diagnostics → Instruments gateway lists every connected analyzer with its AE title, host:port, protocol, and the test codes it can run.",
      "When an analyzer completes a run it posts an HL7 v2 ORU^R01 message. The gateway matches it to the accession, writes the values onto the order, and the result flags exactly as if typed by hand.",
      "An analyzer will only result tests it handles — the Cobas will not accept an FBC. Offline analyzers are refused. Errored or offline instruments raise alerts so the interface never fails silently.",
      "'Receive result' simulates an inbound message through the same code path a live analyzer uses. Live MLLP listening runs server-side.",
    ],
  },
  {
    id: "blood", section: "Diagnostics", icon: "Droplet",
    title: "Crossmatching and transfusion",
    body: [
      "Blood bank & transfusion has two tabs: Inventory (units by group, with expiry and reorder flags) and Transfusion requests.",
      "Create a request with the recipient's blood group. The system reserves a compatible unit using real ABO/Rh rules — an O− recipient can only receive O−, an AB+ recipient can receive any group. If no compatible unit exists, the request fails rather than guessing.",
      "The flow is Crossmatched → Issued → Transfused. Groups below reorder and units within five days of expiry raise alerts.",
    ],
  },
  {
    id: "dispensing", section: "Pharmacy", icon: "Pill",
    title: "Dispensing medication",
    body: [
      "Pharmacy → Dispensing lists the formulary with NAFDAC numbers, stock levels, and naira pricing.",
      "Click Dispense, search the patient, enter a quantity. The naira total computes as you type. Dispensing decrements stock and logs the event with a reference.",
      "You cannot oversell — a quantity above available stock is blocked — and out-of-stock drugs cannot be dispensed at all.",
      "Restocking above the reorder level in Pharmacy → Inventory clears that drug's alert automatically. There is no separate 'dismiss' step.",
    ],
  },
  {
    id: "billing", section: "Finance", icon: "ReceiptText",
    title: "Billing, payments, and claims",
    body: [
      "Finance → Billing aggregates charges per patient from four sources: lab orders, pharmacy dispenses, radiology studies, and theatre procedures. You do not enter charges manually — they arrive from the work itself.",
      "A theatre case becomes billable only once it enters theatre, not when it's merely scheduled.",
      "Take payment records against the balance (Cash, Card, Transfer, NHIS) and issues a receipt. Overpayment is blocked.",
      "Finance → Claims tracks NHIS/HMO submissions: Submitted → Approved or Rejected → Paid. You cannot pay an unapproved claim.",
    ],
  },
  {
    id: "alerts", section: "Alerts", icon: "BellRing",
    title: "What raises an alert",
    body: [
      "Overview → Alerts is one feed for the whole hospital. The red badge on the sidebar updates every few seconds, so a critical result reaches you wherever you are.",
      "Ten sources feed it: critical lab results, pharmacy low/out of stock, urgent radiology findings, equipment and vehicle issues, unstable ICU/HDU vitals, blood stock and expiry, low-Apgar newborns, overdue chemo cycles, rising notifiable diseases, and analyzer faults.",
      "Critical alerts sort above warnings. Acknowledging clears an alert from the active feed; 'Show acknowledged' brings it back for audit.",
      "Many alerts clear themselves when the underlying problem is fixed — restock a drug, stabilise a patient, and the alert goes on its own.",
    ],
  },
  {
    id: "icu", section: "Patient care", icon: "Activity",
    title: "Monitoring critical care",
    body: [
      "Patient care → ICU / HDU shows every occupied critical-care bed with five vitals: heart rate, systolic BP, SpO₂, respiratory rate, and temperature.",
      "Each vital is flagged against critical thresholds. Any critical value marks the patient Unstable, sorts them to the top of the board, and raises an alert.",
      "Record vitals to update. If the new readings are within range, the Unstable flag and its alert clear automatically.",
    ],
  },
  {
    id: "specialties", section: "Patient care", icon: "Stethoscope",
    title: "Specialist clinics and referrals",
    body: [
      "All 21 specialties — 11 medical (including Geriatrics, Cardiology, Neurology) and 10 surgical — live inside Specialist clinics as departments, not as separate sidebar items.",
      "This is deliberate: from the system's point of view these share one workflow. A consultant runs a clinic, sees referrals, orders diagnostics. The department is context, not a different screen.",
      "Refer a patient to a department with a reason. The flow is Referred → Scheduled → Seen. Each department card shows its live open-referral count.",
    ],
  },
  {
    id: "records", section: "Patient care", icon: "FileHeart",
    title: "The patient chart and clinical notes",
    body: [
      "Patient care → Medical records is the clinical record. Pick a patient and you get their whole picture: notes, problem list, allergies, and results history in one place.",
      "Notes use the SOAP structure — Subjective (what the patient reports), Objective (examination findings), Assessment (your impression, required), Plan (what happens next).",
      "A filed note cannot be edited or deleted. This is deliberate and matches paper practice: corrections are recorded as an amendment, a new note that references the original while both stay visible. A record you can quietly rewrite is not a record.",
      "The problem list carries ICD-10 coded diagnoses, marked active, chronic, or resolved.",
    ],
  },
  {
    id: "allergies", section: "Patient care", icon: "TriangleAlert",
    title: "Allergies and dispensing safety",
    body: [
      "Recording an allergy on the patient chart is not paperwork — it is a safety control.",
      "When pharmacy dispenses, the system checks the drug name against that patient's recorded allergies. A match raises a visible alert in the dispensing dialog.",
      "A severe allergy blocks dispensing outright. The button is disabled; there is no override in the interface.",
      "An allergy banner also appears at the top of the patient's chart so it is seen before anything else.",
    ],
  },
  {
    id: "accommodation", section: "Patient care", icon: "BedDouble",
    title: "Accommodation tiers and bed charges",
    body: [
      "Wards carry an accommodation tier: General Ward, Semi-Private, Private Room, Private Suite, VIP Suite, Executive Suite, and Critical Care.",
      "Each tier has a nightly rate — a general bed is ₦15,000/night, an Executive Suite ₦350,000/night. The ward board shows the tier and rate on each ward.",
      "Bed charges flow automatically into Billing. Occupancy is timestamped on admission, whole nights are billed (minimum one), and the charge appears on the patient's account alongside their lab, pharmacy, radiology and theatre charges.",
    ],
  },
  {
    id: "roles-admin", section: "Administration", icon: "UsersRound",
    title: "Managing users and access",
    body: [
      "System → Users & roles is the directory. Add users, change roles inline, and activate or deactivate accounts.",
      "The permission matrix maps each role to the sidebar groups it can reach. Roles are keyed to those groups, so access control and navigation stay in step.",
      "One guard you cannot override: the last active Super Admin cannot be deactivated. That prevents locking everyone out of the system.",
    ],
  },
  {
    id: "data-note", section: "Administration", icon: "Database",
    title: "About the current data layer",
    body: [
      "HospitalOS currently runs on an in-memory data layer. Records live for the session and reset on reload — this is a preview build, not a production deployment.",
      "Every service is written as an async API deliberately shaped like a network layer. When the Cloudflare D1 backend lands, each service file swaps its internals for Worker calls and no screen changes.",
      "Do not enter real patient data into a preview build.",
    ],
  },
];

export const SECTIONS = [...new Set(ARTICLES.map((a) => a.section))];

export function searchArticles(q) {
  const t = q.trim().toLowerCase();
  if (!t) return ARTICLES;
  return ARTICLES.filter(
    (a) =>
      a.title.toLowerCase().includes(t) ||
      a.section.toLowerCase().includes(t) ||
      a.body.some((p) => p.toLowerCase().includes(t))
  );
}
