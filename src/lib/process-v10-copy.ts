import type { Role } from "@/lib/app-state";

export type LifeSgCard = {
  title?: string;
  subheader: string | string[];
  how?: string[];
  hideOnlyIf?: boolean;
};

/** Header = 3–5 word topic. Same string every role. Do not restate the bullets. */
const TITLES: Record<string, string> = {
  "Tenancy Platform Onboarding::Set Up Systems Required for Works and Setup":
    "OneCalendar for the unit",
  "Tenancy Platform Onboarding::Set Up Systems Required for Staff":
    "Staff in ONE Changi App",
  "Tenancy Platform Onboarding::Set Up WebEpic Account": "WebEpic account setup",
  "Tenancy Platform Onboarding::Point of Sales Setup": "Point of sale",
  "Pre-Kickoff::Kickoff Documents Gathered & Shared": "Site meeting pack",
  "Pre-Kickoff::Check Change of Use with URA": "Change of Use",
  "Pre-Kickoff::High-Level Design Review": "First design concept",
  "Pre-Kickoff::Confirmation of Meeting Attendees": "KickOff meeting",
  "Kickoff::Requirements & Plan Alignment": "Site meeting plans",
  "Post-Kickoff::Onboarding Guidelines Shared": "KickOff follow-up pack",
  "Post-Kickoff::Confirm Fire Safety Submission Route": "Fire permit route",
  "Design Review::Confirmation of Renovation Plans": "Design pack approval",
  "Permit Application::Permit Advisory & Tenancy Project Selection":
    "Renovation permits in OneCalendar",
  "Permit Application::Joint Site Inspection": "Joint site inspection",
  "Permit Application::Submit Combined Permit To Work Application":
    "Renovation permit application",
  "Permit Application::Qualified Person Endorsed Letter of Undertaking":
    "Qualified Person letter",
  "Permit Application::Multi-Party Review by Changi Airport Group Stakeholders":
    "Renovation permit review",
  "Permit Application::Requests / Permissions Outside OneCalendar":
    "Permissions outside OneCalendar",
  "Handover::Site Walkthrough, Technical Verification & Handover Sign Off":
    "Unit handover walk",
  "Renovation::Integrated Facilities Management Pre-Renovation Briefing":
    "IFM pre-renovation briefing",
  "Renovation::Airport Passes & Hoarding Installation":
    "Airport passes and hoarding",
  "Renovation::Temporary Power Request": "Temporary power supply",
  "Renovation::FSSD Notice of Approval Submission": "FSSD notice of approval",
  "Renovation::QP Assessment: FSC / MAA / Temporary Fire Permit":
    "Fire permit assessment",
  "Renovation::Renovation Works & Site Monitoring": "Renovation works on site",
  "Renovation::Waterproofing Checks & Water Ponding Test":
    "Waterproofing and ponding",
  "Renovation::Fire Safety Tests Verification": "Fire safety tests",
  "Renovation::Ceiling Inspection Sign-Off": "Ceiling inspection sign-off",
  "Renovation::Public Announcement System Testing": "Public announcement tests",
  "Renovation::Aircon Balancing Test Report": "Aircon balancing report",
  "Renovation::Kitchen Fire Suppression System Test": "Kitchen fire test",
  "Renovation::Gas Leak Test": "Gas leak test",
  "Renovation::Total Gas Flooding System Test": "Gas flooding test",
  "Renovation::As-Built Drawings Upload": "As-built drawing pack",
  "Renovation::Defects Rectification": "Works defects before opening",
  "Renovation::Fire Safety Certificate / MAA / Temporary Fire Permit Submission":
    "Fire safety certificate",
  "Renovation::Pre-Opening Inspection": "IFM pre-opening inspection",
  "Renovation::Opening Announcement & Directory Update":
    "Store directory listing",
  "Opening::Opening Document Submission": "Opening document pack",
  "Opening::FSSD Notice of Approval Submission": "Opening FSSD notice",
  "Opening::Store Opening & Capex Verification": "Store opening and capex",
  "Opening::Point of Sales Data Reporting": "Point of sale summary",
  "Opening::TOPAZ Account Setup": "TOPAZ account setup",
  "Operations::Regular Servicing Reporting": "Regular service reports",
  "Operations::Pest Control Reporting": "Pest control reports",
  "Operations::Air Handling Unit Servicing Reporting": "Air handling reports",
  "Operations::Annual Fire Safety Declaration & Training":
    "Yearly fire declaration",
  "Operations::Monthly Sales Declaration": "Monthly sales declaration",
  "Reinstatement::Unit Documents Gathered & Shared":
    "Reinstatement document pack",
  "Reinstatement::Reinstatement Requirements & Plan Alignment":
    "Reinstatement site meeting",
  "Reinstatement::Reinstatement Permit Submission via OneCalendar":
    "Reinstatement permit",
  "Reinstatement::Multi-Party Review by Changi Airport Group Stakeholders":
    "Reinstatement permit review",
  "Reinstatement::Pre-Reinstatement Works": "Before reinstatement works",
  "Reinstatement::Point of Sales Removal": "Point of sale removal",
  "Reinstatement::Structured Cabling Disconnection (Terminal 3)":
    "T3 structured cabling",
  "Reinstatement::Reinstatement Works": "Reinstatement works on site",
  "Reinstatement::Pre-Takeover Inspection": "IFM pre-takeover inspection",
  "Reinstatement::Takeover Meeting": "Unit takeover meeting",
  "Reinstatement::Post-Takeover Closure Announcement": "Store closure notice",
  "Reinstatement::Security Deposit Release & Utility Bill Settlement":
    "Security deposit and utilities",
};

