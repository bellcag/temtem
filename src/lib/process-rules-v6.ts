/**
 * Process v6 — role-aware renovation rules + sourced timings.
 * Source: CAG Renovation Requirements Jun 2026 v2.0 (RR) only.
 * Blueprint steps stay in tenancy-data.ts.
 *
 * Timing kinds: lead (apply/notify by), window (when work may happen).
 * Do not invent CAG review, mailbox, or wait SLAs.
 */

import type { Role } from "@/lib/app-state";
import { DOCUMENTS, type DocItem, type Unit } from "@/lib/tenancy-data";
import { docsForStep, tagAppliesToUnit } from "@/lib/process-guide";

export type RuleKind = "must" | "must-not" | "submit";
export type TimingKind = "lead" | "window";
export type TimingBinds = "tenant" | "contractor" | "officer" | "cag";
export type RoleCopy = Partial<Record<Role, string>>;

export type GuideRule = {
  cite: string;
  kind: RuleKind;
  text: string | RoleCopy;
  workIf?: string;
  tag?: string;
  roles?: Role[];
  /** Surface on the card before the collapsed “more” list. */
  pin?: boolean;
};

export type GuideTiming = {
  kind: TimingKind;
  duration: string;
  binds: TimingBinds;
  cite: string;
  text: string | RoleCopy;
  workIf?: string;
  tag?: string;
  roles?: Role[];
};

function r(
  cite: string,
  kind: RuleKind,
  text: string | RoleCopy,
  extra?: Pick<GuideRule, "workIf" | "tag" | "roles" | "pin">,
): GuideRule {
  return { cite, kind, text, ...extra };
}

function t(
  kind: TimingKind,
  duration: string,
  binds: TimingBinds,
  cite: string,
  text: string | RoleCopy,
  extra?: Pick<GuideTiming, "workIf" | "tag" | "roles">,
): GuideTiming {
  return { kind, duration, binds, cite, text, ...extra };
}

export function copyForRole(value: string | RoleCopy, role: Role): string {
  if (typeof value === "string") return value;
  return value[role] ?? value.tenant ?? value.contractor ?? value.officer ?? "";
}

export function bindLabel(binds: TimingBinds, role: Role): string {
  if (binds === "cag") return "CAG";
  if (binds === role) return "You";
  if (binds === "tenant") return "Tenant";
  if (binds === "contractor") return "Contractor";
  return "Project Officer";
}

