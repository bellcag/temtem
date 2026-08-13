// Tenancy 101 / TeMPo prototype data

export type Unit = {
  id: string;
  unitNo: string;
  terminal: "T1" | "T2" | "T3" | "T4" | "Jewel";
  tenancyType: "F&B" | "Retail" | "Service" | "Kiosk";
  zone: "Airside" | "Landside";
  company: string;
};

export const TENANT = {
  firstName: "Sarah",
  fullName: "Sarah Tan",
  company: "Kopi & Co. Pte Ltd",
};

export const CONTRACTOR = {
  firstName: "Raj",
  fullName: "Raj Kumar",
  company: "BuildRight Contractors Pte Ltd",
  role: "Site Supervisor",
};

export const OFFICER = {
  firstName: "Daniel",
  fullName: "Daniel Wong",
  role: "Project Officer — T3",
  team: "COM T3",
  terminal: "T3" as const,
};

/** MVP: Airside F&B + Retail only */
export const UNITS: Unit[] = [
  { id: "u-301", unitNo: "T3-AS-114", terminal: "T3", tenancyType: "F&B", zone: "Airside", company: "Kopi & Co. Pte Ltd" },
  { id: "u-302", unitNo: "T3-AS-208", terminal: "T3", tenancyType: "Retail", zone: "Airside", company: "Kopi & Co. Pte Ltd" },
  { id: "u-201", unitNo: "T2-AS-045", terminal: "T2", tenancyType: "F&B", zone: "Airside", company: "Kopi & Co. Pte Ltd" },
  { id: "u-202", unitNo: "T2-AS-112", terminal: "T2", tenancyType: "Retail", zone: "Airside", company: "Kopi & Co. Pte Ltd" },
];

export type Responsible = "CAG" | "You" | "CAG + You";

/** Who may see this sub-step. Officer always sees every sub-step. */
export type AudienceRole = "tenant" | "contractor" | "officer";
export type Audience = AudienceRole | "shared" | AudienceRole[];

export type SubStep = {
  text: string;
  tag?: string;
  audience: Audience;
};

export type Step = {
  name: string;
  responsible: Responsible;
  what: string;
  /** Role-specific guide purpose; falls back to `what`. */
  whatFor?: Partial<Record<"tenant" | "contractor" | "officer", string>>;
  subSteps: SubStep[];
  people?: string[];
  systems?: { label: string; url?: string }[];
  documents?: { id: string; name: string }[];
};

export type Stage = {
  name: string;
  /** One-line section outcome for the guide. */
  purpose: string;
  steps: Step[];
};

export type Phase = {
  id: "setup" | "build" | "operate" | "exit";
  name: string;
  description: string;
  stages: Stage[];
};

