import type { Role } from "@/lib/app-state";
import type { Unit } from "@/lib/tenancy-data";

export type WorksStepGuide = {
  who: string;
  how: string[];
};

const BECAUSE = {
  isolation: "Work that could set off alarms or sprinklers",
  ceiling: "Open / work above ceiling panels",
  roof: "Work on the roof",
} as const;

const GUIDE: Record<
  string,
  {
    who: Record<Role, string>;
    how: Record<Role, string>;
  }
> = {
  "Change of Use": {
    who: {
      tenant: "Your Project Officer. You do not file this.",
      contractor: "The Project Officer. You do not file this.",
      officer: "You check this with URA.",
    },
    how: {
      tenant:
        "Your Project Officer checks Change of Use with URA before the use is treated as locked.",
      contractor:
        "Wait for the Project Officer’s Change of Use check with URA. Do not treat the use as locked.",
      officer: "Check Change of Use with URA before the use is treated as locked.",
    },
  },
  "First design concept": {
    who: {
      tenant: "You send the first concept. Design Management reviews it.",
      contractor:
        "The tenant and Design Management. You do not submit the concept.",
      officer: "You route the concept to Design Management.",
    },
    how: {
      tenant:
        "Send a first design concept to your Project Officer. Wait for Design Management feedback before locking drawings.",
      contractor:
        "Wait for the tenant’s first concept to clear. Do not treat drawings as locked yet.",
      officer:
        "Route the first concept to Design Management, then share the feedback with the tenant.",
    },
  },
  "Fire Safety Certificate": {
    who: {
      tenant:
        "Your contractor’s Qualified Person confirms the route. You stay the Applicant.",
      contractor: "Your Qualified Person / Professional Engineer.",
      officer: "The Qualified Person confirms the route. You do not decide it.",
    },
    how: {
      tenant:
        "Your contractor’s Qualified Person confirms whether a Fire Safety Certificate, Minor Addition & Alteration, or Temporary Fire Permit is needed.",
      contractor:
        "Engage a Qualified Person / Professional Engineer to confirm whether a Fire Safety Certificate, Minor Addition & Alteration, or Temporary Fire Permit applies.",
      officer:
        "Check the Qualified Person confirmed whether a Fire Safety Certificate, Minor Addition & Alteration, or Temporary Fire Permit applies.",
    },
  },
  "Joint site inspection": {
    who: {
      tenant: "Your contractor books and walks this. You do not book it.",
      contractor: "You book this and walk it.",
      officer:
        "The contractor books it. You check it is booked — you do not run the walk.",
    },
    how: {
      tenant: "",
      contractor: "",
      officer: "",
    },
  },
  "BIM model": {
    who: {
      tenant: "Your contractor submits this. You do not file the model.",
      contractor: "You submit the BIM model for this job.",
      officer: "You check the BIM model is in.",
    },
    how: {
      tenant:
        "Your contractor submits a BIM model when the works add or remove structural walls, or change M&E outside the unit. Interior-only partitions, flooring, ceiling and lighting do not need BIM.",
      contractor:
        "Submit a BIM model (proposed, then as-built) if the works add or remove full-height concrete or structural walls, or change M&E services outside the unit. Interior-only partitions, flooring, ceiling and lighting do not need BIM.",
      officer:
        "Check the BIM model is in for structural walls or M&E outside the unit. Interior-only fit-out does not need BIM.",
    },
  },
  "Qualified Person letter": {
    who: {
      tenant: "Your contractor emails this to your Project Officer.",
      contractor: "You email this to your Project Officer.",
      officer: "The contractor emails this to you.",
    },
    how: {
      tenant:
        "Your contractor emails the QP-endorsed Letter of Undertaking to your Project Officer.",
      contractor:
        "Email the QP-endorsed Letter of Undertaking to your Project Officer.",
      officer:
        "The contractor emails you the QP-endorsed Letter of Undertaking.",
    },
  },
  "Waterproofing and ponding": {
    who: {
      tenant: "IFM walks this with your contractor. You do not book IFM.",
      contractor: "You walk this with IFM.",
      officer: "IFM runs this. You do not run the ponding test.",
    },
    how: {
      tenant:
        "IFM checks waterproofing and witnesses the ponding test with your contractor.",
      contractor:
        "Walk waterproofing checks with IFM, then do the ponding test with IFM as witness.",
      officer:
        "IFM checks waterproofing and witnesses the ponding test with the contractor.",
    },
  },
  "FSSD notice of approval": {
    who: {
      tenant: "Your contractor submits this. You do not file it.",
      contractor: "You submit this in OneCalendar.",
      officer: "The contractor submits this. You check it is in.",
    },
    how: {
      tenant:
        "Your contractor submits the FSSD Notice of Approval in OneCalendar.",
      contractor: "Submit the FSSD Notice of Approval in OneCalendar.",
      officer:
        "Check the contractor submitted the FSSD Notice of Approval in OneCalendar.",
    },
  },
  "Structured cabling disconnection": {
    who: {
      tenant: "Your contractor disconnects this before handover.",
      contractor: "You disconnect this before handover.",
      officer: "The contractor disconnects this. You check it is done.",
    },
    how: {
      tenant:
        "Your contractor disconnects structured cabling before handover.",
      contractor:
        "Disconnect structured cabling before handover. On T3, submit the STC disconnect request at least five working days before the handover inspection, with the reinstatement Works Permit and as-builts.",
      officer:
        "Check structured cabling is disconnected before handover. On T3, the STC request is five working days before the inspection.",
    },
  },
};