export const STEP_TIMINGS: Record<string, GuideTiming[]> = {
  "Permit Application::Permit Selection & Document Preparation by Tenant/Contractor": [
    t(
      "lead",
      "2 weeks before works start",
      "contractor",
      "RR 3.1(iii)",
      {
        tenant: "Works Permit in OneCalendar.",
        contractor: "Works Permit in OneCalendar.",
        officer:
          "Check the start date against this lead time before you endorse the pack. Two weeks is the applicant’s duty — not a CAG review SLA.",
      },
    ),
    t(
      "lead",
      "3 days before Skytrain works",
      "contractor",
      "RR 5.15(v)",
      {
        tenant:
          "Within 6 m of Skytrain. Attach risk assessment, method statement and collapse-zone analysis.",
        contractor:
          "Skytrain Permit to Work online. Attach risk assessment, method statement and collapse-zone analysis if lifting or using heavy plant. Display the approved permit on site.",
        officer:
          "Skytrain PTW, no storage under the guideway. Point them to CAG Engineering Skytrain Maintenance if they are unsure of the 6 m line.",
      },
      { workIf: "works near Skytrain" },
    ),
    t(
      "lead",
      "5 working days before cabling works",
      "contractor",
      "RR 5.10(xi)",
      {
        tenant:
          "Work-request form with approved Works Permit and A3 shop drawings.",
        contractor:
          "T3 STC work-request form, with the approved Works Permit and two A3 shop drawings plus method statement.",
        officer:
          "STC connection request. Cabling contractor is the tenant’s, not yours to arrange.",
      },
      { tag: "Terminal 3 (", workIf: "T3 structured cabling" },
    ),
  ],

  "Permit Application::Permit Selection & Supporting Document Submission": [
    t(
      "lead",
      "14 working days before isolation",
      "contractor",
      "RR 5.4.2 / 5.9.10",
      {
        tenant:
          "Your contractor applies for fire-alarm isolation or sprinkler draining in OneCalendar at least 14 working days before work. For genuine urgency, call AES HQ 6541 2535 (office) or Fire Station 1 6541 2526 (after hours). Do not call your Project Officer for this.",
        contractor:
          "Submit isolation / sprinkler-drain in OneCalendar at least 14 working days before work. Attach the fire-sprinkler floor plan. For genuine urgency call AES HQ 6541 2535 (office) or Fire Station 1 6541 2526 (after hours).",
        officer:
          "Brief: isolation ≥14 working days in OneCalendar. You cannot shorten AES’s lead time. Urgent calls go to AES HQ / Fire Station 1, not COM.",
      },
      { workIf: "fire alarm isolation or sprinkler drain" },
    ),
    t(
      "lead",
      "7 working days before hot work",
      "contractor",
      "RR 5.9.10(ii)",
      {
        tenant:
          "Your contractor applies for the Hot Work Permit in OneCalendar at least seven working days before welding, cutting or grinding. For genuine urgency, call AES HQ 6541 2535 (office) or Fire Station 1 6541 2526 (after hours).",
        contractor:
          "Apply for Hot Work in OneCalendar at least seven working days before start. A trained fire patroller must cover each 15 m radius. For genuine urgency call AES HQ 6541 2535 (office) or Fire Station 1 6541 2526 (after hours).",
        officer:
          "Brief: Hot Work ≥7 working days. Fire patroller on site. You do not issue this permit — AES does.",
      },
      { workIf: "hot work" },
    ),
  ],

  "Renovation::Renovation Works": [
    t(
      "window",
      "01:00–05:00 noisy work",
      "contractor",
      "RR 3.2.21",
      {
        tenant:
          "Noisy or dusty work (hacking, drilling, demolition) is only allowed from 01:00 to 05:00. CAG can stop the works at once if you work outside those hours.",
        contractor:
          "Noisy or dusty work is only allowed from 01:00 to 05:00. If you work outside those hours, CAG can stop the job and take away the Works Permit.",
        officer:
          "Brief: noisy/dusty 01:00–05:00 only. If a tenant asks to ‘just start earlier’, the answer is already in this guide.",
      },
    ),
    t(
      "lead",
      "3 days before noisy work",
      "contractor",
      "RR 3.2.21",
      {
        tenant:
          "Your contractor must tell CAG at least three days before noisy or dusty work.",
        contractor:
          "Inform CAG at least three days before noisy or dusty work.",
        officer:
          "Brief: 3 days’ notice for noisy/dusty work — not a same-day ask.",
      },
    ),
    t(
      "window",
      "09:00–16:30 weekdays",
      "contractor",
      "RR 5.4(x)",
      {
        tenant:
          "Fire-protection isolation or discharge is only allowed from 09:00 to 17:00, Monday to Friday. Sprinklers in the unit must be charged and working again by 16:30.",
        contractor:
          "Isolate or discharge fire protection only from 09:00 to 17:00, Monday to Friday. Charge the sprinklers back by 16:30.",
        officer:
          "Brief: fire-system isolation window is weekday office hours, back in service by 1630. Not a night job.",
      },
      { workIf: "fire alarm isolation or sprinkler drain" },
    ),
    t(
      "lead",
      "7 working days before sprinkler A&A",
      "contractor",
      "RR 5.4(ix)",
      {
        tenant:
          "CAG and AES need seven working days’ written notice of fire-sprinkler A&A works.",
        contractor:
          "Give CAG and AES seven working days’ written notice before fire-sprinkler A&A works.",
        officer:
          "Brief: sprinkler A&A notice is 7 working days to AES — not a COM email the day before.",
      },
      { workIf: "sprinkler A&A" },
    ),
    t(
      "lead",
      "2 weeks before gas install",
      "contractor",
      "RR 5.5(xiii)",
      {
        tenant:
          "Gas installation needs two weeks’ notice to CAG, plus City Energy inspection. Connection that affects existing supply is only 00:01–05:00.",
        contractor:
          "Give CAG two weeks’ notice of gas installation and arrange City Energy inspection. If existing supply is affected, connect only 00:01–05:00.",
        officer:
          "Brief F&B: gas works need two weeks’ notice to CAG and City Energy — you do not book City Energy for them.",
      },
      { tag: "Need Gas", workIf: "gas" },
    ),
    t(
      "lead",
      "2 days before gas turn-on",
      "contractor",
      "RR 5.5(v)",
      {
        tenant:
          "Submit the Certificate of Responsibility for the gas installation at least two days before turn-on.",
        contractor:
          "Submit the Certificate of Responsibility for the Gas Installation After Turn-On at least two days before turn-on. Copy CAG.",
        officer:
          "Brief: gas turn-on certificate ≥2 days ahead. City Energy, not COM, turns on gas.",
      },
      { tag: "Need Gas", workIf: "gas" },
    ),
  ],

  "Renovation::Pre-Opening Checks and Certifications": [
    t(
      "lead",
      "3 weeks after completion",
      "contractor",
      "RR 3.5.4",
      {
        tenant:
          "Your contractor uploads complete as-built drawings (BIM, architectural, structural and M&E) to CP83 through OneCalendar within three weeks of completion.",
        contractor:
          "Upload complete as-builts (BIM, architectural, structural and M&E) in OneCalendar under As-built drawing within three weeks of completion. Hard copy and CAD on request.",
        officer:
          "Brief: as-builts within three weeks of completion — not opening week. You do not draft these.",
      },
    ),
    t(
      "lead",
      "3 days before opening",
      "contractor",
      "RR 5.9.8(i)",
      {
        tenant:
          "A joint fire-safety inspection must happen at least three days before completion, opening or re-opening. If it fails, the unit stays closed until AES is satisfied.",
        contractor:
          "Arrange the AES joint site inspection at least three days before completion or opening. Failed fire-safety items keep the unit closed.",
        officer:
          "Brief: fire inspection ≥3 days before opening. You cannot waive a fail — AES can keep the unit closed.",
      },
    ),
    t(
      "lead",
      "5 working days before supply turn-on",
      "contractor",
      "RR 6.10.3",
      {
        tenant:
          "If a smart meter is moved, email CAG’s meter vendor (spdtenantcare@spgroup.com.sg) at least five working days before supply turn-on for testing and commissioning. Your LEW or licensed plumber verifies first.",
        contractor:
          "After LEW or licensed plumber verification, email spdtenantcare@spgroup.com.sg at least five working days before supply turn-on for meter testing and commissioning.",
        officer:
          "Brief T1–T3: smart-meter commissioning is the vendor at spdtenantcare@spgroup.com.sg, ≥5 working days, not a COM booking.",
      },
      { tag: "T1, T2, T3", workIf: "smart meter relocated" },
    ),
    t(
      "lead",
      "1 day after power on",
      "contractor",
      "RR 5.1",
      {
        tenant:
          "Your Licensed Electrical Worker scans the temporary distribution board at least one day after power is turned on, and signs the result.",
        contractor:
          "Thermal-scan the temporary distribution board at least one day after power turn-on. The Licensed Electrical Worker must sign the result.",
        officer:
          "Brief: thermal scan of the TDB is the day after turn-on, signed by the LEW.",
      },
      { workIf: "electrical works", roles: ["contractor", "officer", "tenant"] },
    ),
  ],

  "Operations::Regular Servicing Reporting": [
    t(
      "lead",
      "3 working days to replace",
      "tenant",
      "RR 3.5.3 / 5.13",
      {
        tenant:
          "Replace failed lighting in the unit within three working days.",
        contractor:
          "If you are still on the defects list, failed lighting in the unit must be replaced within three working days.",
        officer:
          "Brief: lighting failure is a three-working-day make-good — not a TOPAZ ticket you chase for them unless they are stuck.",
      },
    ),
  ],

  "Reinstatement::Permit Submission via OneCal 3.0": [
    t(
      "lead",
      "2 weeks before strip-out",
      "contractor",
      "RR 1.1 / 3.1(iii)",
      {
        tenant:
          "Reinstatement needs its own Works Permit about two weeks before strip-out starts.",
        contractor:
          "Apply for the reinstatement Works Permit about two weeks before strip-out.",
        officer:
          "Brief: reinstatement is a new permit, same ~2-week lead — not a continuation of the fit-out permit.",
      },
    ),
  ],

  "Reinstatement::Reinstatement Works": [
    t(
      "window",
      "01:00–05:00 noisy work",
      "contractor",
      "RR 3.2.21",
      {
        tenant:
          "Noisy or dusty strip-out is still only 01:00–05:00, with at least three days’ notice to CAG.",
        contractor:
          "Noisy or dusty strip-out is still only allowed 01:00–05:00. Tell CAG at least three days ahead.",
        officer:
          "Brief: reinstatement noisy hours are the same 01:00–05:00 rule.",
      },
    ),
  ],

  "Reinstatement::Takeover Meeting": [
    t(
      "lead",
      "5 working days before handover",
      "contractor",
      "RR 5.10(xviii)",
      {
        tenant:
          "For T3, your contractor submits the STC disconnect request at least five working days before the handover inspection, with the reinstatement Works Permit and as-built drawings.",
        contractor:
          "Submit the T3 STC disconnect request at least five working days before the handover inspection, with the reinstatement Works Permit and as-builts. Remove telephone points, the BT box, voice cabling and supports.",
        officer:
          "Brief T3 outgoing: STC disconnect ≥5 working days before handover — otherwise voice patching will not be facilitated.",
      },
      { tag: "Terminal 3 (", workIf: "T3 structured cabling" },
    ),
  ],
};

