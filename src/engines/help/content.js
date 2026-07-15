// Help content.
//
// CATEGORIES group ARTICLES. Each article has a lead (shown on cards), a body of
// blocks, and optional related links.
// Body blocks: { p } paragraph, { h } subheading, { list } bullets,
// { steps } numbered, { note } callout, { warn } warning, { table } {head, rows}.

export const CATEGORIES = [
  { key: "start", label: "Getting started", icon: "Rocket", blurb: "Orientation, signing in, and how the system is laid out." },
  { key: "clinical", label: "Clinical workflows", icon: "Stethoscope", blurb: "Registration, admission, records, emergency, critical care." },
  { key: "diagnostics", label: "Diagnostics", icon: "Microscope", blurb: "Laboratory, imaging, blood bank, and the instruments gateway." },
  { key: "pharmacy", label: "Pharmacy", icon: "Pill", blurb: "Dispensing, inventory, and allergy safety." },
  { key: "finance", label: "Finance", icon: "Wallet", blurb: "Billing, payments, claims, and accommodation charges." },
  { key: "safety", label: "Safety & alerts", icon: "BellRing", blurb: "What raises an alert and how alerts clear." },
  { key: "admin", label: "Administration", icon: "SlidersHorizontal", blurb: "Users, roles, permissions, and the audit trail." },
  { key: "reference", label: "Reference", icon: "BookMarked", blurb: "Shortcuts, glossary, and current limitations." },
];

