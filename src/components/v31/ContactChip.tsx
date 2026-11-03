import { Link } from "react-router-dom";
import { Mail, MessageSquare, Phone } from "lucide-react";
import type { Role } from "@/lib/app-state";
import {
  BMC_CONTACTS,
  BMC_SERVICES,
  type BmcContact,
  type BmcService,
  type Unit,
} from "@/lib/tenancy-data";
import contactsIcon from "@/assets/figma-setup/contacts.svg";

export const BMC_NAME = "Building Maintenance Contractor";

type StepRef = { id: string; title: string };

/** Which BMC teams each step needs, and what BMC does there, per reader. Match is on step id or title. */
const BMC_STEPS: {
  match: RegExp;
  services: (unit: Unit | null | undefined) => BmcService[];
  lead: Record<Role, string>;
}[] = [
  {
    match: /joint[\s-]site[\s-]inspection|\bjsi\b/i,
    services: () => ["jsi", "fire-alarm"],
    lead: {
      contractor: "Book the Joint Site Inspection and walk the zone together. The Fire Alarm team confirms which zones your works affect.",
      tenant: "Your contractor books the Joint Site Inspection with them. Reach out only if you need to.",
      officer: "They walk the zone with the contractor and endorse the JSI form before you endorse isolation.",
    },
  },
  {
    match: /multi[\s-]party[\s-]review/i,
    services: () => ["fire-alarm", "building"],
    lead: {
      contractor: "They review your Hot Work and Fire Alarm Isolation permits first. Reach out if they ask you to revise.",
      tenant: "They review the Hot Work and Fire Alarm Isolation permits. Your contractor handles any changes.",
      officer: "They review Hot Work and Fire Alarm Isolation permits before AES and IFM.",
    },
  },
  {
    match: /public[\s-]announcement|\bpa[\s-]system/i,
    services: () => ["pa"],
    lead: {
      contractor: "Arrange the PA test with the PA team before IFM witnesses it.",
      tenant: "Your contractor arranges the PA test with them.",
      officer: "They run the PA test with the contractor before IFM witnesses it.",
    },
  },
  {
    match: /pre[\s-]opening[\s-]inspection/i,
    services: (unit) =>
      unit?.tenancyType === "F&B" ? ["pa", "fire-alarm", "kwp"] : ["pa", "fire-alarm"],
    lead: {
      contractor: "Reach the team for each system checked before opening.",
      tenant: "Reach the team for each system checked before opening.",
      officer: "The teams that sign off building systems before opening.",
    },
  },
  {
    match: /servicing[\s-]report/i,
    services: (unit) => (unit?.tenancyType === "F&B" ? ["kwp"] : []),
    lead: {
      contractor: "Book kitchen waste pipe flushing with them.",
      tenant: "Book kitchen waste pipe flushing with them before you submit the report.",
      officer: "They flush kitchen waste pipes for F&B units.",
    },
  },
];

/** BMC teams for this step. Steps that list BMC with no mapping get the Building Team. */
export function bmcServicesFor(
  step: StepRef,
  unit: Unit | null | undefined,
  listsBmc: boolean,
): BmcService[] {
  const key = `${step.id} ${step.title}`;
  const row = BMC_STEPS.find((entry) => entry.match.test(key));
  if (row) return row.services(unit);
  return listsBmc ? ["building"] : [];
}

export function bmcLead(step: StepRef, role: Role) {
  const key = `${step.id} ${step.title}`;
  const row = BMC_STEPS.find((entry) => entry.match.test(key));
  return row ? row.lead[role] : `Reach out to them about the ${step.title} step.`;
}

/** One contact per service for this unit's terminal. */
export function bmcContactsFor(
  unit: Unit | null | undefined,
  services: BmcService[] = BMC_SERVICES.map((service) => service.id),
): BmcContact[] {
  return services
    .map((service) => {
      const team = BMC_CONTACTS.filter((row) => row.service === service);
      return (unit && team.find((row) => row.terminals.includes(unit.terminal))) ?? team[0];
    })
    .filter((row): row is BmcContact => Boolean(row));
}

export function bmcServiceLabel(service: BmcService) {
  return BMC_SERVICES.find((row) => row.id === service)?.label ?? service;
}

function compact(phone: string) {
  return phone.replace(/\s+/g, "");
}

/** People chip that links to the BMC section of the Contacts page. */
export function BmcContactChip({
  size = "sm",
  className,
}: {
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <Link
      to="/contacts#bmc"
      aria-label={`Contact ${BMC_NAME}`}
      title={`Contact ${BMC_NAME}`}
      className={
        className ??
        (size === "md"
          ? "inline-flex h-6 w-fit max-w-full items-center gap-1 rounded-[var(--radius-sm)] bg-grey-100 px-2 text-left text-xs leading-4 font-bold text-grey-700 hover:bg-grey-200 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]"
          : "inline-flex h-6 w-fit max-w-full items-center gap-1 rounded-full border border-grey-200 bg-white px-2 text-left text-xs leading-4 font-bold text-grey-700 hover:border-grey-300 hover:bg-grey-50 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]")
      }
    >
      <span
        aria-hidden
        className="h-3 w-3.5 shrink-0 bg-current"
        style={{
          WebkitMaskImage: `url("${contactsIcon}")`,
          maskImage: `url("${contactsIcon}")`,
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
        }}
      />
      <span className="min-w-0 truncate">{BMC_NAME}</span>
    </Link>
  );
}

const ACTION =
  "grid size-10 shrink-0 place-items-center rounded-full bg-grey-50 text-black hover:bg-grey-75 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-purple-600)]";

export function BmcContactActions({ person }: { person: BmcContact }) {
  return (
    <div className="flex shrink-0 gap-2">
      {person.phone ? (
        <>
          <a href={`tel:${compact(person.phone)}`} aria-label={`Call ${person.name}`} className={ACTION}>
            <Phone className="size-4" aria-hidden />
          </a>
          <a href={`sms:${compact(person.phone)}`} aria-label={`Message ${person.name}`} className={ACTION}>
            <MessageSquare className="size-4" aria-hidden />
          </a>
        </>
      ) : null}
      <a href={`mailto:${person.email}`} aria-label={`Email ${person.name}`} className={ACTION}>
        <Mail className="size-4" aria-hidden />
      </a>
    </div>
  );
}