export const STEP_RULES: Record<string, GuideRule[]> = {
  "Tenancy Platform Onboarding::Set Up Systems Required for Works and Setup": [
    r("RR 1.1", "must", {
      tenant:
        "Do not start renovation, refurbishment or alteration works until a Works Permit is approved in OneCalendar. Your contractor applies; you approve their unit access when the request arrives.",
      contractor:
        "Do not start renovation, refurbishment or alteration works until a Works Permit is approved in OneCalendar. Create your account, apply for terminal then unit access, then apply for the Works Permit. The tenant remains the Applicant.",
      officer:
        "Create Tenant, Brand and Outlet records first so the contractor can apply. You approve terminal access; the tenant approves unit access. Do not start a verbal walkthrough of OneCalendar if this card already names the order.",
    }),
  ],

  "Pre-Kickoff::Kickoff Documents Gathered & Shared": [
    r("RR 1.4", "must", {
      tenant:
        "Read the Renovation Requirements together with the Tenancy Design Guidelines and the provision list for this unit — they are one package, not optional extras.",
      contractor:
        "The kickoff pack is the Renovation Requirements, Tenancy Design Guidelines and this unit’s provision list. Design and method statements must follow that pack, not the previous tenant’s fit-out.",
      officer:
        "Compile Base Build, M&E, provision list and Renovation Requirements before the walk. Ask IFM to confirm the provision list against what is actually on site. This pack is what you brief from — not a live Q&A of the 158-page PDF.",
    }),
    r(
      "RR 3.6.11",
      "must",
      "CAG drawings in the kickoff pack may not show the true as-built condition. The consultant or Professional Engineer must verify them on site before design is locked.",
    ),
    r("RR 3.6.3", "submit", {
      tenant:
        "An Information Request Form is needed if you or your consultant need more drawings or unit information from CAG.",
      contractor:
        "If further drawings are needed, the tenant’s consultant files an Information Request Form. Do not start from a previous job’s CAD.",
      officer:
        "If they need more drawings, the Information Request Form is the path — not an ad-hoc email chain you assemble from Newforma in the meeting.",
    }),
  ],

  "Pre-Kickoff::High-Level Design Review": [
    r(
      "RR 3.6.5",
      "submit",
      "Before a detailed design meeting, upload the architectural layout, sections and elevations in OneCalendar (CAD, PDF and Revit where used).",
    ),
    r(
      "RR 3.6.6",
      "submit",
      "Shops, restaurants and CIP lounges need coloured perspective drawings of the proposed works.",
    ),
  ],

  "Pre-Kickoff::Confirmation of Meeting Attendees": [
    r("RR 3.1(i)", "must", {
      tenant:
        "Attend the kickoff meeting your Project Officer arranges. Bring your consultant and contractor if you can. Facility Management and Engineering & Development may also attend. Use this session to ask about the unit, work procedures and airport rules.",
      contractor:
        "Attend kickoff with the tenant and their consultant. Use it to confirm work procedures, permits and site rules for this unit. Come with the drawings already in hand — this meeting is not a first look.",
      officer:
        "Invite tenant, consultant, contractor, IFM and AES as needed. You facilitate; you do not re-read the Renovation Requirements aloud. Point them at the Rules and Timing on each later step.",
    }),
    r("RR 3.1(ii)", "must", {
      tenant:
        "Bring drawings and perspectives that already follow the Renovation Requirements. Do not arrive expecting CAG to brief a unit with no drawings.",
      contractor:
        "Bring the drawings and perspectives already aligned to the Renovation Requirements so IFM and AES can brief against them.",
      officer:
        "If they arrive without drawings, reschedule rather than turning kickoff into a blank-site tour.",
    }),
  ],

  "Kickoff::Requirements & Plan Alignment": [
    r("RR 1.2", "must", {
      tenant:
        "Appoint a consultant architect or Professional Engineer to take overall charge of the works. They must follow all applicable Singapore laws and agency codes (including BCA, URA and CAAS).",
      contractor:
        "The tenant’s appointed architect or Professional Engineer stays in charge of the works. You do not replace that Qualified Person.",
      officer:
        "Confirm an architect or PE is appointed before design lock. You do not appoint them.",
    }),
    r("RR 1.3", "must", {
      tenant:
        "Only BCA-registered contractors of the right discipline may modify Mechanical & Electrical systems.",
      contractor:
        "You may only modify Mechanical & Electrical systems if you are BCA-registered in the right discipline. If you are not, engage a registered specialist for that work.",
      officer:
        "Brief: M&E is BCA-registered contractors only. Spot-check the name against the blacklist (RR 1.26) before they engage.",
    }),
    r("RR 1.7", "must", {
      tenant:
        "Works can only go ahead with a qualified site supervisor on site full-time. Give CAG that person’s name and contact details.",
      contractor:
        "Provide CAG the full-time qualified site supervisor’s name and contact before works start. That person is on site whenever works run.",
      officer:
        "Collect the site supervisor contact at kickoff so AES and IFM do not call you for the name later.",
    }),
    r(
      "RR 1.11",
      "must-not",
      "Do not hack beams, columns or slabs, including drilling inserts through them.",
      { pin: true },
    ),
    r(
      "RR 1.6",
      "must-not",
      "Works must not extend into neighbouring units or into public and common areas such as toilets, stairs, corridors and lifts.",
    ),
    r(
      "RR 1.21",
      "must",
      "Terminals 1–4 have an Engineered Smoke Control system. Get a Letter of No Objection from a Fire Safety Engineer or Qualified Person confirming the design does not affect it — or get authority approval before changing it.",
    ),
    r(
      "RR 1.14",
      "submit",
      "If the intended use changes (for example shop to restaurant), the Qualified Person must check URA and apply for Change of Use where required.",
      { workIf: "change of use" },
    ),
    r(
      "RR 1.26",
      "must",
      {
        tenant:
          "Before you hire a contractor, check with your Project Officer that they are not on CAG’s blacklist. If you use a blacklisted contractor, CAG can take away the permit, stop works for 2–5 days, charge S$1,000–S$1,500, and add demerit points.",
        contractor:
          "You cannot take this job if you are on CAG’s blacklist. If you do, CAG can take away the permit, stop works for 2–5 days, charge S$1,000–S$1,500, and add demerit points (Appendix B).",
        officer:
          "Check the blacklist before the tenant signs a contractor. Quote Appendix B consequences from this card — you do not need to retrieve the PDF in the meeting.",
      },
      { pin: true },
    ),
    r("RR 5.9", "must", {
      tenant:
        "Your Qualified Person must confirm whether a Fire Safety Certificate, Minor Addition & Alteration, or Temporary Fire Permit is needed for this unit.",
      contractor:
        "Ask the Qualified Person whether a Fire Safety Certificate, Minor Addition & Alteration, or Temporary Fire Permit is needed, and confirm that before you programme opening. Do not leave this until the last minute.",
      officer:
        "Ask once, on this step: has the QP said FSC, MAA or TFP applies? File the answer; do not re-ask at pre-opening.",
    }),
  ],

  "Post-Kickoff::Onboarding Guidelines Shared": [
    r("RR 3.1(iii)", "must", {
      tenant:
        "Apply for the Works Permit about two weeks before works start. Keep the approved permit (and isolation / hot-work / STC permits) printed behind the hoarding door or on site.",
      contractor:
        "Apply for the Works Permit about two weeks before works start. Print the approved Works Permit and any Isolation, Hot Work or STC permits, and display them behind the hoarding door or on site.",
      officer:
        "Brief: two-week lead and permits on the hoarding door. That is the contractor’s display duty, not a COM print job.",
    }),
    r(
      "RR 1.17",
      "submit",
      "Send CAG a risk assessment for the works before they start.",
    ),
    r(
      "RR 1.15",
      "submit",
      "If Change of Use was required, forward URA Written Permission to CAG before works start.",
      { workIf: "change of use" },
    ),
    r(
      "RR 3.6.2",
      "must",
      "The architect or PE must obtain the fire strategy / FSER and FSSD-approved drawings for this terminal before they design.",
    ),
  ],

  "Design Review::Confirmation of Renovation Plans": [
    r("RR 3.6.5", "submit", {
      tenant:
        "Upload the architectural layout, sections and elevations to OneCalendar (CAD, PDF and Revit where used). Drawings are 1:50, with existing and proposed clearly shown.",
      contractor:
        "Help the consultant upload the architectural layout, sections and elevations to OneCalendar at 1:50, with existing and proposed clearly shown (CAD, PDF and Revit where used).",
      officer:
        "Reject incomplete packs rather than translating drawing lists verbally. The required set is on this card.",
    }),
    r(
      "RR 3.6.5",
      "submit",
      "The pack should also include drawings for sanitary and water, power and lighting, electrical single-line (kW per circuit and maximum demand), sprinklers and hose reels, fire alarm, air-con, floor trunking, mechanical services, and gas where it applies.",
    ),
    r(
      "RR 3.6.5(ix)",
      "submit",
      "Include drawings for kitchen ventilation, cooker hoods, gas leak detection and kitchen ducting.",
      { tag: "F&B", workIf: "kitchen" },
    ),
    r(
      "RR 3.6.6",
      "submit",
      "Submit coloured perspectives of the proposed shop or restaurant.",
    ),
    r(
      "RR 3.6.4",
      "submit",
      "If asked, submit a labelled material sample board of architectural finishes and colour schemes.",
    ),
    r(
      "RR 3.6.9–3.6.10",
      "must",
      "Mark proposed changes in colour on the plan: alterations in red, new work in black or blue, and deletions in yellow dotted lines. The architect or PE, and the licensed plumber or Licensed Electrical Worker, must endorse the drawings.",
    ),
    r(
      "RR 4.1.1",
      "must",
      "Survey the unit and the landlord shopfront, and design to those as-built dimensions. Shop-sign artwork, lighting (warm 3000K) and unit-number placement need CAG approval before fabrication. Do not alter the bulkhead without written approval.",
    ),
    r(
      "RR 3.1.1 / 8",
      "submit",
      "Submit a hoarding method statement and detail drawing with Structural Qualified Person certification, plus the graphic design for the hoarding faces.",
    ),
    r(
      "RR 3.7",
      "submit",
      "Submit a BIM model (proposed and later as-built) if the works remove or add full-height concrete or structural walls, or change M&E services outside the unit. Interior-only partitions, flooring, ceiling and lighting do not need BIM.",
      { workIf: "structural wall or M&E outside the unit" },
    ),
    r(
      "RR 10",
      "must",
      "Follow the Green Fit-Out Guidelines in the Renovation Requirements for materials, lighting and resource use.",
    ),
    r(
      "RR 6.1.9",
      "must",
      "Electrical drawings must carry a title block, company chop, and endorsement by a Licensed Electrical Worker of the right grade.",
      { workIf: "electrical works" },
    ),
    r(
      "RR 5.4(xvi)",
      "must",
      "The Professional Engineer (Mechanical) must endorse on the drawings whether the fire protection system is affected by the renovation.",
      { workIf: "fire protection affected" },
    ),
  ],

  "Permit Application::Permit Selection & Document Preparation by Tenant/Contractor": [
    r("RR 1.1 / 3.1(iii)", "must", {
      tenant:
        "Your contractor selects Tenancy Project in OneCalendar. Follow the approved Works Permit — you stay the Applicant.",
      contractor:
        "Select the Tenancy Project work type in OneCalendar. The tenant is the Applicant; you fill and supervise. Display approved permits on site.",
      officer:
        "Do not fill OneCalendar for them. Tenant = Applicant; contractor = submitter. If they pick the wrong work type, send them back to this step.",
    }),
    r("RR 1.18–1.23", "must", {
      tenant:
        "You are the Applicant, so workplace safety on site stays your responsibility even if the contractor runs the works.",
      contractor:
        "The tenant is the Applicant and stays responsible for Workplace Safety and Health on site (risk assessment, safe work procedures, Appendix D in-house rules). CAG is indemnified against claims from the works team’s acts or omissions.",
      officer:
        "The tenant is the Applicant for WSH — not you. Point them at Appendix D; do not take site safety on as a COM duty.",
    }),
    r("RR 3.1(iv)", "submit", {
      contractor:
        "You need a separate Ceiling permit before you open ceiling outside the unit (cables, pipes or ducting).",
      officer:
        "The contractor needs a separate Ceiling permit before they open ceiling outside the unit (cables, pipes or ducting). You do not file this.",
    }, { workIf: "ceiling works" }),
    r("RR 3.1(v)", "submit", {
      contractor:
        "Send CAG the statutory approvals. If you need to start before those approvals arrive, a Qualified Person must sign a letter of undertaking. Use an architect for building works, or a PE for M&E or civil and structural works.",
      officer:
        "The contractor files statutory approvals with CAG. If they need to start before those arrive, a Qualified Person must sign a letter of undertaking. You do not file this.",
    }),
    r("RR 5.15", "must", {
      tenant:
        "Do not store anything under the Skytrain guideway.",
      contractor:
        "Do not store anything under the Skytrain guideway.",
      officer:
        "No storage under the Skytrain guideway. You do not issue this permit.",
    }, { workIf: "works near Skytrain" }),
    r("RR 5.10", "must", {
      tenant:
        "Extra voice pairs need a written request to CAG.",
      contractor:
        "Ask CAG in writing if you need extra voice pairs.",
      officer:
        "Extra voice pairs need a written request to CAG. You do not arrange the cabling contractor.",
    }, { tag: "Terminal 3 (", workIf: "T3 structured cabling" }),
    r("RR App D", "must", {
      tenant:
        "The works team must acknowledge Workplace Safety and Health and in-house safety rules before work starts.",
      contractor:
        "Acknowledge Workplace Safety and Health and in-house safety rules before work starts.",
      officer:
        "The contractor must acknowledge Workplace Safety and Health and in-house safety rules before work starts. You do not collect this as a COM form.",
    }),
    r("RR 5.9", "must", {
      tenant:
        "Your contractor’s project manager must attend CAG’s Fire Alarm Briefing before isolation works.",
      contractor:
        "The contractor project manager must attend CAG’s Fire Alarm Briefing. Isolation in OneCalendar is still 14 working days in advance.",
      officer:
        "Brief: Fire Alarm Briefing is AES’s session for the contractor PM — you do not deliver it.",
    }),
  ],

  "Permit Application::Joint Site Inspection": [
    r("RR 3.2.16", "must", {
      tenant:
        "For ceiling works in common areas outside the unit, your contractor arranges joint inspection with Facility Management before, during and after, and signs the ceiling-condition checklist. If they skip this, they must repair any defects found later.",
      contractor:
        "For ceiling works in common areas outside the unit, arrange joint inspection with Facility Management before, during and after, and sign the ceiling-condition checklist. If you skip this, you must repair any defects found later.",
      officer:
        "For ceiling works in common areas, the contractor arranges joint inspection with Facility Management and signs the checklist. You do not run this inspection.",
    }, { workIf: "ceiling works" }),
    r("RR 3.2.18", "must", {
      tenant:
        "Roof works (for example CCTV conduits or condenser removal) also need joint inspection with Facility Management, plus authority approval and Auxiliary Police escort where required.",
      contractor:
        "Roof works (for example CCTV conduits or condenser removal) also need joint inspection with Facility Management, plus Appropriate Authority approval and Auxiliary Police escort where required.",
      officer:
        "Roof works also need joint inspection with Facility Management, plus authority approval and Auxiliary Police escort where required. The contractor arranges this — you do not.",
    }, { workIf: "roof works" }),
    r("RR 5.4.2(ii)", "must", {
      tenant:
        "Before fire-alarm isolation or sprinkler draining can be approved, a joint physical inspection with CAG’s M&E contractor must confirm the zone. Without this inspection, isolation will not be approved, even if the works are urgent.",
      contractor:
        "Book a joint site inspection with CAG’s M&E contractor and complete the JSI form. Isolation will not be approved without this physical check, even if the works are urgent.",
      officer:
        "Brief: isolation JSI is with the M&E contractor, not a COM walk. You cannot waive it for urgency (RR 5.4.2).",
    }, { workIf: "fire alarm isolation or sprinkler drain" }),
  ],

  "Permit Application::Permit Selection & Supporting Document Submission": [
    r(
      "RR 3.2.1",
      "must-not",
      "Do not start works until the Works Permit is issued. If the works could accidentally trigger fire alarms or sprinklers, wait until AES has also approved the isolation permit.",
    ),
    r(
      "RR 1.5",
      "submit",
      "Inspect the site and complete a risk assessment before works start. Tell CAG if the site does not match the drawings.",
    ),
    r(
      "RR 5.4.2(iii)",
      "submit",
      "Attach a copy of the fire-sprinkler drawing / floor plan with the online isolation application.",
      { workIf: "fire alarm isolation or sprinkler drain" },
    ),
  ],

  "Permit Application::Multi-Party Review by Changi Airport Group Stakeholders": [
    r("RR 1.26 / App B", "must", {
      tenant:
        "If reviewers ask for changes, your contractor submits the updated files in OneCalendar. If they ignore those comments, CAG can take away the permit, stop the works, charge a fee, or blacklist the contractor.",
      contractor:
        "If reviewers ask for changes, submit the updated files in OneCalendar. If you ignore those comments, CAG can take away the permit, stop the works, charge a fee, or blacklist you (Appendix B / C).",
      officer:
        "Do not quote a CAG review turnaround — it is not in the Renovation Requirements. Appendix B covers stop-work, charges and blacklisting if they ignore comments.",
    }),
    r(
      "RR 1.9",
      "must",
      "Works on site must match the drawings CAG approved. If you change the design without approval, review or later inspection can fail.",
    ),
  ],

  "Handover::Site Walkthrough, Technical Verification & Handover Sign Off": [
    r("RR 1.5", "must", {
      tenant:
        "Walk the unit and check it against the provision list and drawings. Tell CAG at once if site conditions differ — do not wait until design is locked.",
      contractor:
        "Walk the unit against the provision list. Report discrepancies to CAG before you mobilise. Do not assume landlord drawings are as-built.",
      officer:
        "Use the provision list on the walk. Discrepancies go on record at handover — not as a later COM complaint.",
    }),
    r(
      "RR 1.8",
      "must",
      "CAG may inspect the premises during renovation and through the lease without notice.",
    ),
  ],

  "Renovation::Integrated Facilities Management Pre-Renovation Briefing": [
    r("RR 3.1 / 3.2.1", "must", {
      tenant:
        "Works cannot start until IFM has briefed the works team, you have the Works Permit, and any required isolation permits are approved. If you skip this, CAG can cancel security passes.",
      contractor:
        "Do not start on site until IFM has briefed you, the Works Permit is issued, and any isolation or hot-work permits you need are approved. If you skip this, CAG can cancel security passes.",
      officer:
        "IFM runs this briefing. Your job is to make sure the contractor is in the room with permits in hand — not to restate hoarding rules IFM will cover.",
    }),
  ],

  "Renovation::Pre-Renovation Works": [
    r(
      "RR 2.1.2",
      "must",
      "Load and unload only at designated bays. Each delivery needs a valid renovation permit plus invoice or delivery order. CAG may restrict delivery hours.",
    ),
    r(
      "RR 2.1.3",
      "must",
      "Consult Aviation Security (and get authority approval) for restricted-area works, security equipment, non-staff access points, or changes to security boundaries.",
    ),
    r(
      "RR 2.5–2.6",
      "must",
      "T4 Transit works: everyone and all goods are screened. Register prohibited items with the Appropriate Authority, engage Auxiliary Police at your cost, and remove tools from transit at the end of each day.",
      { tag: "Terminal 4 only" },
    ),
    r(
      "RR App A",
      "must-not",
      "Do not bring unregistered prohibited items into the T4 Transit Area.",
      { tag: "Terminal 4 only" },
    ),
    r(
      "RR 3.1.1",
      "must",
      "Hoard the site before work starts. Confine all works inside the hoarding. Doors must slide or open inward. Submit PE-certified hoarding drawings and the graphic design first.",
    ),
    r(
      "RR 3.1.2",
      "must",
      "Hoarding must be non-combustible (for example gypsum board). File proof of non-combustibility with the permit.",
    ),
    r(
      "RR 3.1.1(ix) / 7",
      "must",
      "Protect the route and surrounding floor with plywood (at least 10 mm on 4 mm underlay) and 4 mm grey felt before any work. T4 recon marble needs 16 mm plywood.",
    ),
    r(
      "RR 3.1.1(xii)",
      "must-not",
      "Hoarding must not obstruct fire protection (for example fire curtains). If full-height hoarding is not possible, leave an opening so those systems still work.",
    ),
    r(
      "RR 1.12",
      "must-not",
      "Do not move goods in passenger lifts, escalators or travellators. Use cargo or service lifts, protected with CAG-approved covering.",
    ),
  ],

  "Renovation::Renovation Works": [
    r(
      "RR 3.2.1–3.2.2",
      "must",
      "Works can only go ahead with a CAG Works Permit, and with every proposed plan approved by CAG and the relevant authorities. Follow any conditions of approval.",
    ),
    r("RR 3.2.5", "must", {
      tenant:
        "Cutting, welding or grinding needs AES Hot Work Approval in OneCalendar. A qualified fire patroller must be on standby. You also pay AES service charges and transport for AES staff.",
      contractor:
        "Hot work needs AES approval in OneCalendar, a fire patroller who has passed the Fire Patroller Course, one extinguisher per 15 m radius, and AES service charges. No hot work while fire protection is isolated.",
      officer:
        "Brief: hot work is AES, not COM. Fire patroller coverage is 15 m per person. Isolation and hot work cannot run together (RR 5.4.2(iv)).",
    }, { workIf: "hot work" }),
    r(
      "RR 3.2.6",
      "must-not",
      "Do not store flammable liquids or cylinders in the airport. Bring them in for the day’s work and take them out the same day.",
    ),
    r(
      "RR 3.2.7 / 3.2.27",
      "must-not",
      "Do not affect fire protection or means of escape. In false ceilings, keep 300 mm clearance all round between services.",
    ),
    r(
      "RR 3.2.11–3.2.13",
      "must-not",
      "Do not use existing CAG tray or trunking for your installation, and do not tamper with CAG or government-agency services (including ICA and Customs).",
    ),
    r(
      "RR 3.2.21",
      "must",
      "Noisy or dusty work (hacking, drilling, demolition) is only allowed from 01:00 to 05:00. Tell CAG at least three days ahead. CAG can stop the works at once if you work outside those hours.",
    ),
    r(
      "RR 3.2.19 / 1.13",
      "must",
      "Remove debris from the airport daily. Neighbouring and public areas stay clear. High-volume debris needs an approved bulk bin with the Works Permit on it.",
    ),
    r(
      "RR 3.3",
      "must",
      "In F&B kitchens, prep areas and stores with ceiling boards, fit rust-free perimeter mesh (show a sample to IFM first). Screw metal floor traps down. Keep a pest-control operator on 24-hour call, and keep monthly reports on site.",
      { tag: "F&B" },
    ),
    r(
      "RR 3.4",
      "must",
      "Segregate waste in the unit. Engage a licensed contractor to remove renovation and toxic waste. F&B units need a tray-return or wash area and proper cooking-oil / food-waste arrangements.",
    ),
    r(
      "RR 5.5.1",
      "must",
      "Open-flame cooking and deep-frying need an approved kitchen fire suppression system, linked to the building fire alarm, with the manual and layout sent to AES.",
      { tag: "F&B", workIf: "open flame or deep frying" },
    ),
    r(
      "RR 5.5",
      "must-not",
      "Do not bring LPG cylinders into the airport. Gas work needs a Licensed Gas Service Worker and City Energy approval before you alter existing pipes.",
      { tag: "Need Gas", workIf: "gas" },
    ),
    r(
      "RR 1.27",
      "must",
      "Physical changes on the airfield or in baggage handling need an Airside Work Permit (Airfield or Baggage) and must follow Airport Operational and Safety Requirements.",
      { workIf: "airside infrastructure works" },
    ),
    r("RR 5.4.2(v)", "must", {
      tenant:
        "Your project manager or site supervisor must be present during draining and charging of the fire-protection system.",
      contractor:
        "The applicant’s project officer / site supervisor must be present during draining and charging. A fire-engine turnout caused by workers is charged to the tenant or contractor.",
      officer:
        "You do not need to stand on the drain-down. The tenant’s site supervisor does. Fire-engine turnout from negligence is charged to them (RR 5.4.2(vi)).",
    }, { workIf: "fire alarm isolation or sprinkler drain" }),
  ],

  "Renovation::Pre-Opening Checks and Certifications": [
    r(
      "RR 3.5.1–3.5.2",
      "must",
      "Repair all areas the works disturbed, at your cost. Arrange a joint inspection with CAG; fire protection will be checked so nothing is blocked.",
    ),
    r(
      "RR 3.5.4",
      "submit",
      "Submit complete as-built drawings (BIM, architectural, structural and M&E) to CP83, via OneCalendar, within three weeks of completion. Hard copy and CAD media on request.",
    ),
    r(
      "RR 3.5.5",
      "submit",
      "Before trading, name the City Energy–approved company that will maintain the gas supply and leak detection. Monthly reports go to CAG; yearly calibration to City Energy and CAG.",
      { tag: "Need Gas", workIf: "gas" },
    ),
    r(
      "RR 3.5.7 / 3.5.9",
      "must-not",
      "Do not increase electrical load without CAG’s written approval. If you change the electrical system illegally, CAG can cut the supply. CAG is not liable for lost business.",
    ),
    r(
      "RR 5.1.3",
      "submit",
      "Where it applies, the Licensed Electrical Worker must arrange a Certificate of Fitness for the electrical installation.",
    ),
    r(
      "RR 5.9",
      "submit",
      "Where the Qualified Person said they apply, have the Fire Safety Certificate, Minor Addition & Alteration approval, or Temporary Fire Permit in hand before opening.",
    ),
    r(
      "RR 5.9.8(ii)",
      "must",
      "If the joint fire-safety inspection fails, the unit stays closed until every failed item is fixed. Do not open on a verbal agreement.",
    ),
    r("RR 5.1", "submit", {
      tenant:
        "After Pre-Opening Inspection, the Licensed Electrical Worker’s signed records are due one week after POI. The LEW must attend the electrical supply turn-on in the switch room.",
      contractor:
        "Submit LEW-signed records one week after POI. The appointed LEW must attend electrical turn-on at the switch room.",
      officer:
        "Brief: LEW attends turn-on; signed records one week after POI. IFM books the turn-on date — you do not.",
    }, { workIf: "electrical works" }),
  ],

  "Opening::Document Submission": [
    r(
      "RR 1.10 / 3.5.4",
      "submit",
      "After opening, keep every drawing submitted to CAG updated. File as-builts (and BIM where required) in OneCalendar if they were not already in at pre-opening.",
    ),
    r(
      "RR 3.5.3",
      "must",
      "Maintain M&E systems in the unit. Replace failed lighting within three working days.",
    ),
  ],

  "Operations::Regular Servicing Reporting": [
    r(
      "RR 5.13",
      "must",
      "Maintain installations in your unit to CAG’s maintenance requirements and keep servicing evidence in TOPAZ.",
    ),
    r(
      "RR 3.3.6",
      "submit",
      "Keep monthly pest-control reports on site and available to CAG.",
      { tag: "F&B" },
    ),
    r(
      "RR 3.5.5",
      "submit",
      "Forward monthly gas-system maintenance reports to CAG and yearly calibration to City Energy and CAG.",
      { tag: "Need Gas" },
    ),
    r(
      "RR 6.10.2",
      "must-not",
      "Do not tamper with smart-meter seals, change the meter, or turn off utility supply without CAG approval. Keep the meters powered so the wireless network stays up.",
      { tag: "T1, T2, T3" },
    ),
  ],

  "Operations::Staff Reporting & Training": [
    r(
      "RR 5.9",
      "must",
      "Staff must complete the fire-safety training, quiz and declaration. AES checks this every year. If it is missing, AES can inspect and charge you.",
    ),
  ],

  "Reinstatement::Requirements & Plan Alignment": [
    r(
      "RR 3.5.6 / 5.1.19",
      "must",
      "Reinstate the unit to its original state if CAG requires it. Remove electrical fixtures, luminaires and cables installed for this tenancy, and return landlord equipment as found.",
    ),
    r(
      "RR 1.11",
      "must-not",
      "Do not hack beams, columns or slabs during reinstatement either.",
      { pin: true },
    ),
    r(
      "RR 1.26",
      "must",
      "Use a contractor who is not blacklisted. The same rules apply: CAG can stop the works, charge a fee, and add demerit points.",
      { pin: true },
    ),
  ],

  "Reinstatement::Permit Submission via OneCal 3.0": [
    r(
      "RR 1.1 / 3.1",
      "must",
      "Reinstatement needs its own Works Permit in OneCalendar, with method statement and safe work procedures, before any strip-out starts.",
    ),
  ],

  "Reinstatement::Pre-Reinstatement Works": [
    r(
      "RR 3.1.1 / 2",
      "must",
      "Hoard the unit and follow the same security, delivery-bay and floor-protection rules as for fit-out.",
    ),
  ],

  "Reinstatement::Reinstatement Works": [
    r(
      "RR 3.2",
      "must",
      "The same start rules apply: works need an approved permit, must not block fire systems, debris must leave the airport daily, and noisy work is only 01:00–05:00.",
    ),
  ],

  "Reinstatement::Pre-Takeover Inspection": [
    r(
      "RR 3.5.1–3.5.2",
      "must",
      "Repair defects from the inspection at your cost. Fire protection must be clear and unblocked before takeover.",
    ),
  ],

  "Reinstatement::Takeover Meeting": [
    r(
      "RR 3.5.6",
      "must",
      "Hand the premises and keys back once IFM accepts the reinstated unit.",
    ),
  ],
};