function jsiHow(role: Role, because: string[]): string[] {
  const lines: string[] = [];
  const hasIsolation = because.includes(BECAUSE.isolation);
  const hasCeiling = because.includes(BECAUSE.ceiling);
  const hasRoof = because.includes(BECAUSE.roof);
  const any = hasIsolation || hasCeiling || hasRoof;

  if (role === "contractor") {
    if (hasIsolation) {
      lines.push(
        "Book a Joint Site Inspection slot with Building Maintenance. Walk the zone with them and complete the JSI form. Isolation will not be approved without this walk, even if the works are urgent.",
      );
    }
    if (hasCeiling) {
      lines.push(
        "Arrange joint inspection with Facility Management before, during and after ceiling works in common areas. Sign the ceiling-condition checklist.",
      );
    }
    if (hasRoof) {
      lines.push(
        "Arrange joint inspection with Facility Management for roof works. Authority approval and Auxiliary Police escort may also be needed.",
      );
    }
    if (!any) {
      lines.push(
        "Book a Joint Site Inspection slot with Building Maintenance and complete the walk before the related permit can be endorsed.",
      );
    }
    return lines;
  }

  if (role === "tenant") {
    if (hasIsolation) {
      lines.push(
        "Your contractor books the walk with Building Maintenance and completes the JSI form. You do not book this. Isolation cannot be approved without it.",
      );
    }
    if (hasCeiling) {
      lines.push(
        "Your contractor arranges the ceiling walk with Facility Management. If they skip it, they repair defects found later.",
      );
    }
    if (hasRoof) {
      lines.push(
        "Your contractor arranges the roof walk with Facility Management.",
      );
    }
    if (!any) {
      lines.push(
        "Your contractor books the joint site inspection. You do not book this.",
      );
    }
    return lines;
  }

  if (hasIsolation) {
    lines.push(
      "Confirm the contractor booked Building Maintenance and the JSI form is endorsed before you endorse isolation. You cannot waive this for urgency.",
    );
  }
  if (hasCeiling) {
    lines.push(
      "The contractor arranges the ceiling walk with Facility Management and signs the checklist. You do not run this inspection.",
    );
  }
  if (hasRoof) {
    lines.push(
      "The contractor arranges the roof walk with Facility Management. You do not run this inspection.",
    );
  }
  if (!any) {
    lines.push(
      "Confirm the joint site inspection is booked before you endorse the related work.",
    );
  }
  return lines;
}

export function worksStepGuideFor(
  name: string,
  role: Role,
  because: string[] = [],
  unit?: Unit,
): WorksStepGuide | null {
  const row = GUIDE[name];
  if (!row) return null;
  if (name === "Joint site inspection") {
    return { who: row.who[role], how: jsiHow(role, because) };
  }
  if (name === "Structured cabling disconnection" && unit?.terminal !== "T3") {
    return {
      who: row.who[role],
      how: [
        role === "contractor"
          ? "Disconnect structured cabling before handover."
          : role === "tenant"
            ? "Your contractor disconnects structured cabling before handover."
            : "Check structured cabling is disconnected before handover.",
      ],
    };
  }
  return { who: row.who[role], how: [row.how[role]] };
}