const PERMIT_TITLES: Record<string, string> = {
  "Renovation (Terminal) Permit": "Renovation permit",
  "Ceiling Permit": "Ceiling permit",
  "Fire Alarm Isolation / Sprinkler Draining Permit":
    "Fire alarm isolation permit",
  "Hotwork Permit": "Hot Work permit",
  "Architectural Changes & Authority Approvals": "Authority approvals permit",
  "MEP Changes Permit": "MEP changes permit",
  "BIM Model Submission": "BIM model",
  "Structured Cabling (T3 Tenant Telephone Lines) Permit":
    "T3 telephone cabling",
  "Structured Cabling Indoor/Outdoor Permit": "Indoor outdoor cabling",
  "Telco Cabling Permit": "Telco cabling permit",
  "Catwalk Access Permit (Terminal 4)": "T4 catwalk access",
  "Renovation (Terminal – Additional) Permit": "Extra renovation permit",
  "Skytrain Permit-To-Work": "Skytrain permit",
  "Airside Work Permit": "Airside work permit",
  "T4 Transit Area Security Requirements": "T4 transit security",
};

export function cardTitle(
  _role: Role,
  stageName: string,
  stepName: string,
): string {
  return (
    TITLES[`${stageName}::${stepName}`] ?? PERMIT_TITLES[stepName] ?? stepName
  );
}

