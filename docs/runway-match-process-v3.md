# Process v3 → Runway DLS match review

Screen under review: `/process-v3` (`ProcessV3.tsx` + `AppShell` / `SideNav` / `DocumentPreviewDrawer`).

Runway source: `vendor/runway-md-components` ([cag-euxui/runway-md-components](https://github.com/cag-euxui/runway-md-components)). Docs-only — local React + tokens.

Legend: **1:1** = use Runway usage as-is · **Near** = closest published doc, small adaptation · **Gap** = no published 1:1 (or only `_excluded` stub) → build new.

---

## Match list (for review)

| # | UI on screen | Where | Closest Runway doc | Match | Local component |
|---|---|---|---|---|---|
| 1 | Terminal / tenancy / zone / company chips | F0 Active context | [Attribute Chips](../vendor/runway-md-components/docs/actions-interactions/attribute-chips.md) | **1:1** | `AttributeChip` |
| 2 | Doc type chip on sample docs | PathStep footer | Attribute Chips | **1:1** | `AttributeChip` |
| 3 | “Guide only” badge | Page header | [Status Chips](../vendor/runway-md-components/docs/actions-interactions/status-chips.md) (rectangular B2B) | **Near** | `StatusChip` |
| 4 | You / Others tags | PathStep flow | Status Chips / Attribute Chips | **Near** | `StatusChip` |
| 5 | Tag callout (e.g. F&B relevant) | PathStep | Status Chips (warning) | **Near** | `StatusChip` tone=`warning` |
| 6 | Switch outlet / Switch job | F0 | [Dropdown Input](../vendor/runway-md-components/docs/inputs/dropdown-input.md) | **Near** (native select for prototype) | `DropdownField` |
| 7 | Demo: sign in as | SideNav | Dropdown Input | **Near** | `DropdownField` |
| 8 | Ask Assistant | SideNav footer | [Buttons](../vendor/runway-md-components/docs/actions-interactions/buttons.md) Primary | **1:1** | `Button` |
| 9 | Sample document row | PathStep | Buttons (secondary) | **Near** | `Button` variant=`secondary` |
| 10 | Quick-scope unit pills | F0 officer | Filter Chips / Buttons | **Near** | `Button` variant=`secondary` |
| 11 | My unit / Full process | F0 officer | [Selectors](../vendor/runway-md-components/docs/selections/selectors.md) + Filter Chips — not a segment control | **Gap** | **`SegmentedControl`** (new) |
| 12 | Terminal / Tenancy / Zone groups | SideNav Context | Selectors — card selectors, not compact segments | **Gap** | **`SegmentedControl`** (new) |
| 13 | People / Systems link chips | PathStep | Attribute Chips say *do not* mix with interaction | **Gap** | **`LinkChip`** (new) |
| 14 | App side nav + mobile top bar | AppShell / SideNav | [Web Header — Admin](../vendor/runway-md-components/docs/page-navigations/web-header.md) | **Near** | keep shell; collapse toggle aligns |
| 15 | Document preview + assistant dim | drawers | [Overlay](../vendor/runway-md-components/_excluded/overlay-de9ebf.md) (+ Modal stub) | **Near** | `Overlay` + **`Drawer`** (new) |
| 16 | Lifecycle phases + steps-in-phase | Left overview | Progress Steps (`_excluded`, empty) / Tabs stub | **Gap** | **`LifecycleNav`** (new) |
| 17 | Numbered vertical journey rail | Right guide | Progress Steps stub | **Gap** | **`GuideTimeline`** (new) |
| 18 | Action step card | Right guide | Cards (`_excluded`, empty) | **Gap** | **`GuideStepCard`** (new) |
| 19 | Context / “also” note | Right guide | — | **Gap** | **`ContextNote`** (new) |
| 20 | Uppercase micro labels | Various | Foundations / typography (excluded) | N/A | `MicroLabel` helper |
| 21 | Coachmark / Carousel / Pagination | Not on this screen | Published docs exist | Unused | — |

---

## Decisions baked into code

1. **1:1 / Near** → `src/components/runway/` primitives wired into Process v3 + SideNav.
2. **Gap** → new TeMPo components in the same folder (not invented as fake Runway names in docs; marked `// Runway: gap` in source).
3. Filter Chips were considered for My unit / Full process and Terminal segments; product behaviour is exclusive single-select without × dismiss → **SegmentedControl**, not Filter Chips.
4. Interactive people/systems chips are **LinkChip**, not Attribute Chips (Runway: attribute chips are display-only).

---

## Review checklist for Mirabelle

- [ ] Rows 1–10 feel correctly mapped
- [ ] Agree SegmentedControl (not Selectors / Filter Chips) for #11–12
- [ ] Agree LinkChip for #13
- [ ] Agree LifecycleNav + GuideTimeline + GuideStepCard + ContextNote for #16–19
- [ ] Any row that should stay bespoke / not extracted