export const PHASES: Phase[] = [
  {
    id: "setup",
    name: "Setup",
    description: "Get access, kickoff, design and permits sorted so works can start.",
    stages: [
      {
        name: "Tenancy Platform Onboarding",
        purpose: "Get the accounts and access you need before works and day-to-day ops.",
        steps: [
          {
            name: "Set Up Systems for Works",
            responsible: "CAG + You",
            what: "Open OneCalendar access for your project team so terminal and unit entry can be approved before works.",
            whatFor: { tenant: "Open OneCalendar access for your project team so terminal and unit entry can be approved before works.", contractor: "Open OneCalendar access for your project team so terminal and unit entry can be approved before works.", officer: "Open OneCalendar access for your project team so terminal and unit entry can be approved before works." },
            subSteps: [
              { text: "Create the Tenant, Brand and Outlet records in OneCalendar for this unit.", tag: "Facing Travelling Pax", audience: "officer" },
              { text: "Create your OneCalendar account so you can apply for access and work permits.", audience: "contractor" },
              { text: "Apply for terminal access in OneCalendar so you can get on site.", audience: "contractor" },
              { text: "Your Project Officer will approve the contractor’s terminal access in OneCalendar.", audience: "shared" },
              { text: "Apply for unit access in OneCalendar.", audience: "contractor" },
              { text: "Approve the contractor’s unit access in OneCalendar so works can start.", audience: "tenant" },
            ],
            people: ["Project Officer", "Contractor", "Tenant"],
            systems: [{ label: "OneCalendar" }],
          },
          {
            name: "Set Up Systems for Staff",
            responsible: "You",
            what: "Register front-of-house staff for Quality Service Management where the outlet faces travelling passengers.",
            whatFor: { tenant: "Register your front-of-house staff for Quality Service Management where the outlet faces travelling passengers.", officer: "Register front-of-house staff for Quality Service Management where the outlet faces travelling passengers." },
            subSteps: [
              { text: "Register your staff for Quality Service Management training, and your Project Officer can guide you.", tag: "Facing Travelling Pax", audience: "tenant" },
            ],
            people: ["Tenant"],
            systems: [{ label: "ONE Changi App" }, { label: "Quality Service Management" }],
          },
          {
            name: "Set Up Systems for Operations",
            responsible: "CAG + You",
            what: "Get WebEpic live for your outlet for tenancy ops, and link POS setup with NEC when the unit is Retail or F&B.",
            whatFor: { tenant: "Get WebEpic live for your outlet for tenancy ops, and link POS setup with NEC when the unit is Retail or F&B.", officer: "Get WebEpic live for your outlet for tenancy ops, and link POS setup with NEC when the unit is Retail or F&B." },
            subSteps: [
              { text: "Your Project Officer will remind you to submit the WebEpic application via Enterprise Portal.", audience: ["tenant", "officer"] },
              { text: "Apply for your WebEpic account so tenancy billing and ops tools are ready.", audience: "tenant" },
              { text: "Your Project Officer will link you with NEC for Point of Sales setup.", tag: "Retail / F&B", audience: ["tenant", "officer"] },
            ],
            people: ["Project Officer", "Tenant"],
            systems: [{ label: "WebEpic" }, { label: "Point of Sales" }],
          },
        ],
      },
      {
        name: "Pre-Kickoff",
        purpose: "Make sure drawings and attendees are ready so kickoff is useful.",
        steps: [
          {
            name: "Kickoff Documents Gathered & Shared",
            responsible: "CAG",
            what: "Assemble base-build and M&E drawings from CAG sources into the kickoff package for this unit.",
            whatFor: { tenant: "You’ll receive the kickoff pack and drawings from your Project Officer before site requirements are confirmed.", contractor: "You’ll receive the kickoff pack and drawings from the Project Officer before site requirements are confirmed.", officer: "Assemble base-build and M&E drawings from CAG sources into the kickoff package for this unit." },
            subSteps: [
              { text: "You’ll receive the kickoff pack and drawings from your Project Officer before site requirements are confirmed.", audience: "shared" },
              { text: "Pull Base Build Drawings from your own set.", audience: "officer" },
              { text: "Retrieve Base Build Drawings through officers who have Newforma access.", audience: "officer" },
              { text: "Request Base Build Drawings from Master Planning if you do not have the latest set.", audience: "officer" },
              { text: "Pull Mechanical and Electrical Drawings from your own set.", audience: "officer" },
              { text: "Request Mechanical and Electrical Drawings from IFM if you do not have the latest set.", audience: "officer" },
              { text: "Review the provision list and available drawings.", audience: "officer" },
              { text: "Share Mechanical and Electrical Drawings with Project Officer.", audience: "officer" },
              { text: "Share Base Build Drawing with Project Officer.", audience: "officer" },
              { text: "Share renovation requirements with Project Officer by email if design was shared earlier.", audience: "officer" },
              { text: "Compile the kickoff package for the tenant.", tag: "Duplex", audience: "officer" },
            ],
            people: ["Project Officer", "Integrated Facilities Management", "Master Planning"],
            systems: [{ label: "OneDrive" }, { label: "Newforma" }, { label: "SharePoint" }, { label: "Hard Disk" }, { label: "OneCalendar" }],
          },
          {
            name: "High-Level Design Review",
            responsible: "CAG + You",
            what: "For duplex units, share a preliminary concept early so Design Management can flag issues before full drawings.",
            whatFor: { tenant: "Share a preliminary design concept with your Project Officer early so Design Management can flag issues before full drawings.", officer: "For duplex units, share a preliminary concept early so Design Management can flag issues before full drawings." },
            subSteps: [
              { text: "Share your preliminary design concept with your Project Officer.", tag: "Duplex", audience: "tenant" },
              { text: "Route preliminary design concept to Design Management.", tag: "Duplex", audience: "officer" },
              { text: "Share preliminary design feedback with Project Officer.", tag: "Duplex", audience: "officer" },
              { text: "Your Project Officer will share design feedback with you once Design Management has reviewed it.", tag: "Duplex", audience: ["tenant", "officer"] },
            ],
            people: ["Tenant", "Project Officer", "Design Management"],
          },
          {
            name: "Confirmation of Meeting Attendees",
            responsible: "CAG",
            what: "Confirm who must attend kickoff so AES, IFM and the tenant arrive aligned on requirements.",
            whatFor: { tenant: "Kickoff meeting details will be confirmed with the required attendees.", contractor: "Kickoff meeting details will be confirmed; attend if invited.", officer: "Confirm who must attend kickoff so AES, IFM and the tenant arrive aligned on requirements." },
            subSteps: [
              { text: "Your Project Officer will attend kickoff meeting details with attendees.", audience: "shared" },
              { text: "Confirm kickoff attendees with Airport Planning & Leasing, or set the meeting yourself for Landside Concessions.", audience: "officer" },
            ],
            people: ["Project Officer"],
            systems: [{ label: "Outlook Meeting Scheduler" }],
          },
        ],
      },
      {
        name: "Kickoff",
        purpose: "Align renovation intent, site rules and fire-safety requirements.",
        steps: [
          {
            name: "Requirements & Plan Alignment",
            responsible: "CAG + You",
            what: "Walk renovation intent, IFM and fire-safety requirements, and site measures. Leave with agreed actions.",
            whatFor: { tenant: "Walk renovation intent, IFM and fire-safety requirements, and site measures. Leave with agreed actions.", contractor: "Walk renovation intent, IFM and fire-safety requirements, and site measures. Leave with agreed actions..", officer: "Walk renovation intent, IFM and fire-safety requirements, and site measures. Leave with agreed actions." },
            subSteps: [
              { text: "AES will review tenancy requirements for your premise type.", audience: "shared" },
              { text: "Your Project Officer will introduce project stakeholders to Tenant.", audience: "shared" },
              { text: "Present your renovation intentions to the stakeholders at kickoff.", audience: "tenant" },
              { text: "IFM will explain renovation requirements to you.", audience: "shared" },
              { text: "IFM will explain work permit requirements to the contractor.", audience: ["contractor", "officer"] },
              { text: "IFM will handle onsite questions with Tenant and Contractor.", audience: "shared" },
              { text: "Take site measurements for renovation planning.", audience: "tenant" },
              { text: "AES will explain fire safety renovation requirements to you.", audience: "shared" },
              { text: "Your Project Officer will record the agreed actions from kickoff.", audience: "shared" },
            ],
            people: ["Airport Emergency & Safety", "Project Officer", "Tenant", "Integrated Facilities Management"],
          },
        ],
      },
      {
        name: "Post-Kickoff",
        purpose: "Receive your checklists and access setup after kickoff.",
        steps: [
          {
            name: "Onboarding Guidelines Shared",
            responsible: "CAG",
            what: "Send the post-kickoff pack — checklists, access setup and commercial onboarding links for this unit.",
            whatFor: { tenant: "You’ll receive the kickoff pack and drawings from your Project Officer before site requirements are confirmed.", contractor: "You’ll receive the kickoff pack and drawings from your Project Officer before site requirements are confirmed.", officer: "Send the post-kickoff pack — checklists, access setup and commercial onboarding links for this unit." },
            subSteps: [
              { text: "You’ll receive the post-kickoff pack from your Project Officer with checklists and access setup notes.", audience: "shared" },
              { text: "Gather kickoff notes, documents and the submission checklist for the post-kickoff email (including the Tenant–Contractor Kit).", tag: "Terminal 3 (Structured Ceiling Permit)", audience: "officer" },
              { text: "Add renovation requirements into the post-kickoff email.", audience: "officer" },
              { text: "Add Joint Site Inspection requirements into the post-kickoff email.", audience: "officer" },
              { text: "Add LONO and FSC / Minor A&A requirements into the post-kickoff email.", tag: "Approval Specific", audience: "officer" },
              { text: "Add basement loading bay information into the post-kickoff email.", audience: "officer" },
              { text: "Add the Tenant–Contractor Kit into the post-kickoff email.", audience: "officer" },
              { text: "You’ll receive the post-kickoff email pack from your Project Officer after kickoff.", audience: ["tenant", "officer"] },
              { text: "Confirm whether Fire Safety Certificate or Minor Addition & Alteration applies.", audience: "officer" },
              { text: "Your Project Officer will set up Access Control & Scheduling System account for tenant staff access.", audience: ["tenant", "officer"] },
              { text: "Your Project Officer will remind you to create Access Control & Scheduling System account for loading bay access.", audience: ["contractor", "officer"] },
              { text: "Email Viseo to create the tenant’s Salesforce account when Landside Concessions access is available.", audience: "officer" },
              { text: "Email Changi Rewards to start the tenant portal account setup.", audience: "officer" },
              { text: "Your Project Officer will request Tenant Directory Taxonomy details from you.", audience: ["tenant", "officer"] },
              { text: "Start iShopChangi onboarding for the tenant.", audience: "officer" },
            ],
            people: ["Project Officer", "Qualified Person"],
            systems: [{ label: "Access Control & Scheduling System" }, { label: "Salesforce" }, { label: "Changi Rewards" }, { label: "Tenant Directory Taxonomy" }, { label: "iShopChangi" }],
          },
        ],
      },
      {
        name: "Design Review",
        purpose: "Clear store design with Design Management before you apply for permits.",
        steps: [
          {
            name: "Confirmation of Renovation Plans",
            responsible: "CAG + You",
            what: "Route tenant design packs, revise against Design Management comments, and wait for written approval before permits.",
            whatFor: { tenant: "Submit your design packs to the Project Officer, revise against Design Management comments, and wait for written approval before permits.", officer: "Route tenant design packs, revise against Design Management comments, and wait for written approval before permits." },
            subSteps: [
              { text: "Submit coloured perspectives to your Project Officer.", audience: "tenant" },
              { text: "Submit architectural plans to your Project Officer.", audience: "tenant" },
              { text: "Submit elevation plans to your Project Officer.", audience: "tenant" },
              { text: "Submit the ceiling layout to your Project Officer.", audience: "tenant" },
              { text: "Submit signage drawings to your Project Officer.", audience: "tenant" },
              { text: "Submit the hoarding plan to your Project Officer.", audience: "tenant" },
              { text: "Share design proposal to Design Management.", audience: "officer" },
              { text: "Review design proposal from operational perspective.", audience: "officer" },
              { text: "Design Management will review the store design and share comments with your Project Officer.", audience: "officer" },
              { text: "Submit a material sample board if your Project Officer asks for one.", audience: "tenant" },
              { text: "Compile design review comments.", audience: "officer" },
              { text: "Your Project Officer will share design feedback with you once Design Management has reviewed it.", audience: ["tenant", "officer"] },
              { text: "Revise your design proposal and resubmit it to your Project Officer.", audience: "tenant" },
              { text: "Design Management will approve the final store design for your Project Officer to confirm with you.", audience: "officer" },
              { text: "Your Project Officer will confirm design approval with you.", audience: ["tenant", "officer"] },
            ],
            people: ["Tenant", "Project Officer", "Design Management"],
            systems: [{ label: "Google Drive" }],
          },
        ],
      },
      {
        name: "Permit Application",
        purpose: "Get the right permits selected, submitted and approved.",
        steps: [
          {
            name: "Permit Selection & Document Preparation",
            responsible: "CAG + You",
            what: "Confirm permit requirements with the contractor as they select OneCalendar work types.",
            whatFor: { tenant: "Your contractor selects the required OneCalendar permits; Project Officer confirms what is needed.", contractor: "Select the right OneCalendar work types and permits for the planned works; wait for Project Officer advice if unsure.", officer: "Confirm permit requirements with the contractor as they select OneCalendar work types." },
            subSteps: [
              { text: "Your Project Officer will confirm which permits the contractor should select in OneCalendar.", audience: ["tenant", "officer"] },
              { text: "Your Project Officer will advise the contractor which permits are required for the planned works.", audience: ["contractor", "officer"] },
              { text: "Select the Tenancy Project work type in OneCalendar for the works you planned.", audience: "contractor" },
              { text: "Enter the Tenancy Project work details in OneCalendar.", audience: "contractor" },
              { text: "Select the Renovation (Terminal) project type in OneCalendar.", audience: "contractor" },
              { text: "Add a Ceiling permit in OneCalendar if your works need it.", audience: "contractor" },
              { text: "Add a Fire Alarm Isolation Permit in OneCalendar if your works need it.", audience: "contractor" },
              { text: "Add a Hot Work Permit in OneCalendar if your works need it.", audience: "contractor" },
              { text: "Add the Archi Changes / Authority Submission & Approvals permit if your works need it.", audience: "contractor" },
              { text: "Add an MEP Changes permit in OneCalendar if your works need it.", audience: "contractor" },
              { text: "Add the Structured Cabling (T3 tenant telephone lines) permit if your works need it.", audience: "contractor" },
              { text: "Add the Structured Cabling Indoor/Outdoor permit if your works need it.", audience: "contractor" },
              { text: "Add a Telco Cabling permit in OneCalendar if your works need it.", audience: "contractor" },
              { text: "Add a Catwalk Access permit in OneCalendar if you are working in T4.", tag: "Terminal 4 only", audience: "contractor" },
              { text: "Add a Renovation (Terminal — Additional) permit if your works need it.", audience: "contractor" },
            ],
            people: ["Project Officer", "Contractor"],
            systems: [{ label: "OneCalendar" }],
          },
          {
            name: "Joint Site Inspection",
            responsible: "CAG + You",
            what: "Book and complete JSI with Building Maintenance so fire isolation needs are endorsed before Hot Work / FAI submission.",
            whatFor: { tenant: "Your contractor books Joint Site Inspection with Building Maintenance so fire isolation needs are endorsed before Hot Work or Fire Alarm Isolation permits.", contractor: "Book and complete Joint Site Inspection with Building Maintenance so fire isolation needs are endorsed before Hot Work or Fire Alarm Isolation permits.", officer: "Make sure Joint Site Inspection is booked and completed so fire isolation needs are endorsed before Hot Work or Fire Alarm Isolation permits." },
            subSteps: [
              { text: "The contractor books a Joint Site Inspection with Building Maintenance before certain fire permits can proceed.", audience: ["tenant", "officer"] },
              { text: "Book a Joint Site Inspection slot with Building Maintenance.", tag: "Terminal 1, Terminal 2, Terminal 3, Term", audience: "contractor" },
              { text: "Identify fire alarm isolation and fire protection needs with Building Maintenance during JSI.", audience: "contractor" },
              { text: "Building Maintenance will endorse the Joint Site Inspection form for the Fire Alarm Isolation Permit.", audience: ["contractor", "officer"] },
            ],
            people: ["Contractor", "Building Maintenance Contractor"],
            systems: [{ label: "Web link / QR booking" }, { label: "Walk-in" }, { label: "Building Maintenance Contractor Joint Site Inspection Booking" }, { label: "Building Management System" }, { label: "OneCalendar" }],
          },
          {
            name: "Supporting Document Submission",
            responsible: "You",
            what: "Bundle remaining permits into one Permit to Work application and upload supporting documents in OneCalendar.",
            whatFor: { contractor: "Bundle remaining permits into one Permit to Work application and upload supporting documents in OneCalendar.", officer: "Bundle remaining permits into one Permit to Work application and upload supporting documents in OneCalendar." },
            subSteps: [
              { text: "Complete the remaining steps and submit everything as one Permit to Work application in OneCalendar.", audience: "contractor" },
              { text: "Email the QP-endorsed Letter of Undertaking to your Project Officer.", audience: "contractor" },
            ],
            people: ["Contractor"],
            systems: [{ label: "OneCalendar" }],
          },
          {
            name: "Multi-Party Review by CAG Stakeholders",
            responsible: "CAG + You",
            what: "Endorse completeness; BMC, AES and IFM review in sequence. Revise if rejected until OneCalendar issues the PTW.",
            whatFor: { tenant: "PO endorses completeness; BMC, AES and IFM review in sequence. Revise if rejected until OneCalendar issues the PTW..", contractor: "Endorse completeness; BMC, AES and IFM review in sequence. Revise if rejected until OneCalendar issues the PTW.", officer: "Endorse completeness; BMC, AES and IFM review in sequence. Revise if rejected until OneCalendar issues the PTW." },
            subSteps: [
              { text: "CAG will review the Permit to Work, and the contractor revises it if needed, until OneCalendar issues it.", audience: ["tenant", "officer"] },
              { text: "Your Project Officer will review & endorses on all permit documents completeness.", audience: ["contractor", "officer"] },
              { text: "Your Project Officer will confirm design approval with you.", audience: ["contractor", "officer"] },
              { text: "Building Maintenance will review Hot Work and Fire Alarm Isolation permits in OneCalendar.", audience: ["contractor", "officer"] },
              { text: "Revise the documents and resubmit in OneCalendar if a reviewer asks you to refile.", audience: "contractor" },
              { text: "Building Maintenance will approve the required Hot Work and Fire Alarm Isolation permits.", audience: ["contractor", "officer"] },
              { text: "AES will review Hot Work and Fire Alarm Isolation permits required for the works in OneCalendar.", audience: ["contractor", "officer"] },
              { text: "Revise the documents and resubmit in OneCalendar if a reviewer asks you to refile.", audience: "contractor" },
              { text: "AES will approve Hot Work and Fire Alarm Isolation permits required for the works in OneCalendar.", audience: ["contractor", "officer"] },
              { text: "IFM will review all applications submitted in OneCalendar.", audience: ["contractor", "officer"] },
              { text: "Revise the documents and resubmit in OneCalendar if a reviewer asks you to refile.", audience: "contractor" },
              { text: "IFM will approve the submissions.", audience: ["contractor", "officer"] },
              { text: "You’ll get the Permit to Work in OneCalendar when CAG finishes review.", audience: "shared" },
            ],
            people: ["Project Officer", "Building Maintenance Contractor", "Contractor", "Airport Emergency & Safety", "Integrated Facilities Management", "System"],
            systems: [{ label: "OneCalendar" }, { label: "WhatsApp" }, { label: "Teams" }],
          },
          {
            name: "Requests Outside OneCalendar",
            responsible: "You",
            what: "Submit any IFM permissions that sit outside OneCalendar so they do not block site start.",
            whatFor: { contractor: "Submit any IFM permissions that sit outside OneCalendar so they do not block site start.", officer: "Submit any IFM permissions that sit outside OneCalendar so they do not block site start." },
            subSteps: [
              { text: "Submit any IFM permissions that sit outside OneCalendar so they don’t block site start.", audience: "contractor" },
            ],
            people: ["Contractor"],
          },
        ],
      },
    ],
  },
  {
    id: "build",
    name: "Build",
    description: "Take over the unit, complete renovation under permit, and clear pre-opening checks.",
    stages: [
      {
        name: "Authority Permits",
        purpose: "Confirm which fire-safety authority permits apply to the works.",
        steps: [
          {
            name: "Fire Safety Authority Assessment",
            responsible: "You",
            what: "Ensure the contractor engages a QP/PE to confirm FSC, Minor A&A or Temporary Fire Permit needs.",
            whatFor: { contractor: "Engage a QP/PE to confirm whether FSC, Minor A&A or Temporary Fire Permit is required for the proposed works.", officer: "Ensure the contractor engages a QP/PE to confirm FSC, Minor A&A or Temporary Fire Permit needs." },
            subSteps: [
              { text: "Engage a QP/PE to confirm whether an FSC, Minor A&A or Temporary Fire Permit is required.", audience: "contractor" },
            ],
            people: ["Contractor"],
          },
        ],
      },
      {
        name: "Handover",
        purpose: "Collect the keys and sign handover before renovation starts.",
        steps: [
          {
            name: "Site Handover & Sign-Off",
            responsible: "CAG + You",
            what: "Schedule handover so the tenant walks the unit with IFM, collect keys and sign the handover form before renovation starts.",
            whatFor: { tenant: "Walk the unit with IFM, collect keys and sign the handover form before renovation starts.", contractor: "Walk the unit with IFM, collect keys and sign the handover form before renovation starts..", officer: "Schedule handover so the tenant walks the unit with IFM, collect keys and sign the handover form before renovation starts." },
            subSteps: [
              { text: "Your Project Officer will handover meeting with Integrated Facilities Management and Tenant.", audience: "shared" },
              { text: "IFM will retrieve unit keys from the Key Management System.", audience: "shared" },
              { text: "Walk through the unit with IFM at handover.", audience: "tenant" },
              { text: "IFM will handover of keys to Tenant.", audience: "shared" },
              { text: "IFM will handover form with Tenant.", audience: "shared" },
              { text: "Handover form with Integrated Facilities Management.", audience: "tenant" },
            ],
            people: ["Project Officer", "Integrated Facilities Management", "Tenant"],
            systems: [{ label: "Outlook Meeting Scheduler" }, { label: "Key Management System" }, { label: "Sharepoint" }],
          },
        ],
      },
      {
        name: "Renovation",
        purpose: "Complete permitted works and the checks that unlock opening.",
        steps: [
          {
            name: "IFM Pre-Renovation Briefing",
            responsible: "CAG",
            what: "IFM briefs the contractor on site rules and requirements before works begin.",
            whatFor: { contractor: "Attend the IFM pre-renovation briefing before works begin.", officer: "IFM briefs the contractor on site rules and requirements before works begin.", tenant: "IFM briefs the works team before renovation starts." },
            subSteps: [
              { text: "IFM will arrange the pre-renovation briefing with the contractor.", audience: ["contractor", "officer"] },
              { text: "IFM will conduct the pre-renovation briefing for the contractor.", audience: ["contractor", "officer"] },
            ],
            people: ["Integrated Facilities Management"],
            systems: [{ label: "Outlook Meeting Scheduler" }],
          },
          {
            name: "Pre-Renovation Works",
            responsible: "CAG + You",
            what: "Secure passes, install hoarding, arrange temporary power if needed, and lodge FSSD NOA before main works.",
            whatFor: { tenant: "Secure passes, install hoarding, arrange temporary power if needed, and lodge FSSD NOA before main works..", contractor: "Secure passes, install hoarding, arrange temporary power if needed, and lodge FSSD NOA before main works.", officer: "Secure passes, install hoarding, arrange temporary power if needed, and lodge FSSD NOA before main works." },
            subSteps: [
              { text: "The contractor secures passes, installs hoarding, and completes pre-start works before renovation.", audience: ["tenant", "officer"] },
              { text: "Obtain airport passes for your work team.", audience: "contractor" },
              { text: "Install hoarding before main works begin.", audience: "contractor" },
              { text: "Request temporary power from IFM if the unit has no permanent meter.", tag: "Lack of Perm Meter", audience: "contractor" },
              { text: "IFM will turn on temporary power for the contractor.", tag: "Lack of Perm Meter", audience: ["contractor", "officer"] },
              { text: "Submit the FSSD Notice of Approval (NOA) via OneCalendar.", audience: "contractor" },
            ],
            people: ["Contractor", "Integrated Facilities Management"],
            systems: [{ label: "Airport Pass In Changi" }, { label: "OneCalendar" }],
          },
          {
            name: "Renovation Works",
            responsible: "CAG + You",
            what: "Monitor renovation under permit. CAG checks progress and witness tests; rectify defects and upload as-builts before opening checks.",
            whatFor: { tenant: "Execute works under permit. CAG checks progress and witness tests; rectify defects and upload as-builts before opening checks..", contractor: "Execute works under permit. CAG checks progress and witness tests; rectify defects and upload as-builts before opening checks.", officer: "Monitor renovation under permit. CAG checks progress and witness tests; rectify defects and upload as-builts before opening checks." },
            subSteps: [
              { text: "The contractor carries out renovation under permit — CAG may issue a Stop Work Order if something is non-compliant.", audience: ["tenant", "officer"] },
              { text: "Carry out the renovation works under your Permit to Work.", audience: "contractor" },
              { text: "Your Project Officer will monitor renovation progress and can issue a Stop Work Order if something is non-compliant.", audience: "shared" },
              { text: "IFM will run on-site checks during renovation and can issue a Stop Work Order if something is non-compliant.", audience: "shared" },
              { text: "IFM will carry out waterproofing checks with the contractor.", audience: ["contractor", "officer"] },
              { text: "Notify Airport Emergency & Safety required fire safety steps ready for review.", audience: "officer" },
              { text: "AES will verify public announcement, sprinkler and power tests with Building Management Centre.", audience: ["contractor", "officer"] },
              { text: "Compile and shares signed off inspection checklist to Integrated Facilities Management.", audience: "officer" },
              { text: "Signed-off inspection checklist to Project Officer.", audience: "officer" },
              { text: "IFM will verify the ceiling inspection with the contractor.", tag: "Ceiling Panel, False Ceiling", audience: ["contractor", "officer"] },
              { text: "AES will verify the ceiling inspection against fire safety requirements.", audience: ["contractor", "officer"] },
              { text: "IFM will witness the water ponding test with the contractor.", audience: ["contractor", "officer"] },
              { text: "IFM will witness Public Announcement System testing with the contractor.", tag: "Closed-Door Rooms", audience: ["contractor", "officer"] },
              { text: "Submit the aircon balancing test report.", audience: "contractor" },
              { text: "AES will verify kitchen fire suppression system testing for F&B.", tag: "F&B", audience: ["contractor", "officer"] },
              { text: "AES will verify gas leak testing for F&B.", tag: "F&B", audience: ["contractor", "officer"] },
              { text: "AES will verify Total Gas Fire Suppression System testing.", tag: "Servers/Computer Rooms", audience: ["contractor", "officer"] },
              { text: "Upload as-built drawings into OneCalendar.", audience: "contractor" },
              { text: "Rectify defects raised by CAG stakeholders before opening checks.", audience: "contractor" },
            ],
            people: ["Contractor", "Project Officer", "Integrated Facilities Management", "Airport Emergency & Safety", "Building Management Centre"],
            systems: [{ label: "Teams" }, { label: "OneCalendar" }, { label: "Sharepoint" }],
          },
          {
            name: "Pre-Opening Checks & Certifications",
            responsible: "CAG + You",
            what: "Coordinate pre-opening checks and certifications where required, pass Pre-Opening Inspection with IFM and AES, then publish opening details.",
            whatFor: { tenant: "Lodge fire permits where required where required, pass Pre-Opening Inspection with IFM and AES, then publish opening details.", contractor: "Lodge fire permits where required, pass Pre-Opening Inspection with IFM and AES, then publish opening details..", officer: "Coordinate pre-opening checks and certifications where required, pass Pre-Opening Inspection with IFM and AES, then publish opening details." },
            subSteps: [
              { text: "Submit the Fire Safety Certificate, Minor A&A or Temporary Fire Permit where it applies.", audience: "tenant" },
              { text: "Your Project Officer will schedule the Pre-Opening Inspection with stakeholders.", audience: "shared" },
              { text: "AES will review Fire Safety Certificate or Minor A&A permits.", audience: "shared" },
              { text: "IFM will share requirements compliance during Pre-Opening Inspection.", audience: "shared" },
              { text: "AES will check fire safety compliance during Pre-Opening Inspection.", audience: "shared" },
              { text: "IFM will sign Pre-Opening Inspection form for Project Officer.", audience: "shared" },
              { text: "AES will sign Pre-Opening Inspection form for Project Officer.", audience: "shared" },
              { text: "Your Project Officer will opening of unit to CAG.", audience: ["tenant", "officer"] },
              { text: "Your Project Officer will update the Tenant Directory Taxonomy before outlet opening.", audience: ["tenant", "officer"] },
              { text: "Your Project Officer will publish tenant information on the Tenant Directory Taxonomy.", audience: ["tenant", "officer"] },
            ],
            people: ["Tenant", "Project Officer", "Airport Emergency & Safety", "Integrated Facilities Management"],
            systems: [{ label: "OneCalendar" }, { label: "Outlook Meeting Scheduler" }, { label: "Tenant Directory Taxonomy" }],
          },
        ],
      },
    ],
  },
  {
    id: "operate",
    name: "Operate",
    description: "Open cleanly, then keep reports, training and declarations up to date.",
    stages: [
      {
        name: "Opening",
        purpose: "Close opening documents and start trading on a clean footing.",
        steps: [
          {
            name: "Opening Document Submission",
            responsible: "CAG + You",
            what: "Request and clear opening documents from the tenant.",
            whatFor: { tenant: "Submit as-builts, COF and FSSD NOA so IFM can close the opening documentation loop.", officer: "Request and clear opening documents from the tenant." },
            subSteps: [
              { text: "IFM will request as-built drawings from you via OneCalendar.", audience: ["tenant", "officer"] },
              { text: "IFM will request the Certificate of Fitness from you via OneCalendar.", audience: ["tenant", "officer"] },
              { text: "Submit the FSSD Notice of Approval (NOA) to IFM and AES via OneCalendar.", audience: "tenant" },
              { text: "Submit as-built drawings to IFM via OneCalendar.", audience: "tenant" },
              { text: "Submit the Certificate of Fitness to IFM via TOPAZ.", audience: "tenant" },
            ],
            people: ["Integrated Facilities Management", "Tenant"],
            systems: [{ label: "OneCalendar" }, { label: "TOPAZ" }],
          },
          {
            name: "Store Opening",
            responsible: "CAG + You",
            what: "Announce opening and clear capex / defects, settle capex evidence with the Project Officer, and clear any remaining IFM defects.",
            whatFor: { tenant: "Support store opening close-out, settle capex evidence with the Project Officer, and clear any remaining IFM defects.", officer: "Announce opening and clear capex / defects, settle capex evidence with the Project Officer, and clear any remaining IFM defects." },
            subSteps: [
              { text: "Your Project Officer will send the store opening notice to stakeholders.", audience: ["tenant", "officer"] },
              { text: "Your Project Officer will handle renovation invoice from Tenant.", audience: ["tenant", "officer"] },
              { text: "Submit your renovation invoice to your Project Officer.", audience: "tenant" },
              { text: "Your Project Officer will verify capex commitment fulfilment.", audience: ["tenant", "officer"] },
              { text: "IFM will follow up on outstanding defects with Tenant if any.", audience: ["tenant", "officer"] },
              { text: "Rectify any outstanding defects IFM has flagged.", audience: "tenant" },
            ],
            people: ["Project Officer", "Tenant", "Integrated Facilities Management"],
          },
          {
            name: "Point of Sales Data Reporting",
            responsible: "CAG",
            what: "Pull POS insights and circulate the sales summary to stakeholders (Retail/F&B).",
            whatFor: { officer: "Pull POS insights and circulate the sales summary to stakeholders (Retail/F&B)." },
            subSteps: [
              { text: "Pull sales information from the Point of Sales backend using Customer Discovery Insights.", tag: "Retail / F&B", audience: "officer" },
              { text: "Synthesise the sales information from the Point of Sales data.", tag: "Retail / F&B", audience: "officer" },
              { text: "Share the synthesised sales report with stakeholders by email.", tag: "Retail / F&B", audience: "officer" },
            ],
            people: ["Project Officer"],
            systems: [{ label: "Customer Discovery Insights" }, { label: "Point of Sales" }, { label: "Excel" }],
          },
          {
            name: "TOPAZ Account Setup",
            responsible: "CAG",
            what: "Create the tenant TOPAZ account so recurring service reports can be lodged.",
            whatFor: { tenant: "Project Officer creates your TOPAZ account for service reports.", officer: "Create the tenant TOPAZ account so recurring service reports can be lodged." },
            subSteps: [
              { text: "Your Project Officer will create your TOPAZ account so you can submit service reports.", audience: ["tenant", "officer"] },
              { text: "Create the tenant’s TOPAZ account so they can submit service reports.", audience: "officer" },
            ],
            people: ["Project Officer"],
            systems: [{ label: "TOPAZ" }],
          },
        ],
      },
      {
        name: "Operations",
        purpose: "Keep servicing reports, training and sales declarations current.",
        steps: [
          {
            name: "Regular Servicing Reporting",
            responsible: "CAG + You",
            what: "Lodge required service reports in TOPAZ on schedule. Unit filters hide reports that do not apply to this premise.",
            whatFor: { tenant: "Lodge your required service reports in TOPAZ in TOPAZ on schedule. Unit filters hide reports that do not apply to this premise.", officer: "Lodge required service reports in TOPAZ on schedule. Unit filters hide reports that do not apply to this premise." },
            subSteps: [
              { text: "Submit your pest control report to IFM via TOPAZ.", tag: "F&B", audience: "tenant" },
              { text: "Submit your Air Handling Unit servicing report to IFM via TOPAZ.", tag: "Tenant-Maintained AHU", audience: "tenant" },
              { text: "Submit your kitchen waste pipe report to IFM via TOPAZ.", audience: "tenant" },
              { text: "Submit your FCU servicing report to IFM via TOPAZ.", audience: "tenant" },
              { text: "Submit your grease trap servicing report to IFM via TOPAZ.", audience: "tenant" },
              { text: "Submit your floor trap servicing report to IFM via TOPAZ.", audience: "tenant" },
              { text: "Submit your kitchen fire suppression system report to AES via TOPAZ.", audience: "tenant" },
              { text: "Submit your kitchen supply and kitchen fan servicing report to IFM via TOPAZ.", audience: "tenant" },
              { text: "Submit your Certificate of Fitness report to IFM via TOPAZ.", audience: "tenant" },
              { text: "Submit your fire alarm system report to IFM via TOPAZ.", audience: "tenant" },
              { text: "Submit your Engineered Smoke Control System (ESCS) report to IFM via TOPAZ.", audience: "tenant" },
              { text: "Submit your Total Gas Flooding System (TGFS) report to IFM via TOPAZ.", audience: "tenant" },
              { text: "Submit your kitchen duct cleaning report via TOPAZ.", audience: "tenant" },
              { text: "IFM will approve service reports in TOPAZ.", audience: ["tenant", "officer"] },
            ],
            people: ["Tenant", "Integrated Facilities Management"],
            systems: [{ label: "TOPAZ" }],
          },
          {
            name: "Staff Fire Safety Declaration",
            responsible: "CAG + You",
            what: "Complete annual fire safety training and declaration; AES follows up on overdue units.",
            whatFor: { tenant: "Complete your annual fire safety training and declaration training and declaration; AES follows up on overdue units.", officer: "Complete annual fire safety training and declaration; AES follows up on overdue units." },
            subSteps: [
              { text: "Complete the AES fire safety training, quiz and annual declaration.", audience: "tenant" },
              { text: "AES will track annual Fire Safety Declaration submissions.", audience: ["tenant", "officer"] },
              { text: "AES will send renewal reminders before year end.", audience: ["tenant", "officer"] },
              { text: "AES will carry out a chargeable inspection if the declaration is not submitted.", audience: ["tenant", "officer"] },
            ],
            people: ["Tenant", "Airport Emergency & Safety"],
            systems: [{ label: "Tenant Fire Safety Declaration Portal" }, { label: "Tenant Fire Safety Portal" }],
          },
          {
            name: "Commercial Sales Declaration",
            responsible: "You",
            what: "Submit the monthly sales declaration in the Lease Management System.",
            whatFor: { tenant: "Submit your monthly sales declaration declaration in the Lease Management System.", officer: "Submit the monthly sales declaration in the Lease Management System." },
            subSteps: [
              { text: "Submit your monthly sales declaration in the Lease Management System.", audience: "tenant" },
            ],
            people: ["Tenant"],
            systems: [{ label: "Lease Management System" }],
          },
        ],
      },
    ],
  },
  {
    id: "exit",
    name: "Exit",
    description: "Reinstate the unit, hand it back, and settle the close-out.",
    stages: [
      {
        name: "Reinstatement",
        purpose: "Reinstate the unit, hand it back, and settle deposits and utilities.",
        steps: [
          {
            name: "Unit Documents Gathered & Shared",
            responsible: "CAG",
            what: "Assemble provision list, drawings and key status for the reinstatement meeting.",
            whatFor: { tenant: "Project Officer and IFM prepare drawings and keys for the reinstatement meeting.", contractor: "Reinstatement pack is prepared before permit and works.", officer: "Assemble provision list, drawings and key status for the reinstatement meeting." },
            subSteps: [
              { text: "Your Project Officer will prepare the provision list and drawings before the reinstatement meeting.", audience: "shared" },
              { text: "Request provision list from Airport Planning & Leasing.", audience: "officer" },
              { text: "Share provision list with Project Officer.", audience: "officer" },
              { text: "Retrieve Base-Build drawings from own repository or NewForma.", audience: "officer" },
              { text: "Retrieve Base-Build drawings from Master Planning if unable to find latest version.", audience: "officer" },
              { text: "Retrieve Mechanical & Electrical drawings from own repository.", audience: "officer" },
              { text: "Request Mechanical and Electrical drawings from IFM if you do not have the latest version.", audience: "officer" },
              { text: "Share Base-Build Drawings with Project Officers.", audience: "officer" },
              { text: "Share Mechanical & Electrical drawings with Project Officer.", audience: "officer" },
              { text: "Check key status for reinstatement meeting.", audience: "officer" },
              { text: "IFM will arrange key purchasing for any missing keys.", audience: "shared" },
            ],
            people: ["Project Officer", "Airport Planning & Leasing", "Master Planning", "Integrated Facilities Management"],
            systems: [{ label: "SharePoint" }, { label: "Newforma" }, { label: "Key Management System" }, { label: "Procurement" }],
          },
          {
            name: "Reinstatement Requirements Alignment",
            responsible: "CAG",
            what: "Align reinstatement scope with the outgoing tenant and IFM on reinstatement scope; link incoming tenant when a handover applies.",
            whatFor: { tenant: "Align outgoing tenant and IFM on reinstatement scope; link incoming tenant when a handover applies..", contractor: "Align outgoing tenant and IFM on reinstatement scope; link incoming tenant when a handover applies..", officer: "Align reinstatement scope with the outgoing tenant and IFM on reinstatement scope; link incoming tenant when a handover applies." },
            subSteps: [
              { text: "Your Project Officer will schedule the reinstatement meeting with stakeholders.", tag: "Outgoing Tenant", audience: "shared" },
              { text: "IFM will attend the reinstatement meeting with you.", tag: "Outgoing Tenant", audience: "shared" },
              { text: "IFM will explain reinstatement requirements to you.", tag: "Outgoing Tenant", audience: "shared" },
              { text: "Your Project Officer will link the incoming tenant with the outgoing tenant when a handover applies.", tag: "Outgoing Tenant", audience: "shared" },
            ],
            people: ["Project Officer", "Integrated Facilities Management"],
            systems: [{ label: "Outlook Meeting Scheduler" }, { label: "Meeting" }],
          },
          {
            name: "Reinstatement Permit Submission",
            responsible: "You",
            what: "Contractor submits the reinstatement Permit to Work in OneCalendar for the outgoing unit.",
            whatFor: { contractor: "Submit the reinstatement Permit to Work Permit to Work in OneCalendar for the outgoing unit.", officer: "Contractor submits the reinstatement Permit to Work in OneCalendar for the outgoing unit." },
            subSteps: [
              { text: "Submit the reinstatement Permit to Work in OneCalendar.", tag: "Outgoing Tenant", audience: "contractor" },
            ],
            people: ["Contractor"],
            systems: [{ label: "OneCalendar" }],
          },
          {
            name: "Reinstatement Multi-Party Review",
            responsible: "CAG",
            what: "IFM and AES review the reinstatement PTW and method statements until OneCalendar issues approval.",
            whatFor: { tenant: "IFM and AES review the reinstatement PTW and method statements until OneCalendar issues approval..", contractor: "IFM and AES review the reinstatement PTW and method statements until OneCalendar issues approval..", officer: "IFM and AES review the reinstatement PTW and method statements until OneCalendar issues approval." },
            subSteps: [
              { text: "IFM and AES will review the reinstatement Permit to Work until it is issued.", audience: ["tenant", "officer"] },
              { text: "IFM will review the reinstatement Permit to Work against renovation requirements.", tag: "Outgoing Tenant", audience: ["contractor", "officer"] },
              { text: "AES will review the reinstatement Permit to Work against fire safety provisions.", tag: "Outgoing Tenant", audience: "officer" },
              { text: "AES will review the reinstatement method statement.", tag: "Outgoing Tenant", audience: ["contractor", "officer"] },
              { text: "AES will review the reinstatement safe work procedures.", tag: "Outgoing Tenant", audience: ["contractor", "officer"] },
              { text: "You’ll get the approved reinstatement Permit to Work in OneCalendar when CAG finishes review.", tag: "Outgoing Tenant", audience: "shared" },
            ],
            people: ["Integrated Facilities Management", "Airport Emergency & Safety", "System"],
            systems: [{ label: "OneCalendar" }],
          },
          {
            name: "Pre-Reinstatement Works",
            responsible: "CAG + You",
            what: "Close POS and directory listings before strip-out listings, notify stakeholders of closure, and install hoarding before strip-out.",
            whatFor: { tenant: "Close POS and directory listings, notify stakeholders of closure, and install hoarding before strip-out..", contractor: "Install hoarding and complete pre-reinstatement works listings, notify stakeholders of closure, and install hoarding before strip-out.", officer: "Close POS and directory listings before strip-out listings, notify stakeholders of closure, and install hoarding before strip-out." },
            subSteps: [
              { text: "Your Project Officer will stay copied on the Point of Sales removal notice with NEC and the tenant.", tag: "Retail / F&B", audience: "shared" },
              { text: "Your Project Officer will update the Tenant Directory Taxonomy with store closure information.", tag: "Outgoing Tenant", audience: "shared" },
              { text: "Your Project Officer will notify stakeholders of the store closure.", tag: "Outgoing Tenant", audience: "shared" },
              { text: "Install hoarding before reinstatement works begin.", tag: "Outgoing Tenant", audience: "contractor" },
            ],
            people: ["Project Officer", "Contractor"],
            systems: [{ label: "Point of Sales" }, { label: "Tenant Directory Taxonomy" }],
          },
          {
            name: "Reinstatement Works",
            responsible: "CAG + You",
            what: "Monitor reinstatement under permit the unit under permit; Project Officer monitors and can stop non-compliant work.",
            whatFor: { tenant: "Contractor reinstates the unit under permit; Project Officer monitors and can stop non-compliant work..", contractor: "Reinstate the unit under permit the unit under permit; Project Officer monitors and can stop non-compliant work.", officer: "Monitor reinstatement under permit the unit under permit; Project Officer monitors and can stop non-compliant work." },
            subSteps: [
              { text: "Carry out reinstatement works under your Permit to Work.", tag: "Outgoing Tenant", audience: "contractor" },
              { text: "Your Project Officer will monitor reinstatement progress and can issue a Stop Work Order if something is non-compliant.", tag: "Outgoing Tenant", audience: "shared" },
            ],
            people: ["Contractor", "Project Officer"],
          },
          {
            name: "Pre-Takeover Inspection",
            responsible: "CAG + You",
            what: "Schedule pre-takeover inspection reinstated premises with the tenant; defects must be cleared before takeover.",
            whatFor: { tenant: "Attend pre-takeover inspection and clear defects reinstated premises with the tenant; defects must be cleared before takeover.", officer: "Schedule pre-takeover inspection reinstated premises with the tenant; defects must be cleared before takeover." },
            subSteps: [
              { text: "Your Project Officer will schedule the pre-takeover inspection with stakeholders.", tag: "Outgoing Tenant", audience: ["tenant", "officer"] },
              { text: "IFM will inspect the reinstated premises with you.", tag: "Outgoing Tenant", audience: ["tenant", "officer"] },
              { text: "Rectify any reinstatement defects IFM finds before takeover.", tag: "Outgoing Tenant", audience: "tenant" },
            ],
            people: ["Project Officer", "Integrated Facilities Management", "Tenant"],
            systems: [{ label: "Outlook Meeting Scheduler" }],
          },
          {
            name: "Takeover Meeting",
            responsible: "CAG + You",
            what: "Record takeover sign-off to IFM, sign the takeover form, and file a copy with the Project Officer.",
            whatFor: { tenant: "Hand the premises back to IFM to IFM, sign the takeover form, and file a copy with the Project Officer.", officer: "Record takeover sign-off to IFM, sign the takeover form, and file a copy with the Project Officer." },
            subSteps: [
              { text: "IFM will verify that defects are cleared.", tag: "Outgoing Tenant", audience: ["tenant", "officer"] },
              { text: "Hand the premises back to IFM at takeover.", tag: "Outgoing Tenant", audience: "tenant" },
              { text: "IFM will sign takeover form with Tenant.", tag: "Outgoing Tenant", audience: ["tenant", "officer"] },
              { text: "Receive a copy of signed takeover form from Integrated Facilities Management.", tag: "Outgoing Tenant", audience: "officer" },
            ],
            people: ["Integrated Facilities Management", "Tenant", "Project Officer"],
            systems: [{ label: "Takeover Records" }],
          },
          {
            name: "Post-Takeover Close-Out",
            responsible: "CAG",
            what: "Send the store closure notice to stakeholders.",
            whatFor: { tenant: "Project Officer notifies stakeholders that the store has closed.", officer: "Send the store closure notice to stakeholders." },
            subSteps: [
              { text: "Your Project Officer will send the store closure notice to stakeholders.", audience: ["tenant", "officer"] },
              { text: "Your Project Officer will send the store closure notice to stakeholders.", audience: ["tenant", "officer"] },
            ],
            people: ["Project Officer"],
          },
          {
            name: "Security Deposit & Utility Settlement",
            responsible: "CAG + You",
            what: "Initiate security deposit release after lease end with Finance; Project Officer initiates security deposit release after lease end.",
            whatFor: { tenant: "Settle your utilities and security deposit with Finance; Project Officer initiates security deposit release after lease end.", officer: "Initiate security deposit release after lease end with Finance; Project Officer initiates security deposit release after lease end." },
            subSteps: [
              { text: "Your Project Officer will initiate security deposit release with Finance once the lease end date is reached.", audience: ["tenant", "officer"] },
              { text: "The tenant will handle outstanding utility charges notified by Finance.", audience: ["tenant", "officer"] },
              { text: "Finance will release security deposit to Tenant.", audience: ["tenant", "officer"] },
            ],
            people: ["Project Officer", "Tenant", "Finance"],
          },
        ],
      },
    ],
  },
];

