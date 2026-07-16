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
  { key: "platform", label: "Platform & configuration", icon: "Settings2", blurb: "Pricing, tenant branding, communication, bookings, and the vendor view." },
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
    title: "Instruments & devices gateway",
    lead: "One interoperability hub for analyzers, imaging equipment, radiotherapy systems, and printers \u2014 old and modern alike.",
    body: [
      { p: "The gateway is reachable from both Diagnostics and Administration (as 'Instruments gateway') \u2014 the same screen, since biomedical/lab staff and IT/systems staff both need it. It manages four device categories, each speaking the protocol that category actually uses in a real hospital:" },
      { table: { head: ["Category", "Protocol", "Example"], rows: [
        ["Laboratory analyzer", "HL7 v2 / MLLP", "Sysmex, Cobas, a 2009 Beckman AU480 still in service"],
        ["Imaging modality", "DICOM 3.0", "CT, MRI, ultrasound, a 2007 CR reader"],
        ["Radiotherapy system", "DICOM-RT / proprietary", "A modern LINAC and a manual Cobalt-60 unit"],
        ["Printer", "IPP / raw socket / serial", "Label printers, report printers, a legacy dot-matrix ward printer"],
      ] } },
      { h: "Old and new equipment, deliberately" },
      { p: "A real hospital's fleet spans two decades of purchase dates. The registry includes equipment from as early as 2001 alongside machines bought this year, because a gateway that only speaks to brand-new equipment is not a working gateway for a hospital like this one." },
      { h: "How each category connects" },
      { list: [
        "Analyzers post an HL7 ORU^R01 result message, matched to the lab order by accession.",
        "Imaging modalities post a DICOM C-STORE on study completion, moving the study to Performed with a series/image count.",
        "Radiotherapy systems confirm fraction delivery, incrementing the course's fraction count directly.",
        "Printers accept a job (wristband, label, report, receipt) and confirm completion.",
      ] },
      { h: "Guards, per category" },
      { p: "A device only handles what it is actually capable of \u2014 an MRI scanner will not accept a chest X-ray study, a wristband printer will not accept a receipt job, and any offline device refuses everything. Errored or offline devices raise a hospital-wide alert." },
      { note: "Each 'receive/confirm/send' action simulates the inbound message through the exact code path a real listener would use. Live network listening \u2014 an MLLP socket, a DICOM SCP, a print daemon \u2014 runs server-side; a browser cannot open one." },
    ],
    related: ["lab", "imaging-modalities", "alerts"],
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
      { p: "Payments record against the outstanding balance (Cash, Card, Transfer, or NHIA) and issue a receipt. Overpayment is blocked. Every receipt appears in Finance \u2192 Payments as a hospital-wide ledger." },
    ],
    related: ["claims", "beds-tiers"],
  },
  {
    id: "claims", cat: "finance", icon: "FileCheck",
    title: "Insurance and NHIA claims",
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
    lead: "Eleven sources, one feed, and most alerts clear themselves.",
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
          ["Renal", "Dialysis session overdue", "Critical"],
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
    id: "ethics", cat: "admin", icon: "Scale",
    title: "Ethics committee (IRB) review",
    lead: "A real submit-review-decide workflow, not a static list \u2014 every decision requires a reasoned comment.",
    body: [
      { p: "Academic \u2192 Ethics committee tracks Institutional Review Board submissions from first filing through to a final decision." },
      { h: "The lifecycle" },
      { p: "Submitted \u2192 Under review \u2192 one of: Revisions requested, Approved, Rejected. Click a submission to expand it and see the full comment history alongside its current status." },
      { warn: "You cannot approve, reject, or request revisions without entering a reviewer comment \u2014 the button stays disabled until you do. Ethics review that leaves no reasoning behind is not a real review." },
      { p: "Once a submission is Approved or Rejected, that decision is final within this screen \u2014 it cannot be silently reopened. A genuinely new decision needs a fresh submission." },
    ],
    related: ["roles-explained"],
  },
  {
    id: "documents-upload", cat: "admin", icon: "Files",
    title: "Uploading your own documents & templates",
    lead: "Real file upload \u2014 any category you choose, any file type, up to 15MB.",
    body: [
      { p: "Administration \u2192 Documents & templates is where your hospital keeps its own forms, policies, and templates \u2014 discharge summary templates, consent forms, NHIA claim forms, statutory notifications, anything you need on hand." },
      { h: "Uploading" },
      { steps: [
        "Drag a file onto the upload area, or click it to browse.",
        "Choose an existing category, or create a new one by typing its name \u2014 categories are entirely yours to define, there is no fixed list.",
        "Confirm. The file is immediately downloadable, renameable, and deletable from the list below.",
      ] },
      { warn: "Files are held in your browser session, not on a server yet \u2014 they do not survive a page reload. Do not use this as your only copy of anything important until server-side storage lands." },
    ],
  },
  {
    id: "fhir", cat: "platform", icon: "Share2",
    title: "FHIR interoperability",
    lead: "Standards-shaped patient records another system can actually ingest.",
    body: [
      { p: "Administration \u2192 FHIR interoperability generates an HL7 FHIR R4 Bundle for any patient \u2014 Patient, Condition, AllergyIntolerance, DocumentReference and DiagnosticReport resources, correctly cross-referenced and ICD-10 coded." },
      { warn: "A browser cannot host a live FHIR REST endpoint \u2014 that is server territory, the same limitation as the instruments gateway's device listeners. What this screen produces is the real substance of interoperability: correct resource mapping. A generated Bundle is a valid artifact any FHIR-consuming system can ingest today by file, and is exactly what a future REST endpoint would serve \u2014 the mapping logic does not change when the transport does." },
      { p: "Download the Bundle as JSON directly from the screen." },
    ],
  },
  {
    id: "privacy", cat: "admin", icon: "ShieldCheck",
    title: "Privacy & consent (NDPA)",
    lead: "Consent records and data-subject rights requests under the Nigeria Data Protection Act 2023.",
    body: [
      { p: "Administration \u2192 Privacy & consent has two tabs: Consent records (what a patient has agreed their data may be used for, and how that consent was captured) and Data-subject requests (access, rectification, erasure, restriction, portability)." },
      { h: "The 30-day window" },
      { p: "Every data-subject request gets a due-by date calculated automatically \u2014 30 days from filing, the statutory response window under the Act. An overdue request is flagged in the list and raises a hospital-wide critical alert." },
      { warn: "You cannot mark a request Fulfilled or Declined without entering a closing note explaining what was done \u2014 the button stays disabled without one." },
    ],
    related: ["ethics", "audit"],
  },
  {
    id: "immunisation", cat: "clinical", icon: "Syringe",
    title: "Immunisation (NPHCDA schedule)",
    lead: "The real National Programme on Immunization schedule, tracked per child \u2014 not just coverage bars.",
    body: [
      { p: "Public health \u2192 Immunisation tracks children against the NPHCDA Routine Immunization Schedule: BCG, OPV, Pentavalent, PCV, Rotavirus, IPV, Measles, Yellow Fever, Meningitis A, and Vitamin A, each at its recommended age." },
      { h: "Due vs. overdue" },
      { p: "A dose becomes Due the moment a child reaches the recommended age for it. It becomes Overdue once more than 14 days have passed beyond that \u2014 the same operational definition used in NHMIS reporting. An overdue dose raises an alert." },
      { p: "Coverage is reported per antigen series (the figure actually submitted to NHMIS), not as a single blended number \u2014 completed doses of the final shot in a series, divided by children old enough to have received it." },
    ],
    related: ["alerts"],
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
          ["NHIA", "National Health Insurance Authority (formerly NHIS)"],
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

  {
    id: "imaging-modalities", cat: "diagnostics", icon: "Waves",
    title: "Ultrasound, CT and MRI",
    lead: "Three dedicated worklists reading the same records as the generic Radiology screen — not a parallel system.",
    body: [
      { p: "Diagnostics has three modality-specific screens \u2014 Ultrasound, CT, MRI \u2014 alongside the general Radiology & imaging worklist. They are filtered views of the exact same study records: request a study from any of them and it appears immediately in all the others, with the same accession number and lifecycle." },
      { h: "Technical parameters" },
      { p: "Each modality captures parameters relevant to it when a study is marked performed \u2014 not generic filler fields:" },
      { table: { head: ["Modality", "Captured"], rows: [
        ["Ultrasound", "Probe type, Doppler use"],
        ["CT", "Contrast (none/oral/IV), slice thickness"],
        ["MRI", "Sequence protocol, field strength (1.5T/3T)"],
      ] } },
      { p: "27 protocols are offered across the modalities \u2014 including echocardiogram, FAST trauma scan, CT angiography, KUB stone protocol, and MRCP \u2014 the range a tertiary imaging department actually runs, not a token X-ray/CT/MRI/USG each." },
    ],
    related: ["lab"],
  },
  {
    id: "biobanking", cat: "diagnostics", icon: "Archive",
    title: "Biobanking",
    lead: "Long-term specimen storage, distinct from the active lab worklist.",
    body: [
      { p: "Diagnostics \u2192 Biobanking is a separate concern from the Laboratory worklist: it is for specimens retained after routine testing \u2014 for research, future clinical use, or medico-legal purposes \u2014 not samples awaiting a result today." },
      { h: "What is tracked" },
      { list: [
        "Storage location across four units (two freezers, a liquid-nitrogen vault, a room-temperature archive), each with a capacity the system will not let you exceed.",
        "Specimen type and volume.",
        "Consent basis \u2014 research use, future clinical use only, or no further use.",
        "Associated study, where relevant.",
      ] },
      { note: "Banking a specimen checks the destination unit's capacity before accepting it \u2014 a full freezer refuses new specimens rather than silently overfilling." },
    ],
  },
  {
    id: "lab-utilities-scope", cat: "diagnostics", icon: "Calculator",
    title: "Lab utilities \u2014 what they are and are not",
    lead: "Bench-side calculators and reference material, not a clinical department.",
    body: [
      { p: "Diagnostics \u2192 Lab utilities holds seven clinical calculators (eGFR, creatinine clearance, BMI, BSA, maintenance fluids, anion gap, corrected calcium), nine unit converters, a critical-value quick-reference card, and a specimen tube guide." },
      { p: "These sit in Diagnostics deliberately \u2014 a lab scientist reaching for a creatinine-clearance figure while validating a result is exactly the audience. They are pure calculators: no patient record is created or touched, nothing here is saved." },
      { warn: "A calculator is not a department. If you need to actually manage patients on a renal pathway \u2014 dialysis sessions, vascular access, CKD staging over time \u2014 that is Patient care \u2192 Renal & dialysis, a full clinical module in its own right." },
    ],
    related: ["renal"],
  },
  {
    id: "diagnostic-intel", cat: "diagnostics", icon: "Brain",
    title: "Diagnostic intelligence",
    lead: "Read-only analytics across Laboratory, Radiology, and Blood Bank.",
    body: [
      { p: "Diagnostics \u2192 Diagnostic intelligence owns no data of its own \u2014 it reads across the other diagnostic modules and surfaces patterns no single one shows alone." },
      { table: { head: ["Metric", "What it tells you"], rows: [
        ["Lab completion %", "How much of the ordered workload has reached Verified"],
        ["Most-ordered tests", "Where lab demand concentrates"],
        ["Orders by department", "Chemistry vs Haematology vs Microbiology load"],
        ["Declared vs actual turnaround", "Whether stated TAT promises are being met"],
        ["Positivity rate", "For qualitative screens \u2014 HIV, malaria, etc."],
      ] } },
      { note: "Turnaround is computed from real timestamps \u2014 order time to result time \u2014 against each test's declared TAT in the catalogue, not an estimate." },
    ],
    related: ["lab"],
  },

  {
    id: "referrals", cat: "clinical", icon: "ArrowLeftRight",
    title: "Referrals \u2014 inbound and outbound",
    lead: "The structural link between this hospital and the wider referral network it sits in.",
    body: [
      { p: "Patient care \u2192 Referrals tracks patients moving in both directions: other facilities referring patients to you (Inbound), and you referring patients onward for a service you do not offer or for step-down care (Outbound)." },
      { h: "Inbound" },
      { p: "Received \u2192 Accepted or Declined \u2192 Checked-in. A decline requires a reason \u2014 the referring facility needs to know why, not just that. Accepting and then checking a patient in calls the same function Online Bookings uses to add someone to today's Outpatient queue \u2014 a real integration, not a separate list." },
      { warn: "An Emergency-urgency inbound referral raises a hospital-wide critical alert the moment it is logged, before anyone accepts or declines it." },
      { h: "Outbound" },
      { p: "Sent \u2192 Acknowledged, once the receiving facility confirms. Records the facility, its tier (Primary/Secondary/Tertiary/Private), and the reason." },
      { note: "Facility tier matters for triage \u2014 a referral from a PHC with no diagnostic capacity reads differently from one already worked up at a secondary facility." },
    ],
    related: ["register-admit", "alerts"],
  },
  {
    id: "renal", cat: "clinical", icon: "Droplets",
    title: "Renal & dialysis",
    lead: "A haemodialysis programme and a CKD staging registry.",
    body: [
      { p: "Patient care \u2192 Renal & dialysis has two tabs." },
      { h: "Dialysis programme" },
      { p: "Enrol a patient with their vascular access type (fistula, graft, or catheter), schedule, and dry weight. Logging a session records pre- and post-dialysis weight, blood pressure, duration, and complications \u2014 fluid removed is calculated automatically from the weight difference." },
      { warn: "A patient who misses their scheduled session shows Overdue on the programme list and raises a critical hospital-wide alert. Dialysis is not something that can quietly slip." },
      { h: "CKD registry" },
      { p: "For patients being followed for chronic kidney disease who are not (yet) on dialysis. Enter an eGFR and the system stages it automatically against the standard six-stage classification, from Stage 1 (normal/high with damage) to Stage 5 (kidney failure)." },
    ],
    related: ["lab-utilities-scope", "alerts"],
  },

  {
    id: "pricing", cat: "platform", icon: "Tags",
    title: "Configuring your own prices",
    lead: "Every price is a catalogue default until you override it \u2014 then it is what your hospital actually charges.",
    body: [
      { p: "Administration \u2192 Pricing is where a hospital sets its own prices for lab tests, drugs, imaging studies, theatre procedures, and ward accommodation per night. HospitalOS ships with sensible catalogue defaults, but nothing about them is fixed \u2014 they exist so the system works out of the box, not as a ceiling." },
      { h: "How it actually works" },
      { p: "Every screen that shows a price, and every billing calculation, reads through one function: an override if you have set one, the catalogue default otherwise. There is no second place prices live \u2014 setting a price here changes what is billed immediately, for every new charge from that point on." },
      { steps: [
        "Choose a category (tests, drugs, imaging, procedures, or accommodation).",
        "Search for the item.",
        "Click Edit, enter your price, save.",
        "The new price applies to every future charge and every screen showing that item, instantly.",
        "Reset removes your override and the item returns to its catalogue default.",
      ] },
      { note: "Past charges are not rewritten. A patient dispensed medication before you changed the price keeps their historical total \u2014 only new transactions use the new price. This is standard practice: you do not retroactively re-bill someone for a price change." },
      { warn: "This screen requires the 'Change settings' permission. Every price change is written to the audit trail, naming who changed what and when." },
    ],
    related: ["audit", "billing"],
  },
  {
    id: "tenant-branding", cat: "platform", icon: "Image",
    title: "Your hospital's branding",
    lead: "Your logo and name, shown on every screen \u2014 distinct from the HospitalOS product branding.",
    body: [
      { p: "Administration \u2192 Settings has a Hospital name field and a Logo URL field. Once set, both appear top-right on every screen in the application, in a badge separate from the HospitalOS/AgoroX branding in the sidebar." },
      { p: "If no logo is set, a badge showing your hospital's initials is used instead, so the space is never empty." },
      { note: "This is genuinely live: change the name or logo in Settings and it updates everywhere within a few seconds, with no reload needed." },
    ],
  },
  {
    id: "communication", cat: "platform", icon: "MessagesSquare",
    title: "Communication hub",
    lead: "SMS, WhatsApp, email and in-app delivery in one queue.",
    body: [
      { p: "Overview \u2192 Communication hub is the delivery log for outbound messages \u2014 appointment reminders, result-ready notices, payment receipts, discharge summaries \u2014 across four channels." },
      { p: "Compose lets you send a templated or custom message on any channel. Delivery status moves from Queued to Delivered (or Failed) as messages process, visible live without refreshing the page." },
    ],
  },
  {
    id: "bookings", cat: "platform", icon: "CalendarPlus",
    title: "Online bookings",
    lead: "Appointment requests from your website, and how they become real visits.",
    body: [
      { p: "Patient care \u2192 Online bookings holds appointment requests arriving from the hospital's public website \u2014 name, phone, desired clinic, and reason." },
      { h: "How a booking becomes a visit" },
      { p: "Confirming a booking, then checking it in, calls the exact same function the Outpatient module uses when staff check a patient in directly. This is a real integration, not two lists that happen to look similar \u2014 a checked-in booking genuinely appears on the Outpatient queue." },
      { warn: "Checking in requires a matched patient record. A booking from someone not yet registered shows 'Unmatched patient' and must be registered in Registration & ADT before it can be checked in." },
      { note: "See also: the notification bell (topbar) surfaces every unreviewed booking request and does not let you forget one \u2014 it only clears once you confirm or decline." },
    ],
    related: ["register-admit"],
  },
  {
    id: "notifications", cat: "platform", icon: "BellRing",
    title: "The notification bell",
    lead: "A queue of unhandled work, not a feed you dismiss.",
    body: [
      { p: "The bell icon in the topbar currently surfaces booking requests awaiting review. Its badge count is the number of bookings still in the 'requested' state." },
      { h: "Why it does not disappear on its own" },
      { p: "Nothing here times out and nothing is dismissible from the bell itself. A booking leaves this list only when someone actually treats it \u2014 confirms it, declines it, or (from the Bookings screen) checks the patient in. The bell exists so a request cannot be silently forgotten; making it swipeable would defeat that." },
      { p: "Confirm or decline directly from the bell's dropdown, or click through to the full Online bookings screen." },
    ],
    related: ["bookings"],
  },
  {
    id: "settlement", cat: "platform", icon: "Landmark",
    title: "Settlement centre (platform view)",
    lead: "How AgoroX's platform fee is calculated and paid out \u2014 visible only to the platform admin.",
    body: [
      { p: "Signed in as the platform admin (support@agorox.africa), the topbar shows a Hospital / Platform toggle. Switching to Platform reveals the vendor-side view, which hospital staff never see." },
      { h: "Settlement" },
      { p: "AgoroX takes a 3.25% platform fee on total hospital collections, calculated per monthly cycle. Each cycle moves Pending \u2192 Processing \u2192 Settled, with a payout to a configured bank account. The fee and the net amount to the hospital always sum back to the gross collected \u2014 nothing is lost in the arithmetic." },
      { h: "Usage analytics" },
      { p: "Per-tenant metering \u2014 seats, active users, encounters, lab orders, storage, API calls \u2014 the evidence behind an invoice. Seat under-utilisation (a tenant paying for seats it is not using) is flagged explicitly as a churn risk worth a conversation before renewal." },
    ],
  },
  {
    id: "global-search", cat: "reference", icon: "Search",
    title: "Global search",
    lead: "Ctrl+K searches screens, patients, and documentation at once.",
    body: [
      { p: "The search bar in the topbar is a real command palette, not a decoration. Press Ctrl+K (or Cmd+K on Mac) from anywhere to open it." },
      { list: [
        "Screens \u2014 filtered to what your role can actually reach; you will never see a result you cannot open.",
        "Patients \u2014 by name or hospital number.",
        "Documentation \u2014 full-text across every help article, with an excerpt showing why it matched.",
      ] },
      { note: "Arrow keys move between results, Enter opens the highlighted one, Escape closes the palette." },
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
