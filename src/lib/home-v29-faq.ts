export type FaqItem = { q: string; a: string };
export type FaqSection = { id: string; title: string; detail: string; items: FaqItem[] };

/** Tenant FAQ. Facts only from the blueprint, Renovation Requirements, and the Oct 2025 Tenant-Contractor Kit. */
export const TENANCY_FAQ: FaqSection[] = [
  {
    id: "renovation",
    title: "Starting your renovation",
    detail: "The kick-off meeting, your drawings, and permission to start work.",
    items: [
      {
        q: "When is the kick-off?",
        a: "After you accept the tenancy, your Project Officer sets the meeting. Come with your consultant and contractor. The airport’s safety and facilities teams walk you through the unit. Bring drawings that already follow the Renovation Requirements.",
      },
      {
        q: "Where are the renovation rules?",
        a: "Open Renovation Requirements in Documents. Read them before you finalise the design.",
      },
      {
        q: "What do I submit before work starts?",
        a: "First, the early drawings: the design, furniture layout, shopfront, material samples, and hoarding. After those are approved, send the full architectural, mechanical, and electrical drawings in OneCalendar. Work can start only after the design is approved in writing.",
      },
    ],
  },
  {
    id: "handover",
    title: "Taking over the unit",
    detail: "Walk the unit, collect the keys, then put up the hoarding.",
    items: [
      {
        q: "How do I take the unit?",
        a: "You walk the unit, collect the keys, and sign the handover form. Then you get a briefing, and permission to start work.",
      },
      {
        q: "When does hoarding go up?",
        a: "After handover, and only in the design you already submitted. Work on site starts once the permits are approved.",
      },
      {
        q: "What happens before I open?",
        a: "The shop is inspected before you open. If it is in the secure part of the airport, staff and contractors need an airport pass. Appoint someone in your company to apply for those passes.",
      },
    ],
  },
  {
    id: "outlet",
    title: "Running the shop",
    detail: "Price tags, receipts, and shopping bags.",
    items: [
      {
        q: "What must the shop show?",
        a: "A price on every item, a receipt for every sale, and shopping bags printed with the Changi Airport logo.",
      },
    ],
  },
  {
    id: "sales",
    title: "Using the till",
    detail: "Changi’s till, and handwritten receipts if it stops.",
    items: [
      {
        q: "Which till do I use?",
        a: "Changi’s till, from the day you start selling. Tell your Changi officer who to contact, how many tills you need, and when to install them.",
      },
      {
        q: "What if the till is down?",
        a: "Write a receipt by hand, then enter those sales when the till is working again. Keep spare receipts in the shop.",
      },
    ],
  },
  {
    id: "service",
    title: "Training your staff",
    detail: "The courses staff take before they collect an airport pass.",
    items: [
      {
        q: "What courses do staff take?",
        a: "Before they collect an airport pass, frontline staff complete Re-Imagine the Changi Experience, then the Changi orientation or refresher course. The training is provided, and each course lasts two years.",
      },
    ],
  },
  {
    id: "pass",
    title: "Applying for passes",
    detail: "Who needs one to enter the secure part of the airport.",
    items: [
      {
        q: "Who needs an airport pass?",
        a: "Staff and contractors who enter the secure part of the airport. Appoint someone in your company to apply for the passes.",
      },
    ],
  },
  {
    id: "fire",
    title: "Declaring fire safety",
    detail: "The declaration you send for the shop each year.",
    items: [
      {
        q: "What do I send each year?",
        a: "A fire safety declaration for the shop.",
      },
    ],
  },
];

