// Tenancy 101 / TeMPo prototype data

export type Unit = {
  id: string;
  unitNo: string;
  terminal: "T1" | "T2" | "T3" | "T4" | "Jewel";
  tenancyType: "F&B" | "Retail" | "Service" | "Kiosk";
  zone: "Airside" | "Landside";
  company: string;
  /** Unit-profile facts used to hide/show guide blocks. Defaults apply if omitted. */
  facesTravellingPax?: boolean;
  duplex?: boolean;
  landsideConcessions?: boolean;
  outgoing?: boolean;
};

export type UnitProfile = {
  terminal: string;
  tenancyType: string;
  zone: string;
  facesTravellingPax: boolean;
  duplex: boolean;
  landsideConcessions: boolean;
  outgoing: boolean;
};

export function unitProfile(unit: Unit): UnitProfile {
  return {
    terminal: unit.terminal,
    tenancyType: unit.tenancyType,
    zone: unit.zone,
    facesTravellingPax: unit.facesTravellingPax ?? unit.zone === "Airside",
    duplex: unit.duplex ?? false,
    landsideConcessions: unit.landsideConcessions ?? unit.zone === "Landside",
    outgoing: unit.outgoing ?? false,
  };
}

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
  { id: "u-301", unitNo: "T3-AS-114", terminal: "T3", tenancyType: "F&B", zone: "Airside", company: "Kopi & Co. Pte Ltd", outgoing: true },
  { id: "u-302", unitNo: "T3-AS-208", terminal: "T3", tenancyType: "Retail", zone: "Airside", company: "Kopi & Co. Pte Ltd", outgoing: true },
  { id: "u-201", unitNo: "T2-AS-045", terminal: "T2", tenancyType: "F&B", zone: "Airside", company: "Kopi & Co. Pte Ltd", outgoing: true },
  { id: "u-202", unitNo: "T2-AS-112", terminal: "T2", tenancyType: "Retail", zone: "Airside", company: "Kopi & Co. Pte Ltd", outgoing: true },
];

export type Responsible = "CAG" | "You" | "CAG + You";

/**
 * Who this task belongs to. Role never hides the parent step.
 *
 * Tag the ACTOR — who does the work — not who might like to know.
 * - `tenant` / `contractor` / `officer` = that login’s Your Steps
 * - array = those logins’ Your Steps
 * - `shared` = a moment everyone present actually takes part in (kickoff room,
 *   site walk). Never use `shared` for CAG-internal how-to or internal systems
 *   (Key Management System, OneDrive, retrieving keys, signing a form for PO).
 *   Those are `officer` (or the real actor). Tenant/contractor get a handoff
 *   via `alsoText` only if they need the outcome — that copy lands in
 *   Your Steps when they have nothing of their own to do.
 */
export type AudienceRole = "tenant" | "contractor" | "officer";
export type Audience = AudienceRole | "shared" | AudienceRole[];

/**
 * Wait / receive copy for the person READING — not the actor.
 *
 * - `text` is written to the actor (`audience`) and is their Your Steps.
 * - `alsoText` is what another login should follow when this task is not
 *   theirs: what arrives, what to wait for, what not to chase. It is not a
 *   second “meanwhile” list in the UI.
 * - Keep reader “you” only for what they receive or wait for next.
 * - Never name CAG-internal systems in tenant/contractor `alsoText`.
 */
export type HandoffCopy = Partial<Record<AudienceRole, string>>;

export type SubStep = {
  text: string;
  alsoText?: HandoffCopy;
  tag?: string;
  audience: Audience;
  seq?: "sequential" | "parallel";
  /** Nested how-to — shown as “if your works include…”, never as its own rail item. */
  workIf?: string;
};