/** 2–4 word action line under the title. Does not replace bullets. */
const LEADS: Record<Role, Record<string, string>> = {
  tenant: {
    "Tenancy Platform Onboarding::Set Up Systems Required for Works and Setup":
      "Approve unit access",
    "Tenancy Platform Onboarding::Set Up Systems Required for Staff":
      "Register outlet staff",
    "Tenancy Platform Onboarding::Set Up WebEpic Account": "Apply for WebEpic",
    "Tenancy Platform Onboarding::Point of Sales Setup": "Get POS setup",
    "Pre-Kickoff::Kickoff Documents Gathered & Shared": "Get pack by email",
    "Pre-Kickoff::Check Change of Use with URA": "Get URA result",
    "Pre-Kickoff::High-Level Design Review": "Send first concept",
    "Pre-Kickoff::Confirmation of Meeting Attendees": "Attend when invited",
    "Kickoff::Requirements & Plan Alignment": "Present renovation plans",
    "Post-Kickoff::Onboarding Guidelines Shared": "Send directory details",
    "Post-Kickoff::Confirm Fire Safety Submission Route": "Confirm fire route",
    "Design Review::Confirmation of Renovation Plans": "Send design pack",
    "Permit Application::Permit Advisory & Tenancy Project Selection":
      "Check renovation permits started",
    "Permit Application::Joint Site Inspection": "Check inspection booked",
    "Permit Application::Submit Combined Permit To Work Application":
      "Get renovation permits",
    "Permit Application::Qualified Person Endorsed Letter of Undertaking":
      "Get QP letter",
    "Permit Application::Multi-Party Review by Changi Airport Group Stakeholders":
      "Get renovation permits",
    "Permit Application::Requests / Permissions Outside OneCalendar":
      "Email extra permissions",
    "Handover::Site Walkthrough, Technical Verification & Handover Sign Off":
      "Walk the unit",
    "Renovation::Integrated Facilities Management Pre-Renovation Briefing":
      "Get briefing date",
    "Renovation::Airport Passes & Hoarding Installation": "Get airport passes",
    "Renovation::Temporary Power Request": "Get temporary power",
    "Renovation::FSSD Notice of Approval Submission": "Get FSSD notice",
    "Renovation::QP Assessment: FSC / MAA / Temporary Fire Permit":
      "Get fire route",
    "Renovation::Renovation Works & Site Monitoring": "Get works finished",
    "Renovation::Waterproofing Checks & Water Ponding Test":
      "Get test results",
    "Renovation::Fire Safety Tests Verification": "Get fire tests",
    "Renovation::Ceiling Inspection Sign-Off": "Get ceiling sign-off",
    "Renovation::Public Announcement System Testing": "Get PA results",
    "Renovation::Aircon Balancing Test Report": "Get balancing report",
    "Renovation::Kitchen Fire Suppression System Test": "Get kitchen test",
    "Renovation::Gas Leak Test": "Get leak test",
    "Renovation::Total Gas Flooding System Test": "Get flooding test",
    "Renovation::As-Built Drawings Upload": "Get as-built drawings",
    "Renovation::Defects Rectification": "Get defects fixed",
    "Renovation::Fire Safety Certificate / MAA / Temporary Fire Permit Submission":
      "Submit fire certificate",
    "Renovation::Pre-Opening Inspection": "Attend opening inspection",
    "Renovation::Opening Announcement & Directory Update": "Get store listing",
    "Opening::Opening Document Submission": "Submit opening documents",
    "Opening::FSSD Notice of Approval Submission": "Submit FSSD notice",
    "Opening::Store Opening & Capex Verification": "Send renovation invoice",
    "Opening::Point of Sales Data Reporting": "Get sales summary",
    "Opening::TOPAZ Account Setup": "Get TOPAZ account",
    "Operations::Regular Servicing Reporting": "Lodge service reports",
    "Operations::Pest Control Reporting": "Submit pest report",
    "Operations::Air Handling Unit Servicing Reporting": "Submit aircon reports",
    "Operations::Annual Fire Safety Declaration & Training":
      "Complete yearly training",
    "Operations::Monthly Sales Declaration": "Submit monthly sales",
    "Reinstatement::Unit Documents Gathered & Shared": "Get reinstatement pack",
    "Reinstatement::Reinstatement Requirements & Plan Alignment":
      "Attend reinstatement meeting",
    "Reinstatement::Reinstatement Permit Submission via OneCalendar":
      "Get reinstatement permit",
    "Reinstatement::Multi-Party Review by Changi Airport Group Stakeholders":
      "Get the permit",
    "Reinstatement::Pre-Reinstatement Works": "Get closure notices",
    "Reinstatement::Point of Sales Removal": "Get POS removed",
    "Reinstatement::Structured Cabling Disconnection (Terminal 3)":
      "Get cabling disconnected",
    "Reinstatement::Reinstatement Works": "Get works finished",
    "Reinstatement::Pre-Takeover Inspection": "Walk pre-takeover inspection",
    "Reinstatement::Takeover Meeting": "Hand premises back",
    "Reinstatement::Post-Takeover Closure Announcement": "Get closure notice",
    "Reinstatement::Security Deposit Release & Utility Bill Settlement":
      "Settle utility charges",
  },
  contractor: {
    "Tenancy Platform Onboarding::Set Up Systems Required for Works and Setup":
      "Apply for access",
    "Pre-Kickoff::Kickoff Documents Gathered & Shared": "Get pack by email",
    "Pre-Kickoff::High-Level Design Review": "Get design clearance",
    "Pre-Kickoff::Confirmation of Meeting Attendees": "Attend when invited",
    "Kickoff::Requirements & Plan Alignment": "Confirm site rules",
    "Post-Kickoff::Onboarding Guidelines Shared": "Create loading-bay access",
    "Post-Kickoff::Confirm Fire Safety Submission Route": "Ask which applies",
    "Design Review::Confirmation of Renovation Plans": "Get written approval",
    "Permit Application::Permit Advisory & Tenancy Project Selection":
      "Select Tenancy Project",
    "Permit Application::Joint Site Inspection": "Book the inspection",
    "Permit Application::Submit Combined Permit To Work Application":
      "Submit renovation permits",
    "Permit Application::Qualified Person Endorsed Letter of Undertaking":
      "Email QP letter",
    "Permit Application::Multi-Party Review by Changi Airport Group Stakeholders":
      "Get renovation permits",
    "Permit Application::Requests / Permissions Outside OneCalendar":
      "Email extra permissions",
    "Handover::Site Walkthrough, Technical Verification & Handover Sign Off":
      "Walk the unit",
    "Renovation::Integrated Facilities Management Pre-Renovation Briefing":
      "Attend the briefing",
    "Renovation::Airport Passes & Hoarding Installation": "Get airport passes",
    "Renovation::Temporary Power Request": "Ask for power",
    "Renovation::FSSD Notice of Approval Submission": "Submit FSSD notice",
    "Renovation::QP Assessment: FSC / MAA / Temporary Fire Permit":
      "Ask which applies",
    "Renovation::Renovation Works & Site Monitoring": "Do the works",
    "Renovation::Waterproofing Checks & Water Ponding Test": "Do ponding tests",
    "Renovation::Fire Safety Tests Verification": "Do fire tests",
    "Renovation::Ceiling Inspection Sign-Off": "Do ceiling inspection",
    "Renovation::Public Announcement System Testing": "Do PA tests",
    "Renovation::Aircon Balancing Test Report": "Submit balancing report",
    "Renovation::Kitchen Fire Suppression System Test": "Do kitchen test",
    "Renovation::Gas Leak Test": "Do leak test",
    "Renovation::Total Gas Flooding System Test": "Do flooding test",
    "Renovation::As-Built Drawings Upload": "Upload as-built drawings",
    "Renovation::Defects Rectification": "Fix the defects",
    "Renovation::Fire Safety Certificate / MAA / Temporary Fire Permit Submission":
      "Get fire certificates",
    "Renovation::Pre-Opening Inspection": "Attend opening inspection",
    "Opening::Store Opening & Capex Verification": "Fix flagged defects",
    "Reinstatement::Unit Documents Gathered & Shared": "Use reinstatement pack",
    "Reinstatement::Reinstatement Requirements & Plan Alignment":
      "Attend reinstatement meeting",
    "Reinstatement::Reinstatement Permit Submission via OneCalendar":
      "Submit reinstatement permit",
    "Reinstatement::Multi-Party Review by Changi Airport Group Stakeholders":
      "Get the permit",
    "Reinstatement::Pre-Reinstatement Works": "Install hoarding first",
    "Reinstatement::Structured Cabling Disconnection (Terminal 3)":
      "Disconnect T3 cabling",
    "Reinstatement::Reinstatement Works": "Do reinstatement works",
    "Reinstatement::Pre-Takeover Inspection": "Fix the defects",
  },
  officer: {
    "Tenancy Platform Onboarding::Set Up Systems Required for Works and Setup":
      "Create unit records",
    "Tenancy Platform Onboarding::Set Up Systems Required for Staff":
      "Remind tenant staff",
    "Tenancy Platform Onboarding::Set Up WebEpic Account": "Remind about WebEpic",
    "Tenancy Platform Onboarding::Point of Sales Setup": "Link NEC setup",
    "Pre-Kickoff::Kickoff Documents Gathered & Shared": "Email the pack",
    "Pre-Kickoff::Check Change of Use with URA": "Check with URA",
    "Pre-Kickoff::High-Level Design Review": "Send to Design",
    "Pre-Kickoff::Confirmation of Meeting Attendees": "Confirm attendees",
    "Kickoff::Requirements & Plan Alignment": "Introduce the room",
    "Post-Kickoff::Onboarding Guidelines Shared": "Send follow-up email",
    "Post-Kickoff::Confirm Fire Safety Submission Route": "Confirm fire route",
    "Design Review::Confirmation of Renovation Plans": "Share design pack",
    "Permit Application::Permit Advisory & Tenancy Project Selection":
      "Tell which permits apply",
    "Permit Application::Joint Site Inspection": "Check inspection booked",
    "Permit Application::Submit Combined Permit To Work Application":
      "Endorse in OneCalendar",
    "Permit Application::Qualified Person Endorsed Letter of Undertaking":
      "Get QP letter",
    "Permit Application::Multi-Party Review by Changi Airport Group Stakeholders":
      "Review renovation pack",
    "Permit Application::Requests / Permissions Outside OneCalendar":
      "Check extra permissions",
    "Handover::Site Walkthrough, Technical Verification & Handover Sign Off":
      "Schedule handover walk",
    "Renovation::Integrated Facilities Management Pre-Renovation Briefing":
      "Check IFM briefed",
    "Renovation::Airport Passes & Hoarding Installation": "Check passes ready",
    "Renovation::Temporary Power Request": "Check temporary power",
    "Renovation::FSSD Notice of Approval Submission": "Check FSSD notice",
    "Renovation::QP Assessment: FSC / MAA / Temporary Fire Permit":
      "Check fire route",
    "Renovation::Renovation Works & Site Monitoring": "Monitor renovation progress",
    "Renovation::Waterproofing Checks & Water Ponding Test":
      "Check waterproofing tests",
    "Renovation::Fire Safety Tests Verification": "Check fire tests",
    "Renovation::Ceiling Inspection Sign-Off": "Check ceiling inspection",
    "Renovation::Public Announcement System Testing": "Check PA tests",
    "Renovation::Aircon Balancing Test Report": "Check balancing report",
    "Renovation::Kitchen Fire Suppression System Test": "Check kitchen test",
    "Renovation::Gas Leak Test": "Check leak test",
    "Renovation::Total Gas Flooding System Test": "Check flooding test",
    "Renovation::As-Built Drawings Upload": "Check as-built drawings",
    "Renovation::Defects Rectification": "Check defects fixed",
    "Renovation::Fire Safety Certificate / MAA / Temporary Fire Permit Submission":
      "Check fire certificates",
    "Renovation::Pre-Opening Inspection": "Schedule opening inspection",
    "Renovation::Opening Announcement & Directory Update": "Notify unit opening",
    "Opening::Opening Document Submission": "Request opening documents",
    "Opening::FSSD Notice of Approval Submission": "Check FSSD notice",
    "Opening::Store Opening & Capex Verification": "Send opening notice",
    "Opening::Point of Sales Data Reporting": "Pull sales summary",
    "Opening::TOPAZ Account Setup": "Create TOPAZ account",
    "Operations::Regular Servicing Reporting": "Check service reports",
    "Operations::Pest Control Reporting": "Check pest report",
    "Operations::Air Handling Unit Servicing Reporting": "Check aircon reports",
    "Operations::Annual Fire Safety Declaration & Training":
      "Check yearly declaration",
    "Operations::Monthly Sales Declaration": "Check monthly sales",
    "Reinstatement::Unit Documents Gathered & Shared": "Compile reinstatement pack",
    "Reinstatement::Reinstatement Requirements & Plan Alignment":
      "Schedule reinstatement meeting",
    "Reinstatement::Reinstatement Permit Submission via OneCalendar":
      "Check reinstatement permit",
    "Reinstatement::Multi-Party Review by Changi Airport Group Stakeholders":
      "Check permit issued",
    "Reinstatement::Pre-Reinstatement Works": "Update store directory",
    "Reinstatement::Point of Sales Removal": "Check POS removal",
    "Reinstatement::Structured Cabling Disconnection (Terminal 3)":
      "Check cabling disconnected",
    "Reinstatement::Reinstatement Works": "Monitor reinstatement progress",
    "Reinstatement::Pre-Takeover Inspection": "Schedule pre-takeover inspection",
    "Reinstatement::Takeover Meeting": "Get signed form",
    "Reinstatement::Post-Takeover Closure Announcement": "Send closure notice",
    "Reinstatement::Security Deposit Release & Utility Bill Settlement":
      "Start deposit release",
  },
};