function visibleToRole<T extends { roles?: Role[]; tag?: string }>(
  item: T,
  role: Role,
  unit: Unit,
): boolean {
  if (!tagAppliesToUnit(item.tag, unit)) return false;
  if (item.roles && !item.roles.includes(role)) return false;
  return true;
}

/** Tenant sees constraints (must / must-not), not filing actions that read as their to-do. */
export function ruleIsActionForRole(rule: GuideRule, role: Role): boolean {
  if (role !== "tenant") return true;
  return rule.kind !== "submit";
}

export function rulesForStep(
  stageName: string,
  stepName: string,
  unit: Unit,
  role: Role,
): GuideRule[] {
  const list =
    STEP_RULES[`${stageName}::${stepName}`] ?? STEP_RULES[stepName] ?? [];
  return list.filter(
    (rule) => visibleToRole(rule, role, unit) && ruleIsActionForRole(rule, role),
  );
}

/**
 * Current catalogue names → RR timing rows (keys in STEP_TIMINGS).
 * v6/v7 still look up the original keys; v16 uses these remaps.
 */
const CATALOGUE_TIMING: Record<
  string,
  { sources: string[]; workIf?: string; generalOnly?: boolean; cites?: string[] }
> = {
  "Permit Application::Submit Combined Permit To Work Application": {
    sources: [
      "Permit Application::Permit Selection & Document Preparation by Tenant/Contractor",
    ],
    generalOnly: true,
  },
  "Permit Application::Skytrain Permit-To-Work": {
    sources: [
      "Permit Application::Permit Selection & Document Preparation by Tenant/Contractor",
    ],
    workIf: "works near Skytrain",
  },
  "Permit Application::Structured Cabling (T3 Tenant Telephone Lines) Permit": {
    sources: [
      "Permit Application::Permit Selection & Document Preparation by Tenant/Contractor",
    ],
    workIf: "T3 structured cabling",
  },
  "Permit Application::Fire Alarm Isolation / Sprinkler Draining Permit": {
    sources: [
      "Permit Application::Permit Selection & Supporting Document Submission",
    ],
    workIf: "fire alarm isolation or sprinkler drain",
  },
  "Permit Application::Hotwork Permit": {
    sources: [
      "Permit Application::Permit Selection & Supporting Document Submission",
    ],
    workIf: "hot work",
  },
  "Renovation::Renovation Works & Site Monitoring": {
    sources: ["Renovation::Renovation Works"],
  },
  "Renovation::As-Built Drawings Upload": {
    sources: ["Renovation::Pre-Opening Checks and Certifications"],
    cites: ["RR 3.5.4"],
  },
  "Renovation::Pre-Opening Inspection": {
    sources: ["Renovation::Pre-Opening Checks and Certifications"],
    cites: ["RR 5.9.8(i)", "RR 6.10.3", "RR 5.1"],
  },
  "Reinstatement::Reinstatement Permit Submission via OneCalendar": {
    sources: ["Reinstatement::Permit Submission via OneCal 3.0"],
  },
};

