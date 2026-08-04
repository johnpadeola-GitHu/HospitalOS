// Laboratory test catalogue.
//
// The range a tertiary reference laboratory actually runs, organised by
// discipline. Reference ranges are adult values typical of Nigerian tertiary
// practice; a production deployment would make these configurable per lab and
// per demographic (sex, age, pregnancy) rather than fixed.
//
// Each analyte carries:
//   low / high         reference range
//   critLow / critHigh panic thresholds that raise a hospital-wide alert
//   qualitative        true for Pos/Neg results with no numeric range

export const DISCIPLINES = [
  { key: "chemistry", label: "Clinical Chemistry" },
  { key: "haematology", label: "Haematology" },
  { key: "microbiology", label: "Microbiology" },
  { key: "serology", label: "Serology & Immunology" },
  { key: "endocrinology", label: "Endocrinology" },
  { key: "molecular", label: "Molecular Diagnostics" },
  { key: "histopathology", label: "Histopathology & Cytology" },
  { key: "transfusion", label: "Transfusion Medicine" },
  { key: "cardiac_markers", label: "Cardiac Markers" },
  { key: "tumor_markers", label: "Tumor Markers" },
  { key: "urinalysis", label: "Urinalysis & Renal" },
  { key: "toxicology", label: "Toxicology & Drug Levels" },
];

