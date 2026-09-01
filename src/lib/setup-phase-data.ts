export type Guideline = { text: string; ref?: string };

export type SystemLink = { title: string; subtitle: string };

export type Conditional = {
  title: string;
  timing?: string;
  items: Guideline[];
};

export type StepCard = {
  id: string;
  n: number;
  chip: string;
  title: string;
  body: string;
  guidelines: Guideline[];
  alsoFollowIf?: Conditional[];
  systems?: SystemLink[];
  docs?: string[];
};

export type FilterGroup = {
  heading: string;
  items: { label: string; stepId: string }[];
};

export const NAV_PRIMARY = [
  { id: "home", label: "Home", icon: "home" },
  { id: "process", label: "Process", icon: "process" },
  { id: "documents", label: "Documents", icon: "documents" },
  { id: "permit", label: "Permit Screener", icon: "permit" },
  { id: "links", label: "Useful Links", icon: "useful-links" },
  { id: "contacts", label: "Contacts", icon: "contacts" },
] as const;

export const NAV_FOOTER = [
  { id: "settings", label: "Settings", icon: "settings" },
  { id: "logout", label: "Log Out", icon: "logout" },
] as const;

export const PHASE_TABS = ["SetUp", "Build", "Operate", "Exit"] as const;

export const UNIT_CHIPS = ["T1", "Airside", "Retail"] as const;

export const FILTER_GROUPS: FilterGroup[] = [
  {
    heading: "Tenancy Onboarding Platform",
    items: [
      { label: "Set Up Systems Required for Works and Setup", stepId: "step-1" },
      { label: "Set Up Systems Required for Staff", stepId: "step-2" },
      { label: "Set Up Systems Required for Operations", stepId: "step-3" },
    ],
  },
  {
    heading: "Pre-KickOff",
    items: [
      { label: "Kickoff Documents Gathered & Shared", stepId: "step-4" },
      { label: "Confirmation of Meeting Attendees", stepId: "step-5" },
      { label: "Set Up Systems Required for Operations", stepId: "step-3" },
    ],
  },
  {
    heading: "KickOff",
    items: [{ label: "Requirements & Plan Alignment", stepId: "step-6" }],
  },
  {
    heading: "Post-KickOff",
    items: [{ label: "Onboarding Guidelines Shared", stepId: "step-7" }],
  },
  {
    heading: "Design Review",
    items: [{ label: "Confirmation of Renovation Plans", stepId: "step-8" }],
  },
  {
    heading: "Permit Application",
    items: [
      {
        label: "Permit Selection & Document Preparation by Tenant/Contractor",
        stepId: "step-9",
      },
      { label: "Joint Site Inspection", stepId: "step-10" },
      {
        label: "Permit Selection & Supporting Document Submission",
        stepId: "step-11",
      },
      {
        label: "Multi-Party Review by Changi Airport Group Stakeholders",
        stepId: "step-12",
      },
      { label: "Requests / Permissions Outside OneCalendar", stepId: "step-13" },
    ],
  },
];

