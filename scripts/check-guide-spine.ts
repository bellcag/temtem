import { PHASES } from "../src/lib/tenancy-data.ts";
import { pathJourney, spineStepNames } from "../src/lib/process-guide.ts";
type Role = "tenant" | "contractor" | "officer";

const UNIT = { tenancyType: "F&B", terminal: "T3" };
const ROLES: Role[] = ["tenant", "contractor", "officer"];

function names(role: Role, phaseId: string, showFull = false) {
  const phase = PHASES.find((p) => p.id === phaseId)!;
  return pathJourney(
    phase,
    role,
    UNIT.tenancyType,
    UNIT.terminal,
    showFull,
  ).map((s) => `${s.index}. ${s.name}`);
}

let failed = 0;
function assert(cond: boolean, msg: string) {
  if (!cond) {
    failed += 1;
    console.error(`FAIL  ${msg}`);
  } else {
    console.log(`ok    ${msg}`);
  }
}

for (const phase of PHASES) {
  const byRole = Object.fromEntries(
    ROLES.map((r) => [r, names(r, phase.id)]),
  ) as Record<Role, string[]>;

  const spine = spineStepNames(phase, UNIT.tenancyType, UNIT.terminal, false);

  if (phase.id === "operate") {
    assert(
      byRole.contractor.length === 0,
      "Operate is empty for contractor",
    );
    assert(
      byRole.tenant.join("|") === byRole.officer.join("|"),
      "Operate numbers match for tenant and officer",
    );
    assert(
      byRole.tenant.map((s) => s.replace(/^\d+\. /, "")).join("|") ===
        spine.join("|"),
      "Operate tenant/officer list is the unit spine",
    );
  } else {
    assert(
      byRole.tenant.join("|") === byRole.officer.join("|"),
      `${phase.name}: tenant numbers match officer`,
    );
    assert(
      byRole.contractor.join("|") === byRole.officer.join("|"),
      `${phase.name}: contractor numbers match officer`,
    );
    assert(
      byRole.tenant.map((s) => s.replace(/^\d+\. /, "")).join("|") ===
        spine.join("|"),
      `${phase.name}: list is the unit spine`,
    );
  }

  const catalogue = spineStepNames(
    phase,
    UNIT.tenancyType,
    UNIT.terminal,
    true,
  );
  if (catalogue.length !== spine.length) {
    console.log(
      `note  ${phase.name}: Full process has ${catalogue.length} steps vs unit ${spine.length}`,
    );
  }

  console.log(`\n${phase.name} unit path (${byRole.officer.length} steps)`);
  for (const line of byRole.officer) console.log(`  ${line}`);
  console.log("");
}

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log("All spine numbering checks passed.");