export const TEST_CATALOGUE = [
  /* ---------------- Haematology ---------------- */
  {
    code: "FBC", name: "Full Blood Count", department: "Haematology", discipline: "haematology",
    price: 2500, tat: "2h", specimen: "EDTA whole blood",
    analytes: [
      { key: "hb", label: "Haemoglobin", unit: "g/dL", low: 12, high: 17, critLow: 7, critHigh: 20 },
      { key: "wbc", label: "White Cell Count", unit: "x10\u2079/L", low: 4, high: 11, critLow: 1, critHigh: 30 },
      { key: "plt", label: "Platelets", unit: "x10\u2079/L", low: 150, high: 400, critLow: 20, critHigh: 1000 },
      { key: "pcv", label: "Packed Cell Volume", unit: "%", low: 36, high: 50, critLow: 20, critHigh: 60 },
      { key: "mcv", label: "MCV", unit: "fL", low: 80, high: 100, critLow: null, critHigh: null },
    ],
  },
  {
    code: "ESR", name: "Erythrocyte Sedimentation Rate", department: "Haematology", discipline: "haematology",
    price: 1500, tat: "2h", specimen: "EDTA whole blood",
    analytes: [{ key: "esr", label: "ESR", unit: "mm/hr", low: 0, high: 20, critLow: null, critHigh: null }],
  },
  {
    code: "GXM", name: "Group & Crossmatch", department: "Transfusion Medicine", discipline: "transfusion",
    price: 5000, tat: "2h", specimen: "EDTA + clotted blood",
    analytes: [
      { key: "abo", label: "ABO Group", unit: "", qualitative: true },
      { key: "rh", label: "Rhesus D", unit: "", qualitative: true },
      { key: "xm", label: "Crossmatch", unit: "", qualitative: true },
    ],
  },
  {
    code: "GENO", name: "Haemoglobin Genotype", department: "Haematology", discipline: "haematology",
    price: 3000, tat: "4h", specimen: "EDTA whole blood",
    analytes: [{ key: "geno", label: "Genotype", unit: "", qualitative: true }],
  },
  {
    code: "CLOT", name: "Clotting Profile (PT/INR/APTT)", department: "Haematology", discipline: "haematology",
    price: 6500, tat: "3h", specimen: "Citrate plasma",
    analytes: [
      { key: "pt", label: "Prothrombin Time", unit: "s", low: 11, high: 14, critLow: null, critHigh: 30 },
      { key: "inr", label: "INR", unit: "", low: 0.8, high: 1.2, critLow: null, critHigh: 5 },
      { key: "aptt", label: "APTT", unit: "s", low: 25, high: 35, critLow: null, critHigh: 70 },
    ],
  },
  {
    code: "RETIC", name: "Reticulocyte Count", department: "Haematology", discipline: "haematology",
    price: 2500, tat: "3h", specimen: "EDTA whole blood",
    analytes: [{ key: "retic", label: "Reticulocytes", unit: "%", low: 0.5, high: 2.5, critLow: null, critHigh: null }],
  },

  /* ---------------- Clinical Chemistry ---------------- */
  {
    code: "UE", name: "Urea & Electrolytes", department: "Clinical Chemistry", discipline: "chemistry",
    price: 3500, tat: "3h", specimen: "Lithium heparin plasma",
    analytes: [
      { key: "na", label: "Sodium", unit: "mmol/L", low: 135, high: 145, critLow: 120, critHigh: 160 },
      { key: "k", label: "Potassium", unit: "mmol/L", low: 3.5, high: 5.1, critLow: 2.5, critHigh: 6.5 },
      { key: "cl", label: "Chloride", unit: "mmol/L", low: 98, high: 107, critLow: null, critHigh: null },
      { key: "hco3", label: "Bicarbonate", unit: "mmol/L", low: 22, high: 29, critLow: 10, critHigh: 40 },
      { key: "urea", label: "Urea", unit: "mmol/L", low: 2.5, high: 7.8, critLow: null, critHigh: 40 },
      { key: "creat", label: "Creatinine", unit: "\u00b5mol/L", low: 60, high: 110, critLow: null, critHigh: 600 },
    ],
  },
  {
    code: "GLU", name: "Blood Glucose", department: "Clinical Chemistry", discipline: "chemistry",
    price: 1200, tat: "1h", specimen: "Fluoride oxalate plasma",
    analytes: [{ key: "glu", label: "Glucose", unit: "mmol/L", low: 3.9, high: 7.8, critLow: 2.2, critHigh: 25 }],
  },
  {
    code: "LFT", name: "Liver Function Test", department: "Clinical Chemistry", discipline: "chemistry",
    price: 4000, tat: "3h", specimen: "Lithium heparin plasma",
    analytes: [
      { key: "alt", label: "ALT", unit: "U/L", low: 7, high: 56, critLow: null, critHigh: 500 },
      { key: "ast", label: "AST", unit: "U/L", low: 10, high: 40, critLow: null, critHigh: 500 },
      { key: "alp", label: "Alkaline Phosphatase", unit: "U/L", low: 44, high: 147, critLow: null, critHigh: null },
      { key: "bili", label: "Total Bilirubin", unit: "\u00b5mol/L", low: 3, high: 17, critLow: null, critHigh: 300 },
      { key: "alb", label: "Albumin", unit: "g/L", low: 35, high: 50, critLow: 15, critHigh: null },
    ],
  },
  {
    code: "LIPID", name: "Lipid Profile", department: "Clinical Chemistry", discipline: "chemistry",
    price: 5000, tat: "4h", specimen: "Fasting serum",
    analytes: [
      { key: "tc", label: "Total Cholesterol", unit: "mmol/L", low: 0, high: 5.2, critLow: null, critHigh: null },
      { key: "hdl", label: "HDL Cholesterol", unit: "mmol/L", low: 1.0, high: 2.5, critLow: null, critHigh: null },
      { key: "ldl", label: "LDL Cholesterol", unit: "mmol/L", low: 0, high: 3.4, critLow: null, critHigh: null },
      { key: "tg", label: "Triglycerides", unit: "mmol/L", low: 0, high: 1.7, critLow: null, critHigh: 11 },
    ],
  },
  {
    code: "CARD", name: "Cardiac Markers (Troponin I)", department: "Clinical Chemistry", discipline: "chemistry",
    price: 12000, tat: "1h", specimen: "Serum",
    analytes: [{ key: "trop", label: "Troponin I", unit: "ng/mL", low: 0, high: 0.04, critLow: null, critHigh: 0.4 }],
  },
  {
    code: "AMY", name: "Serum Amylase & Lipase", department: "Clinical Chemistry", discipline: "chemistry",
    price: 6000, tat: "4h", specimen: "Serum",
    analytes: [
      { key: "amy", label: "Amylase", unit: "U/L", low: 30, high: 110, critLow: null, critHigh: 500 },
      { key: "lip", label: "Lipase", unit: "U/L", low: 10, high: 140, critLow: null, critHigh: 600 },
    ],
  },
  {
    code: "CAMG", name: "Calcium, Magnesium & Phosphate", department: "Clinical Chemistry", discipline: "chemistry",
    price: 4500, tat: "4h", specimen: "Serum",
    analytes: [
      { key: "ca", label: "Calcium (corrected)", unit: "mmol/L", low: 2.2, high: 2.6, critLow: 1.8, critHigh: 3.5 },
      { key: "mg", label: "Magnesium", unit: "mmol/L", low: 0.7, high: 1.0, critLow: 0.4, critHigh: 2 },
      { key: "po4", label: "Phosphate", unit: "mmol/L", low: 0.8, high: 1.5, critLow: null, critHigh: null },
    ],
  },
  {
    code: "URIC", name: "Serum Uric Acid", department: "Clinical Chemistry", discipline: "chemistry",
    price: 2500, tat: "4h", specimen: "Serum",
    analytes: [{ key: "ua", label: "Uric Acid", unit: "\u00b5mol/L", low: 200, high: 430, critLow: null, critHigh: null }],
  },
  {
    code: "ABG", name: "Arterial Blood Gas", department: "Clinical Chemistry", discipline: "chemistry",
    price: 9000, tat: "30min", specimen: "Heparinised arterial blood",
    analytes: [
      { key: "ph", label: "pH", unit: "", low: 7.35, high: 7.45, critLow: 7.2, critHigh: 7.6 },
      { key: "pco2", label: "pCO\u2082", unit: "kPa", low: 4.7, high: 6.0, critLow: null, critHigh: 9 },
      { key: "po2", label: "pO\u2082", unit: "kPa", low: 11, high: 13, critLow: 7, critHigh: null },
      { key: "lact", label: "Lactate", unit: "mmol/L", low: 0.5, high: 2.2, critLow: null, critHigh: 4 },
    ],
  },

  /* ---------------- Endocrinology ---------------- */
  {
    code: "HBA1C", name: "HbA1c (Glycated Haemoglobin)", department: "Clinical Chemistry", discipline: "endocrinology",
    price: 7000, tat: "6h", specimen: "EDTA whole blood",
    analytes: [{ key: "hba1c", label: "HbA1c", unit: "%", low: 4, high: 5.6, critLow: null, critHigh: 12 }],
  },
  {
    code: "TFT", name: "Thyroid Function Test", department: "Clinical Chemistry", discipline: "endocrinology",
    price: 9500, tat: "8h", specimen: "Serum",
    analytes: [
      { key: "tsh", label: "TSH", unit: "mIU/L", low: 0.4, high: 4.0, critLow: null, critHigh: 100 },
      { key: "ft4", label: "Free T4", unit: "pmol/L", low: 9, high: 25, critLow: null, critHigh: null },
      { key: "ft3", label: "Free T3", unit: "pmol/L", low: 3.5, high: 6.5, critLow: null, critHigh: null },
    ],
  },
  {
    code: "BHCG", name: "Beta-hCG (Quantitative)", department: "Clinical Chemistry", discipline: "endocrinology",
    price: 6500, tat: "6h", specimen: "Serum",
    analytes: [{ key: "bhcg", label: "Beta-hCG", unit: "mIU/mL", low: 0, high: 5, critLow: null, critHigh: null }],
  },
  {
    code: "PSA", name: "Prostate Specific Antigen", department: "Clinical Chemistry", discipline: "endocrinology",
    price: 8000, tat: "8h", specimen: "Serum",
    analytes: [{ key: "psa", label: "Total PSA", unit: "ng/mL", low: 0, high: 4, critLow: null, critHigh: null }],
  },
  {
    code: "CORT", name: "Serum Cortisol (AM)", department: "Clinical Chemistry", discipline: "endocrinology",
    price: 9000, tat: "8h", specimen: "Serum",
    analytes: [{ key: "cort", label: "Cortisol", unit: "nmol/L", low: 140, high: 690, critLow: 50, critHigh: null }],
  },

  /* ---------------- Microbiology ---------------- */
  {
    code: "MP", name: "Malaria Parasite", department: "Microbiology", discipline: "microbiology",
    price: 1500, tat: "1h", specimen: "EDTA whole blood",
    analytes: [{ key: "mp", label: "MP (qualitative)", unit: "", qualitative: true }],
  },
  {
    code: "MCS", name: "Urine Microscopy, Culture & Sensitivity", department: "Microbiology", discipline: "microbiology",
    price: 5500, tat: "48h", specimen: "Midstream urine",
    analytes: [
      { key: "wbc", label: "Pus cells", unit: "/hpf", low: 0, high: 5, critLow: null, critHigh: null },
      { key: "growth", label: "Culture growth", unit: "", qualitative: true },
      { key: "sens", label: "Sensitivity pattern", unit: "", qualitative: true },
    ],
  },
  {
    code: "BCUL", name: "Blood Culture", department: "Microbiology", discipline: "microbiology",
    price: 12000, tat: "5 days", specimen: "Blood culture bottles",
    analytes: [
      { key: "growth", label: "Growth", unit: "", qualitative: true },
      { key: "org", label: "Organism", unit: "", qualitative: true },
      { key: "sens", label: "Sensitivity pattern", unit: "", qualitative: true },
    ],
  },
  {
    code: "SPUT", name: "Sputum AFB (Ziehl-Neelsen)", department: "Microbiology", discipline: "microbiology",
    price: 3000, tat: "24h", specimen: "Early morning sputum",
    analytes: [{ key: "afb", label: "AFB", unit: "", qualitative: true }],
  },
  {
    code: "STOOL", name: "Stool Microscopy & Culture", department: "Microbiology", discipline: "microbiology",
    price: 4000, tat: "48h", specimen: "Fresh stool",
    analytes: [
      { key: "ova", label: "Ova / parasites", unit: "", qualitative: true },
      { key: "growth", label: "Culture growth", unit: "", qualitative: true },
    ],
  },
  {
    code: "CSF", name: "CSF Analysis", department: "Microbiology", discipline: "microbiology",
    price: 8500, tat: "4h", specimen: "Cerebrospinal fluid",
    analytes: [
      { key: "wbc", label: "White cells", unit: "/mm\u00b3", low: 0, high: 5, critLow: null, critHigh: 100 },
      { key: "prot", label: "Protein", unit: "g/L", low: 0.15, high: 0.45, critLow: null, critHigh: 2 },
      { key: "glu", label: "Glucose", unit: "mmol/L", low: 2.8, high: 4.4, critLow: 1.5, critHigh: null },
      { key: "gram", label: "Gram stain", unit: "", qualitative: true },
    ],
  },
  {
    code: "WOUND", name: "Wound Swab Culture & Sensitivity", department: "Microbiology", discipline: "microbiology",
    price: 5500, tat: "48h", specimen: "Wound swab",
    analytes: [
      { key: "growth", label: "Growth", unit: "", qualitative: true },
      { key: "sens", label: "Sensitivity pattern", unit: "", qualitative: true },
    ],
  },

  /* ---------------- Serology & Immunology ---------------- */
  {
    code: "HIV", name: "HIV Screening (Rapid + Confirmatory)", department: "Serology", discipline: "serology",
    price: 3500, tat: "2h", specimen: "Serum",
    analytes: [{ key: "hiv", label: "HIV 1&2", unit: "", qualitative: true }],
  },
  {
    code: "HBSAG", name: "Hepatitis B Surface Antigen", department: "Serology", discipline: "serology",
    price: 3000, tat: "3h", specimen: "Serum",
    analytes: [{ key: "hbsag", label: "HBsAg", unit: "", qualitative: true }],
  },
  {
    code: "HCV", name: "Hepatitis C Antibody", department: "Serology", discipline: "serology",
    price: 3500, tat: "3h", specimen: "Serum",
    analytes: [{ key: "hcv", label: "Anti-HCV", unit: "", qualitative: true }],
  },
  {
    code: "VDRL", name: "VDRL / Syphilis Screen", department: "Serology", discipline: "serology",
    price: 2500, tat: "3h", specimen: "Serum",
    analytes: [{ key: "vdrl", label: "VDRL", unit: "", qualitative: true }],
  },
  {
    code: "WIDAL", name: "Widal Test", department: "Serology", discipline: "serology",
    price: 2000, tat: "3h", specimen: "Serum",
    analytes: [
      { key: "to", label: "S. typhi O", unit: "titre", qualitative: true },
      { key: "th", label: "S. typhi H", unit: "titre", qualitative: true },
    ],
  },
  {
    code: "CRP", name: "C-Reactive Protein", department: "Clinical Chemistry", discipline: "serology",
    price: 4000, tat: "4h", specimen: "Serum",
    analytes: [{ key: "crp", label: "CRP", unit: "mg/L", low: 0, high: 5, critLow: null, critHigh: 200 }],
  },
  {
    code: "RF", name: "Rheumatoid Factor & ASO Titre", department: "Serology", discipline: "serology",
    price: 4500, tat: "6h", specimen: "Serum",
    analytes: [
      { key: "rf", label: "Rheumatoid Factor", unit: "IU/mL", low: 0, high: 14, critLow: null, critHigh: null },
      { key: "aso", label: "ASO Titre", unit: "IU/mL", low: 0, high: 200, critLow: null, critHigh: null },
    ],
  },

  /* ---------------- Molecular ---------------- */
  {
    code: "GXP", name: "GeneXpert MTB/RIF", department: "Molecular Diagnostics", discipline: "molecular",
    price: 18000, tat: "24h", specimen: "Sputum",
    analytes: [
      { key: "mtb", label: "M. tuberculosis", unit: "", qualitative: true },
      { key: "rif", label: "Rifampicin resistance", unit: "", qualitative: true },
    ],
  },
  {
    code: "VL", name: "HIV Viral Load (PCR)", department: "Molecular Diagnostics", discipline: "molecular",
    price: 25000, tat: "5 days", specimen: "EDTA plasma",
    analytes: [{ key: "vl", label: "HIV-1 RNA", unit: "copies/mL", low: 0, high: 50, critLow: null, critHigh: null }],
  },
  {
    code: "CD4", name: "CD4 Count", department: "Molecular Diagnostics", discipline: "molecular",
    price: 12000, tat: "24h", specimen: "EDTA whole blood",
    analytes: [{ key: "cd4", label: "CD4 absolute", unit: "cells/\u00b5L", low: 500, high: 1500, critLow: 200, critHigh: null }],
  },
  {
    code: "COV", name: "SARS-CoV-2 PCR", department: "Molecular Diagnostics", discipline: "molecular",
    price: 20000, tat: "24h", specimen: "Nasopharyngeal swab",
    analytes: [{ key: "cov", label: "SARS-CoV-2 RNA", unit: "", qualitative: true }],
  },

  /* ---------------- Histopathology ---------------- */
  {
    code: "HISTO", name: "Histopathology (Tissue Biopsy)", department: "Histopathology", discipline: "histopathology",
    price: 35000, tat: "7 days", specimen: "Formalin-fixed tissue",
    analytes: [
      { key: "macro", label: "Macroscopy", unit: "", qualitative: true },
      { key: "micro", label: "Microscopy", unit: "", qualitative: true },
      { key: "dx", label: "Diagnosis", unit: "", qualitative: true },
    ],
  },
  {
    code: "PAP", name: "Pap Smear (Cervical Cytology)", department: "Cytology", discipline: "histopathology",
    price: 12000, tat: "5 days", specimen: "Cervical smear",
    analytes: [{ key: "pap", label: "Cytology result", unit: "", qualitative: true }],
  },
  {
    code: "FNAC", name: "Fine Needle Aspiration Cytology", department: "Cytology", discipline: "histopathology",
    price: 18000, tat: "5 days", specimen: "FNA aspirate",
    analytes: [{ key: "fnac", label: "Cytology result", unit: "", qualitative: true }],
  },

// ==== Imported from LabOS's real test catalogue ====
// 250 tests (267 minus 17 that collided with codes already in this
// catalogue — those were skipped, keeping this catalogue's existing,
// already-detailed versions rather than overwriting them).
// Prices/specimens/turnaround times are LabOS's genuine data, not invented.
// Reference ranges: tests below carry real, standard adult values where
// `curated: true`. Where `curated: false`, the analyte is a single
// qualitative placeholder pending a lab director's sign-off on real numeric
// ranges — NOT a fabricated threshold. Search this file for
// `curated: false` to find every one that still needs real ranges added
// before its automatic critical-flagging can be trusted.

// Curated with real ranges: 72 / 250. Needs lab-director input: 178.

  /* ---------------- Hematology ---------------- */
  {
    code: "PCV", name: "Packed Cell Volume / Haematocrit", department: "Hematology", discipline: "haematology",
    price: 1500, tat: "30m", specimen: "EDTA whole blood", curated: true,
    analytes: [
      { key: "pcv", label: "Packed Cell Volume", unit: "%", low: 36, high: 50, critLow: 20, critHigh: 60 }
    ],
  },
  {
    code: "HBE", name: "Haemoglobin Electrophoresis", department: "Hematology", discipline: "haematology",
    price: 6500, tat: "24h", specimen: "EDTA whole blood", curated: false,
    analytes: [
      { key: "hbe", label: "Haemoglobin Electrophoresis", unit: "", qualitative: true }
    ],
  },
  {
    code: "BFM", name: "Blood Film for Malaria Parasites", department: "Hematology", discipline: "haematology",
    price: 2500, tat: "1h", specimen: "EDTA whole blood", curated: false,
    analytes: [
      { key: "bfm", label: "Blood Film for Malaria Parasites", unit: "", qualitative: true }
    ],
  },
  {
    code: "BFC", name: "Blood Film Comment (peripheral smear)", department: "Hematology", discipline: "haematology",
    price: 3500, tat: "4h", specimen: "EDTA whole blood", curated: false,
    analytes: [
      { key: "bfc", label: "Blood Film Comment (peripheral smear)", unit: "", qualitative: true }
    ],
  },
  {
    code: "RET", name: "Reticulocyte Count", department: "Hematology", discipline: "haematology",
    price: 3500, tat: "4h", specimen: "EDTA whole blood", curated: true,
    analytes: [
      { key: "ret", label: "Reticulocyte Count", unit: "%", low: 0.5, high: 2.5, critLow: null, critHigh: null }
    ],
  },
  {
    code: "GST", name: "G6PD Screen (qualitative)", department: "Hematology", discipline: "haematology",
    price: 4500, tat: "6h", specimen: "EDTA whole blood", curated: false,
    analytes: [
      { key: "gst", label: "G6PD Screen (qualitative)", unit: "", qualitative: true }
    ],
  },
  {
    code: "GSQ", name: "G6PD Quantitative", department: "Hematology", discipline: "haematology",
    price: 8500, tat: "48h", specimen: "EDTA whole blood", curated: false, sendOut: true,
    analytes: [
      { key: "gsq", label: "G6PD Quantitative", unit: "", qualitative: true }
    ],
  },
  {
    code: "SCS", name: "Sickling Test", department: "Hematology", discipline: "haematology",
    price: 2500, tat: "2h", specimen: "EDTA whole blood", curated: false,
    analytes: [
      { key: "scs", label: "Sickling Test", unit: "", qualitative: true }
    ],
  },
  {
    code: "BTC", name: "Bleeding Time / Clotting Time", department: "Hematology", discipline: "haematology",
    price: 3500, tat: "1h", specimen: "Finger prick", curated: false,
    analytes: [
      { key: "btc", label: "Bleeding Time / Clotting Time", unit: "", qualitative: true }
    ],
  },
  {
    code: "BGR", name: "Blood Group & Rhesus", department: "Hematology", discipline: "haematology",
    price: 2500, tat: "30m", specimen: "EDTA whole blood", curated: false,
    analytes: [
      { key: "bgr", label: "Blood Group & Rhesus", unit: "", qualitative: true }
    ],
  },
  {
    code: "DCT", name: "Direct Coombs Test (DAT)", department: "Hematology", discipline: "haematology",
    price: 4500, tat: "4h", specimen: "EDTA whole blood", curated: false,
    analytes: [
      { key: "dct", label: "Direct Coombs Test (DAT)", unit: "", qualitative: true }
    ],
  },
  {
    code: "ICT", name: "Indirect Coombs Test (IAT)", department: "Hematology", discipline: "haematology",
    price: 4500, tat: "4h", specimen: "Clotted blood", curated: false,
    analytes: [
      { key: "ict", label: "Indirect Coombs Test (IAT)", unit: "", qualitative: true }
    ],
  },
  {
    code: "OSM", name: "Osmotic Fragility Test", department: "Hematology", discipline: "haematology",
    price: 6500, tat: "24h", specimen: "EDTA whole blood", curated: false,
    analytes: [
      { key: "osm", label: "Osmotic Fragility Test", unit: "", qualitative: true }
    ],
  },
  {
    code: "PTI", name: "Prothrombin Time / INR", department: "Coagulation", discipline: "haematology",
    price: 4500, tat: "2h", specimen: "Citrate plasma", curated: true,
    analytes: [
      { key: "pt", label: "Prothrombin Time", unit: "s", low: 11, high: 14, critLow: null, critHigh: 30 },
      { key: "inr", label: "INR", unit: "", low: 0.8, high: 1.2, critLow: null, critHigh: 5 }
    ],
  },
  {
    code: "APT", name: "Activated Partial Thromboplastin Time", department: "Coagulation", discipline: "haematology",
    price: 4500, tat: "2h", specimen: "Citrate plasma", curated: true,
    analytes: [
      { key: "aptt", label: "APTT", unit: "s", low: 25, high: 35, critLow: null, critHigh: 70 }
    ],
  },
  {
    code: "TT", name: "Thrombin Time", department: "Coagulation", discipline: "haematology",
    price: 5000, tat: "4h", specimen: "Citrate plasma", curated: true,
    analytes: [
      { key: "tt", label: "Thrombin Time", unit: "s", low: 14, high: 21, critLow: null, critHigh: null }
    ],
  },
  {
    code: "FIB", name: "Fibrinogen (quantitative)", department: "Coagulation", discipline: "haematology",
    price: 6500, tat: "4h", specimen: "Citrate plasma", curated: true,
    analytes: [
      { key: "fib", label: "Fibrinogen", unit: "g/L", low: 2.0, high: 4.0, critLow: 1.0, critHigh: null }
    ],
  },
  {
    code: "DDM", name: "D-Dimer (quantitative)", department: "Coagulation", discipline: "haematology",
    price: 8500, tat: "4h", specimen: "Citrate plasma", curated: true,
    analytes: [
      { key: "ddimer", label: "D-Dimer", unit: "ng/mL FEU", low: 0, high: 500, critLow: null, critHigh: null }
    ],
  },
  {
    code: "INR", name: "INR (anticoagulation monitoring)", department: "Coagulation", discipline: "haematology",
    price: 3500, tat: "2h", specimen: "Citrate plasma", curated: true,
    analytes: [
      { key: "inr", label: "INR", unit: "", low: 0.8, high: 1.2, critLow: null, critHigh: 5 }
    ],
  },
  {
    code: "FDP", name: "Fibrin Degradation Products", department: "Coagulation", discipline: "haematology",
    price: 7500, tat: "6h", specimen: "Citrate plasma", curated: false,
    analytes: [
      { key: "fdp", label: "Fibrin Degradation Products", unit: "", qualitative: true }
    ],
  },
  {
    code: "F8", name: "Factor VIII assay", department: "Coagulation", discipline: "haematology",
    price: 18000, tat: "5d", specimen: "Citrate plasma", curated: false, sendOut: true,
    analytes: [
      { key: "f8", label: "Factor VIII assay", unit: "", qualitative: true }
    ],
  },
  {
    code: "F9", name: "Factor IX assay", department: "Coagulation", discipline: "haematology",
    price: 18000, tat: "5d", specimen: "Citrate plasma", curated: false, sendOut: true,
    analytes: [
      { key: "f9", label: "Factor IX assay", unit: "", qualitative: true }
    ],
  },
  {
    code: "VWF", name: "von Willebrand Factor antigen", department: "Coagulation", discipline: "haematology",
    price: 22000, tat: "7d", specimen: "Citrate plasma", curated: false, sendOut: true,
    analytes: [
      { key: "vwf", label: "von Willebrand Factor antigen", unit: "", qualitative: true }
    ],
  },
  {
    code: "PROC", name: "Protein C activity", department: "Coagulation", discipline: "haematology",
    price: 24000, tat: "7d", specimen: "Citrate plasma", curated: false, sendOut: true,
    analytes: [
      { key: "proc", label: "Protein C activity", unit: "", qualitative: true }
    ],
  },
  {
    code: "PROS", name: "Protein S activity", department: "Coagulation", discipline: "haematology",
    price: 24000, tat: "7d", specimen: "Citrate plasma", curated: false, sendOut: true,
    analytes: [
      { key: "pros", label: "Protein S activity", unit: "", qualitative: true }
    ],
  },
  {
    code: "ATIII", name: "Antithrombin III", department: "Coagulation", discipline: "haematology",
    price: 22000, tat: "7d", specimen: "Citrate plasma", curated: false, sendOut: true,
    analytes: [
      { key: "atiii", label: "Antithrombin III", unit: "", qualitative: true }
    ],
  },
  {
    code: "LAC", name: "Lupus Anticoagulant screen", department: "Coagulation", discipline: "haematology",
    price: 18000, tat: "5d", specimen: "Citrate plasma", curated: false, sendOut: true,
    analytes: [
      { key: "lac", label: "Lupus Anticoagulant screen", unit: "", qualitative: true }
    ],
  },

  /* ---------------- Chemical Pathology ---------------- */
  {
    code: "KFT", name: "Kidney Function Test (U/E/Cr)", department: "Chemical Pathology", discipline: "chemistry",
    price: 8500, tat: "4h", specimen: "Serum", curated: false, renal: true,
    analytes: [
      { key: "kft", label: "Kidney Function Test (U/E/Cr)", unit: "", qualitative: true }
    ],
  },
  {
    code: "ELY", name: "Electrolytes (Na/K/Cl/HCO3)", department: "Chemical Pathology", discipline: "chemistry",
    price: 7000, tat: "3h", specimen: "Serum", curated: false, renal: true,
    analytes: [
      { key: "ely", label: "Electrolytes (Na/K/Cl/HCO3)", unit: "", qualitative: true }
    ],
  },
  {
    code: "CRE", name: "Serum Creatinine", department: "Chemical Pathology", discipline: "chemistry",
    price: 3500, tat: "2h", specimen: "Serum", curated: true, renal: true,
    analytes: [
      { key: "cre", label: "Serum Creatinine", unit: "mg/dL", low: 0.6, high: 1.2, critLow: null, critHigh: 10 }
    ],
  },
  {
    code: "URE", name: "Blood Urea", department: "Chemical Pathology", discipline: "chemistry",
    price: 3000, tat: "2h", specimen: "Serum", curated: true, renal: true,
    analytes: [
      { key: "ure", label: "Blood Urea", unit: "mg/dL", low: 15, high: 45, critLow: null, critHigh: 150 }
    ],
  },
  {
    code: "URA", name: "Uric Acid", department: "Chemical Pathology", discipline: "chemistry",
    price: 3500, tat: "2h", specimen: "Serum", curated: true,
    analytes: [
      { key: "ura", label: "Uric Acid", unit: "mg/dL", low: 3.4, high: 7.0, critLow: null, critHigh: null }
    ],
  },
  {
    code: "CAL", name: "Total Calcium", department: "Chemical Pathology", discipline: "chemistry",
    price: 3500, tat: "2h", specimen: "Serum", curated: true,
    analytes: [
      { key: "cal", label: "Total Calcium", unit: "mg/dL", low: 8.5, high: 10.5, critLow: 6, critHigh: 13 }
    ],
  },
  {
    code: "ICAL", name: "Ionised Calcium", department: "Chemical Pathology", discipline: "chemistry",
    price: 5500, tat: "4h", specimen: "Serum", curated: true,
    analytes: [
      { key: "ical", label: "Ionised Calcium", unit: "mmol/L", low: 1.1, high: 1.3, critLow: 0.8, critHigh: 1.6 }
    ],
  },
  {
    code: "PHO", name: "Inorganic Phosphate", department: "Chemical Pathology", discipline: "chemistry",
    price: 3500, tat: "2h", specimen: "Serum", curated: true, renal: true,
    analytes: [
      { key: "pho", label: "Inorganic Phosphate", unit: "mg/dL", low: 2.5, high: 4.5, critLow: null, critHigh: null }
    ],
  },
  {
    code: "MAG", name: "Magnesium", department: "Chemical Pathology", discipline: "chemistry",
    price: 4500, tat: "4h", specimen: "Serum", curated: true,
    analytes: [
      { key: "mag", label: "Magnesium", unit: "mg/dL", low: 1.7, high: 2.2, critLow: 1.0, critHigh: 4.9 }
    ],
  },
  {
    code: "ALB", name: "Serum Albumin", department: "Chemical Pathology", discipline: "chemistry",
    price: 3000, tat: "2h", specimen: "Serum", curated: true,
    analytes: [
      { key: "alb", label: "Serum Albumin", unit: "g/dL", low: 3.5, high: 5.0, critLow: null, critHigh: null }
    ],
  },
  {
    code: "TPR", name: "Total Protein", department: "Chemical Pathology", discipline: "chemistry",
    price: 3000, tat: "2h", specimen: "Serum", curated: true,
    analytes: [
      { key: "tpr", label: "Total Protein", unit: "g/dL", low: 6.0, high: 8.3, critLow: null, critHigh: null }
    ],
  },
  {
    code: "BIL", name: "Bilirubin (total & direct)", department: "Chemical Pathology", discipline: "chemistry",
    price: 3500, tat: "2h", specimen: "Serum", curated: false,
    analytes: [
      { key: "bil", label: "Bilirubin (total & direct)", unit: "", qualitative: true }
    ],
  },
  {
    code: "LIP", name: "Serum Lipase", department: "Chemical Pathology", discipline: "chemistry",
    price: 6500, tat: "4h", specimen: "Serum", curated: true,
    analytes: [
      { key: "lip", label: "Serum Lipase", unit: "U/L", low: 10, high: 140, critLow: null, critHigh: null }
    ],
  },
  {
    code: "LIPP", name: "Lipid Profile (full)", department: "Chemical Pathology", discipline: "chemistry",
    price: 8500, tat: "4h", specimen: "Serum", curated: false, fasting: true,
    analytes: [
      { key: "lipp", label: "Lipid Profile (full)", unit: "", qualitative: true }
    ],
  },
  {
    code: "CHO", name: "Total Cholesterol", department: "Chemical Pathology", discipline: "chemistry",
    price: 3000, tat: "2h", specimen: "Serum", curated: true, fasting: true,
    analytes: [
      { key: "cho", label: "Total Cholesterol", unit: "mg/dL", low: 0, high: 200, critLow: null, critHigh: null }
    ],
  },
  {
    code: "HDL", name: "HDL Cholesterol", department: "Chemical Pathology", discipline: "chemistry",
    price: 3500, tat: "2h", specimen: "Serum", curated: true, fasting: true,
    analytes: [
      { key: "hdl", label: "HDL Cholesterol", unit: "mg/dL", low: 40, high: 60, critLow: null, critHigh: null }
    ],
  },
  {
    code: "LDL", name: "LDL Cholesterol (calculated)", department: "Chemical Pathology", discipline: "chemistry",
    price: 3500, tat: "2h", specimen: "Serum", curated: true, fasting: true,
    analytes: [
      { key: "ldl", label: "LDL Cholesterol", unit: "mg/dL", low: 0, high: 100, critLow: null, critHigh: null }
    ],
  },
  {
    code: "TRIG", name: "Triglycerides", department: "Chemical Pathology", discipline: "chemistry",
    price: 3500, tat: "2h", specimen: "Serum", curated: true, fasting: true,
    analytes: [
      { key: "trig", label: "Triglycerides", unit: "mg/dL", low: 0, high: 150, critLow: null, critHigh: null }
    ],
  },
  {
    code: "CPK", name: "Creatine Phosphokinase (total)", department: "Chemical Pathology", discipline: "chemistry",
    price: 6500, tat: "4h", specimen: "Serum", curated: true,
    analytes: [
      { key: "cpk", label: "Creatine Phosphokinase", unit: "U/L", low: 30, high: 200, critLow: null, critHigh: null }
    ],
  },
  {
    code: "LDH", name: "Lactate Dehydrogenase", department: "Chemical Pathology", discipline: "chemistry",
    price: 5500, tat: "4h", specimen: "Serum", curated: true,
    analytes: [
      { key: "ldh", label: "Lactate Dehydrogenase", unit: "U/L", low: 140, high: 280, critLow: null, critHigh: null }
    ],
  },
  {
    code: "B12", name: "Vitamin B12", department: "Vitamins, Minerals & Iron", discipline: "chemistry",
    price: 9500, tat: "24h", specimen: "Serum", curated: true,
    analytes: [
      { key: "b12", label: "Vitamin B12", unit: "pg/mL", low: 200, high: 900, critLow: 100, critHigh: null }
    ],
  },
  {
    code: "FOL", name: "Serum Folate", department: "Vitamins, Minerals & Iron", discipline: "chemistry",
    price: 8500, tat: "24h", specimen: "Serum", curated: true,
    analytes: [
      { key: "fol", label: "Serum Folate", unit: "ng/mL", low: 2.7, high: 17.0, critLow: null, critHigh: null }
    ],
  },
  {
    code: "RBCF", name: "RBC Folate", department: "Vitamins, Minerals & Iron", discipline: "chemistry",
    price: 14500, tat: "72h", specimen: "EDTA whole blood", curated: false, sendOut: true,
    analytes: [
      { key: "rbcf", label: "RBC Folate", unit: "", qualitative: true }
    ],
  },
  {
    code: "VTD", name: "Vitamin D (25-OH)", department: "Vitamins, Minerals & Iron", discipline: "chemistry",
    price: 14500, tat: "48h", specimen: "Serum", curated: true,
    analytes: [
      { key: "vtd", label: "Vitamin D (25-OH)", unit: "ng/mL", low: 30, high: 100, critLow: null, critHigh: null }
    ],
  },
  {
    code: "VTA", name: "Vitamin A (retinol)", department: "Vitamins, Minerals & Iron", discipline: "chemistry",
    price: 18500, tat: "7d", specimen: "Serum", curated: false, sendOut: true,
    analytes: [
      { key: "vta", label: "Vitamin A (retinol)", unit: "", qualitative: true }
    ],
  },
  {
    code: "VTE", name: "Vitamin E", department: "Vitamins, Minerals & Iron", discipline: "chemistry",
    price: 18500, tat: "7d", specimen: "Serum", curated: false, sendOut: true,
    analytes: [
      { key: "vte", label: "Vitamin E", unit: "", qualitative: true }
    ],
  },
  {
    code: "VTK", name: "Vitamin K", department: "Vitamins, Minerals & Iron", discipline: "chemistry",
    price: 22500, tat: "7d", specimen: "Serum", curated: false, sendOut: true,
    analytes: [
      { key: "vtk", label: "Vitamin K", unit: "", qualitative: true }
    ],
  },
  {
    code: "FE", name: "Serum Iron", department: "Vitamins, Minerals & Iron", discipline: "chemistry",
    price: 4500, tat: "4h", specimen: "Serum", curated: true,
    analytes: [
      { key: "fe", label: "Serum Iron", unit: "ug/dL", low: 60, high: 170, critLow: null, critHigh: null }
    ],
  },
  {
    code: "TIBC", name: "Total Iron Binding Capacity (TIBC)", department: "Vitamins, Minerals & Iron", discipline: "chemistry",
    price: 5500, tat: "4h", specimen: "Serum", curated: true,
    analytes: [
      { key: "tibc", label: "TIBC", unit: "ug/dL", low: 240, high: 450, critLow: null, critHigh: null }
    ],
  },
  {
    code: "FER", name: "Ferritin", department: "Vitamins, Minerals & Iron", discipline: "chemistry",
    price: 9500, tat: "24h", specimen: "Serum", curated: true,
    analytes: [
      { key: "fer", label: "Ferritin", unit: "ng/mL", low: 20, high: 250, critLow: null, critHigh: null }
    ],
  },
  {
    code: "TRF", name: "Transferrin Saturation", department: "Vitamins, Minerals & Iron", discipline: "chemistry",
    price: 6500, tat: "4h", specimen: "Serum", curated: false,
    analytes: [
      { key: "trf", label: "Transferrin Saturation", unit: "", qualitative: true }
    ],
  },
  {
    code: "IRP", name: "Iron Studies Panel (Fe/TIBC/Ferritin/%Sat)", department: "Vitamins, Minerals & Iron", discipline: "chemistry",
    price: 14500, tat: "24h", specimen: "Serum", curated: false,
    analytes: [
      { key: "irp", label: "Iron Studies Panel (Fe/TIBC/Ferritin/%Sat)", unit: "", qualitative: true }
    ],
  },
  {
    code: "ZN", name: "Serum Zinc", department: "Vitamins, Minerals & Iron", discipline: "chemistry",
    price: 9500, tat: "72h", specimen: "Serum", curated: false,
    analytes: [
      { key: "zn", label: "Serum Zinc", unit: "", qualitative: true }
    ],
  },
  {
    code: "CU", name: "Serum Copper", department: "Vitamins, Minerals & Iron", discipline: "chemistry",
    price: 9500, tat: "72h", specimen: "Serum", curated: false,
    analytes: [
      { key: "cu", label: "Serum Copper", unit: "", qualitative: true }
    ],
  },
  {
    code: "CER", name: "Ceruloplasmin", department: "Vitamins, Minerals & Iron", discipline: "chemistry",
    price: 14500, tat: "7d", specimen: "Serum", curated: false, sendOut: true,
    analytes: [
      { key: "cer", label: "Ceruloplasmin", unit: "", qualitative: true }
    ],
  },

  /* ---------------- Diabetes & Metabolic ---------------- */
  {
    code: "FBS", name: "Fasting Blood Sugar", department: "Diabetes & Metabolic", discipline: "endocrinology",
    price: 2000, tat: "1h", specimen: "Fluoride plasma", curated: true, fasting: true,
    analytes: [
      { key: "fbs", label: "Fasting Blood Sugar", unit: "mg/dL", low: 70, high: 100, critLow: 40, critHigh: 400 }
    ],
  },
  {
    code: "RBS", name: "Random Blood Sugar", department: "Diabetes & Metabolic", discipline: "endocrinology",
    price: 2000, tat: "1h", specimen: "Fluoride plasma", curated: true,
    analytes: [
      { key: "rbs", label: "Random Blood Sugar", unit: "mg/dL", low: 70, high: 140, critLow: 40, critHigh: 400 }
    ],
  },
  {
    code: "PPBS", name: "2-Hour Post-Prandial Blood Sugar", department: "Diabetes & Metabolic", discipline: "endocrinology",
    price: 2500, tat: "1h", specimen: "Fluoride plasma", curated: true,
    analytes: [
      { key: "ppbs", label: "2h Post-Prandial Glucose", unit: "mg/dL", low: 70, high: 140, critLow: null, critHigh: null }
    ],
  },
  {
    code: "HBA", name: "HbA1c (glycated haemoglobin)", department: "Diabetes & Metabolic", discipline: "endocrinology",
    price: 7500, tat: "4h", specimen: "EDTA whole blood", curated: true,
    analytes: [
      { key: "hba1c", label: "HbA1c", unit: "%", low: 4.0, high: 5.6, critLow: null, critHigh: null }
    ],
  },
  {
    code: "OGT", name: "Oral Glucose Tolerance Test (75g)", department: "Diabetes & Metabolic", discipline: "endocrinology",
    price: 8500, tat: "4h", specimen: "Fluoride plasma × 3", curated: false, fasting: true,
    analytes: [
      { key: "ogt", label: "Oral Glucose Tolerance Test (75g)", unit: "", qualitative: true }
    ],
  },
  {
    code: "OGTP", name: "OGTT in Pregnancy (2-hour)", department: "Diabetes & Metabolic", discipline: "endocrinology",
    price: 9500, tat: "4h", specimen: "Fluoride plasma × 3", curated: false, fasting: true,
    analytes: [
      { key: "ogtp", label: "OGTT in Pregnancy (2-hour)", unit: "", qualitative: true }
    ],
  },
  {
    code: "FRU", name: "Fructosamine", department: "Diabetes & Metabolic", discipline: "endocrinology",
    price: 9500, tat: "24h", specimen: "Serum", curated: true,
    analytes: [
      { key: "fru", label: "Fructosamine", unit: "umol/L", low: 205, high: 285, critLow: null, critHigh: null }
    ],
  },
  {
    code: "INS", name: "Fasting Insulin", department: "Diabetes & Metabolic", discipline: "endocrinology",
    price: 12500, tat: "24h", specimen: "Serum", curated: true, fasting: true,
    analytes: [
      { key: "ins", label: "Fasting Insulin", unit: "uIU/mL", low: 2.6, high: 24.9, critLow: null, critHigh: null }
    ],
  },
  {
    code: "CPP", name: "C-Peptide", department: "Diabetes & Metabolic", discipline: "endocrinology",
    price: 14500, tat: "24h", specimen: "Serum", curated: false, fasting: true,
    analytes: [
      { key: "cpp", label: "C-Peptide", unit: "", qualitative: true }
    ],
  },
  {
    code: "HOMA", name: "HOMA-IR (insulin + glucose)", department: "Diabetes & Metabolic", discipline: "endocrinology",
    price: 14500, tat: "24h", specimen: "Serum", curated: false, fasting: true,
    analytes: [
      { key: "homa", label: "HOMA-IR (insulin + glucose)", unit: "", qualitative: true }
    ],
  },
  {
    code: "GAD", name: "Anti-GAD Antibodies", department: "Diabetes & Metabolic", discipline: "endocrinology",
    price: 28000, tat: "7d", specimen: "Serum", curated: false, sendOut: true,
    analytes: [
      { key: "gad", label: "Anti-GAD Antibodies", unit: "", qualitative: true }
    ],
  },
  {
    code: "IAA", name: "Insulin Autoantibodies", department: "Diabetes & Metabolic", discipline: "endocrinology",
    price: 28000, tat: "7d", specimen: "Serum", curated: false, sendOut: true,
    analytes: [
      { key: "iaa", label: "Insulin Autoantibodies", unit: "", qualitative: true }
    ],
  },
  {
    code: "TSH", name: "Thyroid Stimulating Hormone", department: "Endocrinology - Thyroid", discipline: "endocrinology",
    price: 7500, tat: "24h", specimen: "Serum", curated: true,
    analytes: [
      { key: "tsh", label: "TSH", unit: "mIU/L", low: 0.4, high: 4.0, critLow: 0.01, critHigh: 100 }
    ],
  },
  {
    code: "FT3", name: "Free Triiodothyronine (FT3)", department: "Endocrinology - Thyroid", discipline: "endocrinology",
    price: 7500, tat: "24h", specimen: "Serum", curated: true,
    analytes: [
      { key: "ft3", label: "Free T3", unit: "pg/mL", low: 2.3, high: 4.2, critLow: null, critHigh: null }
    ],
  },
  {
    code: "FT4", name: "Free Thyroxine (FT4)", department: "Endocrinology - Thyroid", discipline: "endocrinology",
    price: 7500, tat: "24h", specimen: "Serum", curated: true,
    analytes: [
      { key: "ft4", label: "Free T4", unit: "ng/dL", low: 0.8, high: 1.8, critLow: null, critHigh: null }
    ],
  },
  {
    code: "TT3", name: "Total Triiodothyronine (TT3)", department: "Endocrinology - Thyroid", discipline: "endocrinology",
    price: 6500, tat: "24h", specimen: "Serum", curated: true,
    analytes: [
      { key: "tt3", label: "Total T3", unit: "ng/dL", low: 80, high: 200, critLow: null, critHigh: null }
    ],
  },
  {
    code: "TT4", name: "Total Thyroxine (TT4)", department: "Endocrinology - Thyroid", discipline: "endocrinology",
    price: 6500, tat: "24h", specimen: "Serum", curated: true,
    analytes: [
      { key: "tt4", label: "Total T4", unit: "ug/dL", low: 5.0, high: 12.0, critLow: null, critHigh: null }
    ],
  },
  {
    code: "TPO", name: "Anti-Thyroid Peroxidase (Anti-TPO)", department: "Endocrinology - Thyroid", discipline: "endocrinology",
    price: 12500, tat: "48h", specimen: "Serum", curated: false,
    analytes: [
      { key: "tpo", label: "Anti-Thyroid Peroxidase (Anti-TPO)", unit: "", qualitative: true }
    ],
  },
  {
    code: "ATG", name: "Anti-Thyroglobulin Antibodies", department: "Endocrinology - Thyroid", discipline: "endocrinology",
    price: 12500, tat: "48h", specimen: "Serum", curated: false,
    analytes: [
      { key: "atg", label: "Anti-Thyroglobulin Antibodies", unit: "", qualitative: true }
    ],
  },
  {
    code: "TGB", name: "Thyroglobulin", department: "Endocrinology - Thyroid", discipline: "endocrinology",
    price: 14500, tat: "48h", specimen: "Serum", curated: false,
    analytes: [
      { key: "tgb", label: "Thyroglobulin", unit: "", qualitative: true }
    ],
  },
  {
    code: "TRAB", name: "TSH Receptor Antibodies (TRAb)", department: "Endocrinology - Thyroid", discipline: "endocrinology",
    price: 28000, tat: "7d", specimen: "Serum", curated: false, sendOut: true,
    analytes: [
      { key: "trab", label: "TSH Receptor Antibodies (TRAb)", unit: "", qualitative: true }
    ],
  },
  {
    code: "TPAN", name: "Thyroid Profile (TSH, FT3, FT4)", department: "Endocrinology - Thyroid", discipline: "endocrinology",
    price: 18500, tat: "24h", specimen: "Serum", curated: false,
    analytes: [
      { key: "tpan", label: "Thyroid Profile (TSH, FT3, FT4)", unit: "", qualitative: true }
    ],
  },
  {
    code: "FSH", name: "Follicle Stimulating Hormone", department: "Endocrinology - Reproductive", discipline: "endocrinology",
    price: 8500, tat: "24h", specimen: "Serum", curated: true,
    analytes: [
      { key: "fsh", label: "FSH", unit: "mIU/mL", low: 1.5, high: 12.4, critLow: null, critHigh: null }
    ],
  },
  {
    code: "LH", name: "Luteinising Hormone", department: "Endocrinology - Reproductive", discipline: "endocrinology",
    price: 8500, tat: "24h", specimen: "Serum", curated: true,
    analytes: [
      { key: "lh", label: "LH", unit: "mIU/mL", low: 1.7, high: 8.6, critLow: null, critHigh: null }
    ],
  },
  {
    code: "PRL", name: "Prolactin", department: "Endocrinology - Reproductive", discipline: "endocrinology",
    price: 8500, tat: "24h", specimen: "Serum", curated: true,
    analytes: [
      { key: "prl", label: "Prolactin", unit: "ng/mL", low: 4.8, high: 23.3, critLow: null, critHigh: null }
    ],
  },
  {
    code: "EST", name: "Estradiol (E2)", department: "Endocrinology - Reproductive", discipline: "endocrinology",
    price: 9500, tat: "24h", specimen: "Serum", curated: false,
    analytes: [
      { key: "est", label: "Estradiol (E2)", unit: "", qualitative: true }
    ],
  },
  {
    code: "PRG", name: "Progesterone", department: "Endocrinology - Reproductive", discipline: "endocrinology",
    price: 9500, tat: "24h", specimen: "Serum", curated: false,
    analytes: [
      { key: "prg", label: "Progesterone", unit: "", qualitative: true }
    ],
  },
  {
    code: "TES", name: "Total Testosterone", department: "Endocrinology - Reproductive", discipline: "endocrinology",
    price: 10500, tat: "24h", specimen: "Serum", curated: true,
    analytes: [
      { key: "tes", label: "Total Testosterone", unit: "ng/dL", low: 264, high: 916, critLow: null, critHigh: null }
    ],
  },
  {
    code: "FTES", name: "Free Testosterone", department: "Endocrinology - Reproductive", discipline: "endocrinology",
    price: 14500, tat: "48h", specimen: "Serum", curated: false,
    analytes: [
      { key: "ftes", label: "Free Testosterone", unit: "", qualitative: true }
    ],
  },
  {
    code: "SHBG", name: "Sex Hormone Binding Globulin", department: "Endocrinology - Reproductive", discipline: "endocrinology",
    price: 12500, tat: "48h", specimen: "Serum", curated: false,
    analytes: [
      { key: "shbg", label: "Sex Hormone Binding Globulin", unit: "", qualitative: true }
    ],
  },
  {
    code: "DHEA", name: "DHEA Sulphate", department: "Endocrinology - Reproductive", discipline: "endocrinology",
    price: 12500, tat: "48h", specimen: "Serum", curated: false,
    analytes: [
      { key: "dhea", label: "DHEA Sulphate", unit: "", qualitative: true }
    ],
  },
  {
    code: "AND", name: "Androstenedione", department: "Endocrinology - Reproductive", discipline: "endocrinology",
    price: 14500, tat: "72h", specimen: "Serum", curated: false,
    analytes: [
      { key: "and", label: "Androstenedione", unit: "", qualitative: true }
    ],
  },
  {
    code: "AMH", name: "Anti-Müllerian Hormone", department: "Endocrinology - Reproductive", discipline: "endocrinology",
    price: 24500, tat: "72h", specimen: "Serum", curated: false,
    analytes: [
      { key: "amh", label: "Anti-Müllerian Hormone", unit: "", qualitative: true }
    ],
  },
  {
    code: "INH", name: "Inhibin B", department: "Endocrinology - Reproductive", discipline: "endocrinology",
    price: 24500, tat: "7d", specimen: "Serum", curated: false, sendOut: true,
    analytes: [
      { key: "inh", label: "Inhibin B", unit: "", qualitative: true }
    ],
  },
  {
    code: "FRP", name: "Female Reproductive Profile (FSH/LH/PRL/E2)", department: "Endocrinology - Reproductive", discipline: "endocrinology",
    price: 32000, tat: "24h", specimen: "Serum", curated: false,
    analytes: [
      { key: "frp", label: "Female Reproductive Profile (FSH/LH/PRL/E2)", unit: "", qualitative: true }
    ],
  },
  {
    code: "MRP", name: "Male Reproductive Profile (FSH/LH/PRL/T)", department: "Endocrinology - Reproductive", discipline: "endocrinology",
    price: 34000, tat: "24h", specimen: "Serum", curated: false,
    analytes: [
      { key: "mrp", label: "Male Reproductive Profile (FSH/LH/PRL/T)", unit: "", qualitative: true }
    ],
  },
  {
    code: "COR", name: "Cortisol (AM)", department: "Endocrinology - Adrenal & Pituitary", discipline: "endocrinology",
    price: 9500, tat: "24h", specimen: "Serum", curated: true,
    analytes: [
      { key: "cor", label: "Cortisol (AM)", unit: "ug/dL", low: 6.2, high: 19.4, critLow: null, critHigh: null }
    ],
  },
  {
    code: "CORP", name: "Cortisol (PM)", department: "Endocrinology - Adrenal & Pituitary", discipline: "endocrinology",
    price: 9500, tat: "24h", specimen: "Serum", curated: false,
    analytes: [
      { key: "corp", label: "Cortisol (PM)", unit: "", qualitative: true }
    ],
  },
  {
    code: "UCOR", name: "24-hour Urine Free Cortisol", department: "Endocrinology - Adrenal & Pituitary", discipline: "endocrinology",
    price: 14500, tat: "48h", specimen: "24h urine", curated: false,
    analytes: [
      { key: "ucor", label: "24-hour Urine Free Cortisol", unit: "", qualitative: true }
    ],
  },
  {
    code: "ACTH", name: "Adrenocorticotropic Hormone (ACTH)", department: "Endocrinology - Adrenal & Pituitary", discipline: "endocrinology",
    price: 18500, tat: "48h", specimen: "EDTA plasma", curated: false,
    analytes: [
      { key: "acth", label: "Adrenocorticotropic Hormone (ACTH)", unit: "", qualitative: true }
    ],
  },
  {
    code: "ALD", name: "Aldosterone", department: "Endocrinology - Adrenal & Pituitary", discipline: "endocrinology",
    price: 18500, tat: "72h", specimen: "Serum", curated: false,
    analytes: [
      { key: "ald", label: "Aldosterone", unit: "", qualitative: true }
    ],
  },
  {
    code: "REN", name: "Renin (active)", department: "Endocrinology - Adrenal & Pituitary", discipline: "endocrinology",
    price: 22500, tat: "7d", specimen: "EDTA plasma", curated: false, sendOut: true,
    analytes: [
      { key: "ren", label: "Renin (active)", unit: "", qualitative: true }
    ],
  },
  {
    code: "MET", name: "Plasma Metanephrines", department: "Endocrinology - Adrenal & Pituitary", discipline: "endocrinology",
    price: 34500, tat: "7d", specimen: "EDTA plasma", curated: false, sendOut: true,
    analytes: [
      { key: "met", label: "Plasma Metanephrines", unit: "", qualitative: true }
    ],
  },
  {
    code: "GH", name: "Growth Hormone", department: "Endocrinology - Adrenal & Pituitary", discipline: "endocrinology",
    price: 14500, tat: "48h", specimen: "Serum", curated: true, fasting: true,
    analytes: [
      { key: "gh", label: "Growth Hormone", unit: "ng/mL", low: 0, high: 5, critLow: null, critHigh: null }
    ],
  },
  {
    code: "IGF", name: "IGF-1 (Somatomedin C)", department: "Endocrinology - Adrenal & Pituitary", discipline: "endocrinology",
    price: 18500, tat: "72h", specimen: "Serum", curated: false,
    analytes: [
      { key: "igf", label: "IGF-1 (Somatomedin C)", unit: "", qualitative: true }
    ],
  },
  {
    code: "PTH", name: "Parathyroid Hormone (intact)", department: "Endocrinology - Adrenal & Pituitary", discipline: "endocrinology",
    price: 14500, tat: "48h", specimen: "Serum", curated: true,
    analytes: [
      { key: "pth", label: "Parathyroid Hormone", unit: "pg/mL", low: 15, high: 65, critLow: null, critHigh: null }
    ],
  },
  {
    code: "CT", name: "Calcitonin", department: "Endocrinology - Adrenal & Pituitary", discipline: "endocrinology",
    price: 22500, tat: "7d", specimen: "Serum", curated: false, sendOut: true,
    analytes: [
      { key: "ct", label: "Calcitonin", unit: "", qualitative: true }
    ],
  },
  {
    code: "HCG", name: "Beta-hCG (pregnancy, qualitative)", department: "Fertility & Pregnancy", discipline: "endocrinology",
    price: 3500, tat: "1h", specimen: "Serum or urine", curated: true,
    analytes: [
      { key: "hcg", label: "Beta-hCG", unit: "", qualitative: true }
    ],
  },
  {
    code: "SEM", name: "Semen Analysis (full WHO 2021)", department: "Fertility & Pregnancy", discipline: "endocrinology",
    price: 7500, tat: "4h", specimen: "Semen (abstinence 2–5d)", curated: false,
    analytes: [
      { key: "sem", label: "Semen Analysis (full WHO 2021)", unit: "", qualitative: true }
    ],
  },
  {
    code: "SEMC", name: "Semen Culture & Sensitivity", department: "Fertility & Pregnancy", discipline: "endocrinology",
    price: 8500, tat: "72h", specimen: "Semen", curated: false,
    analytes: [
      { key: "semc", label: "Semen Culture & Sensitivity", unit: "", qualitative: true }
    ],
  },
  {
    code: "SEMM", name: "Semen MAR test (antisperm Ab)", department: "Fertility & Pregnancy", discipline: "endocrinology",
    price: 14500, tat: "48h", specimen: "Semen", curated: false, sendOut: true,
    analytes: [
      { key: "semm", label: "Semen MAR test (antisperm Ab)", unit: "", qualitative: true }
    ],
  },
  {
    code: "FERT", name: "Female Fertility Panel (FSH/LH/E2/PRL/TSH/AMH)", department: "Fertility & Pregnancy", discipline: "endocrinology",
    price: 48000, tat: "48h", specimen: "Serum", curated: false,
    analytes: [
      { key: "fert", label: "Female Fertility Panel (FSH/LH/E2/PRL/TSH/AMH)", unit: "", qualitative: true }
    ],
  },
  {
    code: "MFERT", name: "Male Fertility Panel (FSH/LH/T/PRL + semen)", department: "Fertility & Pregnancy", discipline: "endocrinology",
    price: 36000, tat: "48h", specimen: "Serum + semen", curated: false,
    analytes: [
      { key: "mfert", label: "Male Fertility Panel (FSH/LH/T/PRL + semen)", unit: "", qualitative: true }
    ],
  },
  {
    code: "TDS", name: "Triple Marker (AFP/hCG/uE3) – 2nd trimester", department: "Fertility & Pregnancy", discipline: "endocrinology",
    price: 14500, tat: "48h", specimen: "Serum", curated: false,
    analytes: [
      { key: "tds", label: "Triple Marker (AFP/hCG/uE3) – 2nd trimester", unit: "", qualitative: true }
    ],
  },
  {
    code: "QDS", name: "Quadruple Marker (AFP/hCG/uE3/Inhibin A)", department: "Fertility & Pregnancy", discipline: "endocrinology",
    price: 18500, tat: "48h", specimen: "Serum", curated: false,
    analytes: [
      { key: "qds", label: "Quadruple Marker (AFP/hCG/uE3/Inhibin A)", unit: "", qualitative: true }
    ],
  },
  {
    code: "NIPT", name: "NIPT (non-invasive prenatal — T13/18/21)", department: "Fertility & Pregnancy", discipline: "endocrinology",
    price: 185000, tat: "10d", specimen: "EDTA plasma 10ml", curated: false, sendOut: true,
    analytes: [
      { key: "nipt", label: "NIPT (non-invasive prenatal — T13/18/21)", unit: "", qualitative: true }
    ],
  },
  {
    code: "PAPP", name: "PAPP-A (1st trimester screen)", department: "Fertility & Pregnancy", discipline: "endocrinology",
    price: 14500, tat: "48h", specimen: "Serum", curated: false,
    analytes: [
      { key: "papp", label: "PAPP-A (1st trimester screen)", unit: "", qualitative: true }
    ],
  },
  {
    code: "AC", name: "Antenatal Profile (FBC/Group/HIV/HBV/HCV/Syph)", department: "Fertility & Pregnancy", discipline: "endocrinology",
    price: 18500, tat: "24h", specimen: "EDTA + clotted", curated: false,
    analytes: [
      { key: "ac", label: "Antenatal Profile (FBC/Group/HIV/HBV/HCV/Syph)", unit: "", qualitative: true }
    ],
  },

  /* ---------------- Cardiac Markers ---------------- */
  {
    code: "TPI", name: "Troponin I (high-sensitivity)", department: "Cardiac Markers", discipline: "cardiac_markers",
    price: 12500, tat: "1h", specimen: "Serum", curated: true,
    analytes: [
      { key: "tpi", label: "Troponin I", unit: "ng/mL", low: 0, high: 0.04, critLow: null, critHigh: 0.4 }
    ],
  },
  {
    code: "TPT", name: "Troponin T", department: "Cardiac Markers", discipline: "cardiac_markers",
    price: 12500, tat: "1h", specimen: "Serum", curated: true,
    analytes: [
      { key: "tpt", label: "Troponin T", unit: "ng/mL", low: 0, high: 0.01, critLow: null, critHigh: 0.1 }
    ],
  },
  {
    code: "CKM", name: "CK-MB (mass)", department: "Cardiac Markers", discipline: "cardiac_markers",
    price: 8500, tat: "2h", specimen: "Serum", curated: true,
    analytes: [
      { key: "ckmb", label: "CK-MB", unit: "ng/mL", low: 0, high: 5, critLow: null, critHigh: null }
    ],
  },
  {
    code: "MYO", name: "Myoglobin", department: "Cardiac Markers", discipline: "cardiac_markers",
    price: 9500, tat: "4h", specimen: "Serum", curated: false,
    analytes: [
      { key: "myo", label: "Myoglobin", unit: "", qualitative: true }
    ],
  },
  {
    code: "BNP", name: "BNP (Brain Natriuretic Peptide)", department: "Cardiac Markers", discipline: "cardiac_markers",
    price: 18500, tat: "4h", specimen: "EDTA plasma", curated: true,
    analytes: [
      { key: "bnp", label: "BNP", unit: "pg/mL", low: 0, high: 100, critLow: null, critHigh: null }
    ],
  },
  {
    code: "NTBP", name: "NT-proBNP", department: "Cardiac Markers", discipline: "cardiac_markers",
    price: 18500, tat: "4h", specimen: "EDTA plasma", curated: false,
    analytes: [
      { key: "ntbp", label: "NT-proBNP", unit: "", qualitative: true }
    ],
  },
  {
    code: "HCY", name: "Homocysteine", department: "Cardiac Markers", discipline: "cardiac_markers",
    price: 14500, tat: "48h", specimen: "EDTA plasma", curated: false, fasting: true,
    analytes: [
      { key: "hcy", label: "Homocysteine", unit: "", qualitative: true }
    ],
  },
  {
    code: "LPA", name: "Lipoprotein (a)", department: "Cardiac Markers", discipline: "cardiac_markers",
    price: 12500, tat: "48h", specimen: "Serum", curated: false, fasting: true,
    analytes: [
      { key: "lpa", label: "Lipoprotein (a)", unit: "", qualitative: true }
    ],
  },
  {
    code: "APOA", name: "Apolipoprotein A1", department: "Cardiac Markers", discipline: "cardiac_markers",
    price: 10500, tat: "48h", specimen: "Serum", curated: false, fasting: true,
    analytes: [
      { key: "apoa", label: "Apolipoprotein A1", unit: "", qualitative: true }
    ],
  },
  {
    code: "APOB", name: "Apolipoprotein B", department: "Cardiac Markers", discipline: "cardiac_markers",
    price: 10500, tat: "48h", specimen: "Serum", curated: false, fasting: true,
    analytes: [
      { key: "apob", label: "Apolipoprotein B", unit: "", qualitative: true }
    ],
  },
  {
    code: "HSCR", name: "High-sensitivity CRP (cardiac)", department: "Cardiac Markers", discipline: "cardiac_markers",
    price: 7500, tat: "4h", specimen: "Serum", curated: false,
    analytes: [
      { key: "hscr", label: "High-sensitivity CRP (cardiac)", unit: "", qualitative: true }
    ],
  },

  /* ---------------- Tumor Markers ---------------- */
  {
    code: "FPSA", name: "Free PSA", department: "Tumor Markers", discipline: "tumor_markers",
    price: 10500, tat: "24h", specimen: "Serum", curated: false,
    analytes: [
      { key: "fpsa", label: "Free PSA", unit: "", qualitative: true }
    ],
  },
  {
    code: "CEA", name: "Carcinoembryonic Antigen", department: "Tumor Markers", discipline: "tumor_markers",
    price: 9500, tat: "24h", specimen: "Serum", curated: true,
    analytes: [
      { key: "cea", label: "CEA", unit: "ng/mL", low: 0, high: 3.0, critLow: null, critHigh: null }
    ],
  },
  {
    code: "AFP", name: "Alpha-Fetoprotein", department: "Tumor Markers", discipline: "tumor_markers",
    price: 9500, tat: "24h", specimen: "Serum", curated: true,
    analytes: [
      { key: "afp", label: "Alpha-Fetoprotein", unit: "ng/mL", low: 0, high: 10, critLow: null, critHigh: null }
    ],
  },
  {
    code: "CA125", name: "CA 125 (ovarian)", department: "Tumor Markers", discipline: "tumor_markers",
    price: 12500, tat: "24h", specimen: "Serum", curated: false,
    analytes: [
      { key: "ca125", label: "CA 125 (ovarian)", unit: "", qualitative: true }
    ],
  },
  {
    code: "CA199", name: "CA 19-9 (pancreatic/GI)", department: "Tumor Markers", discipline: "tumor_markers",
    price: 12500, tat: "24h", specimen: "Serum", curated: false,
    analytes: [
      { key: "ca199", label: "CA 19-9 (pancreatic/GI)", unit: "", qualitative: true }
    ],
  },
  {
    code: "CA153", name: "CA 15-3 (breast)", department: "Tumor Markers", discipline: "tumor_markers",
    price: 12500, tat: "24h", specimen: "Serum", curated: false,
    analytes: [
      { key: "ca153", label: "CA 15-3 (breast)", unit: "", qualitative: true }
    ],
  },
  {
    code: "CA724", name: "CA 72-4 (gastric)", department: "Tumor Markers", discipline: "tumor_markers",
    price: 14500, tat: "72h", specimen: "Serum", curated: false, sendOut: true,
    analytes: [
      { key: "ca724", label: "CA 72-4 (gastric)", unit: "", qualitative: true }
    ],
  },
  {
    code: "CGA", name: "Chromogranin A", department: "Tumor Markers", discipline: "tumor_markers",
    price: 22500, tat: "7d", specimen: "Serum", curated: false, sendOut: true,
    analytes: [
      { key: "cga", label: "Chromogranin A", unit: "", qualitative: true }
    ],
  },
  {
    code: "NSE", name: "Neuron-Specific Enolase", department: "Tumor Markers", discipline: "tumor_markers",
    price: 18500, tat: "7d", specimen: "Serum", curated: false, sendOut: true,
    analytes: [
      { key: "nse", label: "Neuron-Specific Enolase", unit: "", qualitative: true }
    ],
  },
  {
    code: "SCC", name: "Squamous Cell Carcinoma antigen", department: "Tumor Markers", discipline: "tumor_markers",
    price: 16500, tat: "7d", specimen: "Serum", curated: false, sendOut: true,
    analytes: [
      { key: "scc", label: "Squamous Cell Carcinoma antigen", unit: "", qualitative: true }
    ],
  },
  {
    code: "TPSA", name: "Total PSA + Free PSA Ratio", department: "Tumor Markers", discipline: "tumor_markers",
    price: 16500, tat: "24h", specimen: "Serum", curated: false,
    analytes: [
      { key: "tpsa", label: "Total PSA + Free PSA Ratio", unit: "", qualitative: true }
    ],
  },
  {
    code: "HE4", name: "HE4 (ovarian) + ROMA score", department: "Tumor Markers", discipline: "tumor_markers",
    price: 24500, tat: "72h", specimen: "Serum", curated: false, sendOut: true,
    analytes: [
      { key: "he4", label: "HE4 (ovarian) + ROMA score", unit: "", qualitative: true }
    ],
  },

  /* ---------------- Immunology & Autoimmune ---------------- */
  {
    code: "ANA", name: "Antinuclear Antibody (ANA, IFA)", department: "Immunology & Autoimmune", discipline: "serology",
    price: 12500, tat: "48h", specimen: "Serum", curated: true,
    analytes: [
      { key: "ana", label: "ANA", unit: "", qualitative: true }
    ],
  },
  {
    code: "AENA", name: "ENA panel (anti-Sm/RNP/Ro/La/Scl-70/Jo-1)", department: "Immunology & Autoimmune", discipline: "serology",
    price: 24500, tat: "72h", specimen: "Serum", curated: false, sendOut: true,
    analytes: [
      { key: "aena", label: "ENA panel (anti-Sm/RNP/Ro/La/Scl-70/Jo-1)", unit: "", qualitative: true }
    ],
  },
  {
    code: "DSDNA", name: "Anti-dsDNA", department: "Immunology & Autoimmune", discipline: "serology",
    price: 12500, tat: "48h", specimen: "Serum", curated: false,
    analytes: [
      { key: "dsdna", label: "Anti-dsDNA", unit: "", qualitative: true }
    ],
  },
  {
    code: "CCP", name: "Anti-CCP (cyclic citrullinated peptide)", department: "Immunology & Autoimmune", discipline: "serology",
    price: 14500, tat: "48h", specimen: "Serum", curated: false,
    analytes: [
      { key: "ccp", label: "Anti-CCP (cyclic citrullinated peptide)", unit: "", qualitative: true }
    ],
  },
  {
    code: "ANCA", name: "ANCA (c-ANCA / p-ANCA, IFA)", department: "Immunology & Autoimmune", discipline: "serology",
    price: 18500, tat: "72h", specimen: "Serum", curated: false, sendOut: true,
    analytes: [
      { key: "anca", label: "ANCA (c-ANCA / p-ANCA, IFA)", unit: "", qualitative: true }
    ],
  },
  {
    code: "C3", name: "Complement C3", department: "Immunology & Autoimmune", discipline: "serology",
    price: 7500, tat: "48h", specimen: "Serum", curated: true,
    analytes: [
      { key: "c3", label: "Complement C3", unit: "mg/dL", low: 90, high: 180, critLow: null, critHigh: null }
    ],
  },
  {
    code: "C4", name: "Complement C4", department: "Immunology & Autoimmune", discipline: "serology",
    price: 7500, tat: "48h", specimen: "Serum", curated: true,
    analytes: [
      { key: "c4", label: "Complement C4", unit: "mg/dL", low: 10, high: 40, critLow: null, critHigh: null }
    ],
  },
  {
    code: "CH50", name: "Total Haemolytic Complement (CH50)", department: "Immunology & Autoimmune", discipline: "serology",
    price: 14500, tat: "72h", specimen: "Serum", curated: false, sendOut: true,
    analytes: [
      { key: "ch50", label: "Total Haemolytic Complement (CH50)", unit: "", qualitative: true }
    ],
  },
  {
    code: "IGA", name: "Immunoglobulin A (IgA)", department: "Immunology & Autoimmune", discipline: "serology",
    price: 7500, tat: "48h", specimen: "Serum", curated: true,
    analytes: [
      { key: "iga", label: "IgA", unit: "mg/dL", low: 70, high: 400, critLow: null, critHigh: null }
    ],
  },
  {
    code: "IGG", name: "Immunoglobulin G (IgG)", department: "Immunology & Autoimmune", discipline: "serology",
    price: 7500, tat: "48h", specimen: "Serum", curated: true,
    analytes: [
      { key: "igg", label: "IgG", unit: "mg/dL", low: 700, high: 1600, critLow: null, critHigh: null }
    ],
  },
  {
    code: "IGM", name: "Immunoglobulin M (IgM)", department: "Immunology & Autoimmune", discipline: "serology",
    price: 7500, tat: "48h", specimen: "Serum", curated: true,
    analytes: [
      { key: "igm", label: "IgM", unit: "mg/dL", low: 40, high: 230, critLow: null, critHigh: null }
    ],
  },
  {
    code: "IGSP", name: "Immunoglobulins Panel (IgA/G/M)", department: "Immunology & Autoimmune", discipline: "serology",
    price: 18500, tat: "48h", specimen: "Serum", curated: false,
    analytes: [
      { key: "igsp", label: "Immunoglobulins Panel (IgA/G/M)", unit: "", qualitative: true }
    ],
  },
  {
    code: "ASOT", name: "Anti-Streptolysin O Titre", department: "Immunology & Autoimmune", discipline: "serology",
    price: 5500, tat: "24h", specimen: "Serum", curated: false,
    analytes: [
      { key: "asot", label: "Anti-Streptolysin O Titre", unit: "", qualitative: true }
    ],
  },
  {
    code: "CRYO", name: "Cryoglobulins", department: "Immunology & Autoimmune", discipline: "serology",
    price: 14500, tat: "7d", specimen: "Serum (warm)", curated: false, sendOut: true,
    analytes: [
      { key: "cryo", label: "Cryoglobulins", unit: "", qualitative: true }
    ],
  },
  {
    code: "PCT", name: "Procalcitonin", department: "Inflammatory & Allergy", discipline: "serology",
    price: 14500, tat: "4h", specimen: "Serum", curated: true,
    analytes: [
      { key: "pct", label: "Procalcitonin", unit: "ng/mL", low: 0, high: 0.05, critLow: null, critHigh: 2 }
    ],
  },
  {
    code: "IL6", name: "Interleukin-6", department: "Inflammatory & Allergy", discipline: "serology",
    price: 18500, tat: "72h", specimen: "Serum", curated: false, sendOut: true,
    analytes: [
      { key: "il6", label: "Interleukin-6", unit: "", qualitative: true }
    ],
  },
  {
    code: "TIGE", name: "Total IgE", department: "Inflammatory & Allergy", discipline: "serology",
    price: 8500, tat: "48h", specimen: "Serum", curated: false,
    analytes: [
      { key: "tige", label: "Total IgE", unit: "", qualitative: true }
    ],
  },
  {
    code: "PHAD", name: "Phadiatop (mixed inhalant allergy screen)", department: "Inflammatory & Allergy", discipline: "serology",
    price: 18500, tat: "72h", specimen: "Serum", curated: false, sendOut: true,
    analytes: [
      { key: "phad", label: "Phadiatop (mixed inhalant allergy screen)", unit: "", qualitative: true }
    ],
  },
  {
    code: "FOOD", name: "Food allergy panel (specific IgE × 10)", department: "Inflammatory & Allergy", discipline: "serology",
    price: 48500, tat: "7d", specimen: "Serum", curated: false, sendOut: true,
    analytes: [
      { key: "food", label: "Food allergy panel (specific IgE × 10)", unit: "", qualitative: true }
    ],
  },
  {
    code: "TRYP", name: "Tryptase (mast-cell)", department: "Inflammatory & Allergy", discipline: "serology",
    price: 24500, tat: "7d", specimen: "Serum", curated: false, sendOut: true,
    analytes: [
      { key: "tryp", label: "Tryptase (mast-cell)", unit: "", qualitative: true }
    ],
  },
  {
    code: "EOS", name: "Eosinophil Count", department: "Inflammatory & Allergy", discipline: "serology",
    price: 3500, tat: "2h", specimen: "EDTA whole blood", curated: true,
    analytes: [
      { key: "eos", label: "Eosinophil Count", unit: "x10⁹/L", low: 0.02, high: 0.5, critLow: null, critHigh: null }
    ],
  },
  {
    code: "ECP", name: "Eosinophil Cationic Protein", department: "Inflammatory & Allergy", discipline: "serology",
    price: 18500, tat: "7d", specimen: "Serum", curated: false, sendOut: true,
    analytes: [
      { key: "ecp", label: "Eosinophil Cationic Protein", unit: "", qualitative: true }
    ],
  },
  {
    code: "HIVPCR", name: "HIV Viral Load (RNA PCR, quantitative)", department: "Serology & Infectious Disease", discipline: "serology",
    price: 28500, tat: "48h", specimen: "EDTA plasma", curated: false,
    analytes: [
      { key: "hivpcr", label: "HIV Viral Load (RNA PCR, quantitative)", unit: "", qualitative: true }
    ],
  },
  {
    code: "HBSAB", name: "Hepatitis B Surface Antibody (Anti-HBs)", department: "Serology & Infectious Disease", discipline: "serology",
    price: 5500, tat: "4h", specimen: "Serum", curated: false,
    analytes: [
      { key: "hbsab", label: "Hepatitis B Surface Antibody (Anti-HBs)", unit: "", qualitative: true }
    ],
  },
  {
    code: "HBEAG", name: "Hepatitis B e-Antigen (HBeAg)", department: "Serology & Infectious Disease", discipline: "serology",
    price: 7500, tat: "24h", specimen: "Serum", curated: false,
    analytes: [
      { key: "hbeag", label: "Hepatitis B e-Antigen (HBeAg)", unit: "", qualitative: true }
    ],
  },
  {
    code: "HBPNL", name: "Hepatitis B Profile (HBsAg/HBsAb/HBcAb/HBeAg/HBeAb)", department: "Serology & Infectious Disease", discipline: "serology",
    price: 18500, tat: "24h", specimen: "Serum", curated: false,
    analytes: [
      { key: "hbpnl", label: "Hepatitis B Profile (HBsAg/HBsAb/HBcAb/HBeAg/HBeAb)", unit: "", qualitative: true }
    ],
  },
  {
    code: "HBVPCR", name: "Hepatitis B DNA Viral Load (PCR)", department: "Serology & Infectious Disease", discipline: "serology",
    price: 34500, tat: "72h", specimen: "EDTA plasma", curated: false,
    analytes: [
      { key: "hbvpcr", label: "Hepatitis B DNA Viral Load (PCR)", unit: "", qualitative: true }
    ],
  },
  {
    code: "HCVPCR", name: "Hepatitis C RNA Viral Load (PCR)", department: "Serology & Infectious Disease", discipline: "serology",
    price: 36500, tat: "72h", specimen: "EDTA plasma", curated: false,
    analytes: [
      { key: "hcvpcr", label: "Hepatitis C RNA Viral Load (PCR)", unit: "", qualitative: true }
    ],
  },
  {
    code: "HAV", name: "Hepatitis A IgM & IgG", department: "Serology & Infectious Disease", discipline: "serology",
    price: 9500, tat: "24h", specimen: "Serum", curated: false,
    analytes: [
      { key: "hav", label: "Hepatitis A IgM & IgG", unit: "", qualitative: true }
    ],
  },
  {
    code: "HEV", name: "Hepatitis E IgM", department: "Serology & Infectious Disease", discipline: "serology",
    price: 8500, tat: "48h", specimen: "Serum", curated: false,
    analytes: [
      { key: "hev", label: "Hepatitis E IgM", unit: "", qualitative: true }
    ],
  },
  {
    code: "SYPH", name: "Syphilis (VDRL/RPR)", department: "Serology & Infectious Disease", discipline: "serology",
    price: 3500, tat: "4h", specimen: "Serum", curated: false,
    analytes: [
      { key: "syph", label: "Syphilis (VDRL/RPR)", unit: "", qualitative: true }
    ],
  },
  {
    code: "TPHA", name: "Treponema pallidum Antibodies (TPHA)", department: "Serology & Infectious Disease", discipline: "serology",
    price: 5500, tat: "24h", specimen: "Serum", curated: false,
    analytes: [
      { key: "tpha", label: "Treponema pallidum Antibodies (TPHA)", unit: "", qualitative: true }
    ],
  },
  {
    code: "WID", name: "Widal Test", department: "Serology & Infectious Disease", discipline: "serology",
    price: 3000, tat: "2h", specimen: "Serum", curated: false,
    analytes: [
      { key: "wid", label: "Widal Test", unit: "", qualitative: true }
    ],
  },
  {
    code: "TYP", name: "Typhoid IgM/IgG (Tubex)", department: "Serology & Infectious Disease", discipline: "serology",
    price: 5500, tat: "4h", specimen: "Serum", curated: false,
    analytes: [
      { key: "typ", label: "Typhoid IgM/IgG (Tubex)", unit: "", qualitative: true }
    ],
  },
  {
    code: "BRU", name: "Brucella Agglutination", department: "Serology & Infectious Disease", discipline: "serology",
    price: 6500, tat: "24h", specimen: "Serum", curated: false,
    analytes: [
      { key: "bru", label: "Brucella Agglutination", unit: "", qualitative: true }
    ],
  },
  {
    code: "DEN", name: "Dengue NS1 + IgM/IgG", department: "Serology & Infectious Disease", discipline: "serology",
    price: 9500, tat: "4h", specimen: "Serum", curated: false,
    analytes: [
      { key: "den", label: "Dengue NS1 + IgM/IgG", unit: "", qualitative: true }
    ],
  },
  {
    code: "CHIK", name: "Chikungunya IgM", department: "Serology & Infectious Disease", discipline: "serology",
    price: 9500, tat: "24h", specimen: "Serum", curated: false,
    analytes: [
      { key: "chik", label: "Chikungunya IgM", unit: "", qualitative: true }
    ],
  },
  {
    code: "TORCH", name: "TORCH Profile (Toxo/Rubella/CMV/HSV)", department: "Serology & Infectious Disease", discipline: "serology",
    price: 24500, tat: "48h", specimen: "Serum", curated: false,
    analytes: [
      { key: "torch", label: "TORCH Profile (Toxo/Rubella/CMV/HSV)", unit: "", qualitative: true }
    ],
  },
  {
    code: "TOXO", name: "Toxoplasma IgM & IgG", department: "Serology & Infectious Disease", discipline: "serology",
    price: 9500, tat: "48h", specimen: "Serum", curated: false,
    analytes: [
      { key: "toxo", label: "Toxoplasma IgM & IgG", unit: "", qualitative: true }
    ],
  },
  {
    code: "RUB", name: "Rubella IgM & IgG", department: "Serology & Infectious Disease", discipline: "serology",
    price: 9500, tat: "48h", specimen: "Serum", curated: false,
    analytes: [
      { key: "rub", label: "Rubella IgM & IgG", unit: "", qualitative: true }
    ],
  },
  {
    code: "CMV", name: "CMV IgM & IgG", department: "Serology & Infectious Disease", discipline: "serology",
    price: 9500, tat: "48h", specimen: "Serum", curated: false,
    analytes: [
      { key: "cmv", label: "CMV IgM & IgG", unit: "", qualitative: true }
    ],
  },
  {
    code: "HSV", name: "HSV 1/2 IgM & IgG", department: "Serology & Infectious Disease", discipline: "serology",
    price: 9500, tat: "48h", specimen: "Serum", curated: false,
    analytes: [
      { key: "hsv", label: "HSV 1/2 IgM & IgG", unit: "", qualitative: true }
    ],
  },
  {
    code: "HPYL", name: "H. pylori Stool Antigen", department: "Serology & Infectious Disease", discipline: "serology",
    price: 7500, tat: "24h", specimen: "Stool", curated: false,
    analytes: [
      { key: "hpyl", label: "H. pylori Stool Antigen", unit: "", qualitative: true }
    ],
  },

  /* ---------------- Microbiology ---------------- */
  {
    code: "UMCS", name: "Urine MCS (microscopy, culture & sensitivity)", department: "Microbiology", discipline: "microbiology",
    price: 6500, tat: "72h", specimen: "Midstream urine", curated: false,
    analytes: [
      { key: "umcs", label: "Urine MCS (microscopy, culture & sensitivity)", unit: "", qualitative: true }
    ],
  },
  {
    code: "SMCS", name: "Stool MCS", department: "Microbiology", discipline: "microbiology",
    price: 6500, tat: "72h", specimen: "Stool", curated: false,
    analytes: [
      { key: "smcs", label: "Stool MCS", unit: "", qualitative: true }
    ],
  },
  {
    code: "BCS", name: "Blood Culture & Sensitivity", department: "Microbiology", discipline: "microbiology",
    price: 9500, tat: "5d", specimen: "BACTEC bottle", curated: false,
    analytes: [
      { key: "bcs", label: "Blood Culture & Sensitivity", unit: "", qualitative: true }
    ],
  },
  {
    code: "WCS", name: "Wound Swab MCS", department: "Microbiology", discipline: "microbiology",
    price: 6500, tat: "72h", specimen: "Swab in transport medium", curated: false,
    analytes: [
      { key: "wcs", label: "Wound Swab MCS", unit: "", qualitative: true }
    ],
  },
  {
    code: "HVS", name: "High Vaginal Swab MCS", department: "Microbiology", discipline: "microbiology",
    price: 6500, tat: "72h", specimen: "HVS in Amies", curated: false,
    analytes: [
      { key: "hvs", label: "High Vaginal Swab MCS", unit: "", qualitative: true }
    ],
  },
  {
    code: "EVS", name: "Endocervical Swab MCS", department: "Microbiology", discipline: "microbiology",
    price: 7500, tat: "72h", specimen: "Swab in Amies", curated: false,
    analytes: [
      { key: "evs", label: "Endocervical Swab MCS", unit: "", qualitative: true }
    ],
  },
  {
    code: "URS", name: "Urethral Swab MCS", department: "Microbiology", discipline: "microbiology",
    price: 6500, tat: "72h", specimen: "Swab in Amies", curated: false,
    analytes: [
      { key: "urs", label: "Urethral Swab MCS", unit: "", qualitative: true }
    ],
  },
  {
    code: "TS", name: "Throat Swab MCS", department: "Microbiology", discipline: "microbiology",
    price: 6500, tat: "72h", specimen: "Swab in Amies", curated: false,
    analytes: [
      { key: "ts", label: "Throat Swab MCS", unit: "", qualitative: true }
    ],
  },
  {
    code: "ESC", name: "Ear Swab MCS", department: "Microbiology", discipline: "microbiology",
    price: 6500, tat: "72h", specimen: "Swab in Amies", curated: false,
    analytes: [
      { key: "esc", label: "Ear Swab MCS", unit: "", qualitative: true }
    ],
  },
  {
    code: "SP", name: "Sputum MCS", department: "Microbiology", discipline: "microbiology",
    price: 6500, tat: "72h", specimen: "Early-morning sputum", curated: false,
    analytes: [
      { key: "sp", label: "Sputum MCS", unit: "", qualitative: true }
    ],
  },
  {
    code: "AFB", name: "AFB Smear (Ziehl-Neelsen) × 2", department: "Microbiology", discipline: "microbiology",
    price: 5500, tat: "24h", specimen: "Sputum × 2", curated: false,
    analytes: [
      { key: "afb", label: "AFB Smear (Ziehl-Neelsen) × 2", unit: "", qualitative: true }
    ],
  },
  {
    code: "AFBC", name: "AFB Culture (MGIT)", department: "Microbiology", discipline: "microbiology",
    price: 18500, tat: "42d", specimen: "Sputum", curated: false, sendOut: true,
    analytes: [
      { key: "afbc", label: "AFB Culture (MGIT)", unit: "", qualitative: true }
    ],
  },
  {
    code: "MTB", name: "GeneXpert MTB/RIF", department: "Microbiology", discipline: "microbiology",
    price: 14500, tat: "4h", specimen: "Sputum", curated: false,
    analytes: [
      { key: "mtb", label: "GeneXpert MTB/RIF", unit: "", qualitative: true }
    ],
  },
  {
    code: "KOH", name: "KOH Mount (fungal)", department: "Microbiology", discipline: "microbiology",
    price: 4500, tat: "4h", specimen: "Skin scraping / nail", curated: false,
    analytes: [
      { key: "koh", label: "KOH Mount (fungal)", unit: "", qualitative: true }
    ],
  },
  {
    code: "FNGC", name: "Fungal Culture", department: "Microbiology", discipline: "microbiology",
    price: 12500, tat: "21d", specimen: "Specimen-dependent", curated: false,
    analytes: [
      { key: "fngc", label: "Fungal Culture", unit: "", qualitative: true }
    ],
  },
  {
    code: "PS", name: "Pus Swab MCS", department: "Microbiology", discipline: "microbiology",
    price: 6500, tat: "72h", specimen: "Swab in Amies", curated: false,
    analytes: [
      { key: "ps", label: "Pus Swab MCS", unit: "", qualitative: true }
    ],
  },
  {
    code: "PERI", name: "Peritoneal Fluid Analysis", department: "Microbiology", discipline: "microbiology",
    price: 9500, tat: "24h", specimen: "Peritoneal fluid", curated: false,
    analytes: [
      { key: "peri", label: "Peritoneal Fluid Analysis", unit: "", qualitative: true }
    ],
  },
  {
    code: "PLEU", name: "Pleural Fluid Analysis", department: "Microbiology", discipline: "microbiology",
    price: 9500, tat: "24h", specimen: "Pleural fluid", curated: false,
    analytes: [
      { key: "pleu", label: "Pleural Fluid Analysis", unit: "", qualitative: true }
    ],
  },
  {
    code: "OVA", name: "Stool for Ova & Cysts (× 3)", department: "Microbiology", discipline: "microbiology",
    price: 5500, tat: "24h", specimen: "Stool × 3", curated: false,
    analytes: [
      { key: "ova", label: "Stool for Ova & Cysts (× 3)", unit: "", qualitative: true }
    ],
  },

  /* ---------------- Urinalysis & Renal ---------------- */
  {
    code: "URI", name: "Urinalysis (10-parameter dipstick + sediment)", department: "Urinalysis & Renal", discipline: "urinalysis",
    price: 3000, tat: "30m", specimen: "Midstream urine", curated: true,
    analytes: [
      { key: "uri", label: "Urinalysis", unit: "", qualitative: true }
    ],
  },
  {
    code: "MALB", name: "Microalbumin (spot urine)", department: "Urinalysis & Renal", discipline: "urinalysis",
    price: 5500, tat: "4h", specimen: "Spot urine", curated: true, renal: true,
    analytes: [
      { key: "malb", label: "Microalbumin", unit: "mg/L", low: 0, high: 30, critLow: null, critHigh: null }
    ],
  },
  {
    code: "ACR", name: "Albumin/Creatinine Ratio (ACR)", department: "Urinalysis & Renal", discipline: "urinalysis",
    price: 6500, tat: "4h", specimen: "Spot urine", curated: true, renal: true,
    analytes: [
      { key: "acr", label: "Albumin/Creatinine Ratio", unit: "mg/g", low: 0, high: 30, critLow: null, critHigh: null }
    ],
  },
  {
    code: "PCR", name: "Protein/Creatinine Ratio (PCR)", department: "Urinalysis & Renal", discipline: "urinalysis",
    price: 6500, tat: "4h", specimen: "Spot urine", curated: false, renal: true,
    analytes: [
      { key: "pcr", label: "Protein/Creatinine Ratio (PCR)", unit: "", qualitative: true }
    ],
  },
  {
    code: "UTP", name: "24-hour Urine Total Protein", department: "Urinalysis & Renal", discipline: "urinalysis",
    price: 7500, tat: "24h", specimen: "24h urine", curated: false, renal: true,
    analytes: [
      { key: "utp", label: "24-hour Urine Total Protein", unit: "", qualitative: true }
    ],
  },
  {
    code: "UCR", name: "24-hour Urine Creatinine Clearance", department: "Urinalysis & Renal", discipline: "urinalysis",
    price: 8500, tat: "24h", specimen: "24h urine + serum", curated: false, renal: true,
    analytes: [
      { key: "ucr", label: "24-hour Urine Creatinine Clearance", unit: "", qualitative: true }
    ],
  },
  {
    code: "UELY", name: "24-hour Urine Electrolytes", department: "Urinalysis & Renal", discipline: "urinalysis",
    price: 7500, tat: "24h", specimen: "24h urine", curated: false, renal: true,
    analytes: [
      { key: "uely", label: "24-hour Urine Electrolytes", unit: "", qualitative: true }
    ],
  },
  {
    code: "BJP", name: "Bence-Jones Protein (urine immunofixation)", department: "Urinalysis & Renal", discipline: "urinalysis",
    price: 14500, tat: "72h", specimen: "24h urine", curated: false, sendOut: true,
    analytes: [
      { key: "bjp", label: "Bence-Jones Protein (urine immunofixation)", unit: "", qualitative: true }
    ],
  },
  {
    code: "UPEP", name: "Urine Protein Electrophoresis", department: "Urinalysis & Renal", discipline: "urinalysis",
    price: 12500, tat: "72h", specimen: "24h urine", curated: false,
    analytes: [
      { key: "upep", label: "Urine Protein Electrophoresis", unit: "", qualitative: true }
    ],
  },
  {
    code: "EGFR", name: "eGFR (calculated from creatinine)", department: "Urinalysis & Renal", discipline: "urinalysis",
    price: 0, tat: "2h", specimen: "Serum", curated: true, renal: true,
    analytes: [
      { key: "egfr", label: "eGFR", unit: "mL/min/1.73m²", low: 90, high: 120, critLow: 15, critHigh: null }
    ],
  },
  {
    code: "CYS", name: "Cystatin C", department: "Urinalysis & Renal", discipline: "urinalysis",
    price: 14500, tat: "48h", specimen: "Serum", curated: false, renal: true,
    analytes: [
      { key: "cys", label: "Cystatin C", unit: "", qualitative: true }
    ],
  },

  /* ---------------- Toxicology & Drug Levels ---------------- */
  {
    code: "DOA10", name: "Drugs of Abuse Panel (10 — urine)", department: "Toxicology & Drug Levels", discipline: "toxicology",
    price: 9500, tat: "4h", specimen: "Random urine", curated: false,
    analytes: [
      { key: "doa10", label: "Drugs of Abuse Panel (10 — urine)", unit: "", qualitative: true }
    ],
  },
  {
    code: "CAN", name: "Cannabis (THC) — urine", department: "Toxicology & Drug Levels", discipline: "toxicology",
    price: 4500, tat: "2h", specimen: "Random urine", curated: false,
    analytes: [
      { key: "can", label: "Cannabis (THC) — urine", unit: "", qualitative: true }
    ],
  },
  {
    code: "COC", name: "Cocaine metabolites — urine", department: "Toxicology & Drug Levels", discipline: "toxicology",
    price: 4500, tat: "2h", specimen: "Random urine", curated: false,
    analytes: [
      { key: "coc", label: "Cocaine metabolites — urine", unit: "", qualitative: true }
    ],
  },
  {
    code: "OP", name: "Opiates — urine", department: "Toxicology & Drug Levels", discipline: "toxicology",
    price: 4500, tat: "2h", specimen: "Random urine", curated: false,
    analytes: [
      { key: "op", label: "Opiates — urine", unit: "", qualitative: true }
    ],
  },
  {
    code: "BENZ", name: "Benzodiazepines — urine", department: "Toxicology & Drug Levels", discipline: "toxicology",
    price: 4500, tat: "2h", specimen: "Random urine", curated: false,
    analytes: [
      { key: "benz", label: "Benzodiazepines — urine", unit: "", qualitative: true }
    ],
  },
  {
    code: "ETOH", name: "Ethanol (blood)", department: "Toxicology & Drug Levels", discipline: "toxicology",
    price: 6500, tat: "4h", specimen: "Whole blood", curated: true,
    analytes: [
      { key: "etoh", label: "Ethanol", unit: "mg/dL", low: 0, high: 0, critLow: null, critHigh: 80 }
    ],
  },
  {
    code: "PARA", name: "Paracetamol level", department: "Toxicology & Drug Levels", discipline: "toxicology",
    price: 6500, tat: "2h", specimen: "Serum", curated: true,
    analytes: [
      { key: "para", label: "Paracetamol Level", unit: "ug/mL", low: 10, high: 30, critLow: null, critHigh: 150 }
    ],
  },
  {
    code: "SAL", name: "Salicylate level", department: "Toxicology & Drug Levels", discipline: "toxicology",
    price: 6500, tat: "2h", specimen: "Serum", curated: false,
    analytes: [
      { key: "sal", label: "Salicylate level", unit: "", qualitative: true }
    ],
  },
  {
    code: "DIG", name: "Digoxin level (TDM)", department: "Toxicology & Drug Levels", discipline: "toxicology",
    price: 9500, tat: "4h", specimen: "Serum", curated: true,
    analytes: [
      { key: "dig", label: "Digoxin (trough)", unit: "ng/mL", low: 0.8, high: 2.0, critLow: null, critHigh: 2.5 }
    ],
  },
  {
    code: "LITH", name: "Lithium level (TDM)", department: "Toxicology & Drug Levels", discipline: "toxicology",
    price: 9500, tat: "4h", specimen: "Serum", curated: true,
    analytes: [
      { key: "lith", label: "Lithium (trough)", unit: "mmol/L", low: 0.6, high: 1.2, critLow: null, critHigh: 1.5 }
    ],
  },
  {
    code: "VAL", name: "Valproic Acid (TDM)", department: "Toxicology & Drug Levels", discipline: "toxicology",
    price: 9500, tat: "4h", specimen: "Serum", curated: false,
    analytes: [
      { key: "val", label: "Valproic Acid (TDM)", unit: "", qualitative: true }
    ],
  },
  {
    code: "CBZ", name: "Carbamazepine (TDM)", department: "Toxicology & Drug Levels", discipline: "toxicology",
    price: 9500, tat: "4h", specimen: "Serum", curated: false,
    analytes: [
      { key: "cbz", label: "Carbamazepine (TDM)", unit: "", qualitative: true }
    ],
  },
  {
    code: "PHE", name: "Phenytoin (TDM)", department: "Toxicology & Drug Levels", discipline: "toxicology",
    price: 9500, tat: "4h", specimen: "Serum", curated: false,
    analytes: [
      { key: "phe", label: "Phenytoin (TDM)", unit: "", qualitative: true }
    ],
  },
  {
    code: "PB", name: "Phenobarbitone (TDM)", department: "Toxicology & Drug Levels", discipline: "toxicology",
    price: 9500, tat: "4h", specimen: "Serum", curated: false,
    analytes: [
      { key: "pb", label: "Phenobarbitone (TDM)", unit: "", qualitative: true }
    ],
  },
  {
    code: "CYC", name: "Cyclosporine (TDM)", department: "Toxicology & Drug Levels", discipline: "toxicology",
    price: 14500, tat: "24h", specimen: "EDTA whole blood", curated: false,
    analytes: [
      { key: "cyc", label: "Cyclosporine (TDM)", unit: "", qualitative: true }
    ],
  },
  {
    code: "TAC", name: "Tacrolimus (TDM)", department: "Toxicology & Drug Levels", discipline: "toxicology",
    price: 14500, tat: "24h", specimen: "EDTA whole blood", curated: false,
    analytes: [
      { key: "tac", label: "Tacrolimus (TDM)", unit: "", qualitative: true }
    ],
  },
  {
    code: "VAN", name: "Vancomycin trough", department: "Toxicology & Drug Levels", discipline: "toxicology",
    price: 9500, tat: "4h", specimen: "Serum", curated: false,
    analytes: [
      { key: "van", label: "Vancomycin trough", unit: "", qualitative: true }
    ],
  },
  {
    code: "LEAD", name: "Blood Lead Level", department: "Toxicology & Drug Levels", discipline: "toxicology",
    price: 14500, tat: "72h", specimen: "EDTA whole blood", curated: true, sendOut: true,
    analytes: [
      { key: "lead", label: "Blood Lead Level", unit: "ug/dL", low: 0, high: 5, critLow: null, critHigh: 70 }
    ],
  },

  /* ---------------- Molecular & Genetic ---------------- */
  {
    code: "HPV", name: "HPV DNA Genotyping (high-risk)", department: "Molecular & Genetic", discipline: "molecular",
    price: 38500, tat: "5d", specimen: "Cervical swab in PreservCyt", curated: false, sendOut: true,
    analytes: [
      { key: "hpv", label: "HPV DNA Genotyping (high-risk)", unit: "", qualitative: true }
    ],
  },
  {
    code: "COVPCR", name: "SARS-CoV-2 RT-PCR", department: "Molecular & Genetic", discipline: "molecular",
    price: 18500, tat: "24h", specimen: "NP swab in VTM", curated: false,
    analytes: [
      { key: "covpcr", label: "SARS-CoV-2 RT-PCR", unit: "", qualitative: true }
    ],
  },
  {
    code: "TBPCR", name: "GeneXpert MTB/RIF Ultra", department: "Molecular & Genetic", discipline: "molecular",
    price: 14500, tat: "4h", specimen: "Sputum", curated: false,
    analytes: [
      { key: "tbpcr", label: "GeneXpert MTB/RIF Ultra", unit: "", qualitative: true }
    ],
  },
  {
    code: "GBSPCR", name: "GBS PCR (vaginal-rectal swab)", department: "Molecular & Genetic", discipline: "molecular",
    price: 18500, tat: "24h", specimen: "V/R swab", curated: false,
    analytes: [
      { key: "gbspcr", label: "GBS PCR (vaginal-rectal swab)", unit: "", qualitative: true }
    ],
  },
  {
    code: "CTNG", name: "Chlamydia/Gonorrhoea PCR (dual)", department: "Molecular & Genetic", discipline: "molecular",
    price: 18500, tat: "48h", specimen: "Urine or swab", curated: false,
    analytes: [
      { key: "ctng", label: "Chlamydia/Gonorrhoea PCR (dual)", unit: "", qualitative: true }
    ],
  },
  {
    code: "TRICH", name: "Trichomonas PCR", department: "Molecular & Genetic", discipline: "molecular",
    price: 14500, tat: "48h", specimen: "Vaginal swab", curated: false,
    analytes: [
      { key: "trich", label: "Trichomonas PCR", unit: "", qualitative: true }
    ],
  },
  {
    code: "HSV12P", name: "HSV 1/2 PCR", department: "Molecular & Genetic", discipline: "molecular",
    price: 18500, tat: "48h", specimen: "Swab from lesion", curated: false,
    analytes: [
      { key: "hsv12p", label: "HSV 1/2 PCR", unit: "", qualitative: true }
    ],
  },
  {
    code: "EBV", name: "EBV PCR (quantitative)", department: "Molecular & Genetic", discipline: "molecular",
    price: 24500, tat: "72h", specimen: "EDTA plasma", curated: false,
    analytes: [
      { key: "ebv", label: "EBV PCR (quantitative)", unit: "", qualitative: true }
    ],
  },
  {
    code: "CMVPCR", name: "CMV PCR (quantitative)", department: "Molecular & Genetic", discipline: "molecular",
    price: 24500, tat: "72h", specimen: "EDTA plasma", curated: false,
    analytes: [
      { key: "cmvpcr", label: "CMV PCR (quantitative)", unit: "", qualitative: true }
    ],
  },
  {
    code: "BCRA", name: "BCR-ABL Quantitative (Major + Minor)", department: "Molecular & Genetic", discipline: "molecular",
    price: 48500, tat: "10d", specimen: "EDTA whole blood", curated: false, sendOut: true,
    analytes: [
      { key: "bcra", label: "BCR-ABL Quantitative (Major + Minor)", unit: "", qualitative: true }
    ],
  },
  {
    code: "JAK2", name: "JAK2 V617F Mutation", department: "Molecular & Genetic", discipline: "molecular",
    price: 38500, tat: "10d", specimen: "EDTA whole blood", curated: false, sendOut: true,
    analytes: [
      { key: "jak2", label: "JAK2 V617F Mutation", unit: "", qualitative: true }
    ],
  },
  {
    code: "FLT3", name: "FLT3-ITD Mutation Analysis", department: "Molecular & Genetic", discipline: "molecular",
    price: 48500, tat: "14d", specimen: "EDTA whole blood", curated: false, sendOut: true,
    analytes: [
      { key: "flt3", label: "FLT3-ITD Mutation Analysis", unit: "", qualitative: true }
    ],
  },
  {
    code: "BRCA", name: "BRCA1/BRCA2 Sequencing", department: "Molecular & Genetic", discipline: "molecular",
    price: 285000, tat: "21d", specimen: "EDTA whole blood", curated: false, sendOut: true,
    analytes: [
      { key: "brca", label: "BRCA1/BRCA2 Sequencing", unit: "", qualitative: true }
    ],
  },
  {
    code: "KARYO", name: "Karyotype (peripheral blood)", department: "Molecular & Genetic", discipline: "molecular",
    price: 48500, tat: "14d", specimen: "Sodium heparin whole blood", curated: false, sendOut: true,
    analytes: [
      { key: "karyo", label: "Karyotype (peripheral blood)", unit: "", qualitative: true }
    ],
  },
  {
    code: "CFG", name: "Cystic Fibrosis Genotyping (common 35)", department: "Molecular & Genetic", discipline: "molecular",
    price: 185000, tat: "21d", specimen: "EDTA whole blood", curated: false, sendOut: true,
    analytes: [
      { key: "cfg", label: "Cystic Fibrosis Genotyping (common 35)", unit: "", qualitative: true }
    ],
  },
  {
    code: "THLM", name: "Alpha & Beta Thalassaemia Genotyping", department: "Molecular & Genetic", discipline: "molecular",
    price: 125000, tat: "21d", specimen: "EDTA whole blood", curated: false, sendOut: true,
    analytes: [
      { key: "thlm", label: "Alpha & Beta Thalassaemia Genotyping", unit: "", qualitative: true }
    ],
  },

];

export const CATALOGUE_SIZE = TEST_CATALOGUE.length;

export function testsInDiscipline(key) {
  return TEST_CATALOGUE.filter((t) => t.discipline === key);
}

export function searchCatalogue(q) {
  const t = String(q || "").trim().toLowerCase();
  if (!t) return TEST_CATALOGUE;
  return TEST_CATALOGUE.filter(
    (x) =>
      x.name.toLowerCase().includes(t) ||
      x.code.toLowerCase().includes(t) ||
      x.department.toLowerCase().includes(t) ||
      x.specimen.toLowerCase().includes(t)
  );
}