export type DocItem = {
  id: string;
  name: string;
  type: DocType;
  phases: ("Setup" | "Build" | "Operate" | "Exit")[];
  version: string;
  effective: string;
  updatedAt: string;
  status?: "New" | "Updated";
  owner: "IFM" | "AES" | "DMO" | "COM" | "Leasing" | "Engineering";
  terminal: ("T1" | "T2" | "T3" | "T4" | "Jewel")[];
  tenancyType: ("F&B" | "Retail" | "Service" | "Kiosk")[];
  zone: ("Airside" | "Landside")[];
  changelog: string;
  submitVia?: { label: string; url?: string };
  flagged?: boolean;
  externalUrl?: string;
};

export const DOCUMENTS: DocItem[] = [
  { id: "doc-renovation", name: "Renovation Requirements", type: "Policy & Requirements", phases: ["Setup", "Build"], version: "v5.2", effective: "2026-03-01", updatedAt: "2026-06-18", status: "Updated", owner: "IFM", terminal: ["T1", "T2", "T3", "T4", "Jewel"], tenancyType: ["F&B", "Retail", "Service", "Kiosk"], zone: ["Airside", "Landside"], changelog: "Section 3 updated with revised hoarding and dust-mitigation standards for airside works." },
  { id: "doc-provision", name: "Provision List — T3-AS-114", type: "Reference Document", phases: ["Setup", "Build"], version: "v2.3", effective: "2025-09-12", updatedAt: "2026-06-02", status: "Updated", owner: "DMO", terminal: ["T3"], tenancyType: ["F&B", "Retail"], zone: ["Airside"], changelog: "Updated grease trap location and capacity notes following T3 mezzanine refresh.", externalUrl: "https://docs.changiairport.example/provision/T3-AS-114" },
  { id: "doc-me", name: "M&E Drawings — T3-AS-114", type: "Reference Document", phases: ["Setup", "Build", "Exit"], version: "v1.4", effective: "2024-11-01", updatedAt: "2026-05-28", status: "Updated", owner: "Engineering", terminal: ["T3"], tenancyType: ["F&B", "Retail", "Service", "Kiosk"], zone: ["Airside"], changelog: "Revised electrical riser drawings for column line 14 to reflect 2026 retrofit.", externalUrl: "https://docs.changiairport.example/me/T3-AS-114" },
  { id: "doc-design", name: "Tenant Design Guidelines (F&B)", type: "Design Guideline", phases: ["Setup"], version: "v3.0", effective: "2026-01-15", updatedAt: "2026-06-10", status: "Updated", owner: "DMO", terminal: ["T1", "T2", "T3", "T4", "Jewel"], tenancyType: ["F&B"], zone: ["Airside", "Landside"], changelog: "Section 4 (Shopfront) revised to align with new wayfinding standard.", externalUrl: "https://docs.changiairport.example/design/fnb" },
  { id: "doc-method", name: "Method Statement Template", type: "Template & Form", phases: ["Setup", "Build", "Exit"], version: "v2.0", effective: "2025-06-01", updatedAt: "2025-06-01", owner: "COM", terminal: ["T1", "T2", "T3", "T4", "Jewel"], tenancyType: ["F&B", "Retail", "Service", "Kiosk"], zone: ["Airside", "Landside"], changelog: "No change since v2.0 release.", submitVia: { label: "OneCal 3.0" }, externalUrl: "https://docs.changiairport.example/templates/method-statement" },
  { id: "doc-hoarding", name: "Hoarding Plan Template", type: "Template & Form", phases: ["Setup", "Build", "Exit"], version: "v1.6", effective: "2025-08-20", updatedAt: "2025-12-04", owner: "COM", terminal: ["T1", "T2", "T3", "T4", "Jewel"], tenancyType: ["F&B", "Retail", "Service", "Kiosk"], zone: ["Airside", "Landside"], changelog: "Hoarding height clarification for low-ceiling areas.", submitVia: { label: "OneCal 3.0" }, externalUrl: "https://docs.changiairport.example/templates/hoarding" },
  { id: "doc-jsi", name: "Joint Site Inspection (JSI) Form", type: "Template & Form", phases: ["Setup", "Exit"], version: "v1.2", effective: "2025-03-10", updatedAt: "2025-03-10", owner: "IFM", terminal: ["T1", "T2", "T3", "T4", "Jewel"], tenancyType: ["F&B", "Retail", "Service", "Kiosk"], zone: ["Airside", "Landside"], changelog: "Initial release for current process.", submitVia: { label: "OneCal 3.0" }, externalUrl: "https://docs.changiairport.example/templates/jsi" },
  { id: "doc-fire", name: "Fire Safety Requirements — Renovation Works", type: "Policy & Requirements", phases: ["Setup", "Build"], version: "v4.1", effective: "2026-02-01", updatedAt: "2026-06-05", status: "Updated", owner: "AES", terminal: ["T1", "T2", "T3", "T4", "Jewel"], tenancyType: ["F&B", "Retail", "Service", "Kiosk"], zone: ["Airside", "Landside"], changelog: "Hot Work permit lead time changed from 3 to 5 working days.", flagged: true, externalUrl: "https://docs.changiairport.example/fire/renovation" },
  { id: "doc-elec", name: "Electrical Requirements — Tenancy Works", type: "Policy & Requirements", phases: ["Setup", "Build"], version: "v2.5", effective: "2025-10-01", updatedAt: "2025-10-01", owner: "Engineering", terminal: ["T1", "T2", "T3", "T4", "Jewel"], tenancyType: ["F&B", "Retail", "Service", "Kiosk"], zone: ["Airside", "Landside"], changelog: "LEW endorsement requirement clarified.", externalUrl: "https://docs.changiairport.example/electrical" },
  { id: "doc-handover", name: "Handover Form", type: "Template & Form", phases: ["Build"], version: "v1.0", effective: "2024-04-01", updatedAt: "2024-04-01", owner: "IFM", terminal: ["T1", "T2", "T3", "T4", "Jewel"], tenancyType: ["F&B", "Retail", "Service", "Kiosk"], zone: ["Airside", "Landside"], changelog: "Initial release.", externalUrl: "https://docs.changiairport.example/templates/handover" },
  { id: "doc-poi", name: "Pre-Opening Inspection (POI) Form", type: "Template & Form", phases: ["Build"], version: "v1.1", effective: "2025-02-10", updatedAt: "2025-02-10", owner: "IFM", terminal: ["T1", "T2", "T3", "T4", "Jewel"], tenancyType: ["F&B", "Retail", "Service", "Kiosk"], zone: ["Airside", "Landside"], changelog: "Added line for PA system test sign-off by NCS.", externalUrl: "https://docs.changiairport.example/templates/poi" },
  { id: "doc-cof", name: "Certificate of Fitness (COF) — Annual", type: "Policy & Requirements", phases: ["Build", "Operate"], version: "v2.0", effective: "2025-01-01", updatedAt: "2026-06-12", status: "Updated", owner: "AES", terminal: ["T1", "T2", "T3", "T4", "Jewel"], tenancyType: ["F&B", "Retail", "Service", "Kiosk"], zone: ["Airside", "Landside"], changelog: "Annual submission window adjusted to align with calendar year.", submitVia: { label: "TOPAZ" }, externalUrl: "https://docs.changiairport.example/cof" },
  { id: "doc-topaz", name: "TOPAZ User Guide — Tenant", type: "Process Guide", phases: ["Operate"], version: "v1.3", effective: "2025-04-20", updatedAt: "2025-04-20", owner: "IFM", terminal: ["T1", "T2", "T3", "T4", "Jewel"], tenancyType: ["F&B", "Retail", "Service", "Kiosk"], zone: ["Airside", "Landside"], changelog: "Screenshots refreshed for new TOPAZ UI.", externalUrl: "https://docs.changiairport.example/guides/topaz" },
  { id: "doc-takeover", name: "Premise Takeover Form", type: "Template & Form", phases: ["Exit"], version: "v1.0", effective: "2024-04-01", updatedAt: "2024-04-01", owner: "Leasing", terminal: ["T1", "T2", "T3", "T4", "Jewel"], tenancyType: ["F&B", "Retail", "Service", "Kiosk"], zone: ["Airside", "Landside"], changelog: "Initial release.", externalUrl: "https://docs.changiairport.example/templates/takeover" },
  { id: "doc-sfa", name: "SFA Licence Application Guide", type: "Process Guide", phases: ["Build", "Operate"], version: "v1.2", effective: "2025-07-15", updatedAt: "2025-07-15", owner: "COM", terminal: ["T1", "T2", "T3", "T4", "Jewel"], tenancyType: ["F&B"], zone: ["Airside", "Landside"], changelog: "Added SFA portal walkthrough section.", externalUrl: "https://docs.changiairport.example/guides/sfa" },
];

