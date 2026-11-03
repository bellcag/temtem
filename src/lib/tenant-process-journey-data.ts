// Generated from the HTML Tenant Process Journey. Do not hand-edit conditions.
export type JourneySlot = "journey" | "before-pack" | "permit" | "before-opening" | "later";

export type JourneyStep = {
  id: string;
  name: string;
  phaseId: "setup" | "build" | "operate" | "exit";
  phase: string;
  stage: string;
  order: number;
  type: "mandatory" | "conditional";
  slot: JourneySlot;
  description: string;
  /** Empty object means the step always applies. Values inside one key are alternatives. Every key must match. */
  when: Record<string, string[]>;
  documents: string[];
};

export const TENANT_PROCESS_STEPS: JourneyStep[] = [
  {
    "id": "set-up-systems-required-for-works-and-setup",
    "name": "Set Up Systems Required for Works and Setup",
    "phaseId": "setup",
    "phase": "SetUp",
    "stage": "Tenancy Platform Onboarding",
    "order": 1,
    "type": "mandatory",
    "slot": "journey",
    "description": "Your Project Officer creates your tenant, brand and outlet records in OneCalendar — CAG's permit platform. Your contractor then creates their own OneCalendar account, applies for terminal access (approved by your Project Officer), and applies for unit access, which you approve in OneCalendar. No renovation paperwork can move until these accounts and accesses exist.",
    "when": {},
    "documents": [
      "placeholder-onecalendar-guide"
    ]
  },
  {
    "id": "set-up-systems-required-for-staff",
    "name": "Set Up Systems Required for Staff",
    "phaseId": "setup",
    "phase": "SetUp",
    "stage": "Tenancy Platform Onboarding",
    "order": 2,
    "type": "conditional",
    "slot": "before-pack",
    "description": "Register your front-of-house staff for Quality Service Management (QSM) training on the ONE Changi App, guided by your Project Officer.",
    "when": {
      "area": [
        "facing-travelling-pax"
      ]
    },
    "documents": []
  },
  {
    "id": "set-up-webepic-account",
    "name": "Set Up WebEpic Account",
    "phaseId": "setup",
    "phase": "SetUp",
    "stage": "Tenancy Platform Onboarding",
    "order": 3,
    "type": "conditional",
    "slot": "before-pack",
    "description": "Your Project Officer will remind you to submit the WebEpic account creation form via the Enterprise Portal; you then apply for the account directly on WebEpic.",
    "when": {
      "projectOfficerDivision": [
        "landside-concessions"
      ]
    },
    "documents": []
  },
  {
    "id": "point-of-sales-setup",
    "name": "Point of Sales Setup",
    "phaseId": "setup",
    "phase": "SetUp",
    "stage": "Tenancy Platform Onboarding",
    "order": 4,
    "type": "conditional",
    "slot": "before-pack",
    "description": "Your Project Officer links you with NEC to install the Point of Sales (POS) system in your unit.",
    "when": {
      "unitType": [
        "retail",
        "f-and-b"
      ]
    },
    "documents": []
  },
  {
    "id": "kickoff-documents-gathered-and-shared",
    "name": "Kickoff Documents Gathered & Shared",
    "phaseId": "setup",
    "phase": "SetUp",
    "stage": "Pre-KickOff",
    "order": 5,
    "type": "mandatory",
    "slot": "journey",
    "description": "Before the kickoff, your Project Officer assembles your unit's document pack: base-build drawings (from their own set, Newforma, or Master Planning) and Mechanical & Electrical (M&E) drawings (from Integrated Facilities Management (IFM), who check the provision list first). You receive a kickoff package covering: the list of submissions, OneCalendar access info, the Renovation Requirements, Joint Site Inspection requirements, Letter of No Objection & Fire Safety Certificate requirements, Singapore Food Agency (SFA) licence requirements for F&B, basement loading bay booking info, the Tenant-Contractor Kit, and the OneCalendar 3.0 guide. Read the Renovation Requirements before the kickoff — it is the rulebook your design and permits will be checked against.",
    "when": {},
    "documents": [
      "placeholder-cag-renovation-requirements",
      "placeholder-tenancy-design-guidelines",
      "placeholder-provision-list",
      "placeholder-base-build-drawings",
      "placeholder-me-drawings",
      "placeholder-tenant-contractor-kit",
      "placeholder-onecalendar-guide",
      "placeholder-sfa-licence-requirements"
    ]
  },
  {
    "id": "ura-change-of-use",
    "name": "Check Change of Use with URA",
    "phaseId": "setup",
    "phase": "SetUp",
    "stage": "Pre-KickOff",
    "order": 6,
    "type": "conditional",
    "slot": "before-pack",
    "description": "If your intended use differs from the unit's approved use (for example a shop becoming a restaurant, or an office becoming a lounge), appoint a Qualified Person (QP) — a registered consultant architect or professional engineer — to confirm with the Urban Redevelopment Authority (URA) whether a Change Of Use is required, and apply for it if so. Forward URA's Written Permission to CAG before renovation works start. (PDF p.8 §1.14–1.15; PDF p.43 §4.4 item 2.1 — change of use must be made known to CAG Master Planning, with pre-approval endorsed by CC and CAAS.)",
    "when": {
      "workScope": [
        "change-of-use"
      ]
    },
    "documents": [
      "placeholder-cag-renovation-requirements"
    ]
  },
  {
    "id": "high-level-design-review",
    "name": "High-Level Design Review",
    "phaseId": "setup",
    "phase": "SetUp",
    "stage": "Pre-KickOff",
    "order": 7,
    "type": "conditional",
    "slot": "before-pack",
    "description": "Share your preliminary design concept with your Project Officer, who routes it to Design Management and returns their feedback to you before the kickoff.",
    "when": {
      "unitType": [
        "duplex"
      ],
      "workScope": [
        "large-scale-renovation"
      ]
    },
    "documents": []
  },
  {
    "id": "confirmation-of-meeting-attendees",
    "name": "Confirmation of Meeting Attendees",
    "phaseId": "setup",
    "phase": "SetUp",
    "stage": "Pre-KickOff",
    "order": 8,
    "type": "mandatory",
    "slot": "journey",
    "description": "Your kickoff meeting is set by Airport Planning & Leasing — or by the leasing officer / Project Officer directly for Landside Concessions — and your Project Officer confirms the attendees. Attend with your consultant and contractor; Airport Emergency & Safety (AES) and IFM brief the unit's requirements, so come with drawings and perspectives, not a blank site.",
    "when": {},
    "documents": []
  },
  {
    "id": "requirements-and-plan-alignment",
    "name": "Requirements & Plan Alignment",
    "phaseId": "setup",
    "phase": "SetUp",
    "stage": "KickOff",
    "order": 9,
    "type": "mandatory",
    "slot": "journey",
    "description": "At the kickoff meeting: AES reviews fire-safety requirements for your premise type; your Project Officer introduces the stakeholders; you present your renovation intentions and preliminary store design; IFM explains the renovation and work-permit requirements to you and your contractor and answers onsite questions. Take site measurements for your renovation planning. You leave with agreed actions recorded by your Project Officer.",
    "when": {},
    "documents": [
      "placeholder-cag-renovation-requirements",
      "placeholder-provision-list",
      "placeholder-me-drawings"
    ]
  },
  {
    "id": "onboarding-guidelines-shared",
    "name": "Onboarding Guidelines Shared",
    "phaseId": "setup",
    "phase": "SetUp",
    "stage": "Post-KickOff",
    "order": 10,
    "type": "mandatory",
    "slot": "journey",
    "description": "Your Project Officer sends you one post-kickoff email with the consolidated requirements: Renovation Requirements, Joint Site Inspection requirements, Letter of No Objection and Fire Safety Certificate / Minor Addition & Alteration requirements, SFA licence requirements (F&B), and basement loading bay booking info, plus the Tenant-Contractor Kit. Your Project Officer also sets up your Access Control & Scheduling System account for staff access, reminds your contractor to create their own account for loading bay access, requests your Salesforce and Changi Rewards accounts, asks you for Tenant Directory Taxonomy information, and — where applicable — initiates iShopChangi onboarding (the exact tenant condition for iShopChangi is still being confirmed by CAG; see open questions).",
    "when": {},
    "documents": [
      "placeholder-cag-renovation-requirements",
      "placeholder-joint-site-inspection-form",
      "placeholder-tenant-contractor-kit",
      "placeholder-sfa-licence-requirements",
      "placeholder-tenant-directory-taxonomy-template"
    ]
  },
  {
    "id": "confirm-fire-safety-submission-route",
    "name": "Confirm Fire Safety Submission Route",
    "phaseId": "setup",
    "phase": "SetUp",
    "stage": "Post-KickOff",
    "order": 11,
    "type": "conditional",
    "slot": "before-pack",
    "description": "Your Qualified Person (QP) confirms — in writing — whether your works need a Fire Safety Certificate (FSC) from SCDF's Fire Safety and Shelter Department (FSSD), or only a Minor Addition & Alteration (MAA) submission. Getting this wrong is a known cause of rejected or late submissions: new unit fit-outs, modifications to approved fire safety systems, and temporary/phased occupation can each take a different route. Confirm before your contractor prepares the permit pack.",
    "when": {
      "workScope": [
        "fire-safety-submission"
      ]
    },
    "documents": [
      "placeholder-cag-renovation-requirements"
    ]
  },
  {
    "id": "confirmation-of-renovation-plans",
    "name": "Confirmation of Renovation Plans",
    "phaseId": "setup",
    "phase": "SetUp",
    "stage": "Design Review",
    "order": 12,
    "type": "mandatory",
    "slot": "journey",
    "description": "Submit one design pack to your Project Officer by email/Google Drive: coloured design perspectives, architectural plans, elevation plans, ceiling layout plan, signage drawings, and your hoarding plan. Your Project Officer reviews it operationally and routes it to Design Management; if they need to assess materials, they will ask you for a physical material sample board (this is handled case-by-case and is not always required). Revise and resubmit until Design Management approves; your Project Officer communicates the written approval. Do not start permit applications or works before this approval. Drawing conventions from the Renovation Requirements: 1:50 scale, alterations in red, new works in black/blue, deletions in yellow dotted line, endorsed by your consultant and licensed workers.",
    "when": {},
    "documents": [
      "placeholder-cag-renovation-requirements",
      "placeholder-hoarding-plan-template",
      "placeholder-tenancy-design-guidelines"
    ]
  },
  {
    "id": "permit-advisory-and-tenancy-project-selection",
    "name": "Permit Advisory & Tenancy Project Selection",
    "phaseId": "setup",
    "phase": "SetUp",
    "stage": "Permit Application",
    "order": 13,
    "type": "mandatory",
    "slot": "journey",
    "description": "Your Project Officer advises your contractor which permits the planned works need. Your contractor then selects the Tenancy Project work type in OneCalendar and fills in the project details (scope, tenant area, Skytrain-height work, site supervisor). OneCalendar pre-selects the applicable permit types and lists the supporting documents. The Letter of Indemnity is mandatory; note that IFM's reviewers treat the Method of Statement, Risk Assessment and schedule timeline as required in practice even where OneCalendar marks them optional — submitting without them risks a refile (see contradictions C7). Apply at least 2 weeks before works commence.",
    "when": {},
    "documents": [
      "placeholder-onecalendar-guide",
      "placeholder-letter-of-indemnity",
      "placeholder-method-statement-template",
      "placeholder-risk-assessment"
    ]
  },
  {
    "id": "renovation-terminal-permit",
    "name": "Renovation (Terminal) Permit",
    "phaseId": "setup",
    "phase": "SetUp",
    "stage": "Permit Application",
    "order": 14,
    "type": "mandatory",
    "slot": "permit",
    "description": "The base permit for tenancy renovation works. Your contractor fills in the work period, location and nature of work (facade, electrical, sprinkler, fire safety systems, ACMV (air-conditioning and mechanical ventilation), plumbing, architectural, telco, working near/on Skytrain, or others), and acknowledges the CAG Renovation Requirements. Supporting documents: Letter of Indemnity, Method of Statement, Risk Assessment. A copy of the approved permit must be printed and displayed behind the hoarding door or at the worksite once works start.",
    "when": {},
    "documents": [
      "placeholder-cag-renovation-requirements",
      "placeholder-letter-of-indemnity",
      "placeholder-method-statement-template",
      "placeholder-risk-assessment"
    ]
  },
  {
    "id": "ceiling-permit",
    "name": "Ceiling Permit",
    "phaseId": "setup",
    "phase": "SetUp",
    "stage": "Permit Application",
    "order": 15,
    "type": "conditional",
    "slot": "permit",
    "description": "For works above the ceiling outside your tenanted premises (laying cables, pipes, ducting), your contractor submits a separate Ceiling permit before opening any ceiling. The checklist requires a joint site inspection with the Building Maintenance Contractor (BMC), knowledge of the ceiling panel opening/closing method, and a ceiling inspection with photo records; your contractor is responsible for rectifying any damage or non-compliance.",
    "when": {
      "workScope": [
        "above-ceiling-works"
      ]
    },
    "documents": [
      "placeholder-joint-site-inspection-form"
    ]
  },
  {
    "id": "joint-site-inspection",
    "name": "Joint Site Inspection",
    "phaseId": "setup",
    "phase": "SetUp",
    "stage": "Permit Application",
    "order": 16,
    "type": "conditional",
    "slot": "before-pack",
    "description": "Your contractor books a Joint Site Inspection (JSI) with the Building Maintenance Contractor (BMC) to confirm which fire alarm zones or fire protection systems your works affect. The booking method depends on your terminal: T1 and T3 book by web link / QR code; T2 and T4 are walk-in. The BMC endorses the JSI form, which must accompany any Fire Alarm Isolation or Fire Sprinkler Isolation permit — the isolation application will not be approved without the joint verification.",
    "when": {
      "workScope": [
        "fire-alarm-isolation",
        "above-ceiling-works",
        "roof-works"
      ]
    },
    "documents": [
      "placeholder-joint-site-inspection-form"
    ]
  },
  {
    "id": "fire-alarm-isolation-permit",
    "name": "Fire Alarm Isolation / Sprinkler Draining Permit",
    "phaseId": "setup",
    "phase": "SetUp",
    "stage": "Permit Application",
    "order": 17,
    "type": "conditional",
    "slot": "permit",
    "description": "Required when works affect or may trigger any fire protection system — smoke/heat/beam detectors, sprinklers, hose reels, manual call points, kitchen fire suppression, fire alarm panel — including dusty works that could cause false alarms. Your contractor applies in OneCalendar at least 14 working days before the work, attaching the signed JSI form. Any isolation, draining or recharging of sprinklers is done only by CAG's M&E maintenance contractor (chargeable to you), during office hours, and the system must be normalised by 1800 hrs on weekdays; weekend/public-holiday isolation needs CAG/AES approval.",
    "when": {
      "workScope": [
        "fire-alarm-isolation"
      ]
    },
    "documents": [
      "placeholder-isolation-of-fire-alarm-draining-sprinkler-form",
      "placeholder-joint-site-inspection-form"
    ]
  },
  {
    "id": "hotwork-permit",
    "name": "Hotwork Permit",
    "phaseId": "setup",
    "phase": "SetUp",
    "stage": "Permit Application",
    "order": 18,
    "type": "conditional",
    "slot": "permit",
    "description": "Required for any work that generates heat or sparks — welding, arc/oxy-fuel cutting, grinding with electrical equipment. Your contractor applies in OneCalendar at least 7 working days before the work, completing the 17-item contractor hotwork checklist and the AES fire-safety checklist, and attaching a Fire Patroller Certificate: a qualified fire patroller with a fire extinguisher must be on standby throughout (one patroller covers a 15 m radius), and AES levies a service charge for the standby. Photo evidence of hot work commencement and of the 30-minute post-work standby must be sent to the duty fire prevention officer.",
    "when": {
      "workScope": [
        "hot-work"
      ]
    },
    "documents": [
      "placeholder-hot-work-permit-form",
      "placeholder-cag-fire-safety-manual"
    ]
  },
  {
    "id": "architectural-changes-authority-approval",
    "name": "Architectural Changes & Authority Approvals",
    "phaseId": "setup",
    "phase": "SetUp",
    "stage": "Permit Application",
    "order": 19,
    "type": "conditional",
    "slot": "permit",
    "description": "For architectural changes that need — or may need — authority approval, your contractor declares in OneCalendar which authorities are involved (CAAS, URA, SCDF, BCA, PUB, NEA, LTA, NParks, IRAS) and whether approval is required or obtained, attaching as-built drawings (.rvt, .dwg or .pdf). If you want to start work before statutory approvals are in, a Letter of Undertaking signed by your Qualified Person must be submitted to CAG.",
    "when": {
      "workScope": [
        "authority-approval"
      ]
    },
    "documents": [
      "placeholder-letter-of-undertaking-qp"
    ]
  },
  {
    "id": "mep-changes-permit",
    "name": "MEP Changes Permit",
    "phaseId": "setup",
    "phase": "SetUp",
    "stage": "Permit Application",
    "order": 20,
    "type": "conditional",
    "slot": "permit",
    "description": "For adding or removing mechanical or electrical systems — electrical works, ACMV, plumbing/sanitary, sprinklers, fire safety systems, heat-load changes or PA systems. Your contractor submits the MEP details in OneCalendar. M&E modification works may only be done by BCA-registered contractors of the relevant discipline, and electrical works need an EMA Licensed Electrical Worker (LEW).",
    "when": {
      "workScope": [
        "mep-changes"
      ]
    },
    "documents": []
  },
  {
    "id": "bim-submission",
    "name": "BIM Model Submission",
    "phaseId": "setup",
    "phase": "SetUp",
    "stage": "Permit Application",
    "order": 21,
    "type": "conditional",
    "slot": "permit",
    "description": "For works in Terminals 1–4 that remove or add full-height concrete/structural walls, change M&E services outside your unit, or (for offices) change room spaces or corridors, your contractor must submit a Building Information Modeling (BIM) model — proposed works and later as-built — to CAG's Drawing Management Office via the Work Request Portal or your Project Officer. The model follows the CAG Fundamental BIM Standard at Level of Development (LOD) 400 for as-builts, in Autodesk Revit; the final as-built BIM model must be approved by CAG before project closeout. Non-concrete partitions, interior design, flooring, ceiling and lighting are exempt. (PDF p.28 §3.7 — note the PDF's table of contents still says \"T2, 3 and 4 only\" but the section body covers T1–T4; see contradictions C2.)",
    "when": {
      "terminal": [
        "t1",
        "t2",
        "t3",
        "t4"
      ],
      "workScope": [
        "structural-works",
        "mep-changes"
      ]
    },
    "documents": [
      "placeholder-cag-bim-guidelines"
    ]
  },
  {
    "id": "structured-cabling-t3-telephone-permit",
    "name": "Structured Cabling (T3 Tenant Telephone Lines) Permit",
    "phaseId": "setup",
    "phase": "SetUp",
    "stage": "Permit Application",
    "order": 22,
    "type": "conditional",
    "slot": "permit",
    "description": "For commissioning or decommissioning a tenant telephone line on CAG's Structured Cabling (STC) system in Terminal 3 (phone, fax, ADSL, leased-line or data services). Your contractor attaches the STC work request form and an as-built telephone layout plan; submit the work request at least 5 working days before work. CAG's STC maintenance contractor inspects the TE/CP enclosures with you before and after the works.",
    "when": {
      "terminal": [
        "t3"
      ],
      "workScope": [
        "structured-cabling"
      ]
    },
    "documents": [
      "placeholder-stc-work-request-form"
    ]
  },
  {
    "id": "structured-cabling-indoor-outdoor-permit",
    "name": "Structured Cabling Indoor/Outdoor Permit",
    "phaseId": "setup",
    "phase": "SetUp",
    "stage": "Permit Application",
    "order": 23,
    "type": "conditional",
    "slot": "permit",
    "description": "For structured cabling works — cable pulling, patching, or system decommissioning. Your contractor must attach the assigned OSTC/STC ports (email correspondence), CAG's approved Permit to Work for the MCER/CRR/LR rooms, and a physical topology (single-line diagram, network diagram or cable routing).",
    "when": {
      "workScope": [
        "structured-cabling"
      ]
    },
    "documents": []
  },
  {
    "id": "telco-cabling-permit",
    "name": "Telco Cabling Permit",
    "phaseId": "setup",
    "phase": "SetUp",
    "stage": "Permit Application",
    "order": 24,
    "type": "conditional",
    "slot": "permit",
    "description": "For telco cabling works — new project, relocation/reinstatement, or troubleshooting — involving an authorised telco. Your contractor attaches the Telco Letter of Authorisation, Method of Statement, cable routing with cable-containment labels, Letter of Indemnity and Risk Assessment.",
    "when": {
      "workScope": [
        "telco-cabling"
      ]
    },
    "documents": [
      "placeholder-letter-of-indemnity",
      "placeholder-method-statement-template",
      "placeholder-risk-assessment"
    ]
  },
  {
    "id": "catwalk-access-permit",
    "name": "Catwalk Access Permit (Terminal 4)",
    "phaseId": "setup",
    "phase": "SetUp",
    "stage": "Permit Application",
    "order": 25,
    "type": "conditional",
    "slot": "permit",
    "description": "Required when workers must access the Terminal 4 catwalk. Catwalk access is only allowed between 0100 and 0500 hrs, requires workers with airport pass \"D\", a bizSAFE Level 3 (or equivalent) certificate, fall-arrest equipment and a qualified supervisor, and must be accompanied by a Fire Alarm Isolation Permit application in the same project category. Your contractor submits the worker name list and certificates with the application.",
    "when": {
      "terminal": [
        "t4"
      ],
      "workScope": [
        "catwalk-access"
      ]
    },
    "documents": []
  },
  {
    "id": "renovation-terminal-additional-permit",
    "name": "Renovation (Terminal – Additional) Permit",
    "phaseId": "setup",
    "phase": "SetUp",
    "stage": "Permit Application",
    "order": 26,
    "type": "conditional",
    "slot": "permit",
    "description": "An additional renovation permit covering further works (same nature-of-work list as the base Renovation (Terminal) permit). Unlike the base permit, the Risk Assessment, Method of Statement and Letter of Indemnity are mandatory here; optional attachments include the Fall Prevention Plan, Permit-to-Work (Work at Height) form, and architectural drawings. The sources do not define when the Additional permit is required instead of the base permit — confirm with your Project Officer.",
    "when": {
      "workScope": [
        "additional-renovation-scope"
      ]
    },
    "documents": [
      "placeholder-letter-of-indemnity",
      "placeholder-method-statement-template",
      "placeholder-risk-assessment"
    ]
  },
  {
    "id": "skytrain-permit-to-work",
    "name": "Skytrain Permit-To-Work",
    "phaseId": "setup",
    "phase": "SetUp",
    "stage": "Permit Application",
    "order": 27,
    "type": "conditional",
    "slot": "permit",
    "description": "The Skytrain connects T1, T2 and T3. A Skytrain Permit-To-Work (PTW) is required for any work on the guideway, within 6 metres of the guideway structure, on maintenance/station platforms, inside Skytrain workshops/equipment rooms or cars, or where cranes/scaffolds/heavy equipment operate within 6 m of the guideway (a collapse-zone analysis is then required). Apply online at least 3 days before works with your Risk Assessment and Method of Statement, supported by your CAG officer-in-charge. No work without an approved PTW; escort costs (Skytrain contractor or Auxiliary Police Officer) are borne by you. (PDF p.108 §5.15. Not in the blueprint's OneCalendar permit list — see contradictions C16.)",
    "when": {
      "terminal": [
        "t1",
        "t2",
        "t3"
      ],
      "workScope": [
        "skytrain-work"
      ]
    },
    "documents": [
      "placeholder-cag-renovation-requirements"
    ]
  },
  {
    "id": "airside-work-permit",
    "name": "Airside Work Permit (Airfield / Baggage)",
    "phaseId": "setup",
    "phase": "SetUp",
    "stage": "Permit Application",
    "order": 28,
    "type": "conditional",
    "slot": "permit",
    "description": "Construction works in the airside that physically change infrastructure in the airfield (apron and aircraft manoeuvring area) or baggage handling area require an Airside Work Permit (Airfield) or Airside Work Permit (Baggage), and must comply with the Airport Operational and Safety Requirements (AOS). This is separate from the terminal renovation permit. (PDF p.10 §1.27. Not in the blueprint's OneCalendar permit list — see contradictions C16.)",
    "when": {
      "area": [
        "airside",
        "apron"
      ]
    },
    "documents": [
      "placeholder-airport-operational-safety-requirements"
    ]
  },
  {
    "id": "t4-transit-security-requirements",
    "name": "T4 Transit Area Security Requirements",
    "phaseId": "setup",
    "phase": "SetUp",
    "stage": "Permit Application",
    "order": 29,
    "type": "conditional",
    "slot": "permit",
    "description": "For works in the Terminal 4 Transit Area: all staff and goods are security-screened; you must submit the list of tools/equipment that are on the Prohibited Items list (Appendix A of the Renovation Requirements) to the Appropriate Authority through CAG for approval before bringing them in; approved items are tagged and accounted for daily and removed each night; and you must engage Auxiliary Police Officer (APO) escorts at your own cost — workers may not move around the Transit Area unescorted. (PDF p.12–13 §2.5–2.6, Appendix A p.129. No blueprint task covers this — see contradictions C17.)",
    "when": {
      "terminal": [
        "t4"
      ],
      "area": [
        "transit"
      ]
    },
    "documents": [
      "placeholder-t4-prohibited-items-list"
    ]
  },
  {
    "id": "submit-combined-permit-to-work",
    "name": "Submit Combined Permit To Work Application",
    "phaseId": "setup",
    "phase": "SetUp",
    "stage": "Permit Application",
    "order": 30,
    "type": "mandatory",
    "slot": "journey",
    "description": "Your contractor completes the remaining OneCalendar steps and submits the main permit plus all required sub-permits as one Permit To Work application.",
    "when": {},
    "documents": [
      "placeholder-onecalendar-guide"
    ]
  },
  {
    "id": "qualified-person-letter-of-undertaking",
    "name": "Qualified Person Endorsed Letter of Undertaking",
    "phaseId": "setup",
    "phase": "SetUp",
    "stage": "Permit Application",
    "order": 31,
    "type": "conditional",
    "slot": "later",
    "description": "When you take over items from the exiting tenant (most commonly the hoarding), your contractor emails a Qualified Person endorsed Letter of Undertaking to your Project Officer. This is handled outside OneCalendar today; if you take over existing hoarding, you are responsible for re-assessing its structural integrity.",
    "when": {
      "workScope": [
        "takeover-from-exiting-tenant"
      ]
    },
    "documents": [
      "placeholder-letter-of-undertaking-qp"
    ]
  },
  {
    "id": "multi-party-review",
    "name": "Multi-Party Review by Changi Airport Group Stakeholders",
    "phaseId": "setup",
    "phase": "SetUp",
    "stage": "Permit Application",
    "order": 32,
    "type": "mandatory",
    "slot": "journey",
    "description": "After submission, your Project Officer endorses the pack for relevance, completeness and accuracy, then it routes through the reviewers in OneCalendar: the Building Maintenance Contractor (BMC) and AES both review hot work and fire alarm/sprinkler isolation permits, and IFM reviews the whole submission. If any reviewer rejects or requests changes, your contractor revises and resubmits in OneCalendar. Once IFM approves, OneCalendar issues the Permit To Work to your contractor. You track status here — do not chase reviewers directly.",
    "when": {},
    "documents": [
      "placeholder-onecalendar-guide"
    ]
  },
  {
    "id": "requests-permissions-outside-onecalendar",
    "name": "Requests / Permissions Outside OneCalendar",
    "phaseId": "setup",
    "phase": "SetUp",
    "stage": "Permit Application",
    "order": 33,
    "type": "mandatory",
    "slot": "journey",
    "description": "Some permissions are still settled by email, outside OneCalendar — for example kerbside use (Airport Operations), landside roadway permits, road-closure traffic management plans (required for any works that close roads, including anything affecting fire-engine access), and structural requests such as load-bearing walls, beams or super-heavy items (CAG civil/structural team). Ask your Project Officer early whether any of your works need such requests, and your contractor submits them to IFM by email so they do not block your site start.",
    "when": {},
    "documents": []
  },
  {
    "id": "site-walkthrough-and-handover-sign-off",
    "name": "Site Walkthrough, Technical Verification & Handover Sign Off",
    "phaseId": "build",
    "phase": "Build",
    "stage": "Handover",
    "order": 1,
    "type": "mandatory",
    "slot": "journey",
    "description": "Your Project Officer schedules the handover meeting for your tenancy start date. Integrated Facilities Management (IFM) retrieves the unit keys from the Key Management System, walks the site with you, hands over the keys, and fills in the handover form recording the unit condition — you sign it. Note any existing defects on the form before signing; it is your baseline for reinstatement at exit.",
    "when": {},
    "documents": []
  },
  {
    "id": "pre-renovation-briefing",
    "name": "IFM Pre-Renovation Briefing",
    "phaseId": "build",
    "phase": "Build",
    "stage": "Renovation",
    "order": 2,
    "type": "mandatory",
    "slot": "journey",
    "description": "IFM arranges and conducts a pre-renovation briefing with your contractor, walking through the Renovation Requirements and confirming readiness to start works.",
    "when": {},
    "documents": [
      "placeholder-cag-renovation-requirements"
    ]
  },
  {
    "id": "airport-passes-and-hoarding",
    "name": "Airport Passes & Hoarding Installation",
    "phaseId": "build",
    "phase": "Build",
    "stage": "Renovation",
    "order": 3,
    "type": "mandatory",
    "slot": "journey",
    "description": "Your contractor obtains airport passes for the work team, then installs hoarding before any work starts — all works must stay within the hoarded area. The hoarding method statement and detail drawing need a Structural Qualified Person's certification, the graphic design needs CAG approval (or use CAG's design with logo rules), hoarding material must be non-combustible with proof submitted to the permit system, and floor protection (10mm plywood on 4mm underlay with grey felt carpet; 16mm plywood over recon marble in T4) must be laid before works begin.",
    "when": {},
    "documents": [
      "placeholder-hoarding-plan-template",
      "placeholder-cag-renovation-requirements"
    ]
  },
  {
    "id": "temporary-power-request",
    "name": "Temporary Power Request",
    "phaseId": "build",
    "phase": "Build",
    "stage": "Renovation",
    "order": 4,
    "type": "conditional",
    "slot": "before-opening",
    "description": "If your unit does not yet have a permanent meter, your contractor requests temporary power in OneCalendar and IFM activates the temporary supply on site.",
    "when": {
      "unitFeatures": [
        "lack-of-perm-meter"
      ]
    },
    "documents": []
  },
  {
    "id": "fssd-notice-of-approval",
    "name": "FSSD Notice of Approval Submission",
    "phaseId": "build",
    "phase": "Build",
    "stage": "Renovation",
    "order": 5,
    "type": "conditional",
    "slot": "before-opening",
    "description": "Your contractor submits the Fire Safety and Shelter Department (FSSD) Notice of Approval (NOA) via OneCalendar. CAG's notes indicate the NOA may be needed even before renovation works begin and that as-built drawings are required to apply for the Fire Safety Certificate — confirm timing with your Project Officer and AES (see contradictions C6).",
    "when": {
      "workScope": [
        "fire-protection-detection-works"
      ]
    },
    "documents": []
  },
  {
    "id": "qp-fire-safety-assessment",
    "name": "QP Assessment: FSC / MAA / Temporary Fire Permit",
    "phaseId": "build",
    "phase": "Build",
    "stage": "Renovation",
    "order": 6,
    "type": "mandatory",
    "slot": "journey",
    "description": "Your contractor engages a Qualified Person / Professional Engineer to assess whether the completed works require a Fire Safety Certificate, a Minor Addition & Alteration submission, or a Temporary Fire Permit before opening.",
    "when": {},
    "documents": []
  },
  {
    "id": "renovation-works-and-monitoring",
    "name": "Renovation Works & Site Monitoring",
    "phaseId": "build",
    "phase": "Build",
    "stage": "Renovation",
    "order": 7,
    "type": "mandatory",
    "slot": "journey",
    "description": "Your contractor executes the renovation under the approved Permit To Work, work schedule and method statement. Your Project Officer and IFM conduct site checks and can issue a Stop Work Order for any non-compliance. Key site rules from the Renovation Requirements: noisy/dusty works (hacking, drilling, demolition) only between 0100–0500 hrs with 3 days' advance notice to CAG; large equipment moves only 0100–0500 unless approved; debris removed from the airport daily; no flammable liquids stored on site; fire protection systems and escape routes never blocked. Violations carry administrative charges of S$1,000–1,500, stop-work orders and demerit points that can blacklist the contractor.",
    "when": {},
    "documents": [
      "placeholder-cag-renovation-requirements"
    ]
  },
  {
    "id": "waterproofing-and-ponding-test",
    "name": "Waterproofing Checks & Water Ponding Test",
    "phaseId": "build",
    "phase": "Build",
    "stage": "Renovation",
    "order": 8,
    "type": "conditional",
    "slot": "before-opening",
    "description": "If your works affect the waterproofing layer (wet areas such as kitchens and toilets), IFM conducts waterproofing checks with your contractor and witnesses the water ponding test. The waterproofing system must be CAG-approved with a 5- or 10-year warranty (matching your lease), and the ponding test runs at least 48 hours with the report submitted to CAG; floor finishes go in only after FM is satisfied. Whether the ponding test applies to your project is determined at the kickoff meeting (SI row 20).",
    "when": {
      "workScope": [
        "waterproofing-works"
      ]
    },
    "documents": [
      "placeholder-cag-renovation-requirements"
    ]
  },
  {
    "id": "fire-safety-tests-verification",
    "name": "Fire Safety Tests Verification",
    "phaseId": "build",
    "phase": "Build",
    "stage": "Renovation",
    "order": 9,
    "type": "mandatory",
    "slot": "journey",
    "description": "Your Project Officer notifies AES when the fire safety steps are ready; AES verifies the Public Announcement, sprinkler and power tests together with the Building Management Centre (BMC). BMC compiles the signed-off inspection checklist and shares it via IFM to your Project Officer.",
    "when": {},
    "documents": []
  },
  {
    "id": "ceiling-inspection-sign-off",
    "name": "Ceiling Inspection Sign-Off",
    "phaseId": "build",
    "phase": "Build",
    "stage": "Renovation",
    "order": 10,
    "type": "conditional",
    "slot": "before-opening",
    "description": "IFM verifies the ceiling inspection with your contractor and AES verifies it on fire-safety terms, using the signed Pre-Ceiling Opening Inspection Form. Your contractor must check every ceiling panel touched — and the adjacent panels — on completion.",
    "when": {
      "unitFeatures": [
        "ceiling-panel-false-ceiling"
      ]
    },
    "documents": []
  },
  {
    "id": "pa-system-testing",
    "name": "Public Announcement System Testing",
    "phaseId": "build",
    "phase": "Build",
    "stage": "Renovation",
    "order": 11,
    "type": "conditional",
    "slot": "before-opening",
    "description": "IFM witnesses the Public Announcement (PA) system test with your contractor against the PA layout plan. AES has asked that the test result be captured in OneCalendar (it is currently recorded off-system); submitting it 1 day before or during the pre-opening inspection gives the most accurate record.",
    "when": {
      "area": [
        "closed-door-rooms"
      ]
    },
    "documents": []
  },
  {
    "id": "aircon-balancing-test-report",
    "name": "Aircon Balancing Test Report",
    "phaseId": "build",
    "phase": "Build",
    "stage": "Renovation",
    "order": 12,
    "type": "mandatory",
    "slot": "journey",
    "description": "Your contractor submits the aircon balancing test report in OneCalendar.",
    "when": {},
    "documents": []
  },
  {
    "id": "kitchen-fire-suppression-test",
    "name": "Kitchen Fire Suppression System Test",
    "phaseId": "build",
    "phase": "Build",
    "stage": "Renovation",
    "order": 13,
    "type": "conditional",
    "slot": "before-opening",
    "description": "AES verifies completion of the kitchen fire suppression system test. The system — required over all cooking ranges where open flames or deep-frying are used — must be CAG AES-approved and linked to the building's fire alarm system, and your QP/PE(M) must include it in the FSSD submission drawings.",
    "when": {
      "unitType": [
        "f-and-b"
      ],
      "unitFeatures": [
        "deep-frying-open-flame"
      ]
    },
    "documents": []
  },
  {
    "id": "gas-leak-test",
    "name": "Gas Leak Test",
    "phaseId": "build",
    "phase": "Build",
    "stage": "Renovation",
    "order": 14,
    "type": "conditional",
    "slot": "before-opening",
    "description": "AES verifies completion of the gas leak test. Today the term contractor submits the result by email to IFM (it may not be a OneCalendar closure item — confirm the channel with IFM; see contradictions C20). Gas installation and alteration works require City Energy or a Licensed Gas Service Worker, with City Energy's written approval before touching existing gas pipes; connection works affecting the live gas supply happen only between 0001–0500 hrs. This is distinct from the Total Gas Flooding System test.",
    "when": {
      "unitType": [
        "f-and-b"
      ],
      "unitFeatures": [
        "gas-supply"
      ]
    },
    "documents": []
  },
  {
    "id": "total-gas-flooding-system-test",
    "name": "Total Gas Flooding System Test",
    "phaseId": "build",
    "phase": "Build",
    "stage": "Renovation",
    "order": 15,
    "type": "conditional",
    "slot": "before-opening",
    "description": "AES verifies completion of the Total Gas Flooding System (TGFS) test in OneCalendar for units with server or computer rooms.",
    "when": {
      "unitFeatures": [
        "servers-computer-rooms"
      ]
    },
    "documents": []
  },
  {
    "id": "as-built-drawings-upload",
    "name": "As-Built Drawings Upload",
    "phaseId": "build",
    "phase": "Build",
    "stage": "Renovation",
    "order": 16,
    "type": "mandatory",
    "slot": "journey",
    "description": "Your contractor uploads the as-built drawings into OneCalendar. The Renovation Requirements set the deadline at within three weeks of completion of the works — covering BIM, architectural, structural and M&E drawings to CP83, plus the fire protection plans endorsed by your QP. Missing final as-builts are a known enforcement gap; they are required again for Fire Safety Certificate application and at reinstatement, so treat them as a closure item.",
    "when": {},
    "documents": []
  },
  {
    "id": "defects-rectification",
    "name": "Defects Rectification",
    "phaseId": "build",
    "phase": "Build",
    "stage": "Renovation",
    "order": 17,
    "type": "mandatory",
    "slot": "journey",
    "description": "Your contractor rectifies any defects found in stakeholder inspections before the pre-opening stage.",
    "when": {},
    "documents": []
  },
  {
    "id": "fire-safety-certification-submission",
    "name": "Fire Safety Certificate / MAA / Temporary Fire Permit Submission",
    "phaseId": "build",
    "phase": "Build",
    "stage": "Renovation",
    "order": 18,
    "type": "conditional",
    "slot": "before-opening",
    "description": "You submit the Fire Safety Certificate (FSC), Minor Addition & Alteration (MAA) or Temporary Fire Permit — whichever route your QP confirmed — issued by SCDF's Fire Safety and Shelter Department. The premises may not be occupied until AES has the FSC (renovation works) or Letter of Acknowledgement (minor A&A works). AES then reviews the certificate as part of your pre-opening checks.",
    "when": {
      "workScope": [
        "fire-safety-submission"
      ]
    },
    "documents": []
  },
  {
    "id": "pre-opening-inspection",
    "name": "Pre-Opening Inspection",
    "phaseId": "build",
    "phase": "Build",
    "stage": "Renovation",
    "order": 19,
    "type": "mandatory",
    "slot": "journey",
    "description": "Your Project Officer schedules the Pre-Opening Inspection with stakeholders. IFM checks requirement compliance and AES checks fire safety compliance on site; both sign the Pre-Opening Inspection Form. Arrange the joint site inspection at least 3 days before your completion date or scheduled opening — if any fire safety requirement is unmet, the premises stay closed until it is resolved.",
    "when": {},
    "documents": [
      "placeholder-pre-opening-inspection-form"
    ]
  },
  {
    "id": "opening-announcement-and-directory-update",
    "name": "Opening Announcement & Directory Update",
    "phaseId": "build",
    "phase": "Build",
    "stage": "Renovation",
    "order": 20,
    "type": "mandatory",
    "slot": "journey",
    "description": "Your Project Officer announces the opening of your unit to CAG stakeholders and publishes your store information on the Tenant Directory Taxonomy before opening day. Confirm your listing details with your Project Officer.",
    "when": {},
    "documents": [
      "placeholder-tenant-directory-taxonomy-template"
    ]
  },
  {
    "id": "opening-document-submission",
    "name": "Opening Document Submission",
    "phaseId": "operate",
    "phase": "Operate",
    "stage": "Opening",
    "order": 1,
    "type": "mandatory",
    "slot": "journey",
    "description": "Around opening, close out the document loop with IFM: they request your as-built drawings and Certificate of Fitness (COF) requirement via OneCalendar. You ensure the as-built drawings have been submitted in OneCalendar, and submit the COF form — endorsed by your EMA Licensed Electrical Worker (LEW) — to IFM via TOPAZ. The COF covers your electrical installation and must be renewed annually thereafter.",
    "when": {},
    "documents": [
      "placeholder-certificate-of-fitness-forms"
    ]
  },
  {
    "id": "fssd-noa-submission",
    "name": "FSSD Notice of Approval Submission",
    "phaseId": "operate",
    "phase": "Operate",
    "stage": "Opening",
    "order": 2,
    "type": "conditional",
    "slot": "later",
    "description": "You submit the Fire Safety and Shelter Department (FSSD) Notice of Approval (NOA) to IFM / AES via OneCalendar as part of the project closure batch.",
    "when": {
      "workScope": [
        "fire-protection-detection-works"
      ]
    },
    "documents": []
  },
  {
    "id": "store-opening-and-capex-verification",
    "name": "Store Opening & Capex Verification",
    "phaseId": "operate",
    "phase": "Operate",
    "stage": "Opening",
    "order": 3,
    "type": "mandatory",
    "slot": "journey",
    "description": "Your Project Officer sends the store opening email to stakeholders (Airport Operations, Commercial, CAG Adviser & Changi TMC, CMC and others). They then request your renovation invoice: you submit it, and your Project Officer verifies your capital expenditure (capex) commitment is fulfilled. IFM follows up on any outstanding defects, which you rectify.",
    "when": {},
    "documents": []
  },
  {
    "id": "point-of-sales-data-reporting",
    "name": "Point of Sales Data Reporting",
    "phaseId": "operate",
    "phase": "Operate",
    "stage": "Opening",
    "order": 4,
    "type": "conditional",
    "slot": "later",
    "description": "Your Project Officer pulls your sales information from the Point of Sales backend via Customer Discovery Insights, synthesizes it, and shares the report with CAG section heads. No action is required from you beyond keeping the POS running; this step is shown so you know the reporting happens.",
    "when": {
      "unitType": [
        "retail",
        "f-and-b"
      ]
    },
    "documents": []
  },
  {
    "id": "topaz-account-setup",
    "name": "TOPAZ Account Setup for Service Reports",
    "phaseId": "operate",
    "phase": "Operate",
    "stage": "Opening",
    "order": 5,
    "type": "mandatory",
    "slot": "journey",
    "description": "Your Project Officer creates your TOPAZ tenant account (company and outlet details, tenancy dates, terminal, unit number, and the types of service reports you owe, with IFM and AES as points of contact). TOPAZ is where your recurring servicing reports go for the rest of your tenancy.",
    "when": {},
    "documents": []
  },
  {
    "id": "regular-servicing-reporting",
    "name": "Regular Servicing Reporting",
    "phaseId": "operate",
    "phase": "Operate",
    "stage": "Operations",
    "order": 6,
    "type": "mandatory",
    "slot": "journey",
    "description": "You submit recurring servicing reports via TOPAZ, and IFM approves them there. The blueprint lists: kitchen waste pipe report; FCU (Fan Coil Unit) servicing report; grease trap / portable grease trap servicing report; floor trap servicing report; kitchen fire suppression system report (to AES); kitchen supply and exhaust fan system servicing report; Certificate of Fitness; fire alarm system report; Engineered Smoke Control System (ESCS) report; Total Gas Flooding System (TGFS) report; and kitchen duct cleaning report (to CAG). Which of these apply depends on your fit-out — the blueprint does not qualify them individually, so confirm your exact report list with IFM when your TOPAZ account is created (see open questions). The Renovation Requirements set minimum frequencies: COF renewal and electrical meter inspection annually; kitchen fire suppression, sprinkler visual inspection and smoke detector cleaning annually; gas system inspection 3-monthly; VAV/FCU inspection 3-monthly; kitchen exhaust duct chemical cleaning at least annually and kitchen exhaust/fresh-air fans at least 6-monthly (reports in OneCalendar).",
    "when": {},
    "documents": [
      "placeholder-cag-renovation-requirements",
      "placeholder-certificate-of-fitness-forms"
    ]
  },
  {
    "id": "pest-control-reporting",
    "name": "Pest Control Reporting",
    "phaseId": "operate",
    "phase": "Operate",
    "stage": "Operations",
    "order": 7,
    "type": "conditional",
    "slot": "later",
    "description": "You submit your pest control report to IFM via TOPAZ. Engage a pest control operator for regular rodent/pest surveillance — monthly inspection and treatment with a report kept on premises and available to CAG on request; the operator should be reachable 24 hours.",
    "when": {
      "unitType": [
        "f-and-b"
      ]
    },
    "documents": []
  },
  {
    "id": "ahu-servicing-reporting",
    "name": "Air Handling Unit Servicing Reporting",
    "phaseId": "operate",
    "phase": "Operate",
    "stage": "Operations",
    "order": 8,
    "type": "conditional",
    "slot": "later",
    "description": "You submit the Air Handling Unit (AHU) servicing report to IFM via TOPAZ for AHUs that you maintain yourself.",
    "when": {
      "unitFeatures": [
        "tenant-maintained-ahu"
      ]
    },
    "documents": []
  },
  {
    "id": "fire-safety-declaration-and-training",
    "name": "Annual Fire Safety Declaration & Training",
    "phaseId": "operate",
    "phase": "Operate",
    "stage": "Operations",
    "order": 9,
    "type": "mandatory",
    "slot": "journey",
    "description": "Each year, complete the AES fire safety training video, quiz and declaration on the Tenant Fire Safety Declaration Portal. AES tracks submissions and sends renewal reminders before year end; non-submission leads to a chargeable AES inspection of your unit.",
    "when": {},
    "documents": []
  },
  {
    "id": "monthly-sales-declaration",
    "name": "Monthly Sales Declaration",
    "phaseId": "operate",
    "phase": "Operate",
    "stage": "Operations",
    "order": 10,
    "type": "mandatory",
    "slot": "journey",
    "description": "You submit your monthly sales declaration through the Lease Management System.",
    "when": {},
    "documents": []
  },
  {
    "id": "unit-documents-gathered-and-shared",
    "name": "Unit Documents Gathered & Shared",
    "phaseId": "exit",
    "phase": "Exit",
    "stage": "Reinstatement",
    "order": 1,
    "type": "mandatory",
    "slot": "journey",
    "description": "Your Project Officer assembles the reinstatement document pack: the provision list from Airport Planning & Leasing, base-build drawings (own repository / Newforma, or Master Planning for the latest version), and M&E drawings from IFM. IFM also checks the unit's key status and arranges purchase of any missing keys.",
    "when": {},
    "documents": [
      "placeholder-provision-list",
      "placeholder-base-build-drawings",
      "placeholder-me-drawings"
    ]
  },
  {
    "id": "reinstatement-meeting",
    "name": "Reinstatement Requirements & Plan Alignment",
    "phaseId": "exit",
    "phase": "Exit",
    "stage": "Reinstatement",
    "order": 2,
    "type": "mandatory",
    "slot": "journey",
    "description": "Your Project Officer schedules the reinstatement meeting. IFM attends and explains the reinstatement requirements — what the unit must be returned to, per the base-build drawings and provision list. If an incoming tenant is taking over the unit, your Project Officer links both parties; takeovers of items (e.g. hoarding) are formalised with a signed Letter of Undertaking. You must reinstate the premises to their original state if CAG requires it.",
    "when": {},
    "documents": [
      "placeholder-letter-of-undertaking-qp",
      "placeholder-provision-list"
    ]
  },
  {
    "id": "reinstatement-permit-submission",
    "name": "Reinstatement Permit Submission via OneCalendar",
    "phaseId": "exit",
    "phase": "Exit",
    "stage": "Reinstatement",
    "order": 3,
    "type": "mandatory",
    "slot": "journey",
    "description": "Your contractor submits the reinstatement Permit To Work in OneCalendar with the reinstatement scope, method statement and safe work procedures. The same permit discipline applies as in SetUp — hot work, fire alarm isolation and other sub-permits ride along where the reinstatement works need them.",
    "when": {},
    "documents": [
      "placeholder-onecalendar-guide",
      "placeholder-method-statement-template",
      "placeholder-risk-assessment"
    ]
  },
  {
    "id": "reinstatement-multi-party-review",
    "name": "Multi-Party Review by Changi Airport Group Stakeholders",
    "phaseId": "exit",
    "phase": "Exit",
    "stage": "Reinstatement",
    "order": 4,
    "type": "mandatory",
    "slot": "journey",
    "description": "IFM reviews the reinstatement Permit To Work against the renovation requirements; AES reviews it against fire safety provisions, including the method statement (fire protection parts, permit isolation and hot works) and the safe work procedures. Once stakeholders approve, OneCalendar issues the reinstatement Permit To Work to your contractor.",
    "when": {},
    "documents": []
  },
  {
    "id": "pre-reinstatement-works",
    "name": "Pre-Reinstatement Works",
    "phaseId": "exit",
    "phase": "Exit",
    "stage": "Reinstatement",
    "order": 5,
    "type": "mandatory",
    "slot": "journey",
    "description": "Before reinstatement starts: your Project Officer updates the Tenant Directory Taxonomy with your store closure and notifies stakeholders; your contractor installs hoarding before works begin (same hoarding rules as renovation — non-combustible material, PE-endorsed drawings, floor protection).",
    "when": {},
    "documents": [
      "placeholder-hoarding-plan-template"
    ]
  },
  {
    "id": "point-of-sales-removal",
    "name": "Point of Sales Removal",
    "phaseId": "exit",
    "phase": "Exit",
    "stage": "Reinstatement",
    "order": 6,
    "type": "conditional",
    "slot": "later",
    "description": "The Point of Sales removal is coordinated with NEC; your Project Officer is looped into the removal notice. Confirm the deactivation date so sales reporting closes cleanly.",
    "when": {
      "unitType": [
        "retail",
        "f-and-b"
      ]
    },
    "documents": []
  },
  {
    "id": "stc-disconnection",
    "name": "Structured Cabling Disconnection (Terminal 3)",
    "phaseId": "exit",
    "phase": "Exit",
    "stage": "Reinstatement",
    "order": 7,
    "type": "conditional",
    "slot": "later",
    "description": "If you have telephone/voice lines on CAG's Structured Cabling (STC) system in Terminal 3, submit the disconnection work request form at least 5 working days before the handover inspection, attaching the approved reinstatement Works Permit and as-built drawings. Remove all your telephone points, BT boxes, voice cabling and cable supports and reinstate them to the original condition. (PDF p.100 §5.10(xviii); form referenced in Inventory row 83.)",
    "when": {
      "terminal": [
        "t3"
      ],
      "workScope": [
        "structured-cabling"
      ]
    },
    "documents": [
      "placeholder-stc-work-request-form"
    ]
  },
  {
    "id": "reinstatement-works",
    "name": "Reinstatement Works",
    "phaseId": "exit",
    "phase": "Exit",
    "stage": "Reinstatement",
    "order": 8,
    "type": "mandatory",
    "slot": "journey",
    "description": "Your contractor carries out the reinstatement works under the approved reinstatement Permit To Work and the reinstatement requirements. Your Project Officer monitors progress and can issue a Stop Work Order for non-compliance — the same site rules (working hours, debris removal, fire safety) apply as during renovation.",
    "when": {},
    "documents": [
      "placeholder-cag-renovation-requirements"
    ]
  },
  {
    "id": "pre-takeover-inspection",
    "name": "Pre-Takeover Inspection",
    "phaseId": "exit",
    "phase": "Exit",
    "stage": "Reinstatement",
    "order": 9,
    "type": "mandatory",
    "slot": "journey",
    "description": "Your Project Officer schedules the pre-takeover inspection; IFM inspects the reinstated premises with you, and you rectify any reinstatement defects found.",
    "when": {},
    "documents": []
  },
  {
    "id": "takeover-meeting",
    "name": "Takeover Meeting",
    "phaseId": "exit",
    "phase": "Exit",
    "stage": "Reinstatement",
    "order": 10,
    "type": "mandatory",
    "slot": "journey",
    "description": "Once IFM verifies the rectifications, you hand the premises — and the keys — back to IFM, and IFM signs the takeover form with you. Your Project Officer receives a copy of the signed form. Keep your copy: it triggers the security deposit release.",
    "when": {},
    "documents": []
  },
  {
    "id": "post-takeover-closure-announcement",
    "name": "Post-Takeover Closure Announcement",
    "phaseId": "exit",
    "phase": "Exit",
    "stage": "Reinstatement",
    "order": 11,
    "type": "mandatory",
    "slot": "journey",
    "description": "Your Project Officer sends the store closure email to stakeholders (Airport Operations, Commercial, CAG Adviser & Changi TMC, CMC and others).",
    "when": {},
    "documents": []
  },
  {
    "id": "security-deposit-and-utility-settlement",
    "name": "Security Deposit Release & Utility Bill Settlement",
    "phaseId": "exit",
    "phase": "Exit",
    "stage": "Reinstatement",
    "order": 12,
    "type": "mandatory",
    "slot": "journey",
    "description": "Your Project Officer initiates the security deposit release with Finance on the strength of the signed takeover form (systems are deactivated automatically at the lease end date). You settle any outstanding utility charges notified by Finance, and Finance releases the deposit to you.",
    "when": {},
    "documents": []
  }
];
