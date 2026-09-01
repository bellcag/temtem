import type { ClassifiedStep } from "@/lib/process-guide";

/** OneCalendar permit types that go in the same Permit to Work application. */
export const PTW_PACK_HOST = "Submit Combined Permit To Work Application";

export const PTW_PACK_TITLE = "Renovation permit application";
export const PTW_PACK_TYPES_LABEL = "Renovation works permit types";

const PTW_PACK_NAMES = new Set([
  "Renovation (Terminal) Permit",
  "Ceiling Permit",
  "Fire Alarm Isolation / Sprinkler Draining Permit",
  "Hotwork Permit",
  "Architectural Changes & Authority Approvals",
  "MEP Changes Permit",
  "BIM Model Submission",
  "Structured Cabling (T3 Tenant Telephone Lines) Permit",
  "Structured Cabling Indoor/Outdoor Permit",
  "Telco Cabling Permit",
  "Catwalk Access Permit (Terminal 4)",
  "Renovation (Terminal – Additional) Permit",
  "Skytrain Permit-To-Work",
  "Airside Work Permit",
  "T4 Transit Area Security Requirements",
  PTW_PACK_HOST,
]);

const JSI_NAME = "Joint Site Inspection";

export function isPtwPackStep(name: string) {
  return PTW_PACK_NAMES.has(name);
}

export function foldPtwPackSteps(steps: ClassifiedStep[]): {
  classified: ClassifiedStep;
  packMembers?: ClassifiedStep[];
}[] {
  const pack = steps.filter((s) => isPtwPackStep(s.step.name));
  if (pack.length === 0) {
    return steps.map((classified) => ({ classified }));
  }
  const host = pack.find((s) => s.step.name === PTW_PACK_HOST) ?? pack[0];
  const members = pack.filter((s) => s.step.name !== host.step.name);
  // Catalogue: JSI sits before FAI / Hot Work. Those types fold into the pack,
  // so JSI always goes immediately before the application — never last.
  const jsi = steps.find((s) => s.step.name === JSI_NAME) ?? null;
  const out: { classified: ClassifiedStep; packMembers?: ClassifiedStep[] }[] =
    [];
  let inserted = false;
  for (const classified of steps) {
    if (classified.step.name === JSI_NAME) continue;
    if (isPtwPackStep(classified.step.name)) {
      if (inserted) continue;
      if (jsi) out.push({ classified: jsi });
      out.push({
        classified: host,
        packMembers: members,
      });
      inserted = true;
      continue;
    }
    out.push({ classified });
  }
  if (jsi && !inserted) out.push({ classified: jsi });
  return out;
}