export function timingsForStep(
  stageName: string,
  stepName: string,
  unit: Unit,
  role: Role,
): GuideTiming[] {
  const key = `${stageName}::${stepName}`;
  const spec = CATALOGUE_TIMING[key];
  const list = spec
    ? spec.sources.flatMap((source) => STEP_TIMINGS[source] ?? []).filter((row) => {
        if (spec.workIf && row.workIf !== spec.workIf) return false;
        if (spec.generalOnly && row.workIf) return false;
        if (spec.cites && !spec.cites.includes(row.cite)) return false;
        return true;
      })
    : (STEP_TIMINGS[key] ?? STEP_TIMINGS[stepName] ?? []);
  return list.filter((row) => visibleToRole(row, role, unit));
}

export function groupRules(rules: GuideRule[]) {
  const general: GuideRule[] = [];
  const nested = new Map<string, GuideRule[]>();
  for (const rule of rules) {
    if (!rule.workIf) {
      general.push(rule);
      continue;
    }
    const bucket = nested.get(rule.workIf) ?? [];
    bucket.push(rule);
    nested.set(rule.workIf, bucket);
  }
  return { general, nested };
}

const PINNED_RULE_CAP = 3;

/** Three guidelines on the card; the rest sit behind “See more”. */
export function splitPinnedRules(rules: GuideRule[], cap = PINNED_RULE_CAP) {
  if (rules.length <= cap) {
    return { pinned: rules, more: [] as GuideRule[] };
  }
  const explicit = rules.filter((rule) => rule.pin);
  const mustNot = rules.filter((rule) => rule.kind === "must-not" && !rule.pin);
  const preferred = [...explicit, ...mustNot];
  const pinned =
    preferred.length > 0 ? preferred.slice(0, cap) : rules.slice(0, cap);
  const pinnedSet = new Set(pinned);
  return {
    pinned,
    more: rules.filter((rule) => !pinnedSet.has(rule)),
  };
}

