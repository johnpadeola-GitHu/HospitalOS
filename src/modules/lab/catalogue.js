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