export const ARTICLES = [
  {
    id: "orientation", cat: "start", icon: "Compass",
    title: "How HospitalOS is organised",
    lead: "The sidebar follows how work moves through a hospital, not the org chart.",
    body: [
      { p: "HospitalOS is arranged by workflow. The ten sidebar groups run roughly in the order work happens: Overview, Patient care, Diagnostics, Pharmacy, Finance & trade, Operations, Academic, Public health, Intelligence, and Administration." },
      { h: "Why groups, not departments" },
      { p: "A cardiologist and a geriatrician do the same thing from the software's point of view: run a clinic, see referrals, order tests. So all 21 specialties live inside one Specialist clinics module as filterable departments rather than 21 sidebar rows. The department is context, not a different screen." },
      { h: "You only see what your role grants" },
      { p: "A pharmacist sees Overview and Pharmacy. A cashier sees Overview and Finance. This is not secrecy \u2014 it keeps your sidebar to what you actually use. The number beside each group tells you how many screens sit inside it." },
      { note: "Start on the Dashboard. Every stat card links into the module behind it." },
    ],
    related: ["signing-in", "roles-explained"],
  },
  {
    id: "signing-in", cat: "start", icon: "LogIn",
    title: "Signing in",
    lead: "Your hospital email and role determine everything you can reach.",
    body: [
      { p: "Sign in with your hospital email address. Your role is set by an administrator under Administration \u2192 Users & roles and determines both which areas you can open and which actions you can take within them." },
      { h: "Demo accounts" },
      { table: {
        head: ["Account", "Password", "Sees"],
        rows: [
          ["support@agorox.africa", "agorox", "Everything, plus the Platform view"],
          ["a.ogun@hospitalos.ng", "demo", "Everything (Super Admin)"],
          ["n.umeh@hospitalos.ng", "demo", "Patient care, Diagnostics, Pharmacy"],
          ["b.ade@hospitalos.ng", "demo", "Patient care only (Nurse)"],
          ["t.bello@hospitalos.ng", "demo", "Pharmacy only"],
          ["a.nwosu@hospitalos.ng", "demo", "Finance only (Cashier)"],
        ],
      } },
      { warn: "Sign-in currently runs in the browser and is not secure. It is the correct shape for a real auth layer, not a substitute for one. Production verifies credentials server-side." },
    ],
    related: ["roles-explained", "orientation"],
  },
  {
    id: "platform-view", cat: "start", icon: "ShieldCheck",
    title: "The Platform view",
    lead: "AgoroX support can switch between the hospital and the platform.",
    body: [
      { p: "Only support@agorox.africa carries platform admin rights. That account sees a Hospital / Platform toggle in the topbar." },
      { p: "The Platform view is the vendor's side: tenant management across deployments (plans, seats, active users, MRR, suspend and activate), platform health for the services behind HospitalOS, feature flags per plan tier, and recent deployments." },
      { note: "Switching to Platform hides the hospital sidebar entirely \u2014 it is a different context, not a section of the hospital app." },
    ],
  },

  {
    id: "register-admit", cat: "clinical", icon: "UserPlus",
    title: "Registering and admitting a patient",
    lead: "From walk-in to a bed, and the guards that prevent double-booking.",
    body: [
      { h: "Registering" },
      { steps: [
        "Patient care \u2192 Registration & ADT.",
        "Click Register patient. Name, sex and date of birth are required.",
        "A hospital number is assigned automatically (H001005, and so on).",
      ] },
      { h: "Admitting" },
      { steps: [
        "Find the patient and click Admit.",
        "Choose a ward. The bed list then shows only beds that are actually free.",
        "Confirm. The bed is reserved immediately and shows as occupied on the ward board.",
      ] },
      { note: "You cannot double-book a bed. Admit and the bed board read the same registry, so a bed taken in one is unavailable in the other instantly." },
      { h: "Transfer and discharge" },
      { p: "Transfer moves an admitted patient to another bed and releases the old one in the same action. Discharge frees the bed entirely. Both are one click from the patient's row." },
      { p: "Not every role can do all of this. A nurse can admit but not discharge \u2014 see the permission matrix." },
    ],
    related: ["beds-tiers", "roles-explained", "records"],
  },
  {
    id: "records", cat: "clinical", icon: "FileHeart",
    title: "The patient chart",
    lead: "Notes, problem list, allergies and results in one place \u2014 and why notes cannot be edited.",
    body: [
      { p: "Patient care \u2192 Medical records is the clinical record. Select a patient and you get their whole picture across four tabs: Notes, Problem list, Allergies, and Results." },
      { h: "Writing notes" },
      { p: "Notes use the SOAP structure \u2014 Subjective (what the patient reports), Objective (examination findings), Assessment (your clinical impression, required), Plan (what happens next). Note types cover consultation, progress, operation, nursing, and discharge summary." },
      { h: "Notes are permanent" },
      { p: "A filed note cannot be edited or deleted. This is deliberate and mirrors paper practice: a record you can quietly rewrite is not a record. Corrections are filed as an amendment \u2014 a new note that references the original, with both remaining visible." },
      { h: "Problem list" },
      { p: "ICD-10 coded diagnoses marked active, chronic, or resolved. The same diagnosis cannot be added twice while unresolved." },
      { warn: "Do not enter real patient data. This is a preview build on an in-memory layer \u2014 records reset on reload." },
    ],
    related: ["allergies", "audit"],
  },
  {
    id: "allergies", cat: "clinical", icon: "TriangleAlert",
    title: "Allergies and dispensing safety",
    lead: "Recording an allergy is a control, not paperwork \u2014 a severe one blocks dispensing.",
    body: [
      { p: "Allergies are recorded on the patient chart with the substance, the reaction, and a severity of mild, moderate, or severe." },
      { h: "What it actually does" },
      { list: [
        "An allergy banner appears at the top of the patient's chart, before anything else.",
        "When pharmacy dispenses, the drug name is checked against that patient's recorded allergies.",
        "A match raises a visible alert inside the dispensing dialog, naming the substance, reaction and severity.",
        "A severe allergy disables the dispense button entirely.",
      ] },
      { warn: "There is no override in the interface for a severe allergy. If a clinician judges the drug necessary, that decision belongs in a clinical note, not a bypassed button." },
    ],
    related: ["records", "dispensing"],
  },
  {
    id: "emergency", cat: "clinical", icon: "Siren",
    title: "The emergency board",
    lead: "Ordered by acuity, not arrival \u2014 and unregistered patients are expected.",
    body: [
      { p: "Emergency & observation sorts by triage acuity first and arrival time second. A level 1 patient who just arrived sits above a level 4 who has waited an hour. Within the same level, the longest wait comes first." },
      { table: {
        head: ["Level", "Meaning"],
        rows: [["1", "Resuscitation"], ["2", "Emergent"], ["3", "Urgent"], ["4", "Less urgent"], ["5", "Non-urgent"]],
      } },
      { h: "Unregistered arrivals" },
      { p: "Tick 'Unregistered patient' for trauma arrivals with no record yet. They go on the board immediately and can be registered properly once stable \u2014 the board does not wait on paperwork." },
      { p: "Move patients Waiting \u2192 In treatment \u2192 Observation, then Dispose (admit, discharge, or transfer). Disposed encounters leave the board but remain in history." },
    ],
    related: ["icu", "register-admit"],
  },
  {
    id: "icu", cat: "clinical", icon: "Activity",
    title: "ICU and HDU monitoring",
    lead: "Five vitals per bed, flagged live, with alerts that clear themselves.",
    body: [
      { p: "Patient care \u2192 ICU / HDU shows every occupied critical-care bed with heart rate, systolic BP, SpO\u2082, respiratory rate, and temperature." },
      { table: {
        head: ["Vital", "Normal", "Critical"],
        rows: [
          ["Heart rate", "60\u2013100 bpm", "\u226440 or \u2265130"],
          ["Systolic BP", "90\u2013140 mmHg", "\u226480 or \u2265180"],
          ["SpO\u2082", "94\u2013100%", "\u226488"],
          ["Resp. rate", "12\u201320 /min", "\u22648 or \u226530"],
          ["Temperature", "36\u201337.8\u00b0C", "\u226435 or \u226539.5"],
        ],
      } },
      { p: "Any critical value marks the patient Unstable, sorts them to the top of the board, and raises a hospital-wide alert. Record improved vitals and the flag and its alert clear automatically \u2014 there is nothing to dismiss." },
    ],
    related: ["alerts", "beds-tiers"],
  },
  {
    id: "beds-tiers", cat: "clinical", icon: "BedDouble",
    title: "Ward board and accommodation tiers",
    lead: "Seven tiers, each with a nightly rate that flows into the bill.",
    body: [
      { p: "The ward board shows every bed in the hospital. Occupied beds are tinted with the patient's surname; free beds are pale. Each ward displays its accommodation tier and nightly rate." },
      { table: {
        head: ["Tier", "Rate per night"],
        rows: [
          ["General Ward", "\u20a615,000"], ["Semi-Private", "\u20a635,000"], ["Private Room", "\u20a660,000"],
          ["Private Suite", "\u20a6120,000"], ["VIP Suite", "\u20a6220,000"], ["Executive Suite", "\u20a6350,000"],
          ["Critical Care", "\u20a6180,000"],
        ],
      } },
      { p: "Occupancy is timestamped on admission. Bed-nights are billed automatically at the tier rate \u2014 whole nights, minimum one \u2014 and appear on the patient's account alongside their other charges." },
      { note: "A ward at or above 90% occupancy turns amber on the Dashboard so pressure is visible before it becomes a problem." },
    ],
    related: ["billing", "register-admit"],
  },
  {
    id: "maternity", cat: "clinical", icon: "Baby",
    title: "Labour and delivery",
    lead: "Stage progression, delivery recording, and the low-Apgar alert.",
    body: [
      { p: "Maternity & neonatology tracks mothers through Admitted \u2192 First stage \u2192 Second stage \u2192 Delivered." },
      { p: "Delivery is a deliberate action, not an automatic stage change. Record the mode (spontaneous vaginal, assisted vaginal, or caesarean) and each newborn's sex, weight and Apgar score. Twins are supported \u2014 add a second newborn in the same record." },
      { warn: "A newborn with an Apgar below 7 raises a critical alert immediately, naming the baby's weight and score." },
    ],
    related: ["alerts"],
  },

  {
    id: "lab", cat: "diagnostics", icon: "TestTube",
    title: "Ordering tests and entering results",
    lead: "A strict lifecycle, live reference-range flagging, and instant critical alerts.",
    body: [
      { h: "The lifecycle is strict" },
      { p: "Ordered \u2192 Collected \u2192 Resulted \u2192 Verified. You cannot enter results before collecting the sample, and cannot verify before results exist. These gates encode the physical reality that you cannot analyse a sample you have not taken." },
      { steps: [
        "Diagnostics \u2192 Laboratory \u2192 Order test.",
        "Search the patient, pick a test. An accession number is generated (LAB-000242).",
        "Collect the sample when taken.",
        "Enter results \u2014 values flag live as you type.",
        "Verify. Verification is a separate permission from resulting.",
      ] },
      { h: "Flagging" },
      { p: "Each value is checked against its reference range and marked Low, High, or Critical as you type. A critical value puts a red dot on the accession and raises a hospital-wide alert the moment it is saved." },
      { note: "The catalogue covers FBC, U&E, Glucose, Malaria Parasite, and LFT, each with its own analytes, units, and panic thresholds." },
    ],
    related: ["instruments", "alerts"],
  },
  {
    id: "instruments", cat: "diagnostics", icon: "Cable",
    title: "The instruments gateway",
    lead: "Analyzers post HL7 results straight onto lab orders.",
    body: [
      { p: "Diagnostics \u2192 Instruments gateway lists every connected analyzer with its AE title, host and port, protocol, and the test codes it can run." },
      { h: "How results arrive" },
      { p: "When an analyzer completes a run it posts an HL7 v2 ORU^R01 message. The gateway matches it to the accession, writes the values onto the order, and the result flags exactly as if a scientist had typed it. Nothing downstream knows the difference." },
      { h: "Guards" },
      { list: [
        "An analyzer only results tests it handles \u2014 the Cobas will not accept an FBC.",
        "Offline analyzers are refused.",
        "A sample that has not been collected cannot be resulted.",
        "Errored or offline instruments raise alerts, so the interface never fails silently.",
      ] },
      { note: "'Receive result' simulates an inbound message through the same code path a live analyzer uses. Live MLLP listening runs server-side." },
    ],
    related: ["lab", "alerts"],
  },
  {
    id: "blood", cat: "diagnostics", icon: "Droplet",
    title: "Blood bank and transfusion",
    lead: "Real ABO/Rh compatibility \u2014 the system refuses rather than guesses.",
    body: [
      { p: "Two tabs: Inventory (units by group with expiry and reorder flags) and Transfusion requests." },
      { h: "Crossmatching" },
      { p: "Create a request with the recipient's blood group. The system reserves a compatible unit using genuine ABO/Rh rules \u2014 an O\u2212 recipient can only receive O\u2212; an AB+ recipient can receive any group. If no compatible unit exists, the request fails rather than guessing." },
      { p: "The flow is Crossmatched \u2192 Issued \u2192 Transfused. Each step releases or commits the reserved unit." },
      { warn: "Groups below their reorder level raise a critical alert. Units within five days of expiry raise a warning." },
    ],
    related: ["alerts"],
  },

  {
    id: "dispensing", cat: "pharmacy", icon: "Pill",
    title: "Dispensing medication",
    lead: "Stock guards, naira totals, and an allergy check that can stop you.",
    body: [
      { p: "Pharmacy \u2192 Dispensing lists the formulary with NAFDAC registration numbers, stock levels, and naira pricing." },
      { steps: [
        "Click Dispense on the drug.",
        "Search and select the patient \u2014 the allergy check runs immediately.",
        "Enter a quantity. The naira total computes as you type.",
        "Confirm. Stock decrements and the event is logged with a reference.",
      ] },
      { h: "What is blocked" },
      { list: [
        "Quantities above available stock \u2014 you cannot oversell.",
        "Out-of-stock drugs \u2014 the button is disabled.",
        "Any drug matching a severe recorded allergy for that patient.",
      ] },
    ],
    related: ["allergies", "inventory"],
  },
  {
    id: "inventory", cat: "pharmacy", icon: "Package",
    title: "Inventory and restocking",
    lead: "Restocking above the reorder level clears the alert by itself.",
    body: [
      { p: "Pharmacy \u2192 Inventory shows each drug's stock, reorder threshold, and status. Filter to 'Needs reorder only' to see just what matters." },
      { p: "The restock dialog previews the new stock level and tells you when the quantity you are adding will clear that drug's reorder alert." },
      { note: "There is no dismiss button for stock alerts. Alerts read the live stock level, so fixing the problem removes the alert. This is true across the system: alerts describe reality rather than tracking acknowledgements." },
    ],
    related: ["dispensing", "alerts"],
  },

  {
    id: "billing", cat: "finance", icon: "ReceiptText",
    title: "Billing and payments",
    lead: "Charges arrive from the work itself \u2014 nobody types them in.",
    body: [
      { p: "Finance \u2192 Billing aggregates charges per patient from five sources: lab orders, pharmacy dispenses, radiology studies, theatre procedures, and accommodation bed-nights." },
      { h: "Charges follow reality" },
      { list: [
        "A theatre case becomes billable when it enters theatre, not when it is scheduled.",
        "A radiology study becomes billable once performed, not when requested.",
        "Bed-nights bill at the ward's accommodation tier rate from the admission timestamp.",
      ] },
      { h: "Taking payment" },
      { p: "Payments record against the outstanding balance (Cash, Card, Transfer, or NHIS) and issue a receipt. Overpayment is blocked. Every receipt appears in Finance \u2192 Payments as a hospital-wide ledger." },
    ],
    related: ["claims", "beds-tiers"],
  },
  {
    id: "claims", cat: "finance", icon: "FileCheck",
    title: "Insurance and NHIS claims",
    lead: "A guarded lifecycle with separation of duties built in.",
    body: [
      { p: "Claims move Submitted \u2192 Approved or Rejected \u2192 Paid. The lifecycle is enforced: you cannot pay an unapproved claim, and you cannot reject one that has already been approved." },
      { warn: "A cashier can file claims but cannot approve them. This separation is deliberate \u2014 the person raising a claim should not be the person authorising it." },
    ],
    related: ["billing", "roles-explained"],
  },

  {
    id: "alerts", cat: "safety", icon: "BellRing",
    title: "The alert system",
    lead: "Ten sources, one feed, and most alerts clear themselves.",
    body: [
      { p: "Overview \u2192 Alerts is a single feed for the whole hospital. The red badge on the sidebar refreshes every few seconds, so a critical result reaches you wherever you are working." },
      { h: "What raises an alert" },
      { table: {
        head: ["Source", "Trigger", "Severity"],
        rows: [
          ["Laboratory", "Result beyond a panic threshold", "Critical"],
          ["Critical care", "Any critical vital in ICU/HDU", "Critical"],
          ["Radiology", "Urgent finding flagged on a report", "Critical"],
          ["Maternity", "Newborn Apgar below 7", "Critical"],
          ["Blood bank", "Group below reorder / unit near expiry", "Critical / Warning"],
          ["Pharmacy", "Out of stock / below reorder", "Critical / Warning"],
          ["Instruments", "Analyzer errored or offline", "Critical / Warning"],
          ["Operations", "Equipment under repair, vehicle out of service", "Warning"],
          ["Oncology", "Chemotherapy cycle overdue", "Warning"],
          ["Public health", "Notifiable disease trending up", "Warning"],
        ],
      } },
      { h: "How alerts clear" },
      { p: "Critical alerts sort above warnings. Acknowledging removes an alert from the active feed and 'Show acknowledged' brings it back for audit. But most alerts do not need acknowledging at all \u2014 restock the drug, stabilise the patient, repair the analyzer, and the alert disappears because the condition that caused it is gone." },
    ],
    related: ["icu", "inventory", "instruments"],
  },

  {
    id: "roles-explained", cat: "admin", icon: "UsersRound",
    title: "Roles and permissions",
    lead: "Two levels: which areas you reach, and what you may do there.",
    body: [
      { h: "Areas and actions" },
      { p: "Area permissions gate the sidebar and routes \u2014 whether you can open Pharmacy at all. Action permissions gate the buttons \u2014 whether you may dispense once you are there. Administration \u2192 Users & roles shows both as a matrix." },
      { h: "Separation of duties" },
      { table: {
        head: ["Role", "Can", "Cannot"],
        rows: [
          ["Nurse", "Admit, record vitals, file notes", "Discharge"],
          ["Lab Scientist", "Collect, result, verify", "Reach Patient care"],
          ["Radiographer", "Order and report imaging", "Verify lab results"],
          ["Pharmacist", "Dispense, restock", "Reach Diagnostics"],
          ["Cashier", "Take payments, file claims", "Approve claims"],
          ["Records Officer", "Register patients", "Admit or discharge"],
        ],
      } },
      { note: "One guard cannot be overridden: the last active Super Admin cannot be deactivated. This prevents locking everyone out." },
    ],
    related: ["audit", "signing-in"],
  },
  {
    id: "audit", cat: "admin", icon: "ShieldCheck",
    title: "The audit trail",
    lead: "Append-only and hash-chained \u2014 history cannot be quietly rewritten.",
    body: [
      { p: "Administration \u2192 Security & audit records every consequential action: sign-ins, failed sign-ins, permission denials, admissions, transfers, discharges, clinical notes, lab verification, and claim decisions." },
      { h: "Why it cannot be edited" },
      { p: "Entries are frozen the moment they are written. There is no update and no delete \u2014 not a disabled button, no API at all. Each entry is hash-chained to the one before it." },
      { list: [
        "Editing any past record breaks verification at that record.",
        "Deleting a record breaks verification at the next one.",
        "The integrity banner at the top of the screen recomputes the whole chain on load.",
      ] },
      { warn: "This is tamper-evident, not tamper-proof. A browser cannot stop someone with developer tools. The chain matters because it carries over: the same design runs server-side and detects rows edited directly in the database." },
    ],
    related: ["roles-explained", "records"],
  },

  {
    id: "shortcuts", cat: "reference", icon: "Keyboard",
    title: "Navigation and shortcuts",
    lead: "Getting around quickly.",
    body: [
      { table: {
        head: ["Action", "How"],
        rows: [
          ["Search", "Ctrl + K (topbar search)"],
          ["Expand / collapse a group", "Click the group header in the sidebar"],
          ["Jump to a module", "Click any Dashboard stat card"],
          ["See active alerts", "Red badge on Overview \u2192 Alerts"],
          ["Sign out", "Icon at the far right of the topbar"],
        ],
      } },
      { note: "The number beside each sidebar group is how many screens it contains." },
    ],
  },
  {
    id: "glossary", cat: "reference", icon: "BookA",
    title: "Glossary",
    lead: "Terms used across the system.",
    body: [
      { table: {
        head: ["Term", "Meaning"],
        rows: [
          ["ADT", "Admission, Discharge, Transfer \u2014 patient movement"],
          ["Accession", "Unique identifier for a lab order or imaging study"],
          ["AE title", "Application Entity title \u2014 an analyzer's network identity"],
          ["Apgar", "Newborn condition score, 0\u201310, taken at birth"],
          ["Crossmatch", "Testing donor blood against a recipient before transfusion"],
          ["HL7 ORU^R01", "The HL7 message type carrying observation results"],
          ["ICD-10", "International classification of diseases, used for diagnoses"],
          ["IDSR", "Integrated Disease Surveillance and Response reporting"],
          ["MLLP", "Minimal Lower Layer Protocol \u2014 how HL7 travels over TCP"],
          ["NAFDAC", "Nigeria's drug regulator; registration number on each product"],
          ["NHIS", "National Health Insurance Scheme"],
          ["SOAP", "Subjective, Objective, Assessment, Plan \u2014 clinical note structure"],
          ["Tier", "Accommodation class of a ward, which sets the nightly rate"],
        ],
      } },
    ],
  },
  {
    id: "limitations", cat: "reference", icon: "TriangleAlert",
    title: "Current limitations",
    lead: "What this build is and is not. Read before using it with anyone real.",
    body: [
      { warn: "This is a preview build. Do not enter real patient data." },
      { h: "Data does not persist" },
      { p: "Every module runs on an in-memory data layer. Records live for the session and reset on reload. Each service is deliberately written as an async API shaped like a network layer, so the Cloudflare D1 backend swaps in per service file without any screen changing." },
      { h: "Authentication is not secure" },
      { p: "Credentials are checked in the browser. Anyone reading the bundle can see them. The structure is correct \u2014 sign-in sets a session that drives every guard \u2014 but it protects nothing until a Worker verifies credentials server-side." },
      { h: "The audit chain is evidence, not enforcement" },
      { p: "Hash-chaining detects tampering. It cannot prevent it client-side. Its value is in migrating unchanged to the server, where append-only storage makes it a genuine control." },
      { h: "The instruments gateway simulates" },
      { p: "Analyzer registry and monitoring are real. Live MLLP listening needs a server socket, which a browser cannot open. 'Receive result' runs the same code path a real listener would call." },
    ],
  },
];

export function articlesIn(cat) {
  return ARTICLES.filter((a) => a.cat === cat);
}

export function getArticle(id) {
  return ARTICLES.find((a) => a.id === id);
}

export function searchArticles(q) {
  const t = q.trim().toLowerCase();
  if (!t) return [];
  const hay = (a) =>
    [a.title, a.lead, ...a.body.flatMap((b) =>
      [b.p, b.h, b.note, b.warn, ...(b.list || []), ...(b.steps || []),
       ...(b.table ? [...b.table.head, ...b.table.rows.flat()] : [])]
    )].filter(Boolean).join(" ").toLowerCase();
  return ARTICLES.filter((a) => hay(a).includes(t));
}