export function groupTimings(rows: GuideTiming[]) {
  const general: GuideTiming[] = [];
  const nested = new Map<string, GuideTiming[]>();
  for (const row of rows) {
    if (!row.workIf) {
      general.push(row);
      continue;
    }
    const bucket = nested.get(row.workIf) ?? [];
    bucket.push(row);
    nested.set(row.workIf, bucket);
  }
  return { general, nested };
}

const RR_DOC: DocItem = {
  ...(DOCUMENTS.find((d) => d.id === "doc-renovation") as DocItem),
  name: "CAG Renovation Requirements (Jun 2026 v2.0)",
  version: "Jun 2026 v2.0",
  effective: "2026-06-09",
  updatedAt: "2026-06-09",
  status: "Updated",
  changelog:
    "Guide sourced from IFM Renovation Requirements Version 2.0 (Jun 2026), with role-specific timings.",
  phases: ["Setup", "Build", "Operate", "Exit"],
};

export function docsForStepV6(
  stepName: string,
  tenancyType: string,
  terminal: string,
  zone: string,
  stageName: string,
  _unit: Unit,
  _role: Role,
): DocItem[] {
  return docsForStep(stepName, tenancyType, terminal, zone, stageName).map(
    (d) => (d.id === "doc-renovation" ? RR_DOC : d),
  );
}