export const STEPS: StepCard[] = [
  {
    id: "step-1",
    n: 1,
    chip: "Setup Phase . Tenancy Platform Onboarding Stage",
    title: "Set Up Systems Required for Works and Setup",
    body: "Your contractor applies in OneCalendar. You’ll approve their unit access when the request arrives - you can follow along here.",
    guidelines: [
      {
        text: "Do not start renovation, refurbishment or alteration works until a Works Permit is approved in OneCalendar. Your contractor applies; you approve their unit access when the request arrives.",
        ref: "Renovation Guideline 1.1",
      },
    ],
    systems: [
      { title: "OneCalendar", subtitle: "Works permit and submission platform" },
    ],
  },
  {
    id: "step-2",
    n: 2,
    chip: "Setup Phase . Tenancy Platform Onboarding Stage",
    title: "Set Up Systems Required for Staff",
    body: "Register your front-of-house staff for Quality Service Management where the outlet faces travelling passengers.",
    guidelines: [
      {
        text: "Register your staff for Quality Service Management training in the ONE Changi App. Your Project Officer can guide you.",
      },
    ],
    systems: [
      { title: "ONE Changi App", subtitle: "Tenant notices and services" },
      { title: "Quality Service Management", subtitle: "Service quality reporting" },
    ],
  },
  {
    id: "step-3",
    n: 3,
    chip: "Pre-Kick Phase . Kickoff Documents Gathered & Shared",
    title: "Set Up Systems Required for Operations",
    body: "Your Project Officer will remind you about WebEpic and, for F&B or Retail, loop in NEC for POS.",
    guidelines: [
      {
        text: "A reminder is going out to submit the WebEpic application via Enterprise Portal.",
      },
      { text: "NEC is being looped in for Point of Sales setup." },
    ],
    systems: [
      { title: "WebEpic", subtitle: "Invoicing and vendor payments" },
      { title: "Point of Sales", subtitle: "Outlet sales reporting" },
    ],
  },
  {
    id: "step-4",
    n: 4,
    chip: "Set Up Phase . Pre-Kick Off",
    title: "Kickoff Documents Gathered & Shared",
    body: "You’ll receive the kickoff pack with drawings and unit facts from your Project Officer before site requirements are confirmed.",
    guidelines: [
      {
        text: "Read the Renovation Requirements together with the Tenancy Design Guidelines and the provision list for this unit - they are one package, not optional extras.",
        ref: "Renovation Guideline 1.4",
      },
      {
        text: "CAG drawings in the kickoff pack may not show the true as-built condition. The consultant or Professional Engineer must verify them on site before design is locked.",
        ref: "Renovation Guideline 3.6.11 ",
      },
    ],
    systems: [
      { title: "OneCalendar", subtitle: "Works permit and submission platform" },
    ],
    docs: [
      "Provision List - T3-AS-114",
      "M&E Drawings - T3-AS-114",
      "CAG Renovation Requirements (Jun 2026 v2.0)",
      "Fire Safety Requirements - Renovation Works",
      "Electrical Requirements - Tenancy Works",
    ],
  },
  {
    id: "step-5",
    n: 5,
    chip: "Set Up Phase . Pre-Kick Off",
    title: "Confirmation of Meeting Attendees",
    body: "Your Project Officer will send the kickoff invite. Attend with your consultant and contractor. AES and IFM brief the unit - come with drawings and perspectives, not a blank site.",
    guidelines: [
      {
        text: "Attend the kickoff meeting your Project Officer arranges. Bring your consultant and contractor if you can. Facility Management and Engineering & Development may also attend. Use this session to ask about the unit, work procedures and airport rules.",
        ref: "Renovation Guideline 3.1(i)",
      },
      {
        text: "Bring drawings and perspectives that already follow the Renovation Requirements. Do not arrive expecting CAG to brief a unit with no drawings.",
        ref: "Renovation Guideline 3.1(ii)",
      },
    ],
    systems: [
      {
        title: "Outlook Meeting Scheduler",
        subtitle: "Meeting invites and attendance",
      },
    ],
  },
  {
    id: "step-6",
    n: 6,
    chip: "Set Up Phase . Kick Off",
    title: "Requirements & Plan Alignment",
    body: "AES covers fire safety for your premise type. Your Project Officer introduces the room. IFM walks renovation rules and takes onsite questions. You leave with agreed actions.",
    guidelines: [
      {
        text: "Appoint a consultant architect or Professional Engineer to take overall charge of the works. They must follow all applicable Singapore laws and agency codes (including BCA, URA and CAAS).",
        ref: "Renovation Guideline 1.2",
      },
      {
        text: "Only BCA-registered contractors of the right discipline may modify Mechanical & Electrical systems.",
        ref: "Renovation Guideline 1.3",
      },
      {
        text: "Works can only go ahead with a qualified site supervisor on site full-time. Give CAG that person’s name and contact details.",
        ref: "Renovation Guideline 1.7",
      },
      {
        text: "Do not hack beams, columns or slabs, including drilling inserts through them.",
        ref: "Renovation Guideline 1.11",
      },
      {
        text: "Works must not extend into neighbouring units or into public and common areas such as toilets, stairs, corridors and lifts.",
        ref: "Renovation Guideline 1.6",
      },
      {
        text: "Terminals 1–4 have an Engineered Smoke Control system. Get a Letter of No Objection from a Fire Safety Engineer or Qualified Person confirming the design does not affect it - or get authority approval before changing it.",
        ref: "Renovation Guideline 1.21",
      },
      {
        text: "Before you hire a contractor, check with your Project Officer that they are not on CAG’s blacklist. If you use a blacklisted contractor, CAG can take away the permit, stop works for 2–5 days, charge S$1,000–S$1,500, and add demerit points.",
        ref: "Renovation Guideline 1.26",
      },
      {
        text: "Your Qualified Person must confirm whether a Fire Safety Certificate, Minor Addition & Alteration, or Temporary Fire Permit is needed for this unit.",
        ref: "Renovation Guideline 5.9",
      },
    ],
    docs: [
      "CAG Renovation Requirements (Jun 2026 v2.0)",
      "Fire Safety Requirements - Renovation Works",
      "Provision List - T3-AS-114",
      "M&E Drawings - T3-AS-114",
    ],
  },
  {
    id: "step-7",
    n: 7,
    chip: "Set Up Phase . Kick Off",
    title: "Onboarding Guidelines Shared",
    body: "You’ll receive one post-kickoff email with checklists and access notes. Your Project Officer also sets up staff access and asks for directory details.",
    guidelines: [
      {
        text: "Apply for the Works Permit about two weeks before works start. Keep the approved permit (and isolation / hot-work / STC permits) printed behind the hoarding door or on site.",
        ref: "Renovation Guideline 3.1(iii)",
      },
      {
        text: "The architect or PE must obtain the fire strategy / FSER and FSSD-approved drawings for this terminal before they design.",
        ref: "Renovation Guideline 3.6.2",
      },
      {
        text: "Your contractor should submit the Works Permit in OneCalendar about two weeks before renovation starts. Approved Isolation, Hot Work and STC permits must be printed and displayed behind the hoarding door or on site.",
        ref: "Renovation Guideline 3.1(iii)",
      },
    ],
    systems: [
      {
        title: "Access Control & Scheduling System",
        subtitle: "Loading bay and lift bookings",
      },
      { title: "Salesforce", subtitle: "Customer and lead records" },
      { title: "Changi Rewards", subtitle: "Loyalty programme" },
      { title: "iShopChangi", subtitle: "Online storefront" },
    ],
    docs: [
      "CAG Renovation Requirements (Jun 2026 v2.0)",
      "Joint Site Inspection (JSI) Form",
      "Fire Safety Requirements - Renovation Works",
      "Tenant Design Guidelines (F&B)",
      "SFA Licence Application Guide",
    ],
  },
  {
    id: "step-8",
    n: 8,
    chip: "Setup Phase . Design Review",
    title: "Confirmation of Renovation Plans",
    body: "Send one design pack to your Project Officer. Revise it if Design Management comments, and wait for written approval before permits.",
    guidelines: [
      {
        text: "Mark proposed changes in colour on the plan: alterations in red, new work in black or blue, and deletions in yellow dotted lines. The architect or PE, and the licensed plumber or Licensed Electrical Worker, must endorse the drawings.",
        ref: "Renovation Guideline 3.6.9–3.6.10",
      },
      {
        text: "Survey the unit and the landlord shopfront, and design to those as-built dimensions. Shop-sign artwork, lighting (warm 3000K) and unit-number placement need CAG approval before fabrication. Do not alter the bulkhead without written approval.",
        ref: "Renovation Guideline 4.1.1",
      },
      {
        text: "Follow the Green Fit-Out Guidelines in the Renovation Requirements for materials, lighting and resource use.",
        ref: "Renovation Guideline 10",
      },
    ],
    alsoFollowIf: [
      {
        title: "Electrical works",
        items: [
          {
            text: "Electrical drawings must carry a title block, company chop, and endorsement by a Licensed Electrical Worker of the right grade.",
            ref: "Renovation Guideline 6.1.9",
          },
        ],
      },
      {
        title: "Fire protection affected",
        items: [
          {
            text: "The Professional Engineer (Mechanical) must endorse on the drawings whether the fire protection system is affected by the renovation.",
            ref: "Renovation Guideline 6.1.9",
          },
        ],
      },
    ],
    systems: [{ title: "Google Drive", subtitle: "Shared working files" }],
    docs: ["Tenant Design Guidelines (F&B)", "Hoarding Plan Template"],
  },
  {
    id: "step-9",
    n: 9,
    chip: "Setup Phase . Permit Application",
    title: "Permit Selection & Document Preparation by Tenant/Contractor",
    body: "Your contractor applies in OneCalendar. Your Project Officer will tell them which permits this unit needs - you do not submit these yourself.",
    guidelines: [
      {
        text: "Your contractor selects Tenancy Project in OneCalendar. Follow the approved Works Permit - you stay the Applicant.",
        ref: "Renovation Guideline 1.1, 3.1(iii)",
      },
      {
        text: "You are the Applicant, so workplace safety on site stays your responsibility even if the contractor runs the works.",
        ref: "Renovation Guideline 1.18–1.23",
      },
      {
        text: "The works team must acknowledge Workplace Safety and Health and in-house safety rules before work starts.",
        ref: "Renovation Guideline App D",
      },
      {
        text: "Your contractor’s project manager must attend CAG’s Fire Alarm Briefing before isolation works.",
        ref: "Renovation Guideline 5.9",
      },
      {
        text: "Works Permit in OneCalendar.",
        ref: "Renovation Guideline 3.1(iii)",
      },
    ],
    alsoFollowIf: [
      {
        title: "Works near Skytrain",
        timing: "3 days before Skytrain works",
        items: [
          {
            text: "Within 6 m of Skytrain. Attach risk assessment, method statement and collapse-zone analysis.",
            ref: "Renovation Guideline 5.15(v)",
          },
          {
            text: "Do not store anything under the Skytrain guideway.",
            ref: "Renovation Guideline 5.15",
          },
        ],
      },
      {
        title: "T3 structured cabling",
        timing: "5 working days before cabling works",
        items: [
          {
            text: "Work-request form with approved Works Permit and A3 shop drawings.",
            ref: "Renovation Guideline 5.10(xi)",
          },
          {
            text: "Extra voice pairs need a written request to CAG.",
            ref: "Renovation Guideline 5.10",
          },
        ],
      },
    ],
    systems: [
      { title: "OneCalendar", subtitle: "Works permit and submission platform" },
    ],
    docs: [
      "CAG Renovation Requirements (Jun 2026 v2.0)",
      "Method Statement Template",
      "Hoarding Plan Template",
      "Fire Safety Requirements - Renovation Works",
      "Electrical Requirements - Tenancy Works",
    ],
  },
  {
    id: "step-10",
    n: 10,
    chip: "Setup Phase . Permit Application",
    title: "Joint Site Inspection",
    body: "Your contractor books Joint Site Inspection with Building Maintenance so fire isolation needs are endorsed before Hot Work or Fire Alarm Isolation permits.",
    guidelines: [],
    alsoFollowIf: [
      {
        title: "Ceiling works",
        items: [
          {
            text: "For ceiling works in common areas outside the unit, your contractor arranges joint inspection with Facility Management before, during and after, and signs the ceiling-condition checklist. If they skip this, they must repair any defects found later.",
            ref: "Renovation Guideline 3.2.16",
          },
        ],
      },
      {
        title: "Roof works",
        items: [
          {
            text: "Roof works (for example CCTV conduits or condenser removal) also need joint inspection with Facility Management, plus authority approval and Auxiliary Police escort where required.",
            ref: "Renovation Guideline 3.2.18",
          },
        ],
      },
      {
        title: "Fire alarm isolation or sprinkler drain",
        items: [
          {
            text: "Before fire-alarm isolation or sprinkler draining can be approved, a joint physical inspection with CAG’s M&E contractor must confirm the zone. Without this inspection, isolation will not be approved, even if the works are urgent.",
            ref: "Renovation Guideline 5.4.2(ii)",
          },
        ],
      },
    ],
    systems: [
      { title: "Web link / QR booking", subtitle: "Inspection booking link" },
      {
        title: "Building Maintenance Contractor Joint Site Inspection Booking",
        subtitle: "Joint site inspection booking",
      },
      {
        title: "Building Management System",
        subtitle: "Building systems monitoring",
      },
      { title: "OneCalendar", subtitle: "Works permit and submission platform" },
    ],
    docs: [
      "Joint Site Inspection (JSI) Form",
      "Fire Safety Requirements - Renovation Works",
    ],
  },
  {
    id: "step-11",
    n: 11,
    chip: "Setup Phase . Permit Application",
    title: "Permit Selection & Supporting Document Submission",
    body: "Your contractor bundles the remaining permits and uploads supporting documents. You stay the Applicant - confirm with your Qualified Person whether fire certificates are needed before opening.",
    guidelines: [
      {
        text: "Do not start works until the Works Permit is issued. If the works could accidentally trigger fire alarms or sprinklers, wait until AES has also approved the isolation permit.",
        ref: "Renovation Guideline 3.2.1",
      },
    ],
    alsoFollowIf: [
      {
        title: "Fire alarm isolation or sprinkler drain",
        timing: "14 working days before isolation",
        items: [
          {
            text: "Your contractor applies for fire-alarm isolation or sprinkler draining in OneCalendar at least 14 working days before work. For genuine urgency, call AES HQ 6541 2535 (office) or Fire Station 1 6541 2526 (after hours). Do not call your Project Officer for this.",
            ref: "Renovation Guideline 5.4.2, 5.9.10",
          },
        ],
      },
      {
        title: "Hot work",
        timing: "7 working days before hot work",
        items: [
          {
            text: "Your contractor applies for the Hot Work Permit in OneCalendar at least seven working days before welding, cutting or grinding. For genuine urgency, call AES HQ 6541 2535 (office) or Fire Station 1 6541 2526 (after hours).",
            ref: "Renovation Guideline 5.9.10(ii)",
          },
        ],
      },
    ],
    systems: [
      { title: "OneCalendar", subtitle: "Works permit and submission platform" },
    ],
    docs: [
      "Method Statement Template",
      "Hoarding Plan Template",
      "Fire Safety Requirements - Renovation Works",
    ],
  },
  {
    id: "step-12",
    n: 12,
    chip: "Setup Phase . Permit Application",
    title: "Multi-Party Review by Changi Airport Group Stakeholders",
    body: "After your contractor submits, BMC, AES and IFM review the files in that order. Works cannot start until OneCalendar issues the Permit to Work. If reviewers ask for changes, your contractor updates the files - you do not need to chase each reviewer.",
    guidelines: [
      {
        text: "If reviewers ask for changes, your contractor submits the updated files in OneCalendar. If they ignore those comments, CAG can take away the permit, stop the works, charge a fee, or blacklist the contractor.",
        ref: "Renovation Guideline 1.26, App B",
      },
      {
        text: "Works on site must match the drawings CAG approved. If you change the design without approval, review or later inspection can fail.",
        ref: "Renovation Guideline 1.9",
      },
    ],
    systems: [
      { title: "OneCalendar", subtitle: "Works permit and submission platform" },
    ],
    docs: [
      "Fire Safety Requirements - Renovation Works",
      "Method Statement Template",
    ],
  },
  {
    id: "step-13",
    n: 13,
    chip: "Setup Phase . Permit Application",
    title: "Requests / Permissions Outside OneCalendar",
    body: "Your contractor submits any IFM permissions that sit outside OneCalendar so they do not block site start - you do not file those yourself.",
    guidelines: [
      {
        text: "Your contractor submits any IFM permissions that sit outside OneCalendar so they don’t block site start.",
      },
    ],
  },
];