export const PRIMARY_CONTACTS = [
  { name: "Lim Wei Ming", role: "Project Officer · COM T3", email: "weiming.lim@changiairport.com", phone: "+65 6595 6868" },
  { name: "Aisha Rahman", role: "Backup Project Officer · COM T3", email: "aisha.rahman@changiairport.com", phone: "+65 6595 6869" },
];

export const OFFICER_PRIMARY_CONTACTS = [
  { name: "Marcus Tan", role: "Senior Manager · COM T3 (Line Manager)", email: "marcus.tan@changiairport.com", phone: "+65 6595 6700" },
  { name: "Priya Nair", role: "Process Lead · COM Tenant Management", email: "priya.nair@changiairport.com", phone: "+65 6595 6701" },
];

export const QUERY_CHANNELS = [
  { category: "Permit Queries", description: "OneCal permit applications, JSI, resubmissions. Not for emergency works.", responseTime: "Within 2 working days", email: "permits@changiairport.com", phases: ["Setup", "Build", "Exit"] },
  { category: "Fire Safety Queries", description: "Fire Alarm Isolation, Hot Work, FSC, AES approvals.", responseTime: "Within 2 working days", email: "aes-tenant@changiairport.com", phases: ["Setup", "Build", "Operate"] },
  { category: "Document & Requirements Queries", description: "Provision lists, M&E drawings, design guidelines.", responseTime: "Within 3 working days", email: "dmo-tenant@changiairport.com", phases: ["Setup", "Build", "Exit"] },
  { category: "Maintenance & TOPAZ", description: "TOPAZ submissions, recurring servicing reports.", responseTime: "Within 2 working days", email: "ifm-tenant@changiairport.com", phases: ["Operate"] },
  { category: "Finance & Billing", description: "Rental, invoices, WebEpic / SESAMI matters.", responseTime: "Within 5 working days", email: "finance-tenant@changiairport.com", phases: ["Operate", "Exit"] },
  { category: "Passes & Access", description: "APIC pass applications, renewals, deactivations.", responseTime: "Within 3 working days", email: "passes@changiairport.com", phases: ["Setup", "Operate", "Exit"] },
];