/** Planned-works slugs from the real catalogue. Stored only — not used to hide/show yet. */
export type PlannedWorkSlug =
  | "large-scale-renovation"
  | "change-of-use"
  | "additional-renovation-scope"
  | "takeover-from-exiting-tenant"
  | "hot-work"
  | "fire-alarm-isolation"
  | "fire-protection-detection-works"
  | "fire-safety-submission"
  | "above-ceiling-works"
  | "roof-works"
  | "structural-works"
  | "mep-changes"
  | "waterproofing-works"
  | "structured-cabling"
  | "telco-cabling"
  | "catwalk-access"
  | "skytrain-work"
  | "authority-approval";

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
  /** Real catalogue condition. Hidden only when every slug is off. */
  whenSlugs?: PlannedWorkSlug[];
  /** Tenancy / ops. Hidden from this login — they do not do the work. */
  hideFrom?: AudienceRole[];
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
            name: "Set Up Systems Required for Works and Setup",
            responsible: "CAG + You",
            what: "Open OneCalendar access for your project team so terminal and unit entry can be approved before works.",
            whatFor: {
              tenant: "Approve unit access in OneCalendar when asked.",
              contractor: "Create your OneCalendar account. Apply for terminal and unit access in OneCalendar.",
              officer: "Create tenant, brand, and outlet records in OneCalendar. Approve contractor terminal access in OneCalendar.",
            },
            subSteps: [
              {
                text: "Create the Tenant, Brand and Outlet records in OneCalendar for this unit.",
                tag: "Facing Travelling Pax",
                audience: "officer",
                seq: "sequential",
                alsoText: {
                  tenant: "Tenant, Brand and Outlet records are being created in OneCalendar — access starts from there.",
                  contractor: "Tenant, Brand and Outlet records are being created in OneCalendar — access starts from there.",
                },
              },
              {
                text: "Create your OneCalendar account so you can apply for access and work permits. Tenant, Brand and Outlet records for this unit are created first — then you apply for terminal access, then unit access (the tenant approves unit access).",
                audience: "contractor",
                seq: "sequential",
                alsoText: {
                  tenant: "A OneCalendar account is being created for access and work permits.",
                },
              },
              {
                text: "Apply for terminal access in OneCalendar so you can get on site.",
                audience: "contractor",
                seq: "sequential",
                alsoText: {
                  tenant: "Terminal access is being applied for in OneCalendar.",
                },
              },
              {
                text: "Approve the contractor’s terminal access in OneCalendar.",
                audience: "officer",
                seq: "sequential",
                alsoText: {
                  tenant: "Terminal access is being approved in OneCalendar. Unit access is next.",
                  contractor: "Terminal access is being approved in OneCalendar. Unit access is next — you’ll wait for the tenant on that.",
                },
              },
              {
                text: "Apply for unit access in OneCalendar.",
                audience: "contractor",
                seq: "sequential",
                alsoText: {
                  tenant: "Unit access is being applied for in OneCalendar. You’ll be asked to approve it.",
                  officer: "Unit access is being applied for in OneCalendar. The tenant will be asked to approve it.",
                },
              },
              {
                text: "When the contractor’s unit-access request arrives in OneCalendar, approve it so works can start. Tenant, Brand and Outlet records and terminal access are set up first — you only approve unit access.",
                audience: "tenant",
                seq: "sequential",
                alsoText: {
                  contractor: "Unit access is being approved in OneCalendar once your request arrives.",
                  officer: "The tenant is approving the contractor’s unit access in OneCalendar so works can start.",
                },
              },
            ],
            people: ["Project Officer", "Contractor", "Tenant"],
            systems: [{ label: "OneCalendar" }],
          },
          {
            name: "Set Up Systems Required for Staff",
            hideFrom: ["contractor"],
            responsible: "You",
            what: "Register front-of-house staff for Quality Service Management where the outlet faces travelling passengers.",
            whatFor: { tenant: "Register your front-of-house staff for Quality Service Management where the outlet faces travelling passengers.", officer: "Register front-of-house staff for Quality Service Management where the outlet faces travelling passengers." },
            subSteps: [
              {
                text: "Register your staff for Quality Service Management training in the ONE Changi App. Your Project Officer can guide you.",
                tag: "Facing Travelling Pax",
                audience: "tenant",
                seq: "parallel",
                alsoText: {
                  contractor: "Front-of-house staff are being registered for Quality Service Management in the ONE Changi App.",
                },
              },
            ],
            people: ["Tenant"],
            systems: [{ label: "ONE Changi App" }, { label: "Quality Service Management" }],
          },
          {
            name: "Set Up WebEpic Account",
            hideFrom: ["contractor"],
            responsible: "CAG + You",
            what: "Get WebEpic live for your outlet for tenancy ops.",
            whatFor: {
              tenant: "Your Project Officer will remind you about WebEpic.",
              contractor: "Tenancy ops accounts sit with the tenant and Project Officer — you’ll hear if anything from this step affects site start.",
              officer: "Remind the tenant about WebEpic.",
            },
            subSteps: [
              {
                text: "Remind the tenant to submit the WebEpic application via Enterprise Portal.",
                audience: "officer",
                seq: "parallel",
                alsoText: {
                  tenant: "A reminder is going out to submit the WebEpic application via Enterprise Portal.",
                  contractor: "A WebEpic reminder is going to the tenant via Enterprise Portal.",
                },
              },
              {
                text: "Apply for your WebEpic account so tenancy billing and ops tools are ready.",
                tag: "Landside Concessions Only",
                audience: "tenant",
                seq: "parallel",
                alsoText: {
                  contractor: "A WebEpic account is being applied for when Landside Concessions uses it for this unit.",
                },
              },
            ],
            people: ["Project Officer", "Tenant"],
            systems: [{ label: "WebEpic" }],
          },
          {
            name: "Point of Sales Setup",
            hideFrom: ["contractor"],
            responsible: "CAG + You",
            what: "Link POS setup with NEC when the unit is Retail or F&B.",
            whatFor: {
              tenant: "For F&B or Retail, your Project Officer loops in NEC for POS.",
              contractor: "Point of Sales setup sits with the tenant and Project Officer.",
              officer: "Link NEC for POS when this unit is Retail or F&B.",
            },
            subSteps: [
              {
                text: "Link the tenant with NEC for Point of Sales setup.",
                tag: "Retail, F&B Only",
                audience: "officer",
                seq: "sequential",
                alsoText: {
                  tenant: "NEC is being looped in for Point of Sales setup.",
                  contractor: "NEC is being looped in for the tenant’s Point of Sales setup.",
                },
              },
            ],
            people: ["Project Officer", "Tenant"],
            systems: [{ label: "Point of Sales" }],
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
            what: "Email the first site meeting pack after division reps pull unit drawings from Newforma, and Airport Planning sends the provision list.",
            whatFor: {
              tenant: "Get drawings and the provision list from your Project Officer.",
              contractor: "Get drawings and the provision list from Project Officer.",
              officer: "Ask division reps for Newforma drawings and Airport Planning for the provision list, then email both. Do not put them in the portal.",
            },
            subSteps: [
              {
                text: "Get drawings and the provision list from your Project Officer.",
                audience: ["tenant", "contractor"],
                seq: "parallel",
              },
              {
                text: "Ask your division reps for the unit drawings. They pull them from Newforma.",
                audience: "officer",
                seq: "parallel",
              },
              {
                text: "Ask Airport Planning for the provision list.",
                audience: "officer",
                seq: "parallel",
              },
              {
                text: "Email drawings and the provision list to the tenant and contractor. Do not upload them to the portal.",
                audience: "officer",
                seq: "parallel",
              },
              {
                text: "Compile the kickoff package for the tenant.",
                tag: "Duplex",
                audience: "officer",
                seq: "sequential",
              },
            ],
            people: ["Project Officer", "Integrated Facilities Management", "Master Planning"],
            systems: [{ label: "OneDrive" }, { label: "Newforma" }, { label: "SharePoint" }, { label: "Hard Disk" }, { label: "OneCalendar" }],
          },
          {
            name: "Check Change of Use with URA",
            hideFrom: ["contractor"],
            responsible: "CAG + You",
            what: "Check Change of Use with URA",
            whenSlugs: ["change-of-use"],
            subSteps: [
              { text: "Check Change of Use with URA", audience: "officer" },
            ],
            people: ["Project Officer"],
          },
          {
            name: "High-Level Design Review",
            responsible: "CAG + You",
            whenSlugs: ["large-scale-renovation"],
            what: "For duplex units, share a preliminary concept early so Design Management can flag issues before full drawings.",
            whatFor: {
              tenant: "Share a preliminary design concept with your Project Officer early so Design Management can flag issues before full drawings.",
              contractor: "This is a tenant and Design Management review for duplex units. You do not submit the concept — wait until design is cleared before treating drawings as locked.",
              officer: "For duplex units, share a preliminary concept early so Design Management can flag issues before full drawings.",
            },
            subSteps: [
              { text: "Share your preliminary design concept with your Project Officer, then wait for Design Management feedback before locking the drawings.", tag: "Duplex", audience: "tenant", alsoText: { contractor: "The tenant is sharing a preliminary concept. Wait for Design Management feedback before treating drawings as locked." } },
              { text: "Route preliminary design concept to Design Management.", tag: "Duplex", audience: "officer" },
              { text: "Share preliminary design feedback with Project Officer.", tag: "Duplex", audience: "officer" },
              { text: "Share design feedback with the tenant once Design Management has reviewed it.", tag: "Duplex", audience: "officer", alsoText: { tenant: "Design feedback is coming once Design Management has reviewed it." } },
            ],
            people: ["Tenant", "Project Officer", "Design Management"],
          },
          {
            name: "Confirmation of Meeting Attendees",
            responsible: "CAG",
            what: "Confirm who must attend kickoff so AES, IFM and the tenant arrive aligned on requirements.",
            whatFor: {
              tenant:
                "Your Project Officer will send the kickoff invite. Attend with your consultant and contractor. AES and IFM brief the unit — come with drawings and perspectives, not a blank site.",
              contractor:
                "Go to the first site meeting when invited. Bring tenant, consultant, and pack drawings. Ask IFM and AES which permits you need.",
              officer:
                "Confirm who must attend kickoff so AES, IFM and the tenant arrive aligned on requirements.",
            },
            subSteps: [
              {
                text: "Watch for the kickoff invite from your Project Officer. Attend with your consultant and contractor if you can. AES and IFM will brief site rules and fire safety — bring drawings and perspectives prepared to the Renovation Requirements.",
                audience: "tenant",
              },
              {
                text: "Ask IFM which extra permissions you need.",
                audience: "tenant",
              },
              {
                text: "Go to the first site meeting. Bring the tenant, their consultant, and the pack drawings. Ask IFM and AES which permits you need. Do not arrive without drawings.",
                audience: "contractor",
              },
              {
                text: "Confirm kickoff meeting details with attendees.",
                audience: "officer",
              },
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
            whatFor: {
              tenant:
                "AES covers fire safety for your premise type. Your Project Officer introduces the room. IFM walks renovation rules and takes onsite questions. You leave with agreed actions.",
              contractor:
                "AES covers fire safety. IFM walks work-permit rules. You leave with agreed actions.",
              officer:
                "You introduce the room. AES covers premise-type and fire-safety requirements. IFM walks renovation and work-permit rules and takes onsite questions.",
            },
            subSteps: [
              { text: "Introduce project stakeholders to the tenant and contractor.", audience: "officer" },
              { text: "Name extra IFM permissions in the room.", audience: "officer" },
              { text: "Present your renovation intentions to the stakeholders at kickoff.", audience: "tenant" },
              { text: "Attend kickoff with the tenant. Confirm work procedures, permits and site rules for this unit.", audience: "contractor" },
              { text: "Take site measurements for renovation planning.", audience: ["tenant", "contractor"] },
              {
                text: "Record the agreed actions from kickoff.",
                audience: "officer",
                alsoText: {
                  tenant: "Agreed actions from kickoff are being recorded.",
                  contractor: "Agreed actions from kickoff are being recorded.",
                },
              },
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
            whatFor: {
              tenant: "You’ll receive one post-kickoff email with checklists and access notes. Your Project Officer also sets up staff access and asks for directory details.",
              contractor: "You’ll get loading-bay access notes after kickoff. The tenant receives the rest of the pack.",
              officer: "Send one post-kickoff email (checklists, kits, and unit notes), then set up access and commercial onboarding for this unit.",
            },
            subSteps: [
              {
                text: "You’ll receive one post-kickoff email with checklists, renovation and JSI notes, loading-bay info, and the Tenant–Contractor Kit. Staff access is set up for you; reply when your Project Officer asks for store directory details.",
                audience: "tenant",
                seq: "parallel",
              },
              {
                text: "You’ll get loading-bay access notes in the post-kickoff pack. Create an Access Control & Scheduling System account for loading-bay access when you’re reminded.",
                audience: "contractor",
                seq: "parallel",
              },
              {
                text: "Collate and send one post-kickoff email: kickoff notes, submission checklist, renovation and JSI requirements, LONO/FSC where they apply, basement loading-bay info, and the Tenant–Contractor Kit. Add the T3 structured ceiling permit note when it applies.",
                audience: "officer",
                seq: "parallel",
              },
              {
                text: "Set up the Access Control & Scheduling System account for tenant staff access.",
                audience: "officer",
                seq: "parallel",
                alsoText: {
                  tenant: "Access Control & Scheduling System is being set up for tenant staff access.",
                  contractor: "Access Control & Scheduling System is being set up for tenant staff access.",
                },
              },
              {
                text: "Remind the contractor to create an Access Control & Scheduling System account for loading-bay access.",
                audience: "officer",
                seq: "sequential",
                alsoText: {
                  tenant: "A loading-bay Access Control & Scheduling System account is being arranged.",
                  contractor: "A reminder is going out to create an Access Control & Scheduling System account for loading-bay access.",
                },
              },
              {
                text: "Email Viseo to create the tenant’s Salesforce account.",
                tag: "Landside Concessions Only",
                audience: "officer",
                seq: "parallel",
              },
              {
                text: "Email Changi Rewards to start the tenant portal account setup.",
                audience: "officer",
                seq: "parallel",
              },
              {
                text: "Request Tenant Directory Taxonomy details from the tenant.",
                audience: "officer",
                seq: "parallel",
                alsoText: {
                  tenant: "Your Project Officer may ask you for store directory details.",
                  contractor: "Store directory details are being requested from the tenant.",
                },
              },
              {
                text: "Start iShopChangi onboarding for the tenant.",
                audience: "officer",
                seq: "parallel",
              },
            ],
            people: ["Project Officer", "Qualified Person"],
            systems: [{ label: "Access Control & Scheduling System" }, { label: "Salesforce" }, { label: "Changi Rewards" }, { label: "Tenant Directory Taxonomy" }, { label: "iShopChangi" }],
          },
          {
            name: "Confirm Fire Safety Submission Route",
            responsible: "CAG + You",
            what: "Confirm whether Fire Safety Certificate, Minor Addition & Alteration, or Temporary Fire Permit applies.",
            whenSlugs: ["fire-safety-submission"],
            whatFor: {
              tenant:
                "Your contractor’s Qualified Person confirms whether a Fire Safety Certificate, Minor Addition & Alteration or Temporary Fire Permit is needed. You remain the Applicant — opening needs those certificates where they apply.",
              contractor:
                "Your Qualified Person confirms whether a Fire Safety Certificate, Minor Addition & Alteration or Temporary Fire Permit is needed.",
              officer:
                "Qualified Person confirms whether Fire Safety Certificate or Minor Addition & Alteration applies.",
            },
            subSteps: [
              {
                text: "Qualified Person confirms whether Fire Safety Certificate or Minor Addition & Alteration applies.",
                audience: "officer",
                seq: "parallel",
              },
              {
                text: "Your contractor’s Qualified Person confirms whether a Fire Safety Certificate, Minor Addition & Alteration or Temporary Fire Permit is needed. You remain the Applicant — opening needs those certificates where they apply.",
                audience: "tenant",
              },
            ],
            people: ["Project Officer", "Qualified Person", "Tenant"],
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
            whatFor: {
              tenant:
                "Send one design pack to your Project Officer. Revise it if Design Management comments, and wait for written approval before permits.",
              contractor:
                "Wait for written design approval before you apply for permits. The tenant submits the packs and revises against Design Management comments.",
              officer:
                "Route tenant design packs, revise against Design Management comments, and wait for written approval before permits.",
            },
            subSteps: [
              {
                text: "Send one design pack to your Project Officer. Include coloured perspectives, architectural plans, elevation plans, ceiling layout, signage drawings and the hoarding plan.",
                audience: "tenant",
              },
              {
                text: "Add a labelled material sample board if your Project Officer asks for one.",
                audience: "tenant",
              },
              { text: "Share design proposal to Design Management.", audience: "officer" },
              { text: "Review design proposal from operational perspective.", audience: "officer" },
              { text: "Design Management will review the store design and share comments with your Project Officer.", audience: "officer" },
              { text: "Compile design review comments.", audience: "officer" },
              {
                text: "Share design feedback with the tenant once Design Management has reviewed it.",
                audience: "officer",
                alsoText: {
                  tenant: "Design feedback is coming once Design Management has reviewed it.",
                },
              },
              {
                text: "If Design Management sends comments, revise the pack and send it again.",
                audience: "tenant",
              },
              { text: "Design Management will approve the final store design for your Project Officer to confirm with you.", audience: "officer" },
              {
                text: "Confirm design approval with the tenant.",
                audience: "officer",
                alsoText: {
                  tenant: "Design approval is being confirmed.",
                  contractor: "Wait for written design approval before you apply for permits. The tenant submits the packs.",
                },
              },
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
            name: "Permit Advisory & Tenancy Project Selection",
            responsible: "CAG + You",
            what: "Confirm permit requirements with the contractor as they select OneCalendar work types.",
            whatFor: {
              tenant: "Your contractor applies in OneCalendar. Your Project Officer will tell them which permits this unit needs — you do not submit these yourself.",
              contractor: "Ask your Project Officer which permits apply. Select Tenancy Project in OneCalendar.",
              officer: "Advise the contractor which permits this unit needs, then they select Tenancy Project in OneCalendar and fill the matching permits.",
            },
            subSteps: [
              {
                text: "Advise the contractor which permits this unit needs for the planned works.",
                audience: "officer",
                seq: "sequential",
                alsoText: {
                  contractor: "Which permits this unit needs is being confirmed.",
                },
              },
              {
                text: "Select the Tenancy Project work type in OneCalendar. Applicable permit types are pre-selected from the planned works.",
                audience: "contractor",
                seq: "sequential",
              },
              {
                text: "Fill Tenancy Project details in OneCalendar (project title and supporting documents).",
                audience: "contractor",
                seq: "parallel",
              },
            ],
            people: ["Project Officer", "Contractor"],
            systems: [{ label: "OneCalendar" }],
          },
          {
            name: "Renovation (Terminal) Permit",
            responsible: "You",
            what: "Fill the Renovation (Terminal) permit in OneCalendar.",
            whatFor: {
              tenant: "Get this renovation permit in OneCalendar.",
              contractor: "Fill the Renovation (Terminal) permit in OneCalendar.",
              officer: "Check this renovation permit in OneCalendar.",
            },
            subSteps: [
              {
                text: "Fill the Renovation (Terminal) permit in OneCalendar (work period and supporting documents).",
                audience: "contractor",
              },
            ],
            people: ["Contractor"],
            systems: [{ label: "OneCalendar" }],
          },
          {
            name: "Ceiling Permit",
            responsible: "You",
            what: "Fill the Ceiling permit in OneCalendar.",
            whenSlugs: ["above-ceiling-works"],
            whatFor: {
              tenant: "Get this renovation permit in OneCalendar.",
              contractor: "Fill the Ceiling permit in OneCalendar.",
              officer: "Check this renovation permit in OneCalendar.",
            },
            subSteps: [
              {
                text: "Fill the Ceiling permit in OneCalendar (work period and supporting documents).",
                audience: "contractor",
              },
            ],
            people: ["Contractor"],
            systems: [{ label: "OneCalendar" }],
          },
          {
            name: "Joint Site Inspection",
            responsible: "CAG + You",
            what: "Book and complete JSI with Building Maintenance so fire isolation needs are endorsed before Hot Work / FAI submission.",
            whatFor: { tenant: "Your contractor books Joint Site Inspection with Building Maintenance so fire isolation needs are endorsed before Hot Work or Fire Alarm Isolation permits.", contractor: "Book the site inspection in OneCalendar.", officer: "Make sure Joint Site Inspection is booked and completed so fire isolation needs are endorsed before Hot Work or Fire Alarm Isolation permits." },
            subSteps: [
              {
                text: "Make sure Joint Site Inspection is booked with Building Maintenance before certain fire permits can proceed.",
                audience: "officer",
                alsoText: {
                  tenant:
                    "Your contractor books the joint site inspection with Building Maintenance. You do not need to book this. Isolation cannot be approved without it.",
                  contractor: "Joint Site Inspection is being confirmed before certain fire permits can proceed.",
                },
              },
              {
                text: "Book a Joint Site Inspection slot with Building Maintenance.",
                tag: "Terminal 1, Terminal 2, Terminal 3, Term",
                audience: "contractor",
              },
              {
                text: "Identify fire alarm isolation and fire protection needs with Building Maintenance during JSI.",
                audience: "contractor",
              },
              {
                text: "Building Maintenance will endorse the Joint Site Inspection form for the Fire Alarm Isolation Permit.",
                audience: ["contractor", "officer"],
              },
            ],
            people: ["Contractor", "Building Maintenance Contractor"],
            systems: [{ label: "Web link / QR booking" }, { label: "Walk-in" }, { label: "Building Maintenance Contractor Joint Site Inspection Booking" }, { label: "Building Management System" }, { label: "OneCalendar" }],
            whenSlugs: ["fire-alarm-isolation", "above-ceiling-works", "roof-works"],
          },
          {
            name: "Fire Alarm Isolation / Sprinkler Draining Permit",
            responsible: "You",
            what: "Fill the Fire Alarm Isolation permit in OneCalendar.",
            whenSlugs: ["fire-alarm-isolation"],
            whatFor: {
              tenant: "Get this renovation permit in OneCalendar.",
              contractor: "Fill the Fire Alarm Isolation permit in OneCalendar.",
              officer: "Check this renovation permit in OneCalendar.",
            },
            subSteps: [
              {
                text: "Fill the Fire Alarm Isolation permit in OneCalendar (basic permit information and the Joint Site Inspection form when isolation applies).",
                audience: "contractor",
              },
            ],
            people: ["Contractor"],
            systems: [{ label: "OneCalendar" }],
          },
          {
            name: "Hotwork Permit",
            responsible: "You",
            what: "Fill the Hot Work permit in OneCalendar.",
            whenSlugs: ["hot-work"],
            whatFor: {
              tenant: "Get this renovation permit in OneCalendar.",
              contractor: "Fill the Hot Work permit in OneCalendar.",
              officer: "Check this renovation permit in OneCalendar.",
            },
            subSteps: [
              {
                text: "Fill the Hot Work permit in OneCalendar (work period and Hot Work checklist).",
                audience: "contractor",
              },
            ],
            people: ["Contractor"],
            systems: [{ label: "OneCalendar" }],
          },
          {
            name: "Architectural Changes & Authority Approvals",
            responsible: "You",
            what: "Fill the Archi Changes / Authority Submission & Approvals permit in OneCalendar.",
            whenSlugs: ["authority-approval"],
            whatFor: {
              tenant: "Get this renovation permit in OneCalendar.",
              contractor: "Fill the Archi Changes permit in OneCalendar.",
              officer: "Check this renovation permit in OneCalendar.",
            },
            subSteps: [
              {
                text: "Fill the Archi Changes / Authority Submission & Approvals permit in OneCalendar (location and supporting documents).",
                audience: "contractor",
              },
            ],
            people: ["Contractor"],
            systems: [{ label: "OneCalendar" }],
          },
          {
            name: "MEP Changes Permit",
            responsible: "You",
            what: "Fill the MEP Changes permit in OneCalendar.",
            whenSlugs: ["mep-changes"],
            whatFor: {
              tenant: "Get this renovation permit in OneCalendar.",
              contractor: "Fill the MEP Changes permit in OneCalendar.",
              officer: "Check this renovation permit in OneCalendar.",
            },
            subSteps: [
              {
                text: "Fill the MEP Changes permit in OneCalendar (location and supporting documents).",
                audience: "contractor",
              },
            ],
            people: ["Contractor"],
            systems: [{ label: "OneCalendar" }],
          },
          {
            name: "BIM Model Submission",
            responsible: "You",
            what: "BIM Model Submission",
            whatFor: {
              contractor: "Submit the BIM model for this job.",
              tenant: "Get the BIM model on this job.",
              officer: "Check the BIM model on this job.",
            },
            whenSlugs: ["structural-works", "mep-changes"],
            subSteps: [
              { text: "BIM Model Submission", audience: "contractor" },
            ],
            people: ["Contractor"],
          },
          {
            name: "Structured Cabling (T3 Tenant Telephone Lines) Permit",
            responsible: "You",
            what: "Fill the Structured Cabling (T3 tenant telephone lines) permit in OneCalendar.",
            whenSlugs: ["structured-cabling"],
            whatFor: {
              tenant: "Get this renovation permit in OneCalendar.",
              contractor: "Fill the T3 cabling permit in OneCalendar.",
              officer: "Check this renovation permit in OneCalendar.",
            },
            subSteps: [
              {
                text: "Fill the Structured Cabling (T3 tenant telephone lines) permit in OneCalendar (location and supporting documents).",
                tag: "Terminal 3 (",
                audience: "contractor",
              },
            ],
            people: ["Contractor"],
            systems: [{ label: "OneCalendar" }],
          },
          {
            name: "Structured Cabling Indoor/Outdoor Permit",
            responsible: "You",
            what: "Fill the Structured Cabling Indoor/Outdoor permit in OneCalendar.",
            whenSlugs: ["structured-cabling"],
            whatFor: {
              tenant: "Get this renovation permit in OneCalendar.",
              contractor: "Fill the indoor outdoor cabling permit in OneCalendar.",
              officer: "Check this renovation permit in OneCalendar.",
            },
            subSteps: [
              {
                text: "Fill the Structured Cabling Indoor/Outdoor permit in OneCalendar (location and supporting documents).",
                audience: "contractor",
              },
            ],
            people: ["Contractor"],
            systems: [{ label: "OneCalendar" }],
          },
          {
            name: "Telco Cabling Permit",
            responsible: "You",
            what: "Fill the Telco Cabling permit in OneCalendar.",
            whenSlugs: ["telco-cabling"],
            whatFor: {
              tenant: "Get this renovation permit in OneCalendar.",
              contractor: "Fill the Telco Cabling permit in OneCalendar.",
              officer: "Check this renovation permit in OneCalendar.",
            },
            subSteps: [
              {
                text: "Fill the Telco Cabling permit in OneCalendar (work period and supporting documents).",
                audience: "contractor",
              },
            ],
            people: ["Contractor"],
            systems: [{ label: "OneCalendar" }],
          },
          {
            name: "Catwalk Access Permit (Terminal 4)",
            responsible: "You",
            what: "Fill the Catwalk Access permit in OneCalendar.",
            whenSlugs: ["catwalk-access"],
            whatFor: {
              tenant: "Get this renovation permit in OneCalendar.",
              contractor: "Fill the Catwalk Access permit in OneCalendar.",
              officer: "Check this renovation permit in OneCalendar.",
            },
            subSteps: [
              {
                text: "Fill the Catwalk Access permit in OneCalendar (worker name list and supporting documents).",
                tag: "Terminal 4 only",
                audience: "contractor",
              },
            ],
            people: ["Contractor"],
            systems: [{ label: "OneCalendar" }],
          },
          {
            name: "Renovation (Terminal – Additional) Permit",
            responsible: "You",
            what: "Fill the Renovation (Terminal — Additional) permit in OneCalendar.",
            whenSlugs: ["additional-renovation-scope"],
            whatFor: {
              tenant: "Get this renovation permit in OneCalendar.",
              contractor: "Fill the additional renovation permit in OneCalendar.",
              officer: "Check this renovation permit in OneCalendar.",
            },
            subSteps: [
              {
                text: "Fill the Renovation (Terminal — Additional) permit in OneCalendar (work period and supporting documents).",
                audience: "contractor",
              },
            ],
            people: ["Contractor"],
            systems: [{ label: "OneCalendar" }],
          },
          {
            name: "Skytrain Permit-To-Work",
            responsible: "You",
            what: "Skytrain Permit-To-Work",
            whatFor: {
              contractor: "Fill the Skytrain permit in OneCalendar.",
              tenant: "Get this renovation permit in OneCalendar.",
              officer: "Check this renovation permit in OneCalendar.",
            },
            whenSlugs: ["skytrain-work"],
            subSteps: [
              {
                text: "Skytrain Permit-To-Work",
                tag: "Terminal 1, Terminal 2, Terminal 3",
                audience: "contractor",
              },
            ],
            people: ["Contractor"],
          },
          {
            name: "Airside Work Permit",
            responsible: "You",
            what: "Airside Work Permit",
            whatFor: {
              contractor: "Fill the Airside Work permit in OneCalendar.",
              tenant: "Get this renovation permit in OneCalendar.",
              officer: "Check this renovation permit in OneCalendar.",
            },
            subSteps: [
              { text: "Airside Work Permit", audience: "contractor" },
            ],
            people: ["Contractor"],
          },
          {
            name: "T4 Transit Area Security Requirements",
            responsible: "You",
            what: "T4 Transit Area Security Requirements",
            whatFor: {
              contractor: "Follow T4 transit security rules for this job.",
              tenant: "Get T4 transit security on this job.",
              officer: "Check T4 transit security on this job.",
            },
            subSteps: [
              {
                text: "T4 Transit Area Security Requirements",
                tag: "Terminal 4 only",
                audience: "contractor",
              },
            ],
            people: ["Contractor"],
          },
          {
            name: "Submit Combined Permit To Work Application",
            responsible: "You",
            what: "Bundle remaining permits into one Permit to Work application and upload supporting documents in OneCalendar.",
            whatFor: {
              tenant:
                "Your contractor bundles the remaining permits and uploads supporting documents. You stay the Applicant.",
              contractor:
                "Submit all remaining permits together in OneCalendar.",
              officer:
                "Endorse the pack in OneCalendar first.",
            },
            subSteps: [
              { text: "Complete the remaining steps and submit everything as one Permit to Work application in OneCalendar.", audience: "contractor" },
            ],
            people: ["Contractor"],
            systems: [{ label: "OneCalendar" }],
          },
          {
            name: "Qualified Person Endorsed Letter of Undertaking",
            responsible: "You",
            what: "Email the QP-endorsed Letter of Undertaking to your Project Officer.",
            whenSlugs: ["takeover-from-exiting-tenant"],
            whatFor: {
              tenant: "Your contractor emails the QP-endorsed Letter of Undertaking to your Project Officer.",
              contractor: "Email the QP letter to your Project Officer.",
              officer: "The contractor emails the QP-endorsed Letter of Undertaking.",
            },
            subSteps: [
              { text: "Email the QP-endorsed Letter of Undertaking to your Project Officer.", audience: "contractor" },
            ],
            people: ["Contractor"],
          },
          {
            name: "Multi-Party Review by Changi Airport Group Stakeholders",
            responsible: "CAG + You",
            what: "Endorse completeness; BMC, AES and IFM review in sequence. Revise if rejected until OneCalendar issues the PTW.",
            whatFor: {
              tenant:
                "After your contractor submits, BMC, AES and IFM review the files in that order. Works cannot start until OneCalendar issues the Permit to Work. If reviewers ask for changes, your contractor updates the files — you do not need to chase each reviewer.",
              contractor:
                "Get pack endorsement before BMC, AES, and IFM.",
              officer:
                "Check pack endorsement before BMC, AES, and IFM.",
            },
            subSteps: [
              {
                text: "Wait for OneCalendar to issue the Permit to Work. BMC, AES and IFM review in that order. If they ask for changes, your contractor updates the files. Do not start works until the permit is issued.",
                audience: "tenant",
              },
              {
                text: "Review the Permit to Work with BMC, AES and IFM until OneCalendar issues it.",
                audience: "officer",
                alsoText: {
                  tenant: "The Permit to Work is under review. It will be issued in OneCalendar once comments are cleared.",
                  contractor: "The Permit to Work is under review. Revise if asked, until OneCalendar issues it.",
                },
              },
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
              {
                text: "OneCalendar issues the Permit to Work to the contractor when reviews are complete.",
                audience: "officer",
                alsoText: {
                  tenant: "The Permit to Work is issued in OneCalendar when reviews are complete.",
                  contractor: "The Permit to Work is issued in OneCalendar when reviews are complete.",
                },
              },
            ],
            people: ["Project Officer", "Building Maintenance Contractor", "Contractor", "Airport Emergency & Safety", "Integrated Facilities Management", "System"],
            systems: [{ label: "OneCalendar" }, { label: "WhatsApp" }, { label: "Teams" }],
          },
          {
            name: "Requests / Permissions Outside OneCalendar",
            responsible: "You",
            what: "Email IFM for permissions they named at the first site meeting.",
            whatFor: {
              tenant: "Email IFM for permissions they named.",
              contractor: "Email IFM for permissions they named.",
              officer: "Check contractor emailed IFM the named permissions.",
            },
            subSteps: [
              {
                text: "Email IFM for permissions they named.",
                audience: "contractor",
                alsoText: {
                  tenant: "Email IFM for permissions they named.",
                  officer: "Check contractor emailed IFM the named permissions.",
                },
              },
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
        name: "Handover",
        purpose: "Collect the keys and sign handover before renovation starts.",
        steps: [
          {
            name: "Site Walkthrough, Technical Verification & Handover Sign Off",
            responsible: "CAG + You",
            what: "Schedule handover so the tenant walks the unit with IFM, collect keys and sign the handover form before renovation starts.",
            whatFor: {
              tenant:
                "Your Project Officer sets the handover with IFM. Walk the unit, collect the keys and sign the handover form before renovation starts.",
              contractor:
                "Walk the unit with IFM if you are asked to attend. The tenant collects the keys and signs the handover form.",
              officer:
                "Schedule handover so the tenant walks the unit with IFM, collects keys and signs the handover form before renovation starts.",
            },
            subSteps: [
              { text: "Schedule the handover walk with IFM and the tenant.", audience: "officer" },
              { text: "Retrieve unit keys from the Key Management System.", audience: "officer" },
              { text: "Walk through the unit with IFM at handover.", audience: "tenant" },
              { text: "Collect the unit keys from IFM at handover.", audience: "tenant" },
              { text: "Sign the handover form with IFM.", audience: "tenant" },
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
            name: "Integrated Facilities Management Pre-Renovation Briefing",
            responsible: "CAG",
            what: "IFM briefs the contractor on site rules and requirements before works begin.",
            whatFor: { contractor: "Attend the IFM pre-renovation briefing before works begin.", officer: "IFM briefs the contractor on site rules and requirements before works begin.", tenant: "IFM briefs the works team before renovation starts." },
            subSteps: [
              { text: "IFM will arrange the pre-renovation briefing with the contractor.", audience: ["contractor", "officer"], alsoText: { tenant: "IFM briefs your contractor on site rules before works begin. You do not need to attend unless asked." } },
              { text: "IFM will conduct the pre-renovation briefing for the contractor.", audience: ["contractor", "officer"] },
            ],
            people: ["Integrated Facilities Management"],
            systems: [{ label: "Outlook Meeting Scheduler" }],
          },
          {
            name: "Airport Passes & Hoarding Installation",
            responsible: "CAG + You",
            what: "Secure airport passes and install hoarding before main works.",
            whatFor: {
              tenant: "Airport passes and hoarding are arranged before main works. You do not file the pass applications.",
              contractor: "Obtain airport passes and install hoarding before main works begin.",
              officer: "The contractor obtains airport passes and installs hoarding before main works.",
            },
            subSteps: [
              {
                text: "Obtain airport passes for your work team.",
                audience: "contractor",
                alsoText: {
                  tenant: "Airport passes are being obtained for the work team.",
                },
              },
              {
                text: "Install hoarding before main works begin.",
                audience: "contractor",
                alsoText: {
                  tenant: "Hoarding is being installed before main works begin.",
                },
              },
            ],
            people: ["Contractor", "Integrated Facilities Management"],
            systems: [{ label: "Airport Pass In Changi" }],
          },
          {
            name: "Temporary Power Request",
            responsible: "CAG + You",
            what: "Request temporary power from IFM if the unit has no permanent meter.",
            whatFor: {
              tenant: "Temporary power is requested from IFM if the unit has no permanent meter.",
              contractor: "Request temporary power from IFM if the unit has no permanent meter.",
              officer: "IFM turns on temporary power when the unit has no permanent meter.",
            },
            subSteps: [
              {
                text: "Request temporary power from IFM if the unit has no permanent meter.",
                audience: "contractor",
                alsoText: {
                  tenant: "Temporary power is being requested from IFM.",
                },
              },
              { text: "IFM will turn on temporary power for the contractor.", audience: ["contractor", "officer"] },
            ],
            people: ["Contractor", "Integrated Facilities Management"],
          },
          {
            name: "FSSD Notice of Approval Submission",
            responsible: "You",
            what: "Submit the FSSD Notice of Approval (NOA) via OneCalendar.",
            whenSlugs: ["fire-protection-detection-works"],
            whatFor: {
              tenant: "The FSSD Notice of Approval is submitted in OneCalendar.",
              contractor: "Submit the FSSD Notice of Approval (NOA) via OneCalendar.",
              officer: "The contractor submits the FSSD Notice of Approval via OneCalendar.",
            },
            subSteps: [
              {
                text: "Submit the FSSD Notice of Approval (NOA) via OneCalendar.",
                audience: "contractor",
                alsoText: {
                  tenant: "The FSSD Notice of Approval is being submitted in OneCalendar.",
                },
              },
            ],
            people: ["Contractor"],
            systems: [{ label: "OneCalendar" }],
          },
          {
            name: "QP Assessment: FSC / MAA / Temporary Fire Permit",
            responsible: "You",
            what: "Engage a Qualified Person / Professional Engineer to confirm whether Fire Safety Certificate, Minor Addition & Alteration or Temporary Fire Permit is required.",
            whatFor: {
              tenant: "Your contractor’s Qualified Person confirms whether a Fire Safety Certificate, Minor Addition & Alteration or Temporary Fire Permit is needed.",
              contractor: "Engage a Qualified Person / Professional Engineer to confirm whether Fire Safety Certificate, Minor Addition & Alteration or Temporary Fire Permit is required.",
              officer: "The contractor engages a Qualified Person to confirm the fire-permit route.",
            },
            subSteps: [
              {
                text: "Engage a Qualified Person / Professional Engineer to confirm whether Fire Safety Certificate, Minor Addition & Alteration or Temporary Fire Permit is required.",
                audience: "contractor",
              },
            ],
            people: ["Contractor", "Qualified Person"],
          },
          {
            name: "Renovation Works & Site Monitoring",
            responsible: "CAG + You",
            what: "Monitor renovation under permit. CAG checks progress and can stop non-compliant work.",
            whatFor: {
              tenant: "Renovation is underway under permit. CAG may issue a Stop Work Order if something is non-compliant.",
              contractor: "Carry out the renovation works under your Permit to Work.",
              officer: "Monitor renovation under permit and issue a Stop Work Order if something is non-compliant.",
            },
            subSteps: [
              {
                text: "Carry out the renovation works under your Permit to Work.",
                audience: "contractor",
                alsoText: {
                  tenant: "Renovation is underway under permit. CAG may issue a Stop Work Order if something is non-compliant.",
                },
              },
              {
                text: "Monitor renovation progress and issue a Stop Work Order if something is non-compliant.",
                audience: "officer",
                alsoText: {
                  tenant: "Works are being monitored. A Stop Work Order can be issued if something is non-compliant.",
                  contractor: "Works are being monitored. A Stop Work Order can be issued if something is non-compliant.",
                },
              },
              {
                text: "IFM will run on-site checks during renovation and can issue a Stop Work Order if something is non-compliant.",
                audience: ["contractor", "officer"],
                alsoText: {
                  tenant: "On-site checks are running during renovation. A Stop Work Order can be issued if something is non-compliant.",
                },
              },
            ],
            people: ["Contractor", "Project Officer", "Integrated Facilities Management"],
            systems: [{ label: "Teams" }, { label: "OneCalendar" }],
          },
          {
            name: "Waterproofing Checks & Water Ponding Test",
            responsible: "CAG + You",
            what: "IFM carries out waterproofing checks and witnesses the water ponding test.",
            whenSlugs: ["waterproofing-works"],
            subSteps: [
              { text: "IFM will carry out waterproofing checks with the contractor.", audience: ["contractor", "officer"] },
              { text: "IFM will witness the water ponding test with the contractor.", audience: ["contractor", "officer"] },
            ],
            people: ["Contractor", "Integrated Facilities Management"],
          },
          {
            name: "Fire Safety Tests Verification",
            responsible: "CAG + You",
            what: "AES verifies fire safety tests with Building Management Centre.",
            subSteps: [
              { text: "Notify Airport Emergency & Safety required fire safety steps ready for review.", audience: "officer" },
              { text: "AES will verify public announcement, sprinkler and power tests with Building Management Centre.", audience: ["contractor", "officer"] },
              { text: "Compile and shares signed off inspection checklist to Integrated Facilities Management.", audience: "officer" },
              { text: "Signed-off inspection checklist to Project Officer.", audience: "officer" },
            ],
            people: ["Contractor", "Project Officer", "Airport Emergency & Safety", "Building Management Centre"],
          },
          {
            name: "Ceiling Inspection Sign-Off",
            responsible: "CAG + You",
            what: "IFM and AES verify the ceiling inspection.",
            subSteps: [
              { text: "IFM will verify the ceiling inspection with the contractor.", tag: "Ceiling Panel, False Ceiling", audience: ["contractor", "officer"] },
              { text: "AES will verify the ceiling inspection against fire safety requirements.", audience: ["contractor", "officer"] },
            ],
            people: ["Contractor", "Integrated Facilities Management", "Airport Emergency & Safety"],
          },
          {
            name: "Public Announcement System Testing",
            responsible: "CAG + You",
            what: "IFM witnesses Public Announcement System testing.",
            subSteps: [
              { text: "IFM will witness Public Announcement System testing with the contractor.", audience: ["contractor", "officer"] },
            ],
            people: ["Contractor", "Integrated Facilities Management"],
          },
          {
            name: "Aircon Balancing Test Report",
            responsible: "You",
            what: "Submit the aircon balancing test report.",
            subSteps: [
              { text: "Submit the aircon balancing test report.", audience: "contractor" },
            ],
            people: ["Contractor"],
          },
          {
            name: "Kitchen Fire Suppression System Test",
            responsible: "CAG + You",
            what: "AES verifies kitchen fire suppression system testing for F&B.",
            subSteps: [
              { text: "AES will verify kitchen fire suppression system testing for F&B.", tag: "F&B", audience: ["contractor", "officer"] },
            ],
            people: ["Contractor", "Airport Emergency & Safety"],
          },
          {
            name: "Gas Leak Test",
            responsible: "CAG + You",
            what: "AES verifies gas leak testing for F&B.",
            subSteps: [
              { text: "AES will verify gas leak testing for F&B.", tag: "F&B", audience: ["contractor", "officer"] },
            ],
            people: ["Contractor", "Airport Emergency & Safety"],
          },
          {
            name: "Total Gas Flooding System Test",
            responsible: "CAG + You",
            what: "AES verifies Total Gas Fire Suppression System testing.",
            subSteps: [
              { text: "AES will verify Total Gas Fire Suppression System testing.", audience: ["contractor", "officer"] },
            ],
            people: ["Contractor", "Airport Emergency & Safety"],
          },
          {
            name: "As-Built Drawings Upload",
            responsible: "You",
            what: "Upload as-built drawings into OneCalendar.",
            subSteps: [
              { text: "Upload as-built drawings into OneCalendar.", audience: "contractor" },
            ],
            people: ["Contractor"],
            systems: [{ label: "OneCalendar" }],
          },
          {
            name: "Defects Rectification",
            responsible: "You",
            what: "Rectify defects raised by CAG stakeholders before opening checks.",
            subSteps: [
              { text: "Rectify defects raised by CAG stakeholders before opening checks.", audience: "contractor" },
            ],
            people: ["Contractor"],
          },
          {
            name: "Fire Safety Certificate / MAA / Temporary Fire Permit Submission",
            responsible: "CAG + You",
            what: "Submit the Fire Safety Certificate, Minor A&A or Temporary Fire Permit where it applies.",
            whenSlugs: ["fire-safety-submission"],
            whatFor: {
              tenant: "Submit the Fire Safety Certificate, Minor A&A or Temporary Fire Permit where it applies.",
              contractor: "The tenant lodges fire certificates where they apply.",
              officer: "AES reviews Fire Safety Certificate or Minor A&A permits.",
            },
            subSteps: [
              { text: "Submit the Fire Safety Certificate, Minor A&A or Temporary Fire Permit where it applies.", audience: "tenant" },
              {
                text: "AES will review Fire Safety Certificate or Minor A&A permits.",
                audience: "officer",
                alsoText: {
                  tenant: "Fire Safety Certificate or Minor A&A permits are under review.",
                  contractor: "Fire Safety Certificate or Minor A&A permits are under review.",
                },
              },
            ],
            people: ["Tenant", "Airport Emergency & Safety"],
            systems: [{ label: "OneCalendar" }],
          },
          {
            name: "Pre-Opening Inspection",
            responsible: "CAG + You",
            what: "Pass Pre-Opening Inspection with IFM and AES.",
            whatFor: {
              tenant: "At Pre-Opening Inspection, IFM checks requirements and AES checks fire safety.",
              contractor: "Attend Pre-Opening Inspection with IFM and AES.",
              officer: "Schedule Pre-Opening Inspection. IFM checks requirements and AES checks fire safety.",
            },
            subSteps: [
              {
                text: "Schedule the Pre-Opening Inspection with stakeholders.",
                audience: "officer",
                alsoText: {
                  tenant: "Pre-Opening Inspection is being scheduled with stakeholders.",
                  contractor: "Pre-Opening Inspection is being scheduled with stakeholders.",
                },
              },
              { text: "Attend the Pre-Opening Inspection.", audience: ["tenant", "contractor"] },
              { text: "IFM will sign Pre-Opening Inspection form for Project Officer.", audience: "officer" },
              { text: "AES will sign Pre-Opening Inspection form for Project Officer.", audience: "officer" },
            ],
            people: ["Tenant", "Project Officer", "Airport Emergency & Safety", "Integrated Facilities Management"],
            systems: [{ label: "Outlook Meeting Scheduler" }],
          },
          {
            name: "Opening Announcement & Directory Update",
            hideFrom: ["contractor"],
            responsible: "CAG",
            what: "Notify CAG that the unit is opening and publish the store listing.",
            whatFor: {
              tenant: "Opening details are published. You do not send the opening notice.",
              contractor: "Opening details are published by the Project Officer.",
              officer: "Notify CAG that the unit is opening and update the Tenant Directory Taxonomy.",
            },
            subSteps: [
              {
                text: "Notify CAG that the unit is opening.",
                audience: "officer",
                alsoText: { tenant: "Opening of the unit is being notified to CAG." },
              },
              {
                text: "Update the Tenant Directory Taxonomy before outlet opening.",
                audience: "officer",
                alsoText: { tenant: "Your store listing is being updated before opening." },
              },
              {
                text: "Publish tenant information on the Tenant Directory Taxonomy.",
                audience: "officer",
                alsoText: { tenant: "Your store listing is being published." },
              },
            ],
            people: ["Project Officer"],
            systems: [{ label: "Tenant Directory Taxonomy" }],
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
            hideFrom: ["contractor"],
            responsible: "CAG + You",
            what: "Request and clear opening documents from the tenant.",
            whatFor: { tenant: "Submit as-builts and COF so IFM can close the opening documentation loop.", contractor: "Opening documents are the tenant’s to submit. You do not lodge as-builts or COF on this step.", officer: "Request and clear opening documents from the tenant." },
            subSteps: [
              { text: "IFM will request as-built drawings from you via OneCalendar.", audience: "tenant", alsoText: { contractor: "Opening documents are requested from the tenant. You do not lodge as-builts or COF on this step." } },
              { text: "IFM will request the Certificate of Fitness from you via OneCalendar.", audience: "tenant" },
              { text: "Submit as-built drawings to IFM via OneCalendar.", audience: "tenant" },
              { text: "Submit the Certificate of Fitness to IFM via TOPAZ.", audience: "tenant" },
            ],
            people: ["Integrated Facilities Management", "Tenant"],
            systems: [{ label: "OneCalendar" }, { label: "TOPAZ" }],
          },
          {
            name: "FSSD Notice of Approval Submission",
            hideFrom: ["contractor"],
            responsible: "You",
            what: "Submit the FSSD Notice of Approval (NOA) to IFM and AES via OneCalendar.",
            whenSlugs: ["fire-protection-detection-works"],
            whatFor: {
              tenant: "Submit the FSSD Notice of Approval (NOA) to IFM and AES via OneCalendar.",
              contractor: "Opening FSSD Notice of Approval is the tenant’s to submit.",
              officer: "The tenant submits the FSSD Notice of Approval via OneCalendar.",
            },
            subSteps: [
              { text: "Submit the FSSD Notice of Approval (NOA) to IFM and AES via OneCalendar.", audience: "tenant" },
            ],
            people: ["Tenant"],
            systems: [{ label: "OneCalendar" }],
          },
          {
            name: "Store Opening & Capex Verification",
            responsible: "CAG + You",
            what: "Announce opening and clear capex / defects, settle capex evidence with the Project Officer, and clear any remaining IFM defects.",
            whatFor: { tenant: "Support store opening close-out, settle capex evidence with the Project Officer, and clear any remaining IFM defects.", contractor: "Opening close-out is the tenant and Project Officer. Clear any defects that sit with your works if IFM flags them.", officer: "Announce opening and clear capex / defects, settle capex evidence with the Project Officer, and clear any remaining IFM defects." },
            subSteps: [
              {
                text: "Send the store opening notice to stakeholders.",
                audience: "officer",
                alsoText: { tenant: "The store opening notice is going out to stakeholders." },
              },
              {
                text: "Handle the renovation invoice from the tenant.",
                audience: "officer",
                alsoText: { tenant: "The renovation invoice is being processed." },
              },
              { text: "Submit your renovation invoice to your Project Officer.", audience: "tenant" },
              {
                text: "Verify capex commitment fulfilment.",
                audience: "officer",
                alsoText: { tenant: "Capex commitment fulfilment is being verified." },
              },
              {
                text: "IFM will follow up on outstanding defects with the tenant if any.",
                audience: "officer",
                alsoText: { tenant: "Outstanding defects are being followed up if any remain." },
              },
              { text: "Rectify any outstanding defects IFM has flagged.", audience: "tenant", alsoText: { contractor: "If IFM flags remaining defects from your works, clear them. Opening notice and capex close-out sit with the tenant and Project Officer." } },
            ],
            people: ["Project Officer", "Tenant", "Integrated Facilities Management"],
          },
          {
            name: "Point of Sales Data Reporting",
            hideFrom: ["contractor"],
            responsible: "CAG",
            what: "Pull POS insights and circulate the sales summary to stakeholders (Retail/F&B).",
            whatFor: {
              tenant: "CAG pulls POS insights internally and circulates a sales summary. You do not submit a report on this step.",
              contractor: "CAG pulls POS insights internally. This is not a contractor submission.",
              officer: "Pull POS insights and circulate the sales summary to stakeholders (Retail/F&B).",
            },
            subSteps: [
              { text: "Pull sales information from the Point of Sales backend using Customer Discovery Insights.", tag: "Retail / F&B", audience: "officer", alsoText: { tenant: "CAG pulls POS insights internally and circulates a sales summary. You do not submit a report on this step.", contractor: "CAG pulls POS insights internally. This is not a contractor submission." } },
              { text: "Synthesise the sales information from the Point of Sales data.", tag: "Retail / F&B", audience: "officer" },
              { text: "Share the synthesised sales report with stakeholders by email.", tag: "Retail / F&B", audience: "officer" },
            ],
            people: ["Project Officer"],
            systems: [{ label: "Customer Discovery Insights" }, { label: "Point of Sales" }, { label: "Excel" }],
          },
          {
            name: "TOPAZ Account Setup",
            hideFrom: ["contractor"],
            responsible: "CAG",
            what: "Create the tenant TOPAZ account so recurring service reports can be lodged.",
            whatFor: { tenant: "Project Officer creates your TOPAZ account for service reports.", contractor: "The tenant’s TOPAZ account is created so they can lodge service reports. You do not create that account.", officer: "Create the tenant TOPAZ account so recurring service reports can be lodged." },
            subSteps: [
              {
                text: "Create the tenant’s TOPAZ account so they can submit service reports.",
                audience: "officer",
                alsoText: {
                  tenant: "A TOPAZ account is being created so you can submit service reports.",
                  contractor: "The tenant’s TOPAZ account is being created so they can lodge service reports.",
                },
              },
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
            hideFrom: ["contractor"],
            responsible: "CAG + You",
            what: "Lodge required service reports in TOPAZ on schedule. Unit filters hide reports that do not apply to this premise.",
            whatFor: { tenant: "Lodge your required service reports in TOPAZ on schedule. Unit filters hide reports that do not apply to this premise.", contractor: "Service reports in TOPAZ are the tenant’s to lodge. You do not submit these recurring reports.", officer: "Lodge required service reports in TOPAZ on schedule. Unit filters hide reports that do not apply to this premise." },
            subSteps: [
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
              { text: "IFM will approve service reports in TOPAZ.", audience: "officer", alsoText: { tenant: "Service reports are being approved in TOPAZ.", contractor: "Recurring TOPAZ service reports are the tenant’s to lodge. You do not submit these." } },
            ],
            people: ["Tenant", "Integrated Facilities Management"],
            systems: [{ label: "TOPAZ" }],
          },
          {
            name: "Pest Control Reporting",
            hideFrom: ["contractor"],
            responsible: "You",
            what: "Submit your pest control report to IFM via TOPAZ.",
            whatFor: {
              tenant: "Submit your pest control report to IFM via TOPAZ.",
              contractor: "Pest control reporting is the tenant’s to lodge.",
              officer: "The tenant submits the pest control report via TOPAZ.",
            },
            subSteps: [
              { text: "Submit your pest control report to IFM via TOPAZ.", tag: "F&B", audience: "tenant" },
            ],
            people: ["Tenant"],
            systems: [{ label: "TOPAZ" }],
          },
          {
            name: "Air Handling Unit Servicing Reporting",
            hideFrom: ["contractor"],
            responsible: "You",
            what: "Submit your Air Handling Unit servicing report to IFM via TOPAZ.",
            whatFor: {
              tenant: "Submit your Air Handling Unit servicing report to IFM via TOPAZ.",
              contractor: "AHU servicing reports are the tenant’s to lodge.",
              officer: "The tenant submits the AHU servicing report via TOPAZ.",
            },
            subSteps: [
              { text: "Submit your Air Handling Unit servicing report to IFM via TOPAZ.", audience: "tenant" },
            ],
            people: ["Tenant"],
            systems: [{ label: "TOPAZ" }],
          },
          {
            name: "Annual Fire Safety Declaration & Training",
            hideFrom: ["contractor"],
            responsible: "CAG + You",
            what: "Complete annual fire safety training and declaration; AES follows up on overdue units.",
            whatFor: { tenant: "Complete your annual fire safety training and declaration. AES follows up if it is late, and a chargeable inspection can follow.", contractor: "Annual fire safety training and declaration are the tenant’s. AES follows up if they are late.", officer: "Complete annual fire safety training and declaration; AES follows up on overdue units." },
            subSteps: [
              { text: "Complete the AES fire safety training, quiz and annual declaration. If it is late, AES sends reminders and can carry out a chargeable inspection.", audience: "tenant", alsoText: { contractor: "Annual fire safety training and declaration are the tenant’s. AES follows up if they are late." } },
              { text: "AES will track annual Fire Safety Declaration submissions.", audience: "officer", alsoText: { tenant: "Annual Fire Safety Declaration submissions are being tracked." } },
              { text: "AES will send renewal reminders before year end.", audience: "officer", alsoText: { tenant: "Renewal reminders go out before year end if the declaration is still due." } },
              { text: "AES will carry out a chargeable inspection if the declaration is not submitted.", audience: "officer", alsoText: { tenant: "A chargeable inspection can follow if the declaration is not submitted." } },
            ],
            people: ["Tenant", "Airport Emergency & Safety"],
            systems: [{ label: "Tenant Fire Safety Declaration Portal" }, { label: "Tenant Fire Safety Portal" }],
          },
          {
            name: "Monthly Sales Declaration",
            hideFrom: ["contractor"],
            responsible: "You",
            what: "Submit the monthly sales declaration in the Lease Management System.",
            whatFor: { tenant: "Submit your monthly sales declaration in the Lease Management System.", contractor: "Monthly sales declaration is the tenant’s in the Lease Management System. You do not file it.", officer: "Submit the monthly sales declaration in the Lease Management System." },
            subSteps: [
              { text: "Submit your monthly sales declaration in the Lease Management System.", audience: "tenant", alsoText: { contractor: "Monthly sales declaration is the tenant’s. You do not file it." } },
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
            what: "Email the reinstatement pack after division reps pull unit drawings from Newforma.",
            whatFor: {
              tenant:
                "Get the reinstatement pack by email from your Project Officer.",
              contractor:
                "Get the reinstatement pack by email from Project Officer. Use that set, not the fit-out drawings.",
              officer:
                "Ask division reps for Newforma drawings, then email the pack. Do not put drawings in the portal.",
            },
            subSteps: [
              {
                text: "Get the reinstatement pack by email from your Project Officer.",
                audience: ["tenant", "contractor"],
              },
              {
                text: "Ask your division reps for the unit drawings. They pull them from Newforma.",
                audience: "officer",
              },
              {
                text: "Email the reinstatement pack to the tenant and contractor. Do not upload drawings to the portal.",
                audience: "officer",
              },
              { text: "Request provision list from Airport Planning & Leasing.", audience: "officer" },
              { text: "Share provision list with Project Officer.", audience: "officer" },
              { text: "Check key status for reinstatement meeting.", audience: "officer" },
              { text: "IFM will arrange key purchasing for any missing keys.", audience: "officer" },
            ],
            people: ["Project Officer", "Airport Planning & Leasing", "Master Planning", "Integrated Facilities Management"],
            systems: [{ label: "SharePoint" }, { label: "Newforma" }, { label: "Key Management System" }, { label: "Procurement" }],
          },
          {
            name: "Reinstatement Requirements & Plan Alignment",
            responsible: "CAG",
            what: "Align reinstatement scope with the outgoing tenant and IFM on reinstatement scope; link incoming tenant when a handover applies.",
            whatFor: {
              tenant:
                "IFM attends this meeting and walks reinstatement requirements. Align the scope with your Project Officer. Incoming tenants are linked when a handover applies.",
              contractor:
                "IFM walks reinstatement requirements at this meeting. Align the strip-out scope before you apply for the reinstatement permit.",
              officer:
                "Schedule the reinstatement meeting. IFM walks requirements. Link incoming and outgoing tenants when a handover applies.",
            },
            subSteps: [
              {
                text: "Schedule the reinstatement meeting with stakeholders.",
                tag: "Outgoing Tenant",
                audience: "officer",
                alsoText: {
                  tenant: "The reinstatement meeting is being scheduled.",
                  contractor: "The reinstatement meeting is being scheduled.",
                },
              },
              { text: "Attend the reinstatement meeting. Confirm reinstatement scope with IFM.", tag: "Outgoing Tenant", audience: ["tenant", "contractor"] },
              {
                text: "Link the incoming tenant with the outgoing tenant when a handover applies.",
                tag: "Outgoing Tenant",
                audience: "officer",
                alsoText: {
                  tenant: "Incoming and outgoing tenants are being linked when a handover applies.",
                  contractor: "Incoming and outgoing tenants are being linked when a handover applies.",
                },
              },
            ],
            people: ["Project Officer", "Integrated Facilities Management"],
            systems: [{ label: "Outlook Meeting Scheduler" }, { label: "Meeting" }],
          },
          {
            name: "Reinstatement Permit Submission via OneCalendar",
            responsible: "You",
            what: "Contractor submits the reinstatement Permit to Work in OneCalendar for the outgoing unit.",
            whatFor: { contractor: "Submit the reinstatement Permit to Work in OneCalendar for the outgoing unit.", tenant: "Your contractor submits the reinstatement Permit to Work in OneCalendar. You do not file that permit.", officer: "Contractor submits the reinstatement Permit to Work in OneCalendar for the outgoing unit." },
            subSteps: [
              { text: "Submit the reinstatement Permit to Work in OneCalendar.", tag: "Outgoing Tenant", audience: "contractor", alsoText: { tenant: "Your contractor submits the reinstatement Permit to Work in OneCalendar. You do not file that permit." } },
            ],
            people: ["Contractor"],
            systems: [{ label: "OneCalendar" }],
          },
          {
            name: "Multi-Party Review by Changi Airport Group Stakeholders",
            responsible: "CAG",
            what: "IFM and AES review the reinstatement PTW and method statements until OneCalendar issues approval.",
            whatFor: { tenant: "IFM and AES review the reinstatement PTW and method statements until OneCalendar issues approval..", contractor: "IFM and AES review the reinstatement PTW and method statements until OneCalendar issues approval..", officer: "IFM and AES review the reinstatement PTW and method statements until OneCalendar issues approval." },
            subSteps: [
              { text: "IFM and AES will review the reinstatement Permit to Work until it is issued.", audience: "officer", alsoText: { tenant: "The reinstatement Permit to Work is under review until it is issued.", contractor: "The reinstatement Permit to Work is under review until it is issued." } },
              { text: "IFM will review the reinstatement Permit to Work against renovation requirements.", tag: "Outgoing Tenant", audience: ["contractor", "officer"] },
              { text: "AES will review the reinstatement Permit to Work against fire safety provisions.", tag: "Outgoing Tenant", audience: "officer" },
              { text: "AES will review the reinstatement method statement.", tag: "Outgoing Tenant", audience: ["contractor", "officer"] },
              { text: "AES will review the reinstatement safe work procedures.", tag: "Outgoing Tenant", audience: ["contractor", "officer"] },
              {
                text: "OneCalendar issues the reinstatement Permit to Work when reviews are complete.",
                tag: "Outgoing Tenant",
                audience: "officer",
                alsoText: {
                  tenant: "The reinstatement Permit to Work is issued in OneCalendar when review is done.",
                  contractor: "The reinstatement Permit to Work is issued in OneCalendar when review is done.",
                },
              },
            ],
            people: ["Integrated Facilities Management", "Airport Emergency & Safety", "System"],
            systems: [{ label: "OneCalendar" }],
          },
          {
            name: "Pre-Reinstatement Works",
            responsible: "CAG + You",
            what: "Take down directory listings, notify stakeholders of closure, and install hoarding before strip-out.",
            whatFor: { tenant: "Your Project Officer takes down directory listings and notifies stakeholders of closure. You do not send those notices. Hoarding goes up before strip-out.", contractor: "Install hoarding before reinstatement works begin. Directory and closure notices are the Project Officer’s.", officer: "Take down directory listings, notify stakeholders of closure, and install hoarding before strip-out." },
            subSteps: [
              { text: "Your Project Officer will update the Tenant Directory Taxonomy with store closure information.", tag: "Outgoing Tenant", audience: "officer", alsoText: { tenant: "Directory listings are taken down and stakeholders are notified of closure — your Project Officer does that. You do not send those notices." } },
              { text: "Your Project Officer will notify stakeholders of the store closure.", tag: "Outgoing Tenant", audience: "officer" },
              { text: "Install hoarding before reinstatement works begin.", tag: "Outgoing Tenant", audience: "contractor" },
            ],
            people: ["Project Officer", "Contractor"],
            systems: [{ label: "Tenant Directory Taxonomy" }],
          },
          {
            name: "Point of Sales Removal",
            hideFrom: ["contractor"],
            responsible: "CAG",
            what: "Stay copied on the Point of Sales removal notice with NEC and the tenant.",
            whatFor: {
              tenant: "NEC is copied on Point of Sales removal. You do not send that notice yourself.",
              contractor: "Point of Sales removal sits with the tenant and Project Officer.",
              officer: "Stay copied on the Point of Sales removal notice with NEC and the tenant.",
            },
            subSteps: [
              { text: "Your Project Officer will stay copied on the Point of Sales removal notice with NEC and the tenant.", tag: "Retail / F&B", audience: "officer" },
            ],
            people: ["Project Officer"],
            systems: [{ label: "Point of Sales" }],
          },
          {
            name: "Structured Cabling Disconnection (Terminal 3)",
            responsible: "You",
            what: "Structured Cabling Disconnection (Terminal 3)",
            whenSlugs: ["structured-cabling"],
            subSteps: [
              {
                text: "Structured Cabling Disconnection (Terminal 3)",
                tag: "Terminal 3 (",
                audience: "contractor",
              },
            ],
            people: ["Contractor"],
          },
          {
            name: "Reinstatement Works",
            responsible: "CAG + You",
            what: "Monitor reinstatement under permit the unit under permit; Project Officer monitors and can stop non-compliant work.",
            whatFor: { tenant: "Contractor reinstates the unit under permit; Project Officer monitors and can stop non-compliant work..", contractor: "Reinstate the unit under permit the unit under permit; Project Officer monitors and can stop non-compliant work.", officer: "Monitor reinstatement under permit the unit under permit; Project Officer monitors and can stop non-compliant work." },
            subSteps: [
              { text: "Carry out reinstatement works under your Permit to Work.", tag: "Outgoing Tenant", audience: "contractor" },
              {
                text: "Monitor reinstatement progress and issue a Stop Work Order if something is non-compliant.",
                tag: "Outgoing Tenant",
                audience: "officer",
                alsoText: {
                  tenant: "Reinstatement is being monitored. A Stop Work Order can be issued if something is non-compliant.",
                  contractor: "Reinstatement is being monitored. A Stop Work Order can be issued if something is non-compliant.",
                },
              },
            ],
            people: ["Contractor", "Project Officer"],
          },
          {
            name: "Pre-Takeover Inspection",
            responsible: "CAG + You",
            what: "Schedule pre-takeover inspection reinstated premises with the tenant; defects must be cleared before takeover.",
            whatFor: {
              tenant:
                "IFM inspects the reinstated unit with you. Attend that walk and clear any defects before takeover.",
              officer:
                "Schedule the pre-takeover inspection. Defects must be cleared before takeover.",
            },
            subSteps: [
              {
                text: "Schedule the pre-takeover inspection with stakeholders.",
                tag: "Outgoing Tenant",
                audience: "officer",
                alsoText: { tenant: "The pre-takeover inspection is being scheduled." },
              },
              { text: "Walk the pre-takeover inspection with IFM.", tag: "Outgoing Tenant", audience: "tenant" },
              { text: "Rectify any reinstatement defects IFM finds before takeover.", tag: "Outgoing Tenant", audience: "tenant" },
            ],
            people: ["Project Officer", "Integrated Facilities Management", "Tenant"],
            systems: [{ label: "Outlook Meeting Scheduler" }],
          },
          {
            name: "Takeover Meeting",
            hideFrom: ["contractor"],
            responsible: "CAG + You",
            what: "Record takeover sign-off to IFM, sign the takeover form, and file a copy with the Project Officer.",
            whatFor: { tenant: "Hand the premises back to IFM, sign the takeover form, and keep a copy with your Project Officer.", contractor: "Takeover sign-off is the tenant and IFM. You do not sign the takeover form unless asked to attend.", officer: "Record takeover sign-off to IFM, sign the takeover form, and file a copy with the Project Officer." },
            subSteps: [
              { text: "IFM will verify that defects are cleared.", tag: "Outgoing Tenant", audience: "officer", alsoText: { tenant: "Defects are being checked as cleared before takeover." } },
              { text: "Hand the premises back to IFM at takeover.", tag: "Outgoing Tenant", audience: "tenant" },
              { text: "Sign the takeover form with IFM.", tag: "Outgoing Tenant", audience: "tenant", alsoText: { contractor: "Takeover sign-off is the tenant and IFM. You do not sign the takeover form unless asked to attend." } },
              { text: "Receive a copy of signed takeover form from Integrated Facilities Management.", tag: "Outgoing Tenant", audience: "officer" },
            ],
            people: ["Integrated Facilities Management", "Tenant", "Project Officer"],
            systems: [{ label: "Takeover Records" }],
          },
          {
            name: "Post-Takeover Closure Announcement",
            hideFrom: ["contractor"],
            responsible: "CAG",
            what: "Send the store closure notice to stakeholders.",
            whatFor: {
              tenant: "After takeover, your Project Officer notifies stakeholders that the store has closed. You do not send that notice.",
              contractor: "After takeover, the Project Officer notifies stakeholders that the store has closed. You do not send that notice.",
              officer: "Send the store closure notice to stakeholders.",
            },
            subSteps: [
              {
                text: "You do not send the store-closure notice — your Project Officer notifies stakeholders after takeover.",
                audience: "tenant",
                alsoText: { contractor: "You do not send the store-closure notice — the Project Officer notifies stakeholders after takeover." },
              },
              {
                text: "Send the store closure notice to stakeholders.",
                audience: "officer",
              },
            ],
            people: ["Project Officer"],
          },
          {
            name: "Security Deposit Release & Utility Bill Settlement",
            hideFrom: ["contractor"],
            responsible: "CAG + You",
            what: "Initiate security deposit release after lease end with Finance; Project Officer initiates security deposit release after lease end.",
            whatFor: { tenant: "Settle outstanding utility charges notified by Finance. The security deposit is released after those charges are clear — you do not chase the release.", contractor: "Security deposit and utilities are the tenant’s to settle with Finance. You do not initiate the release.", officer: "Initiate security deposit release after lease end with Finance; Project Officer initiates security deposit release after lease end." },
            subSteps: [
              {
                text: "Initiate security deposit release with Finance once the lease end date is reached.",
                audience: "officer",
                alsoText: { tenant: "Security deposit release is being initiated with Finance after lease end." },
              },
              { text: "Settle outstanding utility charges notified by Finance. The security deposit is released after lease end once those charges are clear — you do not chase the release.", audience: "tenant", alsoText: { contractor: "Security deposit and utilities are the tenant’s to settle with Finance. You do not initiate the release." } },
              {
                text: "Finance will release the security deposit to the tenant.",
                audience: "officer",
                alsoText: { tenant: "The security deposit is being released by Finance." },
              },
            ],
            people: ["Project Officer", "Tenant", "Finance"],
          },
        ],
      },
    ],
  },
];

export type DocType =
  | "Policy & Requirements"
  | "Reference Document"
  | "Design Guideline"
  | "Template & Form"
  | "Process Guide";

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
  { id: "doc-provision", name: "Provision List — T3-AS-114", type: "Reference Document", phases: ["Setup", "Build"], version: "v2.3", effective: "2025-09-12", updatedAt: "2026-06-02", status: "Updated", owner: "DMO", terminal: ["T3"], tenancyType: ["F&B", "Retail"], zone: ["Airside"], changelog: "Not shared in the portal. Project Officers email the provision list after Airport Planning sends it." },
  { id: "doc-me", name: "M&E Drawings — T3-AS-114", type: "Reference Document", phases: ["Setup", "Build", "Exit"], version: "v1.4", effective: "2024-11-01", updatedAt: "2026-05-28", status: "Updated", owner: "Engineering", terminal: ["T3"], tenancyType: ["F&B", "Retail", "Service", "Kiosk"], zone: ["Airside"], changelog: "Not shared in the portal. Project Officers email drawings after division reps retrieve them from Newforma." },
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