export function cardLead(
  role: Role,
  stageName: string,
  stepName: string,
): string | undefined {
  return LEADS[role][`${stageName}::${stepName}`];
}

const tenant: Record<string, LifeSgCard> = {
  "Tenancy Platform Onboarding::Set Up Systems Required for Works and Setup": {
    subheader: ["Approve unit access in OneCalendar when asked."],
  },
  "Tenancy Platform Onboarding::Set Up Systems Required for Staff": {
    subheader: ["Register front-of-house staff in the ONE Changi App."],
  },
  "Tenancy Platform Onboarding::Set Up WebEpic Account": {
    subheader: ["Apply for your WebEpic account."],
    hideOnlyIf: true,
  },
  "Tenancy Platform Onboarding::Point of Sales Setup": {
    subheader: ["Get point of sale setup from NEC."],
    hideOnlyIf: true,
  },
  "Pre-Kickoff::Kickoff Documents Gathered & Shared": {
    subheader: [
      "Get drawings and the provision list from your Project Officer.",
    ],
  },
  "Pre-Kickoff::Check Change of Use with URA": {
    subheader: ["Get the Change of Use check from URA."],
    hideOnlyIf: true,
  },
  "Pre-Kickoff::High-Level Design Review": {
    subheader: [
      "Send a first design concept to your Project Officer.",
      "Get Design Management feedback before locking drawings.",
    ],
  },
  "Pre-Kickoff::Confirmation of Meeting Attendees": {
    subheader: [
      "Go to the first site meeting when invited.",
      "Bring consultant, contractor, and pack drawings.",
      "Get planned works from your contractor.",
      "Ask IFM which extra permissions you need.",
    ],
  },
  "Kickoff::Requirements & Plan Alignment": {
    subheader: [
      "Present renovation plans at the first site meeting.",
      "Measure the unit for renovation planning.",
      "Leave with a list of next actions.",
    ],
  },
  "Post-Kickoff::Onboarding Guidelines Shared": {
    subheader: ["Send store directory details to your Project Officer."],
  },
  "Post-Kickoff::Confirm Fire Safety Submission Route": {
    subheader: ["Confirm the fire permit route with your Qualified Person."],
  },
  "Design Review::Confirmation of Renovation Plans": {
    subheader: [
      "Send one design pack to your Project Officer.",
      "Revise the pack using Design Management comments.",
      "Get written design approval before permits.",
    ],
  },
  "Permit Application::Permit Advisory & Tenancy Project Selection": {
    subheader: ["Check your contractor started permits in OneCalendar."],
    hideOnlyIf: true,
  },
  "Permit Application::Joint Site Inspection": {
    subheader: ["Check your contractor booked the site inspection."],
    hideOnlyIf: true,
  },
  "Permit Application::Submit Combined Permit To Work Application": {
    subheader: ["Get renovation permits in OneCalendar before works start."],
    hideOnlyIf: true,
  },
  "Permit Application::Qualified Person Endorsed Letter of Undertaking": {
    subheader: ["Get the QP letter before permit review."],
    hideOnlyIf: true,
  },
  "Permit Application::Multi-Party Review by Changi Airport Group Stakeholders":
    {
      subheader: ["Get renovation permits in OneCalendar after review."],
    },
  "Permit Application::Requests / Permissions Outside OneCalendar": {
    subheader: ["Email IFM for permissions named at KickOff meeting."],
    hideOnlyIf: true,
  },
  "Handover::Site Walkthrough, Technical Verification & Handover Sign Off": {
    subheader: [
      "Walk the unit with IFM at handover.",
      "Collect the unit keys.",
      "Sign the handover form.",
    ],
  },
  "Renovation::Integrated Facilities Management Pre-Renovation Briefing": {
    subheader: ["Get the IFM briefing date before works start."],
    hideOnlyIf: true,
  },
  "Renovation::Airport Passes & Hoarding Installation": {
    subheader: ["Get airport passes and hoarding from your contractor."],
    hideOnlyIf: true,
  },
  "Renovation::Temporary Power Request": {
    subheader: ["Get temporary power from IFM if needed."],
    hideOnlyIf: true,
  },
  "Renovation::FSSD Notice of Approval Submission": {
    subheader: ["Get the FSSD notice in OneCalendar."],
    hideOnlyIf: true,
  },
  "Renovation::QP Assessment: FSC / MAA / Temporary Fire Permit": {
    subheader: ["Get the fire permit route from your Qualified Person."],
    hideOnlyIf: true,
  },
  "Renovation::Renovation Works & Site Monitoring": {
    subheader: ["Check the works finish under the permit."],
    hideOnlyIf: true,
  },
  "Renovation::Waterproofing Checks & Water Ponding Test": {
    subheader: ["Get waterproofing test results from IFM."],
    hideOnlyIf: true,
  },
  "Renovation::Fire Safety Tests Verification": {
    subheader: ["Get fire safety test results from AES."],
    hideOnlyIf: true,
  },
  "Renovation::Ceiling Inspection Sign-Off": {
    subheader: ["Get the ceiling inspection sign-off from IFM."],
    hideOnlyIf: true,
  },
  "Renovation::Public Announcement System Testing": {
    subheader: ["Get public announcement test results from AES."],
    hideOnlyIf: true,
  },
  "Renovation::Aircon Balancing Test Report": {
    subheader: ["Get the aircon balancing test report."],
    hideOnlyIf: true,
  },
  "Renovation::Kitchen Fire Suppression System Test": {
    subheader: ["Get the kitchen fire test result from AES."],
    hideOnlyIf: true,
  },
  "Renovation::Gas Leak Test": {
    subheader: ["Get the gas leak test result from AES."],
    hideOnlyIf: true,
  },
  "Renovation::Total Gas Flooding System Test": {
    subheader: ["Get the gas flooding test result from AES."],
    hideOnlyIf: true,
  },
  "Renovation::As-Built Drawings Upload": {
    subheader: [],
    hideOnlyIf: true,
  },
  "Renovation::Defects Rectification": {
    subheader: ["Get defects fixed before you open."],
    hideOnlyIf: true,
  },
  "Renovation::Fire Safety Certificate / MAA / Temporary Fire Permit Submission":
    {
      subheader: ["Submit the fire certificate that applies."],
    },
  "Renovation::Pre-Opening Inspection": {
    subheader: ["Attend pre-opening inspection with IFM and AES."],
  },
  "Renovation::Opening Announcement & Directory Update": {
    subheader: ["Get the store listing from your Project Officer."],
    hideOnlyIf: true,
  },
  "Opening::Opening Document Submission": {
    subheader: [
      "Submit as-built drawings to IFM.",
      "Submit the Certificate of Fitness in TOPAZ.",
    ],
  },
  "Opening::FSSD Notice of Approval Submission": {
    subheader: ["Submit the FSSD notice in OneCalendar."],
  },
  "Opening::Store Opening & Capex Verification": {
    subheader: [
      "Send your renovation invoice to your Project Officer.",
      "Fix defects from IFM comments before opening.",
    ],
  },
  "Opening::Point of Sales Data Reporting": {
    subheader: ["Get the sales summary from CAG."],
    hideOnlyIf: true,
  },
  "Opening::TOPAZ Account Setup": {
    subheader: ["Get your TOPAZ account from your Project Officer."],
    hideOnlyIf: true,
  },
  "Operations::Regular Servicing Reporting": {
    subheader: ["Lodge service reports in TOPAZ on schedule."],
  },
  "Operations::Pest Control Reporting": {
    subheader: ["Submit your pest control report in TOPAZ."],
  },
  "Operations::Air Handling Unit Servicing Reporting": {
    subheader: ["Submit your air handling report in TOPAZ."],
  },
  "Operations::Annual Fire Safety Declaration & Training": {
    subheader: ["Complete AES fire training and yearly declaration."],
  },
  "Operations::Monthly Sales Declaration": {
    subheader: ["Submit monthly sales in the Lease Management System."],
  },
  "Reinstatement::Unit Documents Gathered & Shared": {
    subheader: ["Get the reinstatement pack by email from your Project Officer."],
  },
  "Reinstatement::Reinstatement Requirements & Plan Alignment": {
    subheader: [
      "Go to the reinstatement meeting.",
      "Confirm strip-out scope with IFM.",
    ],
  },
  "Reinstatement::Reinstatement Permit Submission via OneCalendar": {
    subheader: ["Get the reinstatement permit in OneCalendar."],
    hideOnlyIf: true,
  },
  "Reinstatement::Multi-Party Review by Changi Airport Group Stakeholders": {
    subheader: ["Get the permit in OneCalendar after review."],
    hideOnlyIf: true,
  },
  "Reinstatement::Pre-Reinstatement Works": {
    subheader: ["Get directory and closure notices."],
    hideOnlyIf: true,
  },
  "Reinstatement::Point of Sales Removal": {
    subheader: ["Get point of sale removed with NEC."],
    hideOnlyIf: true,
  },
  "Reinstatement::Structured Cabling Disconnection (Terminal 3)": {
    subheader: ["Get structured cabling disconnected on Terminal 3."],
    hideOnlyIf: true,
  },
  "Reinstatement::Reinstatement Works": {
    subheader: ["Get reinstatement works finished under the permit."],
    hideOnlyIf: true,
  },
  "Reinstatement::Pre-Takeover Inspection": {
    subheader: [
      "Walk the pre-takeover inspection with IFM.",
      "Fix reinstatement defects before takeover.",
    ],
  },
  "Reinstatement::Takeover Meeting": {
    subheader: [
      "Hand the premises back to IFM.",
      "Sign the takeover form.",
    ],
  },
  "Reinstatement::Post-Takeover Closure Announcement": {
    subheader: ["Get the store closure notice."],
    hideOnlyIf: true,
  },
  "Reinstatement::Security Deposit Release & Utility Bill Settlement": {
    subheader: ["Settle utility charges when Finance asks."],
  },
};