/** Contractor home links. Wording from the process steps this role carries out. */
export const CONTRACTOR_FAQ: FaqSection[] = [
  {
    id: "access",
    title: "Applying for access",
    detail: "Terminal and unit access in OneCalendar.",
    items: [
      {
        q: "What do I apply for?",
        a: "Create your account, then apply for terminal and unit access in OneCalendar. The tenant approves the unit.",
      },
    ],
  },
  {
    id: "kickoff",
    title: "Bringing drawings to KickOff",
    detail: "The first site meeting for this renovation.",
    items: [
      {
        q: "What do I bring?",
        a: "Go to KickOff when you receive the invite, and bring the drawings. Ask IFM and AES which permits you need.",
      },
    ],
  },
  {
    id: "design",
    title: "Waiting for design approval",
    detail: "Written approval before a renovation Permit to Work.",
    items: [
      {
        q: "When can a Permit to Work be filed?",
        a: "Wait for written approval of the design pack. The tenant sends that pack to the Project Officer.",
      },
    ],
  },
  {
    id: "screen",
    title: "Screening the files",
    detail: "The questionnaire and the pack for OneCalendar.",
    items: [
      {
        q: "What do I do with the pack?",
        a: "Finish the questionnaire, screen the files, then take the pack to OneCalendar.",
      },
    ],
  },
  {
    id: "briefing",
    title: "Attending the briefing",
    detail: "Site rules before this renovation starts.",
    items: [
      {
        q: "Who briefs the renovation team?",
        a: "Attend the IFM briefing on site rules before this renovation starts.",
      },
    ],
  },
  {
    id: "reinstatement",
    title: "Removing the fit-out",
    detail: "The reinstatement Permit to Work.",
    items: [
      {
        q: "What permit do I need to leave?",
        a: "Apply for the reinstatement Permit to Work in OneCalendar before you remove the fit-out. The Project Officer emails the reinstatement drawings.",
      },
    ],
  },
];

/** Project Officer home links. Wording from the process steps this role carries out. */
export const OFFICER_FAQ: FaqSection[] = [
  {
    id: "records",
    title: "Setting up the unit",
    detail: "Unit records before anyone applies for access.",
    items: [
      {
        q: "What do I set up first?",
        a: "Create the unit records in OneCalendar. The contractor then applies for access, and the tenant approves it when asked.",
      },
    ],
  },
  {
    id: "invite",
    title: "Confirming KickOff",
    detail: "Who must come to the first site meeting.",
    items: [
      {
        q: "Who needs the invite?",
        a: "Confirm who must come to KickOff, then send the invite. The tenant brings their consultant and contractor. The contractor brings the drawings.",
      },
    ],
  },
  {
    id: "design",
    title: "Checking the design pack",
    detail: "Written approval before a renovation Permit to Work.",
    items: [
      {
        q: "What arrives before a permit?",
        a: "The tenant sends one design pack. Design Management gives written approval before anyone files a renovation Permit to Work.",
      },
    ],
  },
  {
    id: "pack",
    title: "Reviewing a permit pack",
    detail: "The pack before it goes to OneCalendar.",
    items: [
      {
        q: "When do I look at the pack?",
        a: "Check the pack before the contractor takes it to OneCalendar. The home list shows which units are ready for a Permit to Work.",
      },
    ],
  },
  {
    id: "handover",
    title: "Walking the unit",
    detail: "Handover with IFM before renovation starts.",
    items: [
      {
        q: "What happens at handover?",
        a: "The tenant walks the unit with IFM, then signs and collects the keys. Invite the contractor if they should check the unit before work starts.",
      },
    ],
  },
  {
    id: "reinstatement",
    title: "Sending reinstatement drawings",
    detail: "The drawings for removing the fit-out.",
    items: [
      {
        q: "What do I send when the unit is leaving?",
        a: "Email the reinstatement pack to the tenant and contractor. Those drawings are a different set from the renovation. The contractor applies for the reinstatement Permit to Work.",
      },
    ],
  },
];

export function faqForRole(role: "tenant" | "contractor" | "officer"): FaqSection[] {
  if (role === "contractor") return CONTRACTOR_FAQ;
  if (role === "officer") return OFFICER_FAQ;
  return TENANCY_FAQ;
}

export const TENANCY_FAQ_SOURCE =
  "From the tenancy guide, Renovation Requirements, and the Tenant–Contractor Kit · October 2025";

/** Library row for the dummy Tenancy FAQ file. Slug matches the document list. */
export const TENANCY_FAQ_ID = "tenancy-faq";
export const TENANCY_FAQ_HREF = `/documents/${TENANCY_FAQ_ID}`;