export type DirectoryEntry = {
  name: string;
  role: string;
  terminal: "T1" | "T2" | "T3" | "T4" | "Jewel";
  function: "IFM" | "BMC" | "AES" | "DMO" | "COM" | "Engineering" | "Leasing" | "Security";
  email: string;
  phone: string;
};

export const TERMINAL_DIRECTORY: DirectoryEntry[] = [
  { name: "Lim Wei Ming", role: "Project Officer", terminal: "T3", function: "COM", email: "weiming.lim@changiairport.com", phone: "+65 6595 6868" },
  { name: "Aisha Rahman", role: "Backup Project Officer", terminal: "T3", function: "COM", email: "aisha.rahman@changiairport.com", phone: "+65 6595 6869" },
  { name: "Jasmine Goh", role: "IFM Officer", terminal: "T3", function: "IFM", email: "jasmine.goh@changiairport.com", phone: "+65 6595 6701" },
  { name: "Faizal Ismail", role: "AES Officer", terminal: "T3", function: "AES", email: "faizal.ismail@changiairport.com", phone: "+65 6595 6702" },
  { name: "Nicholas Tay", role: "DMO Lead", terminal: "T3", function: "DMO", email: "nicholas.tay@changiairport.com", phone: "+65 6595 6703" },
  { name: "Rohit Menon", role: "BMC Engineer", terminal: "T3", function: "BMC", email: "rohit.menon@changiairport.com", phone: "+65 6595 6704" },
  { name: "Sandra Lee", role: "Project Officer", terminal: "T2", function: "COM", email: "sandra.lee@changiairport.com", phone: "+65 6595 6760" },
  { name: "Daniel Koh", role: "IFM Officer", terminal: "T2", function: "IFM", email: "daniel.koh@changiairport.com", phone: "+65 6595 6761" },
  { name: "Priscilla Ong", role: "AES Officer", terminal: "T2", function: "AES", email: "priscilla.ong@changiairport.com", phone: "+65 6595 6762" },
  { name: "Iskandar Bakar", role: "DMO Officer", terminal: "T2", function: "DMO", email: "iskandar.bakar@changiairport.com", phone: "+65 6595 6763" },
  { name: "Chen Yi", role: "Project Officer", terminal: "T1", function: "COM", email: "chen.yi@changiairport.com", phone: "+65 6595 6810" },
  { name: "Hannah Lim", role: "IFM Officer", terminal: "T1", function: "IFM", email: "hannah.lim@changiairport.com", phone: "+65 6595 6811" },
  { name: "Vikram Singh", role: "Engineering Lead", terminal: "T1", function: "Engineering", email: "vikram.singh@changiairport.com", phone: "+65 6595 6812" },
  { name: "Geraldine Wee", role: "Project Officer", terminal: "T4", function: "COM", email: "geraldine.wee@changiairport.com", phone: "+65 6595 6890" },
  { name: "Anuar Rahim", role: "AES Officer", terminal: "T4", function: "AES", email: "anuar.rahim@changiairport.com", phone: "+65 6595 6891" },
  { name: "Joel Pereira", role: "Project Officer", terminal: "Jewel", function: "COM", email: "joel.pereira@changiairport.com", phone: "+65 6595 6920" },
  { name: "Rachel Quek", role: "Leasing Officer", terminal: "Jewel", function: "Leasing", email: "rachel.quek@changiairport.com", phone: "+65 6595 6921" },
  { name: "Mohammad Hafiz", role: "Security Lead", terminal: "Jewel", function: "Security", email: "hafiz.m@changiairport.com", phone: "+65 6595 6922" },
];

