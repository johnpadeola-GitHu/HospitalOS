// Tenant Service Agreement — the terms every hospital agrees to as the
// final step of activation, before their account is provisioned. Structured
// the same way as help content (an array of blocks), so it can render
// inline in the wizard AND generate a PDF from the same source, rather than
// maintaining two copies that could drift apart.
//
// This is a template for AgoroX's own use, not a substitute for review by
// qualified legal counsel before it carries real contractual weight —
// stated once here, not repeated through the document itself.

export const AGREEMENT_VERSION = "1.0";
export const AGREEMENT_EFFECTIVE_DATE = "1 August 2026";

export const AGREEMENT_SECTIONS = [
  {
    title: "1. Parties",
    body: [
      "This Tenant Service Agreement (\u201cAgreement\u201d) is entered into between AgoroX Africa (\u201cAgoroX\u201d, \u201cwe\u201d, \u201cus\u201d), the operator of the HospitalOS platform, and the hospital, clinic, or healthcare facility identified by the activation code used to accept this Agreement (\u201cTenant\u201d, \u201cyou\u201d).",
      "The individual accepting this Agreement on the Tenant's behalf represents that they are authorised to bind the Tenant to its terms.",
    ],
  },
  {
    title: "2. Definitions",
    body: [
      "\u201cPlatform\u201d means the HospitalOS software-as-a-service application, including all modules, updates, and associated services made available by AgoroX.",
      "\u201cTenant Data\u201d means all patient records, clinical data, financial records, and other information the Tenant or its staff enters into or generates through the Platform.",
      "\u201cSubscription Plan\u201d means the pricing tier (Starter, Growth, Scale, or Enterprise) assigned to the Tenant's activation code at the time of issue.",
      "\u201cAuthorised Users\u201d means employees, contractors, and staff of the Tenant granted accounts on the Platform by the Tenant's own administrators.",
    ],
  },
  {
    title: "3. Grant of Access",
    body: [
      "Subject to this Agreement and timely payment of applicable fees, AgoroX grants the Tenant a non-exclusive, non-transferable right to access and use the Platform for the Tenant's own internal healthcare operations, across multiple devices and, where the Tenant operates more than one physical site, multiple centres under a single tenancy.",
      "Access is provisioned only through an activation code issued by AgoroX. The Tenant may not sell, sublicense, or otherwise transfer its access to any third party.",
    ],
  },
  {
    title: "4. Subscription Plans and Fees",
    body: [
      "The Tenant's Subscription Plan and applicable fee structure are fixed at the time AgoroX issues the activation code and are not altered by anything entered during activation:",
    ],
    table: {
      head: ["Plan", "Fee structure"],
      rows: [
        ["Starter", "2.75% commission on gross collections processed through the Platform. No upfront subscription fee."],
        ["Growth", "2.25% commission on gross collections processed through the Platform. No upfront subscription fee."],
        ["Scale", "1.75% commission on gross collections processed through the Platform. No upfront subscription fee."],
        ["Enterprise", "\u20a64,500,000 per year, payable annually in advance. No commission on collections."],
      ],
    },
    bodyAfter: [
      "Commission-based plans are settled on a monthly cycle, with gross collections, the commission deducted, and the net amount payable to the Tenant all shown in Platform Settlement records available to the Tenant's administrators.",
      "AgoroX may introduce new Subscription Plans or adjust pricing for future tenants at its discretion; changes to an existing Tenant's fee structure require thirty (30) days' written notice and do not apply retroactively.",
    ],
  },
  {
    title: "5. Payment Terms",
    body: [
      "For commission-based plans, the commission is calculated automatically on gross collections processed through the Platform's billing and payments modules and is deducted at settlement.",
      "For the Enterprise plan, AgoroX will invoice the Tenant annually in advance. Accounts not settled within thirty (30) days of the invoice date may be suspended until payment is received.",
      "All fees are exclusive of applicable taxes, levies, or statutory charges, which are the Tenant's responsibility unless stated otherwise.",
    ],
  },
  {
    title: "6. Term and Renewal",
    body: [
      "This Agreement takes effect on the date the Tenant's activation code is redeemed and continues until terminated by either party under Section 14.",
      "Enterprise subscriptions renew automatically for successive twelve-month terms unless either party gives at least thirty (30) days' written notice of non-renewal before the end of the then-current term.",
    ],
  },
  {
    title: "7. Ownership of Tenant Data",
    body: [
      "The Tenant retains full ownership of all Tenant Data. AgoroX claims no ownership interest in patient records, clinical data, or any other information the Tenant or its Authorised Users enter into the Platform.",
      "AgoroX will not access, use, or disclose Tenant Data except: (a) as necessary to provide and support the Platform; (b) with the Tenant's consent; (c) to comply with a valid legal obligation; or (d) in aggregated, de-identified form that cannot reasonably be used to identify any individual patient, for the purpose of improving the Platform.",
    ],
  },
  {
    title: "8. Data Protection and Privacy",
    body: [
      "AgoroX processes Tenant Data as a data processor on the Tenant's behalf and will handle it in accordance with the Nigeria Data Protection Act 2023 and applicable healthcare data protection obligations.",
      "The Tenant remains the data controller for all patient data entered into the Platform and is responsible for obtaining any patient consent required by law for the collection and processing of that data.",
      "AgoroX will notify the Tenant without undue delay upon becoming aware of any data breach affecting Tenant Data, in accordance with applicable law.",
    ],
  },
  {
    title: "9. Tenant Responsibilities",
    body: [
      "The Tenant agrees to:",
    ],
    list: [
      "Provide accurate information about the Tenant's identity, registration, and contact details during activation and keep it current.",
      "Manage its own Authorised User accounts responsibly, including assigning appropriate roles, deactivating accounts for staff who leave, and keeping login credentials confidential.",
      "Use the Platform only for lawful healthcare operations and in compliance with applicable Nigerian healthcare regulations and professional licensing requirements for its clinical staff.",
      "Ensure the accuracy of clinical, billing, and patient data entered into the Platform; AgoroX is not responsible for clinical decisions made using information the Tenant or its staff entered.",
      "Not attempt to circumvent, reverse-engineer, or interfere with the Platform's security controls, or use the Platform to store or transmit unlawful content.",
    ],
  },
  {
    title: "10. AgoroX Responsibilities",
    body: [
      "AgoroX agrees to:",
    ],
    list: [
      "Use commercially reasonable efforts to make the Platform available and to maintain the security measures described in this Agreement.",
      "Provide support to the Tenant's administrators through the channels published on the Platform from time to time.",
      "Maintain an audit trail of security-relevant actions on the Platform, as described in Administration \u2192 Security & audit.",
      "Notify the Tenant of material changes to the Platform that would reasonably be expected to affect its use.",
    ],
  },
  {
    title: "11. Service Availability",
    body: [
      "AgoroX targets high availability for the Platform but does not guarantee uninterrupted access. Planned maintenance will be communicated in advance where practicable; emergency maintenance may occur without notice.",
      "AgoroX is not liable for unavailability caused by factors outside its reasonable control, including internet service provider failures, power outages at the Tenant's premises, or events described in Section 18 (Force Majeure).",
    ],
  },
  {
    title: "12. Intellectual Property",
    body: [
      "The Platform, including its software, design, and documentation, is and remains the property of AgoroX. This Agreement grants the Tenant a right to use the Platform; it does not transfer any ownership interest in it.",
      "Any feedback, suggestions, or feature requests the Tenant provides to AgoroX may be used by AgoroX without obligation or compensation to the Tenant.",
    ],
  },
  {
    title: "13. Confidentiality",
    body: [
      "Each party agrees to protect the other's confidential information with the same degree of care it uses for its own confidential information, and not to disclose it to third parties except as necessary to perform this Agreement or as required by law.",
      "This obligation survives termination of this Agreement for a period of three (3) years, except with respect to Tenant Data, which remains protected under Section 8 for as long as AgoroX retains it.",
    ],
  },
  {
    title: "14. Termination",
    body: [
      "Either party may terminate this Agreement for convenience with thirty (30) days' written notice.",
      "AgoroX may suspend or terminate the Tenant's access immediately if the Tenant: (a) fails to pay undisputed fees within the period specified in Section 5; (b) materially breaches this Agreement and does not cure the breach within fourteen (14) days of notice; or (c) uses the Platform in a manner that AgoroX reasonably believes poses a security risk to other tenants or to patients.",
      "Upon termination, AgoroX will make Tenant Data available for export for a period of thirty (30) days, after which it may be permanently deleted from AgoroX's systems, except where retention is required by law.",
    ],
  },
  {
    title: "15. Limitation of Liability",
    body: [
      "To the fullest extent permitted by law, AgoroX's total liability arising out of or related to this Agreement will not exceed the fees paid by the Tenant to AgoroX in the twelve (12) months preceding the event giving rise to the claim.",
      "Neither party is liable for indirect, incidental, special, or consequential damages, including loss of profits or loss of data, except in cases of gross negligence, wilful misconduct, or breach of the confidentiality or data protection obligations in this Agreement.",
      "Nothing in this Agreement limits liability that cannot be limited by law, including liability for death or personal injury caused by negligence.",
    ],
  },
  {
    title: "16. Indemnification",
    body: [
      "The Tenant agrees to indemnify AgoroX against claims arising from the Tenant's misuse of the Platform, violation of applicable law, or breach of this Agreement.",
      "AgoroX agrees to indemnify the Tenant against claims that the Platform, as provided by AgoroX and used in accordance with this Agreement, infringes a third party's intellectual property rights.",
    ],
  },
  {
    title: "17. Compliance with Healthcare Regulations",
    body: [
      "The Tenant is solely responsible for ensuring its own compliance with applicable Nigerian healthcare regulations, including licensing requirements for medical practitioners, the National Health Insurance Authority framework where applicable, and any state or federal ministry of health requirements governing the Tenant's operations.",
      "The Platform is a record-keeping and operational tool; it does not constitute medical advice, and AgoroX is not responsible for clinical outcomes.",
    ],
  },
  {
    title: "18. Force Majeure",
    body: [
      "Neither party is liable for delay or failure to perform its obligations under this Agreement (other than payment obligations) caused by events beyond its reasonable control, including natural disasters, war, civil unrest, government action, or widespread internet or power infrastructure failure.",
    ],
  },
  {
    title: "19. Governing Law and Dispute Resolution",
    body: [
      "This Agreement is governed by the laws of the Federal Republic of Nigeria.",
      "The parties will attempt to resolve any dispute arising from this Agreement through good-faith negotiation. If unresolved within thirty (30) days, either party may refer the dispute to arbitration under the Arbitration and Mediation Act 2023, seated in Lagos, Nigeria, with proceedings conducted in English.",
    ],
  },
  {
    title: "20. General",
    body: [
      "This Agreement, together with any Subscription Plan details assigned at activation, constitutes the entire agreement between the parties regarding the Platform and supersedes any prior discussions.",
      "AgoroX may update this Agreement from time to time; material changes will be communicated to the Tenant, and continued use of the Platform after the effective date of an update constitutes acceptance of the revised terms.",
      "If any provision of this Agreement is found unenforceable, the remaining provisions continue in full effect.",
      "Neither party may assign this Agreement without the other's written consent, except that AgoroX may assign it in connection with a merger, acquisition, or sale of substantially all its assets.",
    ],
  },
];
