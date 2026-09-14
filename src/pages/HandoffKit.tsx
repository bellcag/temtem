import { Sparkles } from "lucide-react";
import { ActionButton } from "@/components/dls/ActionButton";
import { FilterChip, OutlineChip } from "@/components/dls/Chip";
import {
  ContextStrip,
  MetaPair,
  MetaSep,
} from "@/components/dls/ContextStrip";
import { PhaseCard } from "@/components/dls/PhaseCard";
import { SearchField } from "@/components/dls/SearchField";
import { SearchHitRow } from "@/components/dls/SearchHitRow";
import {
  StepCardShell,
  StepCardTitle,
  YourStepsItem,
  YourStepsList,
} from "@/components/dls/StepCardShell";
import { TextField } from "@/components/dls/TextField";

/**
 * Capture page for Figma atoms / component sets.
 * Open /handoff-kit?figmaFull while capturing; not part of the product nav.
 */
export function HandoffKitPage() {
  return (
    <div className="dls-page flex flex-col gap-10 bg-grey-50 py-10">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-grey-400">
          Handoff kit
        </p>
        <h1 className="text-2xl font-black text-black">Atoms and sets</h1>
        <p className="text-sm leading-[18px] text-grey-500">
          Map these instances 1:1 in Figma. Key screens: Login, Home, Process.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2>Buttons</h2>
        <div className="flex flex-wrap items-center gap-3">
          <ActionButton variant="primary" size="lg">
            Sign In
          </ActionButton>
          <ActionButton variant="secondary" size="lg">
            Sign In with Microsoft
          </ActionButton>
          <ActionButton variant="tertiary" size="sm">
            Forgot password?
          </ActionButton>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2>Fields</h2>
        <div className="grid max-w-md gap-6">
          <TextField
            id="kit-email"
            label="Work email"
            placeholder="name@company.com"
            defaultValue=""
          />
          <TextField
            id="kit-email-error"
            label="Work email"
            error="This field is required."
            defaultValue=""
          />
          <SearchField
            id="kit-search"
            label="Search guides"
            placeholder="Search guides — try JSI or OneCal"
            value=""
            onChange={() => undefined}
            leading={<Sparkles className="h-5 w-5 text-purple-600" />}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2>Chips</h2>
        <div className="flex flex-wrap gap-2">
          <FilterChip>JSI</FilterChip>
          <FilterChip selected>OneCal</FilterChip>
          <OutlineChip>OneCalendar</OutlineChip>
          <OutlineChip tone="brand">May apply</OutlineChip>
          <OutlineChip tone="warn">Not sure</OutlineChip>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2>Dashboard pieces</h2>
        <ContextStrip kicker="Unit profile">
          <div className="flex flex-wrap items-center gap-x-4">
            <MetaPair label="Unit" value="T3-AS-114" />
            <MetaSep />
            <MetaPair label="Terminal" value="T3" />
          </div>
        </ContextStrip>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <PhaseCard
            to="/process?phase=setup"
            title="SetUp"
            lead="Access"
          />
        </div>
        <div className="max-w-md overflow-hidden rounded-[var(--radius-xl)] border border-grey-100 bg-white">
          <SearchHitRow
            title="Joint Site Inspection"
            hint="Process · Build"
            onClick={() => undefined}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2>Step card</h2>
        <StepCardShell>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-grey-400">
            Kickoff
          </p>
          <StepCardTitle>KickOff meeting</StepCardTitle>
          <p className="text-sm leading-[18px] text-grey-500">Go to the first site meeting when invited.</p>
          <YourStepsList>
            <YourStepsItem>Go to the first site meeting when invited.</YourStepsItem>
            <YourStepsItem>Bring the design pack for IFM.</YourStepsItem>
          </YourStepsList>
          <div className="flex flex-wrap gap-2">
            <OutlineChip>OneCalendar</OutlineChip>
          </div>
        </StepCardShell>
      </section>
    </div>
  );
}