// ============== Application Screener ==============

export type ApplicationType =
  | "PTW T1"
  | "PTW T2"
  | "PTW T3"
  | "PTW T4"
  | "Fire Alarm Isolation";

export type RequiredDoc = {
  id: string;
  name: string;
  must: string;
  endorsement?: string;
  formats: string;
  linkedDocId?: string;
};

export type ConditionalDoc = RequiredDoc & {
  condition: string;
};

export type ScreenerSpec = {
  notes: string;
  mandatory: RequiredDoc[];
  conditional: ConditionalDoc[];
};

export const SCREENER_SPECS: Record<ApplicationType, ScreenerSpec> = {
  "PTW T3": {
    notes:
      "T3 permits require BIM submission and a structured ceiling permit where applicable. Joint Site Inspection is by appointment only.",
    mandatory: [
      { id: "ptw-form", name: "Permit to Work (PTW) Form", must: "Latest CAG PTW template, fully filled, with site address, dates, and contractor details.", endorsement: "Tenant signature + contractor signature", formats: "PDF, DOCX", linkedDocId: "doc-method" },
      { id: "method-statement", name: "Method Statement", must: "Sequence of works, safety controls, equipment, and supervisor on site.", endorsement: "Endorsed by contractor PM", formats: "PDF", linkedDocId: "doc-method" },
      { id: "hoarding-plan", name: "Hoarding Plan", must: "Floor plan showing hoarding line, height, materials, signage.", endorsement: "Endorsed by QP (Architecture)", formats: "PDF, DWG", linkedDocId: "doc-hoarding" },
      { id: "elec-sld", name: "Electrical Single Line Diagram", must: "Updated SLD reflecting proposed works.", endorsement: "Must bear LEW stamp", formats: "PDF, DWG", linkedDocId: "doc-elec" },
      { id: "fire-plan", name: "Fire Safety Plan", must: "Sprinkler, smoke detection, emergency egress impact.", endorsement: "Endorsed by QP (Fire)", formats: "PDF", linkedDocId: "doc-fire" },
      { id: "jsi-form", name: "JSI Form (signed)", must: "Joint Site Inspection completed and counter-signed by IFM.", formats: "PDF", linkedDocId: "doc-jsi" },
    ],
    conditional: [
      { id: "hot-work", name: "Hot Work Permit Form", condition: "If welding, grinding or any open flame is involved", must: "Hot Work permit with fire watch arrangement.", endorsement: "AES-approved", formats: "PDF", linkedDocId: "doc-fire" },
      { id: "ceiling", name: "Structured Ceiling Permit", condition: "If works affect structured ceiling above unit", must: "Structured ceiling permit form with ceiling-grid impact map.", formats: "PDF" },
      { id: "bim", name: "BIM Submission", condition: "Required for T3 fit-outs over 50 sqm", must: "BIM model in IFC format aligned to CAG T3 standards.", formats: "IFC, RVT" },
    ],
  },
  "PTW T2": {
    notes: "T2 permits use walk-in JSI. BIM is not required.",
    mandatory: [
      { id: "ptw-form", name: "Permit to Work (PTW) Form", must: "Latest CAG PTW template, fully filled.", endorsement: "Tenant + contractor signatures", formats: "PDF, DOCX", linkedDocId: "doc-method" },
      { id: "method-statement", name: "Method Statement", must: "Sequence of works, safety controls and equipment.", endorsement: "Endorsed by contractor PM", formats: "PDF", linkedDocId: "doc-method" },
      { id: "hoarding-plan", name: "Hoarding Plan", must: "Hoarding floor plan with dimensions and signage.", endorsement: "Endorsed by QP", formats: "PDF, DWG", linkedDocId: "doc-hoarding" },
      { id: "elec-sld", name: "Electrical Single Line Diagram", must: "Updated SLD for proposed works.", endorsement: "Must bear LEW stamp", formats: "PDF, DWG", linkedDocId: "doc-elec" },
    ],
    conditional: [
      { id: "hot-work", name: "Hot Work Permit Form", condition: "If welding/grinding/open flame involved", must: "Hot Work permit with fire watch arrangement.", endorsement: "AES-approved", formats: "PDF", linkedDocId: "doc-fire" },
      { id: "lono", name: "LONO Application", condition: "Required for T2 F&B fit-outs", must: "Letter of No Objection application.", formats: "PDF" },
    ],
  },
  "PTW T1": {
    notes: "T1 permits require JSI by appointment.",
    mandatory: [
      { id: "ptw-form", name: "Permit to Work (PTW) Form", must: "Latest CAG PTW template.", endorsement: "Tenant + contractor signatures", formats: "PDF, DOCX" },
      { id: "method-statement", name: "Method Statement", must: "Sequence of works.", formats: "PDF" },
      { id: "hoarding-plan", name: "Hoarding Plan", must: "Hoarding plan with dimensions.", endorsement: "Endorsed by QP", formats: "PDF, DWG" },
    ],
    conditional: [
      { id: "hot-work", name: "Hot Work Permit Form", condition: "If welding/grinding/open flame involved", must: "Hot Work permit with fire watch arrangement.", formats: "PDF" },
    ],
  },
  "PTW T4": {
    notes: "T4 permits use walk-in JSI.",
    mandatory: [
      { id: "ptw-form", name: "Permit to Work (PTW) Form", must: "Latest CAG PTW template.", endorsement: "Tenant + contractor signatures", formats: "PDF, DOCX" },
      { id: "method-statement", name: "Method Statement", must: "Sequence of works.", formats: "PDF" },
      { id: "elec-sld", name: "Electrical Single Line Diagram", must: "Updated SLD.", endorsement: "Must bear LEW stamp", formats: "PDF, DWG" },
    ],
    conditional: [
      { id: "lono", name: "LONO Application", condition: "Required for T4 F&B fit-outs", must: "LONO application.", formats: "PDF" },
    ],
  },
  "Fire Alarm Isolation": {
    notes:
      "Fire Alarm Isolation applications must be submitted at least 3 working days before commencement. AES approval is mandatory.",
    mandatory: [
      { id: "fai-form", name: "Fire Alarm Isolation Form", must: "FAI form with isolation period, zones and contact person on site.", endorsement: "AES-approved", formats: "PDF", linkedDocId: "doc-fire" },
      { id: "site-plan", name: "Site Plan with Isolation Zones", must: "Marked-up floor plan showing isolation zones.", formats: "PDF, DWG", linkedDocId: "doc-fire" },
    ],
    conditional: [
      { id: "hot-work", name: "Hot Work Permit Form", condition: "If isolation is to cover hot works", must: "Hot Work permit.", endorsement: "AES-approved", formats: "PDF", linkedDocId: "doc-fire" },
    ],
  },
};

