/** Tenancy Journey Steps from Latest Blueprint.xlsx. Questionnaire-gated steps stay on the backup tab. */
export type V40System = { label: string; href?: string };
export type V40Step = {
  no: number;
  phase: "SetUp" | "Build" | "Operate" | "Exit";
  stage: string;
  step: string;
  type: "Mandatory" | "Conditional";
  area: string;
  unitType: string;
  workScope: string;
  terminal: string;
  unitFeature: string;
  audience: string;
  areaWhy: string;
  unitTypeWhy: string;
  workScopeWhy: string;
  terminalWhy: string;
  unitFeatureWhy: string;
  audienceWhy: string;
  description: string[];
  people: string[];
  systems: V40System[];
  documents: string[];
  action: string;
  slaShow: string;
  sla: string;
};

export const V40_STEPS: V40Step[] = [
  {
    "no": 1,
    "phase": "SetUp",
    "stage": "Tenancy Platform Onboarding",
    "step": "Set Up Systems Required for Works and Setup",
    "type": "Mandatory",
    "area": "",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "",
    "areaWhy": "",
    "unitTypeWhy": "",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "",
    "description": [
      "Your Project Officer creates your tenant, brand and outlet records in OneCalendar — CAG's permit platform.",
      "Your contractor then creates their own OneCalendar account, applies for terminal access (approved by your Project Officer), and applies for unit access, which you approve in OneCalendar.",
      "No renovation paperwork can move until these accounts and accesses exist."
    ],
    "people": [
      "Tenant",
      "Project Officer",
      "Contractor"
    ],
    "systems": [
      {
        "label": "OneCalendar",
        "href": "https://one-calendar.changiairport.com/OneCalendar/Login"
      },
      {
        "label": "Access Control & Scheduling System (ACS)",
        "href": "https://www.cag-acs.com/cus-acs/performlogin"
      }
    ],
    "documents": [
      "CAG OneCalendar User Guide — Contractor",
      "Access Control & Scheduling System (ACS) Guide"
    ],
    "action": "",
    "slaShow": "",
    "sla": ""
  },
  {
    "no": 2,
    "phase": "SetUp",
    "stage": "Tenancy Platform Onboarding",
    "step": "Set Up Systems Required for Staff",
    "type": "Mandatory",
    "area": "Landside or Airside",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "",
    "areaWhy": "Only units fronting the terminal's public or transit areas have front-of-house staff serving travelling passengers, so QSM training applies to them.",
    "unitTypeWhy": "",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "",
    "description": [
      "Register your front-of-house staff for Quality Service Management (QSM) training on the ONE Changi App, guided by your Project Officer."
    ],
    "people": [
      "Tenant",
      "Project Officer"
    ],
    "systems": [
      {
        "label": "ONE Changi App (QSM training)"
      },
      {
        "label": "OneChangi Admin Portal",
        "href": "https://oca-cms.changiairport.com/login"
      }
    ],
    "documents": [
      "Template Email on Quality Service Management (QSM) Training"
    ],
    "action": "",
    "slaShow": "",
    "sla": ""
  },
  {
    "no": 3,
    "phase": "SetUp",
    "stage": "Tenancy Platform Onboarding",
    "step": "Set Up WebEpic Account",
    "type": "Conditional",
    "area": "Landside",
    "unitType": "Retail or F&B",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "",
    "areaWhy": "",
    "unitTypeWhy": "Only Retail and F&B tenants bill through CAG's electrical/sales system, so only they need a WebEpic account.",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "",
    "description": [
      "Your Project Officer will remind you to submit the WebEpic account creation form via the Enterprise Portal; you then apply for the account directly on WebEpic."
    ],
    "people": [
      "Tenant",
      "Project Officer"
    ],
    "systems": [
      {
        "label": "WebEpic",
        "href": "https://ccnwebepic.ccnexchange.com/epic/cagshome.htm"
      }
    ],
    "documents": [
      "Template Email on Electrical / WebEpic account creation form"
    ],
    "action": "",
    "slaShow": "",
    "sla": ""
  },
  {
    "no": 4,
    "phase": "SetUp",
    "stage": "Tenancy Platform Onboarding",
    "step": "Point of Sales Setup",
    "type": "Conditional",
    "area": "",
    "unitType": "Retail or F&B",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "",
    "areaWhy": "",
    "unitTypeWhy": "Only Retail and F&B units transact with customers, so only they need a POS system installed before Operate.",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "",
    "description": [
      "Your Project Officer links you with CAG's POS vendor to install the Point of Sales (POS) system in your unit.",
      "POS setup has its own track and must be ready before Operate."
    ],
    "people": [
      "Tenant",
      "Project Officer",
      "POS vendor"
    ],
    "systems": [],
    "documents": [
      "Template Email on Point of Sale (POS) Onboarding (Retail / F&B)"
    ],
    "action": "",
    "slaShow": "",
    "sla": ""
  },
  {
    "no": 5,
    "phase": "SetUp",
    "stage": "Tenancy Platform Onboarding",
    "step": "Access Control System account",
    "type": "Mandatory",
    "area": "",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "",
    "areaWhy": "",
    "unitTypeWhy": "",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "",
    "description": [
      "Your Project Officer creates your Access Control System account.",
      "You use it to approve supplier and contractor access.",
      "Your contractor needs their own account."
    ],
    "people": [
      "Tenant",
      "Project Officer",
      "Contractor"
    ],
    "systems": [],
    "documents": [
      "Access Control & Scheduling System (ACS) Guide for Basement Access"
    ],
    "action": "",
    "slaShow": "",
    "sla": ""
  },
  {
    "no": 6,
    "phase": "SetUp",
    "stage": "Tenancy Platform Onboarding",
    "step": "Airport Pass creation",
    "type": "Mandatory",
    "area": "",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "Officer only",
    "areaWhy": "",
    "unitTypeWhy": "",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "Internal CAG action — the Project Officer creates the Airport Pass, so the step is hidden from the tenant.",
    "description": [
      "Your Project Officer creates the Airport Pass."
    ],
    "people": [
      "Project Officer"
    ],
    "systems": [],
    "documents": [],
    "action": "",
    "slaShow": "",
    "sla": ""
  },
  {
    "no": 7,
    "phase": "SetUp",
    "stage": "Tenancy Platform Onboarding",
    "step": "Salesforce account creation",
    "type": "Mandatory",
    "area": "",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "",
    "areaWhy": "",
    "unitTypeWhy": "",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "",
    "description": [
      "Your Project Officer requests your Salesforce account, for feedback and staff declaration."
    ],
    "people": [
      "Tenant",
      "Project Officer"
    ],
    "systems": [],
    "documents": [],
    "action": "",
    "slaShow": "",
    "sla": ""
  },
  {
    "no": 8,
    "phase": "SetUp",
    "stage": "Tenancy Platform Onboarding",
    "step": "LMS account creation",
    "type": "Mandatory",
    "area": "",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "",
    "areaWhy": "",
    "unitTypeWhy": "",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "",
    "description": [
      "An LMS account is created for you."
    ],
    "people": [
      "Tenant",
      "Project Officer"
    ],
    "systems": [],
    "documents": [],
    "action": "",
    "slaShow": "",
    "sla": ""
  },
  {
    "no": 9,
    "phase": "SetUp",
    "stage": "Tenancy Platform Onboarding",
    "step": "TOPAZ account",
    "type": "Mandatory",
    "area": "",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "Officer only",
    "areaWhy": "",
    "unitTypeWhy": "",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "Internal CAG action — the Project Officer creates the TOPAZ account, so the step is hidden from the tenant.",
    "description": [
      "Your Project Officer creates the TOPAZ account for service reports."
    ],
    "people": [
      "Project Officer"
    ],
    "systems": [],
    "documents": [],
    "action": "",
    "slaShow": "",
    "sla": ""
  },
  {
    "no": 10,
    "phase": "SetUp",
    "stage": "Kickoff Meeting",
    "step": "Kickoff Documents Gathered & Shared",
    "type": "Mandatory",
    "area": "",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "",
    "areaWhy": "",
    "unitTypeWhy": "",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "",
    "description": [
      "Your Project Officer assembles your kickoff package: – the base building drawing (layout) and the provisions list – the list of submissions – OneCalendar access info – the Renovation Requirements – Joint Site Inspection requirements – Letter of No Objection and Fire Safety Certificate requirements – Singapore Food Agency licence requirements for F&B – basement loading bay booking info – the Tenant-Contractor Kit – the OneCalendar 3.0 guide",
      "Read the Renovation Requirements before the kickoff.",
      "The items in the package are all to be done after the kickoff meeting."
    ],
    "people": [
      "Tenant",
      "Project Officer"
    ],
    "systems": [
      {
        "label": "OneCalendar",
        "href": "https://one-calendar.changiairport.com/OneCalendar/Login"
      }
    ],
    "documents": [
      "Renovation Requirements",
      "Tenancy Design Guidelines",
      "Provision List",
      "Base Build Drawings",
      "M&E Drawings",
      "Tenant Contractor Kit",
      "CAG OneCalendar User Guide",
      "Joint Site Inspection (JSI) Form",
      "Letter of No Objection",
      "Fire Safety Certificate",
      "Singapore Food Agency Licence",
      "T1–T4 Basement Direction Guide"
    ],
    "action": "",
    "slaShow": "",
    "sla": ""
  },
  {
    "no": 11,
    "phase": "SetUp",
    "stage": "Kickoff Meeting",
    "step": "Check Change of Use with URA",
    "type": "Mandatory",
    "area": "",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "Officer only",
    "areaWhy": "",
    "unitTypeWhy": "",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "Internal CAG record of whether a URA Change of Use applies; tenants do not see this step.",
    "description": [
      "Record whether a URA Change of Use applies.",
      "This is internal CAG information.",
      "Tenants do not see this step."
    ],
    "people": [
      "Project Officer",
      "CAG Master Planning"
    ],
    "systems": [],
    "documents": [
      "Change of Use (COU)",
      "Renovation Requirements"
    ],
    "action": "",
    "slaShow": "",
    "sla": ""
  },
  {
    "no": 12,
    "phase": "SetUp",
    "stage": "Kickoff Meeting",
    "step": "Design Review (perspective / look & feel of outlet)",
    "type": "Mandatory",
    "area": "",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "Officer only",
    "areaWhy": "",
    "unitTypeWhy": "",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "Routing of the design concept to Design Management is handled by the Project Officer, not the tenant.",
    "description": [
      "Send the design concept — the perspective, the look and feel of the outlet — to your Project Officer by email only.",
      "Your Project Officer routes it to Design Management and returns their feedback to you before the kickoff."
    ],
    "people": [
      "Project Officer",
      "Design Management"
    ],
    "systems": [
      {
        "label": "OneCalendar",
        "href": "https://one-calendar.changiairport.com/OneCalendar/Login"
      }
    ],
    "documents": [
      "Perspectives Drawings",
      "Coloured Design perspectives (Unique features)",
      "2D/3D renderings"
    ],
    "action": "",
    "slaShow": "",
    "sla": ""
  },
  {
    "no": 13,
    "phase": "SetUp",
    "stage": "Kickoff Meeting",
    "step": "Who should attend the kickoff meeting?",
    "type": "Mandatory",
    "area": "",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "",
    "areaWhy": "",
    "unitTypeWhy": "",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "",
    "description": [
      "Confirm who should attend the kickoff meeting.",
      "Attend with your consultant and contractor.",
      "Airport Emergency & Safety (AES) and IFM brief the unit’s requirements, so come with drawings and perspectives, not a blank site."
    ],
    "people": [
      "Tenant",
      "Project Officer",
      "Consultant",
      "Contractor",
      "AES",
      "IFM"
    ],
    "systems": [],
    "documents": [],
    "action": "",
    "slaShow": "",
    "sla": ""
  },
  {
    "no": 14,
    "phase": "SetUp",
    "stage": "KickOff",
    "step": "Requirements & Plan Alignment",
    "type": "Mandatory",
    "area": "",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "",
    "areaWhy": "",
    "unitTypeWhy": "",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "",
    "description": [
      "At the kickoff meeting: – AES reviews fire-safety requirements for your premise type – your Project Officer introduces the stakeholders – you present your renovation intentions and preliminary store design – IFM explains the renovation and work-permit requirements to you and your contractor and answers onsite questions",
      "Take site measurements for your renovation planning.",
      "You leave with agreed actions recorded by your Project Officer."
    ],
    "people": [
      "Tenant",
      "Project Officer",
      "Contractor",
      "AES",
      "IFM"
    ],
    "systems": [],
    "documents": [
      "Renovation Requirements",
      "Provision List",
      "M&E Drawings",
      "Base Build Drawings"
    ],
    "action": "",
    "slaShow": "",
    "sla": ""
  },
  {
    "no": 15,
    "phase": "SetUp",
    "stage": "Post-KickOff",
    "step": "Onboarding Guidelines Shared",
    "type": "Mandatory",
    "area": "",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "",
    "areaWhy": "",
    "unitTypeWhy": "",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "",
    "description": [
      "Your Project Officer sends you one post-kickoff email with the consolidated requirements: – Renovation Requirements – Joint Site Inspection requirements – Letter of No Objection and Fire Safety Certificate / Minor Addition & Alteration requirements – SFA licence requirements (F&B) – basement loading bay booking info – the Tenant-Contractor Kit",
      "Your Project Officer also: – sets up your Access Control & Scheduling System account for staff access – reminds your contractor to create their own account for loading bay access – requests your Salesforce and Changi Rewards accounts – asks you for Tenant Directory Taxonomy information – where applicable, initiates iShopChangi onboarding (the exact tenant condition for iShopChangi is still being confirmed by CAG; see open questions)"
    ],
    "people": [
      "Tenant",
      "Project Officer",
      "Contractor"
    ],
    "systems": [
      {
        "label": "Access Control & Scheduling System (ACS)",
        "href": "https://www.cag-acs.com/cus-acs/performlogin"
      },
      {
        "label": "Salesforce",
        "href": "https://changiairport.my.salesforce.com/?ec=302&startURL=%2Fhome%2Fhome.jsp"
      },
      {
        "label": "Changi Rewards Tenant Portal",
        "href": "https://admin.changirewards.com/#/login"
      },
      {
        "label": "Tenant Directory Taxonomy",
        "href": "https://sb-aemauthor-prod.ishopchangi.com/libs/granite/core/content/login.html"
      }
    ],
    "documents": [
      "Renovation Requirements",
      "Joint Site Inspection (JSI) Form",
      "Letter of No Objection",
      "Fire Safety Certificate",
      "Tenant Contractor Kit",
      "T1–T4 Basement Direction Guide",
      "Access Control & Scheduling System (ACS) Guide for Basement Access",
      "Template Email on Tenant Directory Taxonomy (TDT) Information Request",
      "Template Email on iShopChangi (iSC) Onboarding"
    ],
    "action": "",
    "slaShow": "",
    "sla": ""
  },
  {
    "no": 16,
    "phase": "SetUp",
    "stage": "Design Review",
    "step": "Design Review — Architectural (Layout)",
    "type": "Mandatory",
    "area": "",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "",
    "areaWhy": "",
    "unitTypeWhy": "",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "",
    "description": [
      "Submit the layout pack to your Project Officer: – coloured design perspectives – architectural plans – elevation plans – ceiling layout plan – signage drawings – the hoarding plan",
      "Your Project Officer reviews it and routes it to Design Management.",
      "If they need to assess materials, they will ask you for a physical material sample board.",
      "Do not start permit applications or works before this approval."
    ],
    "people": [
      "Tenant",
      "Project Officer",
      "Design Management"
    ],
    "systems": [],
    "documents": [
      "Perspectives Drawings",
      "Coloured Design perspectives (Unique features)",
      "Architectural plans",
      "Elevation plans with dimensions",
      "Ceiling layout plan",
      "Signage drawings with dimensions",
      "Hoarding Plan",
      "Tenancy Design Guidelines"
    ],
    "action": "",
    "slaShow": "",
    "sla": ""
  },
  {
    "no": 17,
    "phase": "SetUp",
    "stage": "Design Review",
    "step": "Systems Drawings Review",
    "type": "Mandatory",
    "area": "",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "",
    "areaWhy": "",
    "unitTypeWhy": "",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "",
    "description": [
      "Submit the systems drawings to your Project Officer: – electrical single-line diagram / PA system – mechanical ventilation – air-conditioning – sprinkler / fire protection – plumbing / sanitary",
      "Your Project Officer routes these for review."
    ],
    "people": [
      "Tenant",
      "Project Officer"
    ],
    "systems": [],
    "documents": [
      "Electrical Drawings",
      "Mechanical Drawings",
      "Fire Safety Requirements"
    ],
    "action": "",
    "slaShow": "",
    "sla": ""
  },
  {
    "no": 18,
    "phase": "SetUp",
    "stage": "Permit Application",
    "step": "Permit Advisory & Tenancy Project Selection",
    "type": "Mandatory",
    "area": "",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "",
    "areaWhy": "",
    "unitTypeWhy": "",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "",
    "description": [
      "Start this step at least 4 weeks before works commence.",
      "The Project Officer advises which permits may be needed.",
      "The contractor creates the project in this portal and completes the Scope of Works Questionnaire and permit screening, which identify the required permits, supporting documents and checks.",
      "The tenant and Project Officer can view and review the information, while the contractor updates it and makes any corrections."
    ],
    "people": [
      "Tenant",
      "Project Officer",
      "Contractor"
    ],
    "systems": [
      {
        "label": "OneCalendar",
        "href": "https://one-calendar.changiairport.com/OneCalendar/Login"
      }
    ],
    "documents": [
      "CAG OneCalendar User Guide — Contractor",
      "Letter of Indemnity (LOI) Template",
      "Method Statement Template",
      "Risk Assessment Form"
    ],
    "action": "Start your permit application — starts the permit journey: the contractor creates the project here and completes the Scope of Works Questionnaire and permit screening, which identify the required permits, supporting documents and checks.",
    "slaShow": "Always on this step",
    "sla": "Complete this step at least 4 weeks before works commence."
  },
  {
    "no": 19,
    "phase": "SetUp",
    "stage": "Permit Application",
    "step": "Submit Combined Permit To Work Application",
    "type": "Mandatory",
    "area": "",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "",
    "areaWhy": "",
    "unitTypeWhy": "",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "",
    "description": [
      "Using the screening results, the contractor creates the Tenancy Project in OneCalendar and completes the base renovation permit details, including the work period, location and nature of work.",
      "The contractor also completes any required sub-permits and uploads the supporting documents, with drawings endorsed by the Qualified Person where required.",
      "The tenant and Project Officer can view the application.",
      "Once complete, the contractor submits the base permit and all required sub-permits together as one Permit To Work application."
    ],
    "people": [
      "Tenant",
      "Project Officer",
      "Contractor",
      "Qualified Person"
    ],
    "systems": [
      {
        "label": "OneCalendar",
        "href": "https://one-calendar.changiairport.com/OneCalendar/Login"
      }
    ],
    "documents": [
      "Permit to Work",
      "Letter of Indemnity (LOI) Template",
      "Method Statement Template",
      "Risk Assessment Form",
      "Renovation Requirements"
    ],
    "action": "",
    "slaShow": "Always on this step",
    "sla": "Submit at least 4 weeks before works commence."
  },
  {
    "no": 20,
    "phase": "SetUp",
    "stage": "Permit Application",
    "step": "Multi-Party Review by Changi Airport Group Stakeholders",
    "type": "Mandatory",
    "area": "",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "",
    "areaWhy": "",
    "unitTypeWhy": "",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "",
    "description": [
      "After submission, your Project Officer endorses the pack for relevance, completeness and accuracy, then it routes through the reviewers in OneCalendar: – the Building Maintenance Contractor (BMC) and AES both review hot work and fire alarm/sprinkler isolation permits – IFM reviews the whole submission",
      "If any reviewer rejects or requests changes, your contractor revises and resubmits in OneCalendar.",
      "Once IFM approves, OneCalendar issues the Permit To Work to your contractor.",
      "You track status here — do not chase reviewers directly."
    ],
    "people": [
      "Project Officer",
      "Contractor",
      "IFM",
      "AES",
      "BMC"
    ],
    "systems": [
      {
        "label": "OneCalendar",
        "href": "https://one-calendar.changiairport.com/OneCalendar/Login"
      }
    ],
    "documents": [
      "CAG OneCalendar User Guide — CAG Approver",
      "Permit to Work"
    ],
    "action": "",
    "slaShow": "",
    "sla": ""
  },
  {
    "no": 21,
    "phase": "SetUp",
    "stage": "Permit Application",
    "step": "Requests / Permissions Outside OneCalendar",
    "type": "Mandatory",
    "area": "",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "",
    "areaWhy": "",
    "unitTypeWhy": "",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "",
    "description": [
      "Some permissions are still settled by email, outside OneCalendar — for example: – kerbside use (Airport Operations) – landside roadway permits – road-closure traffic management plans (required for any works that close roads, including anything affecting fire-engine access) – structural requests such as load-bearing walls, beams or super-heavy items (CAG civil/structural team)",
      "Ask your Project Officer early whether any of your works need such requests.",
      "Your contractor submits them to IFM by email so they do not block your site start."
    ],
    "people": [
      "Tenant",
      "Project Officer",
      "Contractor",
      "IFM",
      "Airport Operations"
    ],
    "systems": [],
    "documents": [],
    "action": "",
    "slaShow": "",
    "sla": ""
  },
  {
    "no": 22,
    "phase": "Build",
    "stage": "Handover",
    "step": "Site Walkthrough, Technical Verification & Handover Sign Off",
    "type": "Mandatory",
    "area": "",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "",
    "areaWhy": "",
    "unitTypeWhy": "",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "",
    "description": [
      "Your Project Officer schedules the handover meeting for your tenancy start date.",
      "Integrated Facilities Management (IFM) retrieves the unit keys from the Key Management System, walks the site with you, hands over the keys, and fills in the handover form recording the unit condition — you sign it.",
      "Note any existing defects on the form before signing; it is your baseline for reinstatement at exit."
    ],
    "people": [
      "Tenant",
      "Project Officer",
      "IFM"
    ],
    "systems": [],
    "documents": [
      "Handover Form",
      "Physical Handover Form",
      "Digital Handover Form",
      "Handover Report + Photos"
    ],
    "action": "",
    "slaShow": "",
    "sla": ""
  },
  {
    "no": 23,
    "phase": "Build",
    "stage": "Renovation",
    "step": "IFM Pre-Renovation Briefing",
    "type": "Mandatory",
    "area": "",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "",
    "areaWhy": "",
    "unitTypeWhy": "",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "",
    "description": [
      "IFM arranges and conducts a pre-renovation briefing with your contractor, walking through the Renovation Requirements and confirming readiness to start works."
    ],
    "people": [
      "Contractor",
      "IFM"
    ],
    "systems": [],
    "documents": [
      "Renovation Requirements"
    ],
    "action": "",
    "slaShow": "",
    "sla": ""
  },
  {
    "no": 24,
    "phase": "Build",
    "stage": "Renovation",
    "step": "Airport Passes & Hoarding Installation",
    "type": "Mandatory",
    "area": "",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "",
    "areaWhy": "",
    "unitTypeWhy": "",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "",
    "description": [
      "Your contractor obtains airport passes for the work team, then installs hoarding before any work starts — all works must stay within the hoarded area.",
      "The hoarding method statement and detail drawing need a Structural Qualified Person's certification.",
      "The graphic design needs CAG approval (or use CAG's design with logo rules).",
      "Hoarding material must be non-combustible with proof submitted to the permit system.",
      "Floor protection (10mm plywood on 4mm underlay with grey felt carpet; 16mm plywood over recon marble in T4) must be laid before works begin."
    ],
    "people": [
      "Tenant",
      "Contractor",
      "Qualified Person"
    ],
    "systems": [],
    "documents": [
      "Hoarding Plan",
      "Hoarding Graphics Design",
      "Hoarding Plan Template",
      "Renovation Requirements"
    ],
    "action": "",
    "slaShow": "",
    "sla": ""
  },
  {
    "no": 25,
    "phase": "Build",
    "stage": "Renovation",
    "step": "QP Assessment: FSC / MAA / Temporary Fire Permit",
    "type": "Mandatory",
    "area": "",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "",
    "areaWhy": "",
    "unitTypeWhy": "",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "",
    "description": [
      "Your contractor engages a Qualified Person / Professional Engineer to assess whether the completed works require a Fire Safety Certificate, a Minor Addition & Alteration submission, or a Temporary Fire Permit before opening."
    ],
    "people": [
      "Contractor",
      "Qualified Person / PE"
    ],
    "systems": [],
    "documents": [
      "Fire Safety Certificate",
      "Fire Safety Requirements"
    ],
    "action": "",
    "slaShow": "",
    "sla": ""
  },
  {
    "no": 26,
    "phase": "Build",
    "stage": "Renovation",
    "step": "Renovation Works & Site Monitoring",
    "type": "Mandatory",
    "area": "",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "",
    "areaWhy": "",
    "unitTypeWhy": "",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "",
    "description": [
      "Your contractor executes the renovation under the approved Permit To Work, work schedule and method statement.",
      "Your Project Officer and IFM conduct site checks and can issue a Stop Work Order for any non-compliance.",
      "Key site rules from the Renovation Requirements: – noisy/dusty works (hacking, drilling, demolition) only between 0100–0500 hrs with 3 days' advance notice to CAG – large equipment moves only 0100–0500 unless approved – debris removed from the airport daily – no flammable liquids stored on site – fire protection systems and escape routes never blocked",
      "Violations carry administrative charges of S$1,000–1,500, stop-work orders and demerit points that can blacklist the contractor."
    ],
    "people": [
      "Tenant",
      "Project Officer",
      "Contractor",
      "IFM"
    ],
    "systems": [],
    "documents": [
      "Renovation Requirements",
      "Method Statement Template",
      "Permit to Work"
    ],
    "action": "",
    "slaShow": "",
    "sla": ""
  },
  {
    "no": 27,
    "phase": "Build",
    "stage": "Renovation",
    "step": "Fire Safety Tests Verification",
    "type": "Mandatory",
    "area": "",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "",
    "areaWhy": "",
    "unitTypeWhy": "",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "",
    "description": [
      "Your Project Officer notifies AES when the fire safety steps are ready.",
      "AES verifies the sprinkler and power tests together with the Building Maintenance Centre (BMC).",
      "The Public Announcement test is part of this step, not its own step.",
      "BMC compiles the signed-off inspection checklist and shares it via IFM to your Project Officer.",
      "Fire alarm interlock is only done by the BMC; raise it early because the wait is long."
    ],
    "people": [
      "Project Officer",
      "AES",
      "BMC",
      "IFM"
    ],
    "systems": [],
    "documents": [],
    "action": "",
    "slaShow": "",
    "sla": ""
  },
  {
    "no": 28,
    "phase": "Build",
    "stage": "Renovation",
    "step": "Aircon Balancing Test Report",
    "type": "Mandatory",
    "area": "",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "",
    "areaWhy": "",
    "unitTypeWhy": "",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "",
    "description": [
      "Your contractor submits the aircon balancing test report in OneCalendar."
    ],
    "people": [
      "Contractor"
    ],
    "systems": [
      {
        "label": "OneCalendar",
        "href": "https://one-calendar.changiairport.com/OneCalendar/Login"
      }
    ],
    "documents": [],
    "action": "",
    "slaShow": "",
    "sla": ""
  },
  {
    "no": 29,
    "phase": "Build",
    "stage": "Renovation",
    "step": "As-Built Drawings Upload",
    "type": "Mandatory",
    "area": "",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "",
    "areaWhy": "",
    "unitTypeWhy": "",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "",
    "description": [
      "Your contractor uploads the as-built drawings into OneCalendar.",
      "The Renovation Requirements set the deadline at within three weeks of completion of the works — covering BIM, architectural, structural and M&E drawings to CP83, plus the fire protection plans endorsed by your QP.",
      "Missing final as-builts are a known enforcement gap; they are required again for Fire Safety Certificate application and at reinstatement, so treat them as a closure item."
    ],
    "people": [
      "Contractor",
      "Qualified Person"
    ],
    "systems": [
      {
        "label": "OneCalendar",
        "href": "https://one-calendar.changiairport.com/OneCalendar/Login"
      }
    ],
    "documents": [
      "As-Built Drawings",
      "AutoCAD File",
      "Building Information Modelling",
      "Electrical Drawings",
      "Mechanical Drawings"
    ],
    "action": "",
    "slaShow": "",
    "sla": ""
  },
  {
    "no": 30,
    "phase": "Build",
    "stage": "Renovation",
    "step": "Defects Rectification",
    "type": "Mandatory",
    "area": "",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "",
    "areaWhy": "",
    "unitTypeWhy": "",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "",
    "description": [
      "Your contractor rectifies any defects found in stakeholder inspections before the pre-opening stage."
    ],
    "people": [
      "Contractor"
    ],
    "systems": [],
    "documents": [],
    "action": "",
    "slaShow": "",
    "sla": ""
  },
  {
    "no": 31,
    "phase": "Build",
    "stage": "Renovation",
    "step": "Pre-Opening Inspection",
    "type": "Mandatory",
    "area": "",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "",
    "areaWhy": "",
    "unitTypeWhy": "",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "",
    "description": [
      "Your Project Officer schedules the Pre-Opening Inspection with stakeholders.",
      "IFM checks requirement compliance and AES checks fire safety compliance on site; both sign the Pre-Opening Inspection Form.",
      "The contractor brings the plans in A3: layout, sprinkler, FSC, SLD and ACMV.",
      "Arrange the joint site inspection at least 3 days before your completion date or scheduled opening — if any fire safety requirement is unmet, the premises stay closed until it is resolved."
    ],
    "people": [
      "Tenant",
      "Project Officer",
      "Contractor",
      "IFM",
      "AES"
    ],
    "systems": [],
    "documents": [
      "Pre-Opening Inspection Form",
      "Architectural plans",
      "Electrical Drawings",
      "Mechanical Drawings",
      "Fire Safety Certificate"
    ],
    "action": "",
    "slaShow": "",
    "sla": ""
  },
  {
    "no": 32,
    "phase": "Build",
    "stage": "Renovation",
    "step": "Opening Announcement & Directory Update",
    "type": "Mandatory",
    "area": "",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "Officer only",
    "areaWhy": "",
    "unitTypeWhy": "",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "The opening announcement on changiairport.com is published by the Project Officer, not the tenant.",
    "description": [
      "Your Project Officer announces the opening on changiairport.com."
    ],
    "people": [
      "Project Officer"
    ],
    "systems": [],
    "documents": [
      "Tenant Directory Taxonomy",
      "Template Email on Store Opening"
    ],
    "action": "",
    "slaShow": "",
    "sla": ""
  },
  {
    "no": 33,
    "phase": "Operate",
    "stage": "Operations",
    "step": "Permit Advisory & Tenancy Project Selection (Renovation During Operations)",
    "type": "Mandatory",
    "area": "",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "",
    "areaWhy": "",
    "unitTypeWhy": "",
    "workScopeWhy": "Renovation during operations re-opens the permit journey, so permit advisory and project selection are required again.",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "",
    "description": [
      "For any renovation, upgrade or A&A works while your store is trading.",
      "Start this step at least 4 weeks before works commence.",
      "The Project Officer advises which permits the planned works need.",
      "The contractor creates the project in this portal and completes the Scope of Works Questionnaire and permit screening, which identify the required permits, supporting documents and checks.",
      "The tenant and Project Officer can view and review the information, while the contractor updates it and makes any corrections."
    ],
    "people": [
      "Tenant",
      "Project Officer",
      "Contractor"
    ],
    "systems": [],
    "documents": [
      "CAG OneCalendar User Guide — Contractor",
      "Letter of Indemnity (LOI) Template",
      "Method Statement Template",
      "Risk Assessment Form"
    ],
    "action": "Start your permit application — starts the permit journey: the contractor creates the project here and completes the Scope of Works Questionnaire and permit screening, which identify the required permits, supporting documents and checks.",
    "slaShow": "Always on this step",
    "sla": "Complete this step at least 4 weeks before works commence."
  },
  {
    "no": 34,
    "phase": "Operate",
    "stage": "Operations",
    "step": "Submit Combined Permit To Work Application (Renovation During Operations)",
    "type": "Mandatory",
    "area": "",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "",
    "areaWhy": "",
    "unitTypeWhy": "",
    "workScopeWhy": "Renovation during operations requires a fresh combined Permit To Work covering the new works.",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "",
    "description": [
      "Using the screening results, the contractor creates the project in OneCalendar and completes the base permit details, including the work period, location and nature of work.",
      "The contractor also completes any required sub-permits and uploads the supporting documents, with drawings endorsed by the Qualified Person where required.",
      "The tenant and Project Officer can view the application.",
      "Once complete, the contractor submits the base permit and all required sub-permits together as one Permit To Work application.",
      "Works in a trading unit are normally done outside opening hours, so confirm the work window with your Project Officer."
    ],
    "people": [
      "Tenant",
      "Project Officer",
      "Contractor",
      "Qualified Person"
    ],
    "systems": [
      {
        "label": "OneCalendar",
        "href": "https://one-calendar.changiairport.com/OneCalendar/Login"
      }
    ],
    "documents": [
      "Permit to Work",
      "Letter of Indemnity (LOI) Template",
      "Method Statement Template",
      "Risk Assessment Form",
      "Renovation Requirements"
    ],
    "action": "",
    "slaShow": "Always on this step",
    "sla": "Submit at least 4 weeks before works commence."
  },
  {
    "no": 35,
    "phase": "Operate",
    "stage": "After store opening",
    "step": "Opening Document Submission",
    "type": "Mandatory",
    "area": "",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "",
    "areaWhy": "",
    "unitTypeWhy": "",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "",
    "description": [
      "After the store opens, log in to OneCalendar and submit the following: – as-built drawings – the Certificate of Fitness (COF) – the FSSD Notice of Approval (FSC/NOA)",
      "The COF is endorsed by your EMA Licensed Electrical Worker and renewed annually.",
      "Add a screenshot from OneCalendar or IFM, and a guide on project closure.",
      "As-built drawings, the aircon balancing report, and the Build copies of the FSSD notice and the QP fire-safety assessment are pointed at this step on the printout."
    ],
    "people": [
      "Tenant",
      "Licensed Electrical Worker"
    ],
    "systems": [
      {
        "label": "OneCalendar",
        "href": "https://one-calendar.changiairport.com/OneCalendar/Login"
      }
    ],
    "documents": [
      "As-Built Drawings",
      "Certificate of Fitness",
      "Fire Safety Certificate",
      "Application for new Certificate of Fitness (New Tenant)"
    ],
    "action": "",
    "slaShow": "",
    "sla": ""
  },
  {
    "no": 36,
    "phase": "Operate",
    "stage": "After store opening",
    "step": "Store Opening & Capex Verification",
    "type": "Mandatory",
    "area": "",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "",
    "areaWhy": "",
    "unitTypeWhy": "",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "",
    "description": [
      "Your Project Officer sends the store opening email to stakeholders (Airport Operations, Commercial, CAG Adviser & Changi TMC, CMC and others).",
      "Prepare the invoice of the renovation work and submit it to your CAG officer.",
      "Your Project Officer verifies your capital expenditure (capex) commitment is fulfilled.",
      "IFM follows up on any outstanding defects, which you rectify."
    ],
    "people": [
      "Tenant",
      "Project Officer",
      "IFM",
      "Airport Operations"
    ],
    "systems": [],
    "documents": [
      "Store Opening Email",
      "Opening Sales Report",
      "Template Email on Outlet Opening Sales Reports (MD / EVP COM / CEO)"
    ],
    "action": "",
    "slaShow": "",
    "sla": ""
  },
  {
    "no": 37,
    "phase": "Operate",
    "stage": "Opening",
    "step": "TOPAZ Account Setup for Service Reports",
    "type": "Mandatory",
    "area": "",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "",
    "areaWhy": "",
    "unitTypeWhy": "",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "",
    "description": [
      "Your Project Officer creates your TOPAZ tenant account (company and outlet details, tenancy dates, terminal, unit number, and the types of service reports you owe, with IFM and AES as points of contact).",
      "TOPAZ is where your recurring servicing reports go for the rest of your tenancy."
    ],
    "people": [
      "Tenant",
      "Project Officer",
      "IFM",
      "AES"
    ],
    "systems": [
      {
        "label": "TOPAZ (Tenant Operations Portal A-Z)"
      }
    ],
    "documents": [
      "Issue / Service Reports"
    ],
    "action": "",
    "slaShow": "",
    "sla": ""
  },
  {
    "no": 38,
    "phase": "Operate",
    "stage": "Operations",
    "step": "Conducting regular services and report submission",
    "type": "Mandatory",
    "area": "",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "",
    "areaWhy": "",
    "unitTypeWhy": "",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "",
    "description": [
      "You submit recurring servicing reports via TOPAZ, and IFM approves them there.",
      "The report list should be curated from the tenant’s questionnaire, and a guide inserted. The printout asks whether that curation is possible.",
      "Reports named on the card: – kitchen waste pipe – FCU servicing – grease trap / portable grease trap – floor trap – kitchen fire suppression (to AES) – kitchen supply and exhaust fan – Certificate of Fitness – fire alarm system – ESCS – TGFS – kitchen duct cleaning (to CAG)",
      "Minimum frequencies from the Renovation Requirements stay as written.",
      "Pest control and Air Handling Unit servicing are crossed out as their own steps."
    ],
    "people": [
      "Tenant",
      "IFM"
    ],
    "systems": [
      {
        "label": "TOPAZ (Tenant Operations Portal A-Z)"
      }
    ],
    "documents": [
      "Kitchen Waste Pipe Report",
      "AHU Servicing Report",
      "Grease Trap / Portable Grease Trap Servicing Report",
      "Floor Trap Report",
      "Kitchen Fire Suppression System Report",
      "Certificate of Fitness",
      "Fire Alarm System Report",
      "Kitchen Exhaust / Duct Cleaning",
      "Renovation Requirements"
    ],
    "action": "",
    "slaShow": "",
    "sla": ""
  },
  {
    "no": 39,
    "phase": "Operate",
    "stage": "Operations",
    "step": "Annual Fire Safety Declaration & Training",
    "type": "Mandatory",
    "area": "",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "",
    "areaWhy": "",
    "unitTypeWhy": "",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "",
    "description": [
      "Each year, the tenant completes the AES fire safety training video, quiz and declaration on the Tenant Fire Safety Declaration Portal.",
      "Insert the link.",
      "Failure to submit leads to a chargeable AES inspection of the unit.",
      "AES tracks submissions and sends renewal reminders before year end."
    ],
    "people": [
      "Tenant",
      "AES"
    ],
    "systems": [
      {
        "label": "Tenant Fire Safety Declaration Portal"
      }
    ],
    "documents": [
      "Fire Safety Declaration"
    ],
    "action": "",
    "slaShow": "",
    "sla": ""
  },
  {
    "no": 40,
    "phase": "Operate",
    "stage": "Operations",
    "step": "Monthly Sales Declaration",
    "type": "Mandatory",
    "area": "",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "",
    "areaWhy": "",
    "unitTypeWhy": "",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "",
    "description": [
      "You submit your monthly sales declaration through the Lease Management System.",
      "Also declare CR, and the QSM staff declaration."
    ],
    "people": [
      "Tenant"
    ],
    "systems": [
      {
        "label": "Lease Management System (LMS)",
        "href": "https://tenantleaseportal.changiairport.com/CAG-TenantPortal/applogin.aspx"
      },
      {
        "label": "Changi Rewards Tenant Portal",
        "href": "https://admin.changirewards.com/#/login"
      },
      {
        "label": "Salesforce",
        "href": "https://changiairport.my.salesforce.com/?ec=302&startURL=%2Fhome%2Fhome.jsp"
      }
    ],
    "documents": [
      "Financial Reports"
    ],
    "action": "",
    "slaShow": "",
    "sla": ""
  },
  {
    "no": 41,
    "phase": "Operate",
    "stage": "Operations",
    "step": "Retrieval of sales invoice (WebEpic)",
    "type": "Mandatory",
    "area": "",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "",
    "areaWhy": "",
    "unitTypeWhy": "",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "",
    "description": [
      "Retrieve the sales invoice in WebEpic."
    ],
    "people": [
      "Tenant"
    ],
    "systems": [
      {
        "label": "WebEpic",
        "href": "https://ccnwebepic.ccnexchange.com/epic/cagshome.htm"
      }
    ],
    "documents": [
      "Financial Reports"
    ],
    "action": "",
    "slaShow": "",
    "sla": ""
  },
  {
    "no": 42,
    "phase": "Operate",
    "stage": "Operations",
    "step": "COF (yearly)",
    "type": "Mandatory",
    "area": "",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "",
    "areaWhy": "",
    "unitTypeWhy": "",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "",
    "description": [
      "Each year, the tenant conducts the annual electrical licensing with a licensed electrical worker, and attaches the COF form."
    ],
    "people": [
      "Tenant",
      "Licensed Electrical Worker"
    ],
    "systems": [],
    "documents": [
      "Certificate of Fitness",
      "Application for renewal of Certificate of Fitness (Returning Tenant)",
      "Annual Electrical License"
    ],
    "action": "",
    "slaShow": "",
    "sla": ""
  },
  {
    "no": 43,
    "phase": "Exit",
    "stage": "Reinstatement",
    "step": "Reinstatement Requirements & Plan Alignment",
    "type": "Mandatory",
    "area": "",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "",
    "areaWhy": "",
    "unitTypeWhy": "",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "",
    "description": [
      "Reach out to your Project Officer for the reinstatement meeting.",
      "IFM attends and explains the reinstatement requirements — what the unit must be returned to, per the base-build drawings and provision list.",
      "If an incoming tenant is taking over the unit, your Project Officer links both parties.",
      "Takeovers of items (for example hoarding) are formalised with a signed Letter of Undertaking. Add an LOU template.",
      "You must reinstate the premises to their original state if CAG requires it."
    ],
    "people": [
      "Tenant",
      "Project Officer",
      "IFM"
    ],
    "systems": [],
    "documents": [
      "Reinstatement Requirements",
      "Provision List",
      "M&E Base-built Drawings",
      "Letter of Undertaking (LOU) Template"
    ],
    "action": "",
    "slaShow": "",
    "sla": ""
  },
  {
    "no": 44,
    "phase": "Exit",
    "stage": "Reinstatement",
    "step": "Permit Advisory & Tenancy Project Selection (Reinstatement)",
    "type": "Mandatory",
    "area": "",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "",
    "areaWhy": "",
    "unitTypeWhy": "",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "",
    "description": [
      "Start this step at least 4 weeks before reinstatement works commence.",
      "The Project Officer advises which permits the reinstatement works need.",
      "The contractor creates the project in this portal and completes the Scope of Works Questionnaire and permit screening, which identify the required permits, supporting documents and checks for the reinstatement scope.",
      "The tenant and Project Officer can view and review the information, while the contractor updates it and makes any corrections."
    ],
    "people": [
      "Tenant",
      "Project Officer",
      "Contractor"
    ],
    "systems": [],
    "documents": [
      "CAG OneCalendar User Guide — Contractor",
      "Letter of Indemnity (LOI) Template",
      "Method Statement Template",
      "Risk Assessment Form"
    ],
    "action": "Start your reinstatement permit application — the contractor creates the project here and completes the Scope of Works Questionnaire and permit screening for the reinstatement scope, which identify the required permits, supporting documents and checks.",
    "slaShow": "Always on this step",
    "sla": "Complete this step at least 4 weeks before reinstatement works commence."
  },
  {
    "no": 45,
    "phase": "Exit",
    "stage": "Reinstatement",
    "step": "Submit Combined Permit To Work Application (Reinstatement)",
    "type": "Mandatory",
    "area": "",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "",
    "areaWhy": "",
    "unitTypeWhy": "",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "",
    "description": [
      "Using the screening results, the contractor creates the project in OneCalendar and completes the reinstatement permit details, including the work period, location and nature of work.",
      "The contractor also completes any required sub-permits — hot work, fire alarm isolation and sprinkler draining, ceiling and others where the works need them — and uploads the supporting documents, with drawings endorsed by the Qualified Person where required.",
      "The tenant and Project Officer can view the application.",
      "Once complete, the contractor submits the base permit and all required sub-permits together as one Permit To Work application."
    ],
    "people": [
      "Tenant",
      "Project Officer",
      "Contractor",
      "Qualified Person"
    ],
    "systems": [
      {
        "label": "OneCalendar",
        "href": "https://one-calendar.changiairport.com/OneCalendar/Login"
      }
    ],
    "documents": [
      "Permit to Work",
      "Letter of Indemnity (LOI) Template",
      "Method Statement Template",
      "Risk Assessment Form",
      "Renovation Requirements"
    ],
    "action": "",
    "slaShow": "",
    "sla": ""
  },
  {
    "no": 46,
    "phase": "Exit",
    "stage": "Reinstatement",
    "step": "Reinstatement Permit Submission via OneCalendar",
    "type": "Mandatory",
    "area": "",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "",
    "areaWhy": "",
    "unitTypeWhy": "",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "",
    "description": [
      "Your contractor submits the reinstatement Permit To Work in OneCalendar with the reinstatement scope, method statement and safe work procedures.",
      "Please submit the permit one month in advance.",
      "The same permit discipline applies as in SetUp — hot work, fire alarm isolation and other sub-permits ride along where the reinstatement works need them."
    ],
    "people": [
      "Contractor"
    ],
    "systems": [
      {
        "label": "OneCalendar",
        "href": "https://one-calendar.changiairport.com/OneCalendar/Login"
      }
    ],
    "documents": [
      "Permit to Work",
      "Method Statement Template",
      "Risk Assessment Form",
      "Reinstatement Requirements"
    ],
    "action": "",
    "slaShow": "",
    "sla": ""
  },
  {
    "no": 47,
    "phase": "Exit",
    "stage": "Reinstatement",
    "step": "Multi-Party Review by Changi Airport Group Stakeholders",
    "type": "Mandatory",
    "area": "",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "",
    "areaWhy": "",
    "unitTypeWhy": "",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "",
    "description": [
      "The permit is reviewed by the stakeholder.",
      "IFM reviews the reinstatement Permit To Work against the renovation requirements.",
      "AES reviews it against fire safety provisions, including the method statement (fire protection parts, permit isolation and hot works) and the safe work procedures.",
      "Once stakeholders approve, OneCalendar issues the reinstatement Permit To Work to your contractor."
    ],
    "people": [
      "Contractor",
      "IFM",
      "AES"
    ],
    "systems": [],
    "documents": [
      "Permit to Work",
      "Method Statement Template"
    ],
    "action": "",
    "slaShow": "",
    "sla": ""
  },
  {
    "no": 48,
    "phase": "Exit",
    "stage": "Reinstatement",
    "step": "Point of Sales Removal",
    "type": "Mandatory",
    "area": "",
    "unitType": "Retail or F&B",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "",
    "areaWhy": "",
    "unitTypeWhy": "Only Retail and F&B units have a POS system installed, so only they need it removed at exit.",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "",
    "description": [
      "Inform the POS vendor and your CAG officer of the POS removal date and time.",
      "Your Project Officer is looped into the removal notice.",
      "Confirm the deactivation date so sales reporting closes cleanly."
    ],
    "people": [
      "Tenant",
      "Project Officer",
      "POS vendor"
    ],
    "systems": [],
    "documents": [
      "POS Removal Request"
    ],
    "action": "",
    "slaShow": "",
    "sla": ""
  },
  {
    "no": 49,
    "phase": "Exit",
    "stage": "Reinstatement",
    "step": "Reinstatement Works",
    "type": "Mandatory",
    "area": "",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "",
    "areaWhy": "",
    "unitTypeWhy": "",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "",
    "description": [
      "Your contractor carries out the reinstatement works under the approved reinstatement Permit To Work and the reinstatement requirements.",
      "Your Project Officer monitors progress and can issue a Stop Work Order for non-compliance — the same site rules (working hours, debris removal, fire safety) apply as during renovation."
    ],
    "people": [
      "Project Officer",
      "Contractor"
    ],
    "systems": [],
    "documents": [
      "Renovation Requirements",
      "Permit to Work"
    ],
    "action": "",
    "slaShow": "",
    "sla": ""
  },
  {
    "no": 50,
    "phase": "Exit",
    "stage": "Reinstatement",
    "step": "Pre-Takeover Inspection",
    "type": "Mandatory",
    "area": "",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "",
    "areaWhy": "",
    "unitTypeWhy": "",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "",
    "description": [
      "Your Project Officer schedules the pre-takeover inspection.",
      "IFM inspects the reinstated premises with you, and you rectify any reinstatement defects found."
    ],
    "people": [
      "Tenant",
      "Project Officer",
      "IFM"
    ],
    "systems": [],
    "documents": [
      "Handover Checklist",
      "Reinstatement Requirements"
    ],
    "action": "",
    "slaShow": "",
    "sla": ""
  },
  {
    "no": 51,
    "phase": "Exit",
    "stage": "Reinstatement",
    "step": "Takeover Meeting",
    "type": "Mandatory",
    "area": "",
    "unitType": "",
    "workScope": "",
    "terminal": "",
    "unitFeature": "",
    "audience": "",
    "areaWhy": "",
    "unitTypeWhy": "",
    "workScopeWhy": "",
    "terminalWhy": "",
    "unitFeatureWhy": "",
    "audienceWhy": "",
    "description": [
      "Once IFM verifies the rectifications, IFM signs the takeover form with you.",
      "The keys sentence is struck; the note says there is no key.",
      "Your Project Officer receives a copy of the signed form.",
      "Keep your copy: it triggers the security deposit release."
    ],
    "people": [
      "Tenant",
      "Project Officer",
      "IFM"
    ],
    "systems": [],
    "documents": [
      "Handover Form",
      "Handover Checklist",
      "Handover Report + Photos"
    ],
    "action": "",
    "slaShow": "",
    "sla": ""
  }
];