const contractor: Record<string, LifeSgCard> = {
  "Tenancy Platform Onboarding::Set Up Systems Required for Works and Setup": {
    subheader: [
      "Create your OneCalendar account.",
      "Apply for terminal and unit access in OneCalendar.",
      "Get unit access approval from the tenant.",
    ],
  },
  "Pre-Kickoff::Kickoff Documents Gathered & Shared": {
    subheader: ["Get drawings and the provision list from your Project Officer."],
  },
  "Pre-Kickoff::High-Level Design Review": {
    subheader: ["Get Design Management clearance before locking drawings."],
  },
  "Pre-Kickoff::Confirmation of Meeting Attendees": {
    subheader: [
      "Go to the first site meeting when invited.",
      "Bring tenant, consultant, and pack drawings.",
      "Ask IFM and AES which permits you need.",
      "Confirm planned works before you go on site.",
    ],
  },
  "Kickoff::Requirements & Plan Alignment": {
    subheader: [
      "Be at the first site meeting with the tenant.",
      "Confirm site rules and permits for this unit.",
      "Measure the unit for renovation planning.",
      "Leave with a list of next actions.",
    ],
  },
  "Post-Kickoff::Onboarding Guidelines Shared": {
    subheader: ["Create loading-bay access after the KickOff meeting."],
  },
  "Post-Kickoff::Confirm Fire Safety Submission Route": {
    subheader: ["Ask your Qualified Person which fire permit applies."],
  },
  "Design Review::Confirmation of Renovation Plans": {
    subheader: ["Get written design approval before permits."],
    hideOnlyIf: true,
  },
  "Permit Application::Permit Advisory & Tenancy Project Selection": {
    subheader: [
      "Ask your Project Officer for the agreed KickOff permits.",
      "Select Tenancy Project in OneCalendar.",
      "Fill Tenancy Project details in OneCalendar.",
    ],
  },
  "Permit Application::Joint Site Inspection": {
    subheader: [
      "Book the site inspection in OneCalendar.",
      "Note fire isolation needs during inspection.",
    ],
  },
  "Permit Application::Submit Combined Permit To Work Application": {
    subheader: [
      "Submit renovation permits together in OneCalendar.",
      "Get pack endorsement in OneCalendar first.",
    ],
  },
  "Permit Application::Qualified Person Endorsed Letter of Undertaking": {
    subheader: ["Email the QP letter before permit review."],
  },
  "Permit Application::Multi-Party Review by Changi Airport Group Stakeholders":
    {
      subheader: [
        "Get pack endorsement before other reviews.",
        "Get renovation permits in OneCalendar after review.",
        "Update OneCalendar files from review comments.",
      ],
    },
  "Permit Application::Requests / Permissions Outside OneCalendar": {
    subheader: ["Email IFM for permissions named at KickOff meeting."],
    hideOnlyIf: true,
  },
  "Handover::Site Walkthrough, Technical Verification & Handover Sign Off": {
    subheader: ["Walk the unit with IFM when invited."],
  },
  "Renovation::Integrated Facilities Management Pre-Renovation Briefing": {
    subheader: ["Attend the IFM briefing before works start."],
  },
  "Renovation::Airport Passes & Hoarding Installation": {
    subheader: [
      "Get airport passes for your work team.",
      "Install hoarding before main works start.",
    ],
  },
  "Renovation::Temporary Power Request": {
    subheader: ["Ask IFM for temporary power if needed."],
  },
  "Renovation::FSSD Notice of Approval Submission": {
    subheader: ["Submit the FSSD notice in OneCalendar."],
  },
  "Renovation::QP Assessment: FSC / MAA / Temporary Fire Permit": {
    subheader: ["Ask your Qualified Person which fire permit applies."],
  },
  "Renovation::Renovation Works & Site Monitoring": {
    subheader: ["Do the works under your Permit to Work."],
  },
  "Renovation::Waterproofing Checks & Water Ponding Test": {
    subheader: ["Do waterproofing and ponding tests with IFM."],
  },
  "Renovation::Fire Safety Tests Verification": {
    subheader: ["Do fire safety tests with AES."],
  },
  "Renovation::Ceiling Inspection Sign-Off": {
    subheader: ["Do the ceiling inspection with IFM."],
  },
  "Renovation::Public Announcement System Testing": {
    subheader: ["Do public announcement tests with AES."],
  },
  "Renovation::Aircon Balancing Test Report": {
    subheader: ["Submit the aircon balancing test report."],
  },
  "Renovation::Kitchen Fire Suppression System Test": {
    subheader: ["Do the kitchen fire test with AES."],
  },
  "Renovation::Gas Leak Test": {
    subheader: ["Do the gas leak test with AES."],
  },
  "Renovation::Total Gas Flooding System Test": {
    subheader: ["Do the gas flooding test with AES."],
  },
  "Renovation::As-Built Drawings Upload": {
    subheader: [],
  },
  "Renovation::Defects Rectification": {
    subheader: ["Fix defects CAG raises before opening."],
  },
  "Renovation::Fire Safety Certificate / MAA / Temporary Fire Permit Submission":
    {
      subheader: ["Get fire certificates from the tenant."],
    },
  "Renovation::Pre-Opening Inspection": {
    subheader: ["Attend pre-opening inspection with IFM and AES."],
  },
  "Opening::Store Opening & Capex Verification": {
    subheader: ["Fix defects from IFM comments before opening."],
  },
  "Reinstatement::Unit Documents Gathered & Shared": {
    subheader: [
      "Get the reinstatement pack by email from your Project Officer.",
      "Use the reinstatement pack, not fit-out drawings.",
    ],
  },
  "Reinstatement::Reinstatement Requirements & Plan Alignment": {
    subheader: [
      "Go to the reinstatement meeting.",
      "Confirm strip-out scope with IFM.",
    ],
  },
  "Reinstatement::Reinstatement Permit Submission via OneCalendar": {
    subheader: ["Submit the reinstatement permit in OneCalendar."],
  },
  "Reinstatement::Multi-Party Review by Changi Airport Group Stakeholders": {
    subheader: [
      "Get the permit in OneCalendar after review.",
      "Update OneCalendar files from review comments.",
    ],
  },
  "Reinstatement::Pre-Reinstatement Works": {
    subheader: ["Install hoarding before reinstatement works start."],
  },
  "Reinstatement::Structured Cabling Disconnection (Terminal 3)": {
    subheader: ["Disconnect structured cabling on Terminal 3."],
  },
  "Reinstatement::Reinstatement Works": {
    subheader: ["Do reinstatement works under your Permit to Work."],
  },
  "Reinstatement::Pre-Takeover Inspection": {
    subheader: ["Fix reinstatement defects before takeover."],
  },
};

