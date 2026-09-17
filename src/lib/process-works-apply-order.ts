import type { Role } from "@/lib/app-state";

export type WorksApplyBand = "before" | "after";

type OrderRow = {
  band: WorksApplyBand;
  rank: number;
  why: Record<Role, string>;
};

const BEFORE = {
  "Change of Use": {
    band: "before" as const,
    rank: 5,
    why: {
      tenant:
        "Wait for the URA check before the use is treated as locked.",
      contractor:
        "Wait for the Project Officer’s URA check before you treat the use as locked.",
      officer: "Check Change of Use with URA before the use is treated as locked.",
    },
  },
  "First design concept": {
    band: "before" as const,
    rank: 10,
    why: {
      tenant:
        "Send the first concept and wait for clearance before your contractor applies.",
      contractor:
        "Written design clearance first — do not apply until this is in.",
      officer: "Route the concept. Permits wait on written clearance.",
    },
  },
  "Fire permit route": {
    band: "before" as const,
    rank: 20,
    why: {
      tenant:
        "Your contractor’s Qualified Person confirms the route before the pack is locked.",
      contractor:
        "Ask your Qualified Person which fire permit applies before you lock the pack.",
      officer:
        "Check the Qualified Person named the fire route before the pack is locked.",
    },
  },
  "Fire permit assessment": {
    band: "before" as const,
    rank: 21,
    why: {
      tenant:
        "Your contractor’s Qualified Person confirms the route before the pack is locked.",
      contractor:
        "Ask your Qualified Person which fire permit applies before you lock the pack.",
      officer:
        "Check the Qualified Person named the fire route before the pack is locked.",
    },
  },
  "Joint site inspection": {
    band: "before" as const,
    rank: 30,
    why: {
      tenant:
        "Your contractor books and walks this before Hot Work or Fire Alarm Isolation can be endorsed.",
      contractor:
        "Book and walk this before Hot Work or Fire Alarm Isolation can be endorsed.",
      officer:
        "Check this is booked and walked before you endorse Hot Work or Fire Alarm Isolation.",
    },
  },
  "Qualified Person letter": {
    band: "before" as const,
    rank: 40,
    why: {
      tenant:
        "Your contractor emails this before permit review starts.",
      contractor: "Email the QP letter before permit review starts.",
      officer: "Check the QP letter is in before permit review starts.",
    },
  },
  "BIM model": {
    band: "before" as const,
    rank: 50,
    why: {
      tenant:
        "Your contractor submits the model with the pack when the works need it.",
      contractor: "Submit the model with the pack when the works need it.",
      officer: "Check the BIM model is in with the pack when the works need it.",
    },
  },
} satisfies Record<string, OrderRow>;

const AFTER = {
  "FSSD notice of approval": {
    band: "after" as const,
    rank: 10,
    why: {
      tenant:
        "Your contractor submits this after the application — not a gate on applying.",
      contractor: "Submit this after the application — not a gate on applying.",
      officer: "This lands after the application — not a submit gate.",
    },
  },
  "Opening FSSD notice": {
    band: "after" as const,
    rank: 11,
    why: {
      tenant: "This is for opening — not a gate on applying.",
      contractor: "This is for opening — not a gate on applying.",
      officer: "This is for opening — not a submit gate.",
    },
  },
  "Waterproofing and ponding": {
    band: "after" as const,
    rank: 20,
    why: {
      tenant:
        "IFM walks this during works — not a gate on applying.",
      contractor: "Walk this with IFM during works — not a gate on applying.",
      officer: "IFM runs this during works — not a submit gate.",
    },
  },
  "Fire safety certificate": {
    band: "after" as const,
    rank: 30,
    why: {
      tenant:
        "Have this in hand before opening — not a gate on applying.",
      contractor:
        "Have this in hand before opening — not a gate on applying.",
      officer: "This is before opening — not a submit gate.",
    },
  },
} satisfies Record<string, OrderRow>;

const FALLBACK: OrderRow = {
  band: "before",
  rank: 80,
  why: {
    tenant: "This still needs to happen before or with the application.",
    contractor: "Do this before or with the application.",
    officer: "Check this before or with the application.",
  },
};

const ORDER: Record<string, OrderRow> = { ...BEFORE, ...AFTER };

export function worksApplyOrderFor(title: string): OrderRow {
  return ORDER[title] ?? FALLBACK;
}

export function worksApplyWhy(title: string, role: Role): string {
  return worksApplyOrderFor(title).why[role];
}

export function worksApplyIntro(role: Role): string {
  if (role === "tenant") {
    return "This is the order your contractor follows so permits can be submitted before the longest apply-by.";
  }
  if (role === "officer") {
    return "This is the order to submit on time. The longest apply-by in the pack governs.";
  }
  return "Do these in this order so the OneCalendar application can go in before the longest apply-by.";
}

export function worksApplyStepCopy(role: Role, governingLabel?: string) {
  const lead = governingLabel
    ? role === "tenant"
      ? `Your contractor submits these as one Tenancy Project. The longest apply-by in this pack is ${governingLabel}.`
      : role === "officer"
        ? `They select Tenancy Project and fill these work types in one application. The longest apply-by in this pack is ${governingLabel}.`
        : `Select Tenancy Project, then fill these work types in one application. Submit at least ${governingLabel} — that is the longest apply-by in this pack.`
    : role === "tenant"
      ? "These are the permit types for this job. They go in as one Tenancy Project application — you do not submit these yourself."
      : role === "officer"
        ? "Advise which of these apply, then they select Tenancy Project and fill the matching work types in one application."
        : "Select Tenancy Project, then fill these work types in one application — not as a new job for each row.";
  return {
    title:
      role === "contractor"
        ? "Apply these permits in OneCalendar"
        : "Contractor applies these in OneCalendar",
    lead,
  };
}