// ============== Officer-managed tenants ==============

export type ManagedTenant = {
  id: string;
  company: string;
  units: Unit[];
};

export const MANAGED_TENANTS: ManagedTenant[] = [
  {
    id: "tenant-a",
    company: "Auntie's Kitchen Pte Ltd",
    units: [
      { id: "ak-b214", unitNo: "B2-14", terminal: "T3", tenancyType: "F&B", zone: "Airside", company: "Auntie's Kitchen Pte Ltd" },
      { id: "ak-b215", unitNo: "B2-15", terminal: "T3", tenancyType: "F&B", zone: "Airside", company: "Auntie's Kitchen Pte Ltd" },
    ],
  },
  {
    id: "tenant-b",
    company: "The Watch Boutique",
    units: [
      { id: "wb-a122", unitNo: "A1-22", terminal: "T2", tenancyType: "Retail", zone: "Airside", company: "The Watch Boutique" },
    ],
  },
  {
    id: "tenant-c",
    company: "Luxe Travel Retail",
    units: [
      { id: "ltr-c308", unitNo: "C3-08", terminal: "T4", tenancyType: "Retail", zone: "Airside", company: "Luxe Travel Retail" },
      { id: "ltr-c309", unitNo: "C3-09", terminal: "T4", tenancyType: "Retail", zone: "Airside", company: "Luxe Travel Retail" },
      { id: "ltr-c310", unitNo: "C3-10", terminal: "T4", tenancyType: "Retail", zone: "Airside", company: "Luxe Travel Retail" },
    ],
  },
];

// ============== Email Templates ==============

export type EmailTemplate = {
  id: string;
  name: string;
  description: string;
  condition: "All tenancies" | "Airside tenants only" | "Retail tenants only";
  phase: "Setup" | "Build" | "Operate" | "Exit";
  subject: string;
  body: string;
};

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  { id: "tpl-award", name: "Tenancy Award", condition: "All tenancies", phase: "Setup",
    description: "Formal letter confirming tenancy award and next steps.",
    subject: "Tenancy Award — [Unit number]",
    body: "Dear [Tenant name],\n\nWe are pleased to confirm the award of tenancy at [Unit number], [Terminal]. Your Project Officer is [PO name] and onboarding will commence shortly.\n\nRegards,\nCAG Leasing" },
  { id: "tpl-kickoff", name: "Email to Tenant After Kickoff", condition: "All tenancies", phase: "Setup",
    description: "Sent after the kickoff meeting to consolidate requirements and actions.",
    subject: "[Unit number] — Kickoff notes and next actions",
    body: "Dear [Tenant name],\n\nThank you for attending the kickoff for [Unit number]. Attached are the notes of discussion and the consolidated list of CAG requirements. Please action the items by [Date].\n\nRegards,\n[PO name]" },
  { id: "tpl-pos", name: "POS Installation", condition: "Airside tenants only", phase: "Build",
    description: "Notification to NEC and tenant for POS terminal installation scheduling.",
    subject: "POS Installation — [Unit number]",
    body: "Dear [Tenant name],\n\nPlease coordinate with NEC for POS installation at [Unit number]. Target installation date: [Date].\n\nRegards,\n[PO name]" },
  { id: "tpl-qsm", name: "QSM Training", condition: "Airside tenants only", phase: "Operate",
    description: "Quality Service Management training enrolment for tenant staff.",
    subject: "QSM Training enrolment — [Tenant name]",
    body: "Dear [Tenant name],\n\nKindly enrol all customer-facing staff in the upcoming QSM session on [Date].\n\nRegards,\n[PO name]" },
  { id: "tpl-isc", name: "ISC Onboarding", condition: "Airside tenants only", phase: "Operate",
    description: "Onboarding instructions for iShopChangi merchant account.",
    subject: "iShopChangi Onboarding — [Tenant name]",
    body: "Dear [Tenant name],\n\nYour iShopChangi seller account is ready. Login details have been sent separately. Please complete the merchant profile by [Date].\n\nRegards,\n[PO name]" },
  { id: "tpl-tdt", name: "TDT Info Request", condition: "Retail tenants only", phase: "Operate",
    description: "Request for store information to publish on the Tenancy Data Tool.",
    subject: "TDT info request — [Unit number]",
    body: "Dear [Tenant name],\n\nPlease provide store name, opening hours and product imagery for publication on TDT. Submit via the attached template by [Date].\n\nRegards,\n[PO name]" },
  { id: "tpl-opening", name: "Store Opening Email", condition: "All tenancies", phase: "Operate",
    description: "Sent on confirmed opening day to all CAG stakeholders.",
    subject: "[Unit number] — Store opening on [Date]",
    body: "Dear all,\n\n[Tenant name] will commence operations at [Unit number] on [Date]. Please extend the necessary support.\n\nRegards,\n[PO name]" },
  { id: "tpl-sales", name: "Outlet Opening Sales Reports", condition: "All tenancies", phase: "Operate",
    description: "Monthly opening-period sales reporting reminder.",
    subject: "Sales reporting — [Tenant name] / [Unit number]",
    body: "Dear [Tenant name],\n\nKindly submit your gross sales for the opening period via LMS by the 7th of [Month].\n\nRegards,\n[PO name]" },
  { id: "tpl-closure", name: "Store Closure", condition: "All tenancies", phase: "Exit",
    description: "Closure notification template — last operating day, reinstatement window.",
    subject: "Store closure — [Unit number]",
    body: "Dear all,\n\n[Tenant name] will cease operations at [Unit number] on [Date]. Reinstatement works will commence [Date+1].\n\nRegards,\n[PO name]" },
];