const officer: Record<string, LifeSgCard> = {
  "Tenancy Platform Onboarding::Set Up Systems Required for Works and Setup": {
    subheader: [
      "Create tenant, brand, and outlet records in OneCalendar.",
      "Approve contractor terminal access in OneCalendar.",
    ],
  },
  "Tenancy Platform Onboarding::Set Up Systems Required for Staff": {
    subheader: ["Remind tenant to register staff in ONE Changi App."],
  },
  "Tenancy Platform Onboarding::Set Up WebEpic Account": {
    subheader: ["Remind tenant to apply for WebEpic."],
  },
  "Tenancy Platform Onboarding::Point of Sales Setup": {
    subheader: ["Link NEC for point of sale setup."],
  },
  "Pre-Kickoff::Kickoff Documents Gathered & Shared": {
    subheader: [
      "Ask division reps for Newforma drawings.",
      "Ask Airport Planning for the provision list.",
      "Email drawings and the provision list after you receive them.",
    ],
  },
  "Pre-Kickoff::Check Change of Use with URA": {
    subheader: ["Check Change of Use with URA."],
  },
  "Pre-Kickoff::High-Level Design Review": {
    subheader: [
      "Send the first design concept to Design Management.",
      "Share Design Management feedback with the tenant.",
    ],
  },
  "Pre-Kickoff::Confirmation of Meeting Attendees": {
    subheader: [
      "Confirm first site meeting details with attendees.",
      "Confirm attendees with Airport Planning and Leasing.",
      "Read contractor planned works before KickOff meeting.",
    ],
  },
  "Kickoff::Requirements & Plan Alignment": {
    subheader: [
      "Introduce the room at the first site meeting.",
      "Name extra IFM permissions in the room.",
      "Note agreed permits from the KickOff meeting.",
    ],
  },
  "Post-Kickoff::Onboarding Guidelines Shared": {
    subheader: [
      "Send one email after the first site meeting.",
      "Name extra IFM permissions in that email.",
      "Set up staff access to the unit.",
      "Remind contractor to create loading-bay access.",
      "Ask tenant for store directory details.",
      "Start Changi Rewards and iShopChangi onboarding.",
    ],
  },
  "Post-Kickoff::Confirm Fire Safety Submission Route": {
    subheader: ["Confirm which fire permit the Qualified Person named."],
  },
  "Design Review::Confirmation of Renovation Plans": {
    subheader: [
      "Share the design pack with Design Management.",
      "Send Design Management comments to the tenant.",
      "Confirm written design approval with the tenant.",
    ],
  },
  "Permit Application::Permit Advisory & Tenancy Project Selection": {
    subheader: ["Tell the contractor the permits you recorded."],
  },
  "Permit Application::Joint Site Inspection": {
    subheader: ["Check the site inspection is booked before fire permits."],
  },
  "Permit Application::Submit Combined Permit To Work Application": {
    subheader: [
      "Check the renovation permit pack is complete.",
      "Endorse the pack in OneCalendar first.",
    ],
  },
  "Permit Application::Qualified Person Endorsed Letter of Undertaking": {
    subheader: ["Get the QP letter before permit review."],
  },
  "Permit Application::Multi-Party Review by Changi Airport Group Stakeholders":
    {
      subheader: [
        "Check the pack is endorsed in OneCalendar.",
        "Confirm design approval before other reviews.",
        "Review renovation permits with BMC, AES, and IFM.",
      ],
    },
  "Permit Application::Requests / Permissions Outside OneCalendar": {
    subheader: ["Check contractor emailed IFM the named permissions."],
    hideOnlyIf: true,
  },
  "Handover::Site Walkthrough, Technical Verification & Handover Sign Off": {
    subheader: [
      "Schedule the handover walk with IFM.",
      "Get unit keys from the Key Management System.",
    ],
  },
  "Renovation::Integrated Facilities Management Pre-Renovation Briefing": {
    subheader: ["Check IFM briefed the contractor."],
    hideOnlyIf: true,
  },
  "Renovation::Airport Passes & Hoarding Installation": {
    subheader: ["Check airport passes and hoarding are ready."],
    hideOnlyIf: true,
  },
  "Renovation::Temporary Power Request": {
    subheader: ["Check IFM turned on temporary power."],
    hideOnlyIf: true,
  },
  "Renovation::FSSD Notice of Approval Submission": {
    subheader: ["Check the FSSD notice in OneCalendar."],
    hideOnlyIf: true,
  },
  "Renovation::QP Assessment: FSC / MAA / Temporary Fire Permit": {
    subheader: ["Check the Qualified Person confirmed the fire route."],
    hideOnlyIf: true,
  },
  "Renovation::Renovation Works & Site Monitoring": {
    subheader: [
      "Monitor renovation progress.",
      "Issue a Stop Work Order if works break the rules.",
    ],
  },
  "Renovation::Waterproofing Checks & Water Ponding Test": {
    subheader: ["Check waterproofing tests with IFM."],
    hideOnlyIf: true,
  },
  "Renovation::Fire Safety Tests Verification": {
    subheader: [
      "Tell AES when fire tests are ready.",
      "Share the signed inspection checklist with IFM.",
    ],
  },
  "Renovation::Ceiling Inspection Sign-Off": {
    subheader: ["Check the ceiling inspection with IFM."],
    hideOnlyIf: true,
  },
  "Renovation::Public Announcement System Testing": {
    subheader: ["Check public announcement tests are done."],
    hideOnlyIf: true,
  },
  "Renovation::Aircon Balancing Test Report": {
    subheader: ["Check the aircon balancing test report."],
    hideOnlyIf: true,
  },
  "Renovation::Kitchen Fire Suppression System Test": {
    subheader: ["Check the kitchen fire test with AES."],
    hideOnlyIf: true,
  },
  "Renovation::Gas Leak Test": {
    subheader: ["Check the gas leak test with AES."],
    hideOnlyIf: true,
  },
  "Renovation::Total Gas Flooding System Test": {
    subheader: ["Check the gas flooding test with AES."],
    hideOnlyIf: true,
  },
  "Renovation::As-Built Drawings Upload": {
    subheader: [],
    hideOnlyIf: true,
  },
  "Renovation::Defects Rectification": {
    subheader: ["Check works defects are fixed."],
    hideOnlyIf: true,
  },
  "Renovation::Fire Safety Certificate / MAA / Temporary Fire Permit Submission":
    {
      subheader: ["Check AES reviewed the fire certificates."],
      hideOnlyIf: true,
    },
  "Renovation::Pre-Opening Inspection": {
    subheader: ["Schedule pre-opening inspection with IFM and AES."],
  },
  "Renovation::Opening Announcement & Directory Update": {
    subheader: [
      "Notify CAG that the unit is opening.",
      "Update the store directory before opening.",
    ],
  },
  "Opening::Opening Document Submission": {
    subheader: ["Request opening documents from the tenant."],
  },
  "Opening::FSSD Notice of Approval Submission": {
    subheader: ["Check the tenant FSSD notice in OneCalendar."],
    hideOnlyIf: true,
  },
  "Opening::Store Opening & Capex Verification": {
    subheader: [
      "Send the store opening notice to stakeholders.",
      "Check the renovation invoice from the tenant.",
      "Check capex commitment is met.",
    ],
  },
  "Opening::Point of Sales Data Reporting": {
    subheader: [
      "Pull sales from Customer Discovery Insights.",
      "Send the sales summary to stakeholders.",
    ],
  },
  "Opening::TOPAZ Account Setup": {
    subheader: ["Create the tenant TOPAZ account."],
  },
  "Operations::Regular Servicing Reporting": {
    subheader: ["Check IFM approved service reports in TOPAZ."],
    hideOnlyIf: true,
  },
  "Operations::Pest Control Reporting": {
    subheader: ["Check the tenant pest control report in TOPAZ."],
    hideOnlyIf: true,
  },
  "Operations::Air Handling Unit Servicing Reporting": {
    subheader: ["Check the tenant air handling report in TOPAZ."],
    hideOnlyIf: true,
  },
  "Operations::Annual Fire Safety Declaration & Training": {
    subheader: ["Check AES tracked the yearly fire declaration."],
    hideOnlyIf: true,
  },
  "Operations::Monthly Sales Declaration": {
    subheader: ["Check monthly sales in the Lease Management System."],
    hideOnlyIf: true,
  },
  "Reinstatement::Unit Documents Gathered & Shared": {
    subheader: [
      "Ask division reps for Newforma drawings.",
      "Email the reinstatement pack after you receive them.",
      "Check key status in the Key Management System.",
    ],
  },
  "Reinstatement::Reinstatement Requirements & Plan Alignment": {
    subheader: [
      "Schedule the reinstatement meeting.",
      "Link incoming and outgoing tenants when handover applies.",
    ],
  },
  "Reinstatement::Reinstatement Permit Submission via OneCalendar": {
    subheader: ["Check the reinstatement permit in OneCalendar."],
    hideOnlyIf: true,
  },
  "Reinstatement::Multi-Party Review by Changi Airport Group Stakeholders": {
    subheader: ["Check IFM and AES issued the permit."],
    hideOnlyIf: true,
  },
  "Reinstatement::Pre-Reinstatement Works": {
    subheader: [
      "Update the store directory with closure.",
      "Notify stakeholders of the store closure.",
    ],
  },
  "Reinstatement::Point of Sales Removal": {
    subheader: ["Stay copied on point of sale removal with NEC."],
  },
  "Reinstatement::Structured Cabling Disconnection (Terminal 3)": {
    subheader: ["Check structured cabling is disconnected."],
    hideOnlyIf: true,
  },
  "Reinstatement::Reinstatement Works": {
    subheader: [
      "Monitor reinstatement progress.",
      "Issue a Stop Work Order if works break the rules.",
    ],
  },
  "Reinstatement::Pre-Takeover Inspection": {
    subheader: ["Schedule the pre-takeover inspection with IFM."],
  },
  "Reinstatement::Takeover Meeting": {
    subheader: ["Get a copy of the signed takeover form."],
  },
  "Reinstatement::Post-Takeover Closure Announcement": {
    subheader: ["Send the store closure notice to stakeholders."],
  },
  "Reinstatement::Security Deposit Release & Utility Bill Settlement": {
    subheader: ["Start security deposit release with Finance."],
  },
};

const BY_ROLE: Record<Role, Record<string, LifeSgCard>> = {
  tenant,
  contractor,
  officer,
};

export function lifeSgCard(
  role: Role,
  stageName: string,
  stepName: string,
): LifeSgCard | undefined {
  return BY_ROLE[role][`${stageName}::${stepName}`];
}
