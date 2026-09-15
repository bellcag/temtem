import type { Role } from "@/lib/app-state";

/** Guide line from the journey briefing. What this is, or the gate. Not a task. */
export const CARD_WHYS: Record<Role, Record<string, string>> = {
  tenant: {
    "Tenancy Platform Onboarding::Set Up Systems Required for Works and Setup":
      "OneCalendar is CAG's permit platform for this unit. No renovation paperwork can start until these accounts and accesses exist.",
    "Tenancy Platform Onboarding::Set Up Systems Required for Staff":
      "This applies when the outlet faces travelling passengers.",
    "Tenancy Platform Onboarding::Set Up WebEpic Account":
      "Your Project Officer sends the form. You then apply on WebEpic.",
    "Tenancy Platform Onboarding::Point of Sales Setup":
      "NEC installs point of sale for retail and F&B units.",
    "Pre-Kickoff::Kickoff Documents Gathered & Shared":
      "This pack is the rulebook for your design and permits. Read the Renovation Requirements before KickOff meeting.",
    "Pre-Kickoff::Check Change of Use with URA":
      "If this unit's use will change, URA must approve it before works start.",
    "Pre-Kickoff::High-Level Design Review":
      "Share a first concept before KickOff meeting when the fit-out is large or the unit is a duplex.",
    "Pre-Kickoff::Confirmation of Meeting Attendees":
      "This is the first site meeting. AES and IFM brief the unit. Bring drawings, not a blank site.",
    "Kickoff::Requirements & Plan Alignment":
      "At KickOff meeting you present the plans. Leave with agreed actions.",
    "Renovation::Onboarding Guidelines Shared":
      "This pack lands when planned works are certain — after the IFM briefing, before works start.",
    "Post-Kickoff::Confirm Fire Safety Submission Route":
      "Your Qualified Person must confirm FSC, MAA, or Temporary Fire Permit in writing before the permit pack.",
    "Design Review::Confirmation of Renovation Plans":
      "One design pack must be approved in writing. Do not start permits or works before that.",
    "Permit Application::Permit Advisory & Tenancy Project Selection":
      "Your contractor starts the Tenancy Project in OneCalendar. Apply at least 2 weeks before works.",
    "Permit Application::Joint Site Inspection":
      "BMC must confirm which fire systems the works affect. Isolation permits will not be approved without this.",
    "Permit Application::Submit Combined Permit To Work Application":
      "All remaining permits go in as one Permit To Work in OneCalendar.",
    "Permit Application::Qualified Person Endorsed Letter of Undertaking":
      "Needed when you take over items from the exiting tenant, most often hoarding.",
    "Permit Application::Multi-Party Review by Changi Airport Group Stakeholders":
      "Reviewers check the pack in OneCalendar. Track status here. Do not chase reviewers.",
    "Permit Application::Requests / Permissions Outside OneCalendar":
      "Some permissions still go by email — kerbside, roads, structural. Ask early so they do not block site start.",
    "Handover::Site Walkthrough, Technical Verification & Handover Sign Off":
      "Walk the unit with IFM and sign the condition. Note defects before you sign — this is the baseline at exit.",
    "Renovation::Integrated Facilities Management Pre-Renovation Briefing":
      "IFM walks the contractor through the Renovation Requirements before works start.",
    "Renovation::Airport Passes & Hoarding Installation":
      "Works stay inside the hoarded area. Hoarding and floor protection go in before any work starts.",
    "Renovation::Temporary Power Request":
      "Needed only if this unit has no permanent meter yet.",
    "Renovation::FSSD Notice of Approval Submission":
      "Submit the FSSD notice in OneCalendar when fire systems change.",
    "Renovation::QP Assessment: FSC / MAA / Temporary Fire Permit":
      "Your Qualified Person names FSC, MAA, or Temporary Fire Permit before you open.",
    "Renovation::Renovation Works & Site Monitoring":
      "Works run under the approved Permit To Work. Noisy or dusty work is only 01:00–05:00.",
    "Renovation::Waterproofing Checks & Water Ponding Test":
      "Wet areas need a ponding test of at least 48 hours. Floor finishes go in only after IFM is satisfied.",
    "Renovation::Fire Safety Tests Verification":
      "AES checks public announcement, sprinkler, and power tests before opening.",
    "Renovation::Ceiling Inspection Sign-Off":
      "IFM and AES sign off every ceiling panel touched, and the panels next to them.",
    "Renovation::Public Announcement System Testing":
      "IFM witnesses the public announcement test. Closed-door rooms need this.",
    "Renovation::Aircon Balancing Test Report":
      "The balancing report goes in OneCalendar before opening.",
    "Renovation::Kitchen Fire Suppression System Test":
      "AES checks the kitchen fire system where there is open flame or deep-frying.",
    "Renovation::Gas Leak Test":
      "AES checks the gas leak test. This is not the gas flooding test.",
    "Renovation::Total Gas Flooding System Test":
      "AES checks the Total Gas Flooding System in server or computer rooms.",
    "Renovation::As-Built Drawings Upload":
      "Complete as-builts are due within three weeks of completion. You need them again for the fire certificate and at exit.",
    "Renovation::Defects Rectification":
      "Fix defects from inspections before pre-opening.",
    "Renovation::Fire Safety Certificate / MAA / Temporary Fire Permit Submission":
      "The unit may not open until AES has the Fire Safety Certificate or Letter of Acknowledgement.",
    "Renovation::Pre-Opening Inspection":
      "IFM checks requirements and AES checks fire safety. Arrange this at least 3 days before opening. A fail keeps the unit closed.",
    "Renovation::Opening Announcement & Directory Update":
      "Your Project Officer publishes the store listing before opening day. Confirm your details.",
    "Opening::Opening Document Submission":
      "Close the document loop with IFM. As-builts sit in OneCalendar. The Certificate of Fitness goes in TOPAZ and renews every year.",
    "Opening::FSSD Notice of Approval Submission":
      "Submit the FSSD notice in OneCalendar as part of project close-out.",
    "Opening::Store Opening & Capex Verification":
      "Send the renovation invoice so your Project Officer can check the capex commitment. Fix remaining defects.",
    "Opening::Point of Sales Data Reporting":
      "CAG compiles the sales summary from your point of sale. This step is shown so you know it happens.",
    "Opening::TOPAZ Account Setup":
      "TOPAZ is where recurring service reports go for the rest of the tenancy.",
    "Operations::Regular Servicing Reporting":
      "Lodge the reports IFM named for this fit-out in TOPAZ. Confirm the exact list when the account is created.",
    "Operations::Upcoming works":
      "Read works the Project Officer started for this unit. The agreed list lives in Works.",
    "Operations::Later renovation works":
      "Use this when you need a new renovation after opening.",
    "Operations::Works after opening":
      "Use this if you need to change the unit after opening.",
    "Operations::Pest Control Reporting":
      "F&B units lodge pest control reports in TOPAZ.",
    "Operations::Air Handling Unit Servicing Reporting":
      "Lodge the air handling report in TOPAZ when you maintain the unit yourself.",
    "Operations::Annual Fire Safety Declaration & Training":
      "Complete AES fire training and the yearly declaration. Miss it and AES inspects the unit, and you pay.",
    "Operations::Monthly Sales Declaration":
      "Submit monthly sales in the Lease Management System.",
    "Reinstatement::Unit Documents Gathered & Shared":
      "This pack says what the unit must return to.",
    "Reinstatement::Reinstatement Requirements & Plan Alignment":
      "IFM explains what the unit must be returned to. Takeovers need a signed Letter of Undertaking.",
    "Reinstatement::Reinstatement Permit Submission via OneCalendar":
      "Your contractor submits the reinstatement Permit To Work in OneCalendar. Sub-permits ride along where needed.",
    "Reinstatement::Multi-Party Review by Changi Airport Group Stakeholders":
      "IFM and AES review the pack. OneCalendar issues the permit when they approve.",
    "Reinstatement::Pre-Reinstatement Works":
      "Hoarding goes in before works. Your Project Officer updates the directory with the closure.",
    "Reinstatement::Point of Sales Removal":
      "NEC removes point of sale. Confirm the date so sales reporting closes.",
    "Reinstatement::Structured Cabling Disconnection (Terminal 3)":
      "Disconnect T3 telephone lines at least 5 working days before the handover inspection.",
    "Reinstatement::Reinstatement Works":
      "Works run under the approved reinstatement permit. Same site rules as renovation.",
    "Reinstatement::Pre-Takeover Inspection":
      "IFM inspects the reinstated unit. Fix defects before handover.",
    "Reinstatement::Takeover Meeting":
      "Hand the unit and keys back to IFM. Keep your signed form — it starts the deposit release.",
    "Reinstatement::Post-Takeover Closure Announcement":
      "Your Project Officer sends the store closure email to stakeholders.",
    "Reinstatement::Security Deposit Release & Utility Bill Settlement":
      "Settle utility charges when Finance asks. The signed takeover form starts the deposit release.",
  },
  contractor: {
    "Tenancy Platform Onboarding::Set Up Systems Required for Works and Setup":
      "OneCalendar is CAG's permit platform for this unit. Tenant, brand and outlet records must exist before you apply.",
    "Pre-Kickoff::Kickoff Documents Gathered & Shared":
      "This pack is the rulebook for the design and permits. Read the Renovation Requirements before KickOff meeting.",
    "Pre-Kickoff::High-Level Design Review":
      "Get Design Management clearance before locking drawings when the fit-out is large or the unit is a duplex.",
    "Pre-Kickoff::Confirmation of Meeting Attendees":
      "This is the first site meeting. AES and IFM brief the unit. Bring drawings, not a blank site.",
    "Kickoff::Requirements & Plan Alignment":
      "At KickOff meeting, confirm site rules and permits for this unit. Leave with agreed actions.",
    "Renovation::Onboarding Guidelines Shared":
      "Create loading-bay access when planned works are certain. The pack lands after the IFM briefing.",
    "Post-Kickoff::Confirm Fire Safety Submission Route":
      "Ask your Qualified Person which fire permit applies before you prepare the permit pack.",
    "Design Review::Confirmation of Renovation Plans":
      "Get written design approval before permits. Do not start works before that.",
    "Permit Application::Permit Advisory & Tenancy Project Selection":
      "Select Tenancy Project in OneCalendar. Apply at least 2 weeks before works.",
    "Permit Application::Joint Site Inspection":
      "Book JSI with BMC before fire isolation permits. T1 and T3 book by link. T2 and T4 walk in.",
    "Permit Application::Submit Combined Permit To Work Application":
      "Submit the main permit and required sub-permits as one Permit To Work in OneCalendar.",
    "Permit Application::Qualified Person Endorsed Letter of Undertaking":
      "Email the QP letter if you take over hoarding or other items from the exiting tenant.",
    "Permit Application::Multi-Party Review by Changi Airport Group Stakeholders":
      "Revise and resubmit in OneCalendar if a reviewer asks. IFM issues the Permit To Work when approved.",
    "Permit Application::Requests / Permissions Outside OneCalendar":
      "Some permissions still go by email — kerbside, roads, structural. Email IFM so they do not block site start.",
    "Handover::Site Walkthrough, Technical Verification & Handover Sign Off":
      "Walk the unit with IFM when invited. The signed condition is the baseline at exit.",
    "Renovation::Integrated Facilities Management Pre-Renovation Briefing":
      "IFM walks you through the Renovation Requirements before works start.",
    "Renovation::Airport Passes & Hoarding Installation":
      "Works stay inside the hoarded area. Get airport passes, then install hoarding before any work starts.",
    "Renovation::Temporary Power Request":
      "Ask IFM for temporary power in OneCalendar if this unit has no permanent meter yet.",
    "Renovation::FSSD Notice of Approval Submission":
      "Submit the FSSD notice in OneCalendar when fire systems change.",
    "Renovation::QP Assessment: FSC / MAA / Temporary Fire Permit":
      "Ask your Qualified Person which fire permit applies before opening.",
    "Renovation::Renovation Works & Site Monitoring":
      "Works run under the approved Permit To Work. Noisy or dusty work is only 01:00–05:00.",
    "Renovation::Waterproofing Checks & Water Ponding Test":
      "Wet areas need a ponding test of at least 48 hours. Floor finishes go in only after IFM is satisfied.",
    "Renovation::Fire Safety Tests Verification":
      "AES checks public announcement, sprinkler, and power tests before opening.",
    "Renovation::Ceiling Inspection Sign-Off":
      "Check every ceiling panel touched, and the panels next to them. IFM and AES sign off.",
    "Renovation::Public Announcement System Testing":
      "IFM witnesses the public announcement test. Closed-door rooms need this.",
    "Renovation::Aircon Balancing Test Report":
      "The balancing report goes in OneCalendar before opening.",
    "Renovation::Kitchen Fire Suppression System Test":
      "AES checks the kitchen fire system where there is open flame or deep-frying.",
    "Renovation::Gas Leak Test":
      "AES checks the gas leak test. This is not the gas flooding test.",
    "Renovation::Total Gas Flooding System Test":
      "AES checks the Total Gas Flooding System in server or computer rooms.",
    "Renovation::As-Built Drawings Upload":
      "Upload as-builts in OneCalendar within three weeks of completion. They are needed again for the fire certificate and at exit.",
    "Renovation::Defects Rectification":
      "Fix defects CAG raises before opening.",
    "Renovation::Fire Safety Certificate / MAA / Temporary Fire Permit Submission":
      "The unit may not open until AES has the Fire Safety Certificate or Letter of Acknowledgement.",
    "Renovation::Pre-Opening Inspection":
      "Attend with IFM and AES. Arrange this at least 3 days before opening. A fail keeps the unit closed.",
    "Opening::Store Opening & Capex Verification":
      "Fix remaining defects from IFM before opening.",
    "Operations::Upcoming works":
      "Read works the Project Officer started for this unit. The agreed list lives in Works.",
    "Operations::Later renovation works":
      "Use this when the unit needs a new renovation after opening.",
    "Operations::Works after opening":
      "Use this if the unit needs to change after opening.",
    "Reinstatement::Unit Documents Gathered & Shared":
      "This pack says what the unit must return to.",
    "Reinstatement::Reinstatement Requirements & Plan Alignment":
      "IFM explains what the unit must be returned to. Takeovers need a signed Letter of Undertaking.",
    "Reinstatement::Reinstatement Permit Submission via OneCalendar":
      "Submit the reinstatement Permit To Work in OneCalendar. Sub-permits ride along where needed.",
    "Reinstatement::Multi-Party Review by Changi Airport Group Stakeholders":
      "Revise and resubmit in OneCalendar if a reviewer asks. IFM and AES issue the permit when they approve.",
    "Reinstatement::Pre-Reinstatement Works":
      "Install hoarding before reinstatement works start. Same hoarding rules as renovation.",
    "Reinstatement::Structured Cabling Disconnection (Terminal 3)":
      "Disconnect T3 telephone lines at least 5 working days before the handover inspection.",
    "Reinstatement::Reinstatement Works":
      "Works run under the approved reinstatement permit. Same site rules as renovation.",
    "Reinstatement::Pre-Takeover Inspection":
      "IFM inspects the reinstated unit. Fix defects before handover.",
  },
  officer: {
    "Tenancy Platform Onboarding::Set Up Systems Required for Works and Setup":
      "OneCalendar is CAG's permit platform. No renovation paperwork can move until these records and accesses exist.",
    "Tenancy Platform Onboarding::Set Up Systems Required for Staff":
      "This applies when the outlet faces travelling passengers.",
    "Tenancy Platform Onboarding::Set Up WebEpic Account":
      "Landside concessions only. The tenant applies on WebEpic.",
    "Tenancy Platform Onboarding::Point of Sales Setup":
      "NEC installs point of sale for retail and F&B units.",
    "Pre-Kickoff::Kickoff Documents Gathered & Shared":
      "Assemble drawings and the provision list from Newforma, Master Planning, and IFM. Tenant and contractor get the pack before KickOff meeting.",
    "Pre-Kickoff::Check Change of Use with URA":
      "If this unit's use will change, URA must approve it before works start.",
    "Pre-Kickoff::High-Level Design Review":
      "Route the first concept to Design Management before KickOff meeting when the fit-out is large or the unit is a duplex.",
    "Pre-Kickoff::Confirmation of Meeting Attendees":
      "This is the first site meeting. Confirm attendees. Airport Planning sets it, or you do for Landside Concessions.",
    "Kickoff::Requirements & Plan Alignment":
      "Introduce the room. AES and IFM brief the unit. Record the agreed actions.",
    "Renovation::Onboarding Guidelines Shared":
      "Send the pack when planned works are certain — after the IFM briefing, before works start.",
    "Post-Kickoff::Confirm Fire Safety Submission Route":
      "Confirm the fire permit route the Qualified Person named before the contractor prepares the pack.",
    "Design Review::Confirmation of Renovation Plans":
      "Review the pack and route it to Design Management. Permits and works wait on written approval.",
    "Permit Application::Permit Advisory & Tenancy Project Selection":
      "Tell the contractor which permits apply. They select Tenancy Project in OneCalendar at least 2 weeks before works.",
    "Permit Application::Joint Site Inspection":
      "BMC must confirm which fire systems the works affect. Isolation permits will not be approved without this.",
    "Permit Application::Submit Combined Permit To Work Application":
      "Endorse the pack for completeness. All remaining permits go in as one Permit To Work.",
    "Permit Application::Qualified Person Endorsed Letter of Undertaking":
      "Needed when the incoming tenant takes over items, most often hoarding.",
    "Permit Application::Multi-Party Review by Changi Airport Group Stakeholders":
      "Endorse the pack, then it routes in OneCalendar. IFM issues the Permit To Work when approved.",
    "Permit Application::Requests / Permissions Outside OneCalendar":
      "Some permissions still go by email — kerbside, roads, structural. Check they do not block site start.",
    "Handover::Site Walkthrough, Technical Verification & Handover Sign Off":
      "Schedule handover for the tenancy start date. IFM retrieves keys from the Key Management System and records the unit condition.",
    "Renovation::Integrated Facilities Management Pre-Renovation Briefing":
      "IFM walks the contractor through the Renovation Requirements before works start.",
    "Renovation::Airport Passes & Hoarding Installation":
      "Works stay inside the hoarded area. Hoarding and floor protection go in before any work starts.",
    "Renovation::Temporary Power Request":
      "Needed only if this unit has no permanent meter yet.",
    "Renovation::FSSD Notice of Approval Submission":
      "Check the FSSD notice in OneCalendar when fire systems change.",
    "Renovation::QP Assessment: FSC / MAA / Temporary Fire Permit":
      "Check the Qualified Person confirmed FSC, MAA, or Temporary Fire Permit before opening.",
    "Renovation::Renovation Works & Site Monitoring":
      "Works run under the approved Permit To Work. You and IFM can issue a Stop Work Order.",
    "Renovation::Waterproofing Checks & Water Ponding Test":
      "Wet areas need a ponding test of at least 48 hours. Floor finishes go in only after IFM is satisfied.",
    "Renovation::Fire Safety Tests Verification":
      "Notify AES when the tests are ready. AES checks public announcement, sprinkler, and power tests with BMC.",
    "Renovation::Ceiling Inspection Sign-Off":
      "IFM and AES sign off every ceiling panel touched, and the panels next to them.",
    "Renovation::Public Announcement System Testing":
      "IFM witnesses the public announcement test. Closed-door rooms need this.",
    "Renovation::Aircon Balancing Test Report":
      "The balancing report goes in OneCalendar before opening.",
    "Renovation::Kitchen Fire Suppression System Test":
      "AES checks the kitchen fire system where there is open flame or deep-frying.",
    "Renovation::Gas Leak Test":
      "AES checks the gas leak test. This is not the gas flooding test.",
    "Renovation::Total Gas Flooding System Test":
      "AES checks the Total Gas Flooding System in server or computer rooms.",
    "Renovation::As-Built Drawings Upload":
      "As-builts are due in OneCalendar within three weeks of completion. They are needed again for the fire certificate and at exit.",
    "Renovation::Defects Rectification":
      "Check works defects are fixed before pre-opening.",
    "Renovation::Fire Safety Certificate / MAA / Temporary Fire Permit Submission":
      "The unit may not open until AES has the Fire Safety Certificate or Letter of Acknowledgement.",
    "Renovation::Pre-Opening Inspection":
      "Schedule with IFM and AES at least 3 days before opening. A fail keeps the unit closed.",
    "Renovation::Opening Announcement & Directory Update":
      "Announce the opening and publish the Tenant Directory listing before opening day.",
    "Opening::Opening Document Submission":
      "Close the document loop with IFM. As-builts sit in OneCalendar. The Certificate of Fitness goes in TOPAZ and renews every year.",
    "Opening::FSSD Notice of Approval Submission":
      "Check the tenant FSSD notice in OneCalendar as part of project close-out.",
    "Opening::Store Opening & Capex Verification":
      "Send the opening email. Verify the renovation invoice against the capex commitment.",
    "Opening::Point of Sales Data Reporting":
      "Pull sales from Customer Discovery Insights and share the report with section heads.",
    "Opening::TOPAZ Account Setup":
      "Create the tenant TOPAZ account and the report list they owe. TOPAZ is where servicing reports go for the rest of the tenancy.",
    "Operations::Regular Servicing Reporting":
      "Check IFM approved the reports named for this fit-out in TOPAZ.",
    "Operations::Upcoming works":
      "Start a job when the unit needs a refresh or fix. The agreed list lives in Works.",
    "Operations::Later renovation works":
      "Use this when the unit needs a new renovation after opening.",
    "Operations::Works after opening":
      "Use this if they need to change the unit after opening.",
    "Operations::Pest Control Reporting":
      "F&B units lodge pest control reports in TOPAZ.",
    "Operations::Air Handling Unit Servicing Reporting":
      "Check the air handling report in TOPAZ when the tenant maintains the unit.",
    "Operations::Annual Fire Safety Declaration & Training":
      "Check AES tracked the yearly fire declaration. Miss it and AES inspects the unit, chargeable.",
    "Operations::Monthly Sales Declaration":
      "Check monthly sales in the Lease Management System.",
    "Reinstatement::Unit Documents Gathered & Shared":
      "Assemble the provision list, base-build drawings from Newforma or Master Planning, and M&E drawings from IFM. IFM checks keys.",
    "Reinstatement::Reinstatement Requirements & Plan Alignment":
      "Schedule the meeting. IFM explains what the unit must return to. Link incoming and outgoing tenants if there is a takeover.",
    "Reinstatement::Reinstatement Permit Submission via OneCalendar":
      "The contractor submits the reinstatement Permit To Work in OneCalendar. Sub-permits ride along where needed.",
    "Reinstatement::Multi-Party Review by Changi Airport Group Stakeholders":
      "IFM and AES review the pack. OneCalendar issues the permit when they approve.",
    "Reinstatement::Pre-Reinstatement Works":
      "Update the Tenant Directory with the closure and notify stakeholders. Hoarding goes in before works.",
    "Reinstatement::Point of Sales Removal":
      "Stay copied on point of sale removal with NEC so sales reporting closes.",
    "Reinstatement::Structured Cabling Disconnection (Terminal 3)":
      "T3 telephone lines disconnect at least 5 working days before the handover inspection.",
    "Reinstatement::Reinstatement Works":
      "Works run under the approved reinstatement permit. You can issue a Stop Work Order.",
    "Reinstatement::Pre-Takeover Inspection":
      "Schedule the inspection with IFM. Defects must be fixed before handover.",
    "Reinstatement::Takeover Meeting":
      "Get a copy of the signed takeover form. It starts the security deposit release.",
    "Reinstatement::Post-Takeover Closure Announcement":
      "Send the store closure email to stakeholders.",
    "Reinstatement::Security Deposit Release & Utility Bill Settlement":
      "Start security deposit release with Finance on the signed takeover form.",
  },
};
