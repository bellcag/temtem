import type { Role } from "@/lib/app-state";

/**
 * Prototype only. One public system per sitting, one URL, only the roles
 * who open it. Meetings and Works doors stay unlinkable.
 * Stub `/apps` until the real registry exists.
 *
 * Links live on the Systems chips — never inline in the fact sentence.
 */
const SYSTEMS: {
  name: string;
  href: string;
  external?: boolean;
  roles: Role[];
}[] = [
  {
    name: "Airport Pass In Changi",
    href: "/apps",
    roles: ["contractor", "officer"],
  },
  {
    name: "Lease Management System",
    href: "/apps",
    roles: ["tenant", "officer"],
  },
  {
    name: "Fire Safety Portal",
    href: "/apps",
    roles: ["tenant", "officer"],
  },
  {
    name: "OneCalendar",
    href: "https://onecalendar.changiairport.com",
    external: true,
    roles: ["tenant", "contractor", "officer"],
  },
  {
    name: "TOPAZ",
    href: "/apps",
    roles: ["tenant", "officer"],
  },
];

/** Exit works: Tenant does not apply in OneCalendar. */
const CARD_ROLES: Partial<Record<string, Partial<Record<string, Role[]>>>> = {
  "exit-works": {
    OneCalendar: ["contractor", "officer"],
  },
};

/** Blueprint labels that are the same sitting as the name in the sentence. */
const RESOURCE_ALIASES: Record<string, string[]> = {
  "Fire Safety Portal": [
    "Fire Safety Portal",
    "fire safety portal",
    "Tenant Fire Safety Declaration Portal",
    "Tenant Fire Safety Portal",
  ],
};

export type V28SystemChip = {
  label: string;
  href?: string;
  external?: boolean;
};

function matchSystem(label: string) {
  const lower = label.toLowerCase();
  const direct = SYSTEMS.find((row) => row.name === label);
  if (direct) return direct;
  for (const [name, aliases] of Object.entries(RESOURCE_ALIASES)) {
    if (aliases.some((alias) => alias.toLowerCase() === lower)) {
      return SYSTEMS.find((row) => row.name === name) ?? null;
    }
  }
  return null;
}

function rolesFor(cardId: string | undefined, name: string, fallback: Role[]) {
  if (!cardId) return fallback;
  return CARD_ROLES[cardId]?.[name] ?? fallback;
}

/**
 * Keep every system on the Systems strip. Fact text may still name the tool;
 * the clickable open lives here, not in the sentence.
 */
export function v28SystemsNotInFact(
  systems: { label: string }[],
  _fact: string,
  role?: Role,
  cardId?: string,
): V28SystemChip[] {
  return systems.map((system) => {
    const hit = matchSystem(system.label);
    if (!hit) return { label: system.label, href: "/apps" };
    const allowed = rolesFor(cardId, hit.name, hit.roles);
    if (role && !allowed.includes(role)) return { label: system.label };
    return {
      label: system.label,
      href: hit.href,
      external: hit.external,
    };
  });
}

/** Fact stays plain text. Systems open from the Systems section only. */
export function v28LinkedFact(text: string): string {
  return text;
}
