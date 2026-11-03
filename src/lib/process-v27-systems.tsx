import type { Role } from "@/lib/app-state";
import {
  v28LinkedFact,
  v28SystemsNotInFact,
  type V28SystemChip,
} from "@/lib/process-v28-systems";

/** Same rule as v28: systems open from the Systems section only. */
export function v27SystemsNotInFact(
  systems: { label: string }[],
  fact: string,
  role?: Role,
  cardId?: string,
): V28SystemChip[] {
  return v28SystemsNotInFact(systems, fact, role, cardId);
}

export function v27LinkedFact(text: string): string {
  return v28LinkedFact(text);
}