// ============== Drawings Library ==============

export type DrawingType = "As-Built" | "M&E" | "Structural" | "Architectural" | "Fire Safety" | "Electrical";

export type Drawing = {
  id: string;
  title: string;
  type: DrawingType;
  unitNo: string;
  terminal: "T1" | "T2" | "T3" | "T4" | "Jewel";
  version: string;
  issuedAt: string;
  format: "PDF" | "DWG" | "IFC";
  superseded?: boolean;
};

export const DRAWINGS: Drawing[] = [
  { id: "dwg-1", title: "As-Built Floor Plan — T3-AS-114", type: "As-Built", unitNo: "T3-AS-114", terminal: "T3", version: "v2.1", issuedAt: "2026-05-12", format: "PDF" },
  { id: "dwg-2", title: "M&E Layout — T3-AS-114", type: "M&E", unitNo: "T3-AS-114", terminal: "T3", version: "v1.4", issuedAt: "2026-05-28", format: "DWG" },
  { id: "dwg-3", title: "Electrical SLD — T3-AS-114", type: "Electrical", unitNo: "T3-AS-114", terminal: "T3", version: "v1.2", issuedAt: "2026-04-02", format: "PDF" },
  { id: "dwg-4", title: "Fire Safety Plan — T3-AS-114", type: "Fire Safety", unitNo: "T3-AS-114", terminal: "T3", version: "v1.0", issuedAt: "2026-03-10", format: "PDF" },
  { id: "dwg-5", title: "Architectural Shopfront — T2-LS-022", type: "Architectural", unitNo: "T2-LS-022", terminal: "T2", version: "v3.0", issuedAt: "2026-02-18", format: "DWG" },
  { id: "dwg-6", title: "As-Built Floor Plan — B2-14", type: "As-Built", unitNo: "B2-14", terminal: "T3", version: "v1.1", issuedAt: "2026-01-22", format: "PDF" },
  { id: "dwg-7", title: "M&E Layout — B2-14", type: "M&E", unitNo: "B2-14", terminal: "T3", version: "v1.0", issuedAt: "2025-11-30", format: "DWG" },
  { id: "dwg-8", title: "As-Built Floor Plan — A1-22", type: "As-Built", unitNo: "A1-22", terminal: "T2", version: "v2.0", issuedAt: "2025-09-04", format: "PDF" },
  { id: "dwg-9", title: "Structural Plan — A1-22", type: "Structural", unitNo: "A1-22", terminal: "T2", version: "v1.0", issuedAt: "2024-12-05", format: "PDF" },
  { id: "dwg-10", title: "Architectural Shopfront — C3-08", type: "Architectural", unitNo: "C3-08", terminal: "T4", version: "v1.3", issuedAt: "2026-02-01", format: "DWG" },
  { id: "dwg-11", title: "Fire Safety Plan — C3-08", type: "Fire Safety", unitNo: "C3-08", terminal: "T4", version: "v1.0", issuedAt: "2025-10-20", format: "PDF" },
  { id: "dwg-12", title: "M&E Layout — C3-09", type: "M&E", unitNo: "C3-09", terminal: "T4", version: "v1.1", issuedAt: "2025-12-15", format: "DWG" },
];

// ============== Team Directory ==============

export type Team = "IFM" | "BMC" | "AES" | "DMO" | "COM" | "Fire Safety" | "NEC" | "FMC";

export const TEAMS: Team[] = ["IFM", "BMC", "AES", "DMO", "COM", "Fire Safety", "NEC", "FMC"];

export type TeamEntry = {
  name: string;
  role: string;
  team: Team;
  terminal: "T1" | "T2" | "T3" | "T4" | "Jewel" | "All";
  fn: string;
  email: string;
  notes?: string;
};

export const TEAM_DIRECTORY: TeamEntry[] = [
  { name: "Jasmine Goh", role: "IFM Officer", team: "IFM", terminal: "T3", fn: "Renovation Works", email: "jasmine.goh@changiairport.com", notes: "JSI appointments coordinator" },
  { name: "Daniel Koh", role: "IFM Officer", team: "IFM", terminal: "T2", fn: "JSI Appointments", email: "daniel.koh@changiairport.com" },
  { name: "Hannah Lim", role: "IFM Officer", team: "IFM", terminal: "T1", fn: "Renovation Works", email: "hannah.lim@changiairport.com", notes: "Available Mon–Thu only" },
  { name: "Rohit Menon", role: "BMC Engineer", team: "BMC", terminal: "T3", fn: "Building Controls", email: "rohit.menon@changiairport.com", notes: "TOPAZ POC" },
  { name: "Wendy Tan", role: "BMC Engineer", team: "BMC", terminal: "T1 & T2" as "T1", fn: "M&E Coordination", email: "wendy.tan@changiairport.com" },
  { name: "Faizal Ismail", role: "AES Officer", team: "AES", terminal: "T3", fn: "Fire Safety Permits", email: "faizal.ismail@changiairport.com" },
  { name: "Priscilla Ong", role: "AES Officer", team: "AES", terminal: "T2", fn: "Hot Works Approvals", email: "priscilla.ong@changiairport.com" },
  { name: "Anuar Rahim", role: "AES Officer", team: "AES", terminal: "T4", fn: "Fire Safety Permits", email: "anuar.rahim@changiairport.com" },
  { name: "Nicholas Tay", role: "DMO Lead", team: "DMO", terminal: "T3", fn: "Design Reviews", email: "nicholas.tay@changiairport.com" },
  { name: "Iskandar Bakar", role: "DMO Officer", team: "DMO", terminal: "T2", fn: "Design Reviews", email: "iskandar.bakar@changiairport.com" },
  { name: "Lim Wei Ming", role: "Project Officer", team: "COM", terminal: "T3", fn: "Tenancy Management", email: "weiming.lim@changiairport.com" },
  { name: "Sandra Lee", role: "Project Officer", team: "COM", terminal: "T2", fn: "Tenancy Management", email: "sandra.lee@changiairport.com" },
  { name: "Geraldine Wee", role: "Project Officer", team: "COM", terminal: "T4", fn: "Tenancy Management", email: "geraldine.wee@changiairport.com" },
  { name: "Joel Pereira", role: "Project Officer", team: "COM", terminal: "Jewel", fn: "Tenancy Management", email: "joel.pereira@changiairport.com" },
  { name: "Karen Yip", role: "Fire Safety Manager", team: "Fire Safety", terminal: "All", fn: "FSC Approvals", email: "karen.yip@changiairport.com", notes: "SCDF liaison" },
  { name: "Adrian Loh", role: "Fire Safety Officer", team: "Fire Safety", terminal: "T3", fn: "FAI Approvals", email: "adrian.loh@changiairport.com" },
  { name: "Bryan Ng", role: "NEC Account Lead", team: "NEC", terminal: "All", fn: "POS Provisioning", email: "bryan.ng@nec.com.sg", notes: "Vendor — escalation point" },
  { name: "Cheryl Soh", role: "NEC Field Engineer", team: "NEC", terminal: "T3", fn: "POS Faults", email: "cheryl.soh@nec.com.sg" },
  { name: "Marcus Tan", role: "FMC Lead", team: "FMC", terminal: "All", fn: "Facilities Coordination", email: "marcus.tan@changiairport.com" },
  { name: "Ramesh Iyer", role: "FMC Officer", team: "FMC", terminal: "T2", fn: "Fault Triage", email: "ramesh.iyer@changiairport.com" },
];

// ============== Tenant Contacts (Officer View) ==============

export type TenantContactType = "Tenant" | "Contractor";

export type TenantContactEntry = {
  id: string;
  name: string;
  role: string;
  unit: string; // unit number or "All units"
  email: string;
  type: TenantContactType;
  // For contractor entries: company name shown alongside person
  contractorCompany?: string;
};

export type TenantContactGroup = {
  company: string;
  contacts: TenantContactEntry[];
};

export const TENANT_CONTACTS: TenantContactGroup[] = [
  {
    company: "Auntie's Kitchen Pte Ltd",
    contacts: [
      { id: "tc-ak-1", name: "Jane Lim", role: "Operations Representative", unit: "B2-14", email: "jane.lim@auntieskitchen.sg", type: "Tenant" },
      { id: "tc-ak-2", name: "David Tan", role: "Finance Contact", unit: "All units", email: "david.tan@auntieskitchen.sg", type: "Tenant" },
      { id: "tc-ak-3", name: "Rahim Ismail", role: "Renovation Contractor", unit: "B2-14", email: "rahim@abcreno.sg", type: "Contractor", contractorCompany: "ABC Renovation Pte Ltd" },
    ],
  },
  {
    company: "The Watch Boutique",
    contacts: [
      { id: "tc-wb-1", name: "Sarah Ng", role: "General contact", unit: "A1-22", email: "sarah.ng@watchboutique.sg", type: "Tenant" },
    ],
  },
  {
    company: "Luxe Travel Retail",
    contacts: [
      { id: "tc-ltr-1", name: "Michael Chen", role: "Operations Manager", unit: "All units", email: "michael.chen@luxetravel.sg", type: "Tenant" },
      { id: "tc-ltr-2", name: "Rachel Wong", role: "Finance", unit: "All units", email: "rachel.wong@luxetravel.sg", type: "Tenant" },
      { id: "tc-ltr-3", name: "Kumar", role: "Contractor", unit: "C3-08, C3-09", email: "kumar@proworks.sg", type: "Contractor", contractorCompany: "Pro Works Pte Ltd" },
    ],
  },
];

// Map unitNo → tenant company (for drawings repository, etc.)
export const UNIT_TO_TENANT: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const u of UNITS) m[u.unitNo] = u.company;
  for (const t of MANAGED_TENANTS) for (const u of t.units) m[u.unitNo] = t.company;
  return m;
})();


