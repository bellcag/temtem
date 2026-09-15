# Corrected in-scope checklist

Status is the mapping decision. Implementation is a later pass.

## Shell

| # | Surface / page | Element (what the user sees) | Code today | Figma match | Library source | Tokens used | Status | Notes |
|---:|---|---|---|---|---|---|---|---|
| 1 | Shell | App canvas | `AppShell.tsx` | none — Foundational surface | Foundational | `Colors/Grey/50`; page margin `spacing-24` / `spacing-16` | Wrap | |
| 2 | Shell | Desktop sidenav expanded | `SideNav.tsx` | `_Components/Navigation` Format=Desktop, Expanded=True `73:1219` | TeMPo | Body L; selected `Purple Primary/100` + `/600`; White | Wrap | Molecule. Do not flatten. |
| 3 | Shell | Desktop sidenav collapsed | `SideNav.tsx` `collapsed` | `_Components/Navigation` Format=Desktop, Expanded=False `94:5444` | TeMPo | Icon-only rows | Wrap | |
| 4 | Shell | Mobile top bar | `AppShell.tsx` `<header>` | `_Components/Navigation` Format=Mobile, Expanded=False `118:4123` | TeMPo | White; `Grey/100` hairline | Wrap | Lucide `Menu` → `Icons/Black/Menu-Hamburger` |
| 5 | Shell | Mobile drawer open | `AppShell` + `SideNav` | `_Components/Navigation` Format=Mobile, Expanded=True `118:4129` | TeMPo | Scrim: ➗ `Background overlay` or Grey Alpha — not a Modal | Wrap | Lucide `X` → `Icons/Black/Close` |
| 6 | Shell | CAG wordmark | `SideNav` / `AppShell` / `Login` `<img>` | Logo in `_Components/Navigation` | TeMPo | Local `logo.svg` / `logo-mobile.svg` | Wrap | Brand mark, not Iconography |
| 7 | Shell | Collapse / expand | `SideNav` collapse `<button>` | Part of `_Components/Navigation` | Buttons · Iconography | `Buttons/Icon Semi-Rounded`; `Caret-Left` / `Caret-Right` | Wrap | Local `collapse.svg` today |
| 8 | Shell | Nav row default / selected | `SideNav` `MenuRow` | Tabs inside `_Components/Navigation` | TeMPo · Iconography | Body L; selected Bold `Purple Primary/600` on `/100` | Wrap | Repeats: Home, Process, and parked Documents / Permit Screener / Useful Links / Contacts **rows only**. Icons: `Home`, `Process`, `Documents`, `Link`, `Passenger/Single Profile`, `Logout`. Permit glyph: confirm in Iconography — do not invent. |
| 9 | Shell | Settings row (disabled) | `SideNav` `MenuRow` | Same nav tab, disabled | Iconography | `Icons/Black/Settings`; `Grey/300` | Wrap | |
| 10 | Shell | Log Out row | `SideNav` `MenuRow` | Same nav tab | Iconography | `Icons/Black/Logout` | Wrap | |
| 11 | Shell | Nav footer divider | `SideNav` `h-px` | Divider in Navigation | Foundational | `Grey/100` | Wrap | |
| 12 | Shell | User block (avatar + name + email) | `SideNav` profile `<button>` | User slot in `_Components/Navigation` | TeMPo · Foundational | Avatar `Grey/100`; Small Bold / Regular `Grey/700` | Wrap | Prototype control |
| 13 | Shell | Demo “Sign in as” / Reset Works menu | `SideNav` `roleOpen` `<ul>` | none | Overlay / Inputs `Dropdown` | All Caps `Grey/400`; selected `Purple Primary/100` + `/700` | New atom | Propose `_Atoms/DemoRoleMenu` |
| 14 | Shell | Mobile menu scrim | `AppShell` overlay `<button>` | ➗ `Background overlay` (scrim only) | ➗ Components | `#121212` 60% + `backdrop-blur-md` if that instance; do not invent a hex | Wrap | |
| 15 | Shell | To Top FAB | `src/components/Button/Button.tsx` in `ProcessV24` | `_Atoms/ToTopButton` `152:11665` | TeMPo · Buttons · Iconography | `Buttons/Icon Full-Rounded` Secondary (Mono) lg; `Icons/Black/Arrow-Top`; `shadow-light-bg`; `ring-brand` | Wrap | Alias Figma name. Local `arrow-top.svg` → library glyph |
| 16 | Shell | Assistant chat (desktop, after Home search) | `AssistantPanel.tsx` | none | Overlay / ➗ Modal if it fits | Body S; `Sparkles`; `Close` | New atom | `_Atoms/AssistantPanel` + composer from `Input Fields`. Only if it appears from Home. |

## Login

| # | Surface / page | Element | Code today | Figma match | Library source | Tokens used | Status | Notes |
|---:|---|---|---|---|---|---|---|---|
| 17 | Login | Sign-in card | `Login.tsx` card | none | Foundational | White; `radius-2xl`; `shadow-light-bg` | New atom | `_Atoms/AuthCard` |
| 18 | Login | “Sign in” title + subtitle | inline | none | Foundational | H5 Black; Body S `Grey/500` (Body L desktop) | Wrap | |
| 19 | Login | Work email field | `dls/TextField.tsx` | none | Inputs `Inputs / Input Fields` | Small Bold label; Body L; `Grey/200`; error `Red Error/600`; focus `Purple Primary/600` | Wrap | Keep `TextField` API |
| 20 | Login | Password field | `TextField` + trailing | none | Inputs `Input Fields` | Same as 19 | Wrap | |
| 21 | Login | Show / hide password | Lucide `Eye` / `EyeOff` | none | Buttons · Iconography | `Icon Semi-Rounded` Tertiary; `Icons/Black/Eye` / `Eye-Hide` | New atom | `_Atoms/PasswordToggle` or Input Fields trailing-icon. Lucide is not a match |
| 22 | Login | “Forgot password?” | inline `<button>` | none | Buttons | Body S `Purple Primary/600` hover `/700` | Wrap | `Buttons/Text Semi-Rounded` Tertiary |
| 23 | Login | Sign In primary | `dls/ActionButton` `primary` `lg` | none | Buttons `Text Semi-Rounded` Primary lg | Bold Body L; `Purple Primary/600` `/700` `/800`; `radius-sm` | Wrap | Keep `ActionButton` |
| 24 | Login | “or” rule | inline | none | Foundational | `Grey/100`; Body S `Grey/400` | New atom | `_Atoms/OrDivider` |
| 25 | Login | Sign In with Microsoft | `ActionButton` `secondary` + mark | none | Buttons Secondary | Body L Bold; Microsoft 4-square is brand, not Iconography | Wrap | |

## Home

| # | Surface / page | Element | Code today | Figma match | Library source | Tokens used | Status | Notes |
|---:|---|---|---|---|---|---|---|---|
| 26 | Home | Greeting + company line | `Dashboard.tsx` `<h1>` | none (PageHeader includes unit) | Foundational | H5 Black; Body S `Grey/500` | Wrap | |
| 27 | Home | Unit / portfolio context band | `dls/ContextStrip.tsx` | `_Atoms/Detail` `1459:106937` closest — confirm | Foundational | All Caps Small `Grey/500`; Body S `Grey/700`; `radius-2xl`; `Grey/100` | Wrap | If Detail is not this, New `_Atoms/ContextStrip` |
| 28 | Home | Meta pair + divider | `MetaPair` `MetaSep` | child of 27 | Foundational | All Caps `Grey/400`; Bold Black; `Grey/100` | Wrap | Not a third name |
| 29 | Home | Process overview phase tile (×4) | `dls/PhaseCard.tsx` | none | Foundational · Iconography | Small Bold `Purple Primary/600`; Subheading Black; Body S `Grey/500` | Wrap | Section icon: `Icons/Black/Process` not Lucide `Workflow` |
| 30 | Home | Open Process button | inline `<Link>` | none | Buttons Primary sm | Body S Bold White; `Caret-Right` | Wrap | Lucide `ArrowRight` today |
| 31 | Home | Ask / find search field | `dls/SearchField` + Lucide `Sparkles` | none in `_Atoms/` | Inputs `Input Fields` · `Icons/Black/Sparkles` | Body L; `Grey/200`; focus `Purple Primary/600` | New atom | `_Atoms/SearchField` Type=Assistant\|Guides — same atom as Process 40 |
| 32 | Home | Search overlay + hits | inline + `SearchHitRow` | `_Components/DocLibrary/SearchText` `734:27767` | TeMPo | Body S Bold; hint Small `Grey/500` | Wrap | Molecule. Home overlay only — do not build the Documents library page |
| 33 | Home | Search hit row | `dls/SearchHitRow.tsx` | none | Iconography · Foundational | Body S Bold; `Sparkles` / `Search` | New atom | `_Atoms/SearchHitRow` Type=Ask\|File\|Step\|System. Also Process |
| 34 | Home | Recently updated / Last viewed cards | `DocBlock` inline | none | Foundational | `radius-2xl`; `Grey/100`; H6 | New atom | `_Atoms/DocListCard` using DocumentRow atoms. Home only |
| 35 | Home | Document row in those lists | `dls/DocRow.tsx` | `_Components/DocLibrary/DocumentRow` Hover?=False Desktop `174:12691` | TeMPo · `Icons/Black/File` | Body S Bold; Small `Grey/500` | Wrap | Home list only. Lucide `FileText` today. Status via `_Atoms/DocumentStatusChip` if shown |
| 36 | Home | Works promo + “See works” | inline | none | Foundational · Iconography · Buttons | H6 Black; Body S `Grey/700`; text link `Purple Primary/600` | New atom | `_Atoms/WorksPromo`. On live Home; do not change Works quiz |

## Process

| # | Surface / page | Element | Code today | Figma match | Library source | Tokens used | Status | Notes |
|---:|---|---|---|---|---|---|---|---|
| 37 | Process | Page title “Process” + helper | `ProcessV24` `TITLE_PAGE` | `_Components/PageHeader` Desktop `96:5494` / Mobile `138:11582` | TeMPo | H6 mobile / H5 desktop Black; Body S `Grey/500` | Wrap | Includes 38–39 |
| 38 | Process | “For” + unit dropdown | `UnitSelect` → `DropdownField` | `_Atoms/UnitSelection` User=Tenant Desktop `164:29090` (also Officer / Contractor × Desktop/Mobile) | TeMPo · Inputs `Dropdown` · `Caret-Down` | Body S/L; `radius-md`; `Grey/200`; open `Purple Primary/600` | Wrap | |
| 39 | Process | Unit context chips (T3 · Airside · F&B) | local `OutlineChip` | not `_Atoms/Process/Chip` (that is “May apply”) | Chips `tag label small` | Small Bold; `Grey/200`; `Grey/700` | New atom | `_Atoms/ContextChip` Type=Neutral |
| 40 | Process | Search guides field | `ProcessFind` → `dls/SearchField` + custom `SearchGlyph` | none in `_Atoms/` | Inputs `Input Fields` · `Icons/Black/Search` | Body L; `Grey/200`; focus `Purple Primary/600` | New atom | `_Atoms/SearchField` Type=Guides. Custom magnifier SVG is not a match |
| 41 | Process | Clear search | `SearchField` `onClear` (`×`) | trailing on 40 | Buttons · Iconography | `Close` or `Cross`; `Grey/500` | Wrap | Part of 40 |
| 42 | Process | Filter next to Search | `FilterIconButton` | `_Atoms/FilterButton` Format=Desktop `136:8273` / Format=Mobile `152:23368` | TeMPo · `Filter-Off` / `Filter-On` | Labelled **Filter** + icon; Desktop 103×44; Mobile 87×36 | Wrap | **Follow TeMPo.** No icon-only square. No `_Atoms/FilterIconButton` |
| 43 | Process | Filter-on pip | `bg-[#ff4333]` | variant of 42 `Active=On` | Foundational | `Colors/Red Error/400` or `/500` only | No match | `#ff4333` is not a style |
| 44 | Process | Filter menu (desktop) | `SearchFilter` dialog | none | Inputs `Input options/Dropdown` | Body S/L; selected `Purple Primary/100` + `/700` | Wrap | |
| 45 | Process | Filter sheet (mobile) | `SearchFilter` portal | ➗ `modal bottom sheet` if it fits; scrim = `Background overlay` | ➗ Components | `radius-2xl` top; do not invent `_Atoms/Sheet` until Modal / bottom sheet are ruled out | Wrap | |
| 46 | Process | Search overlay panel | `ProcessFind` listbox | `_Components/DocLibrary/SearchText` `734:27495`–`734:27816` | TeMPo | `radius-2xl`; `Grey/200`; `shadow-light-bg` | Wrap | Molecule: 47–50 |
| 47 | Process | Suggested / Try these row | inline `role="option"` | none | Foundational | Body S; selected Bold `Purple Primary/600` on `/100` | New atom | `_Atoms/SearchSuggestRow`. `MapChip` keywords are coded but `showChips={false}` — not live |
| 48 | Process | Overlay file / system / step peek | `dls/SearchHitRow` | none | Iconography | Body S Bold; `File` / `Write-Forms` / `Documents` / `Link` | New atom | Same `_Atoms/SearchHitRow` as 33 |
| 49 | Process | “View all N results” | inline | `_Atoms/JSIDetail` Type=Link `138:5351` | Buttons text · TeMPo | Body S Bold `Purple Primary/600` | Wrap | |
| 50 | Process | Results title / empty | `SearchResults` `TITLE_SEARCH` | `SearchText` ResultsFound / NoResults | Foundational | Subheading / H6 Bold; empty Body S `Grey/600` | Wrap | |
| 51 | Process | Results lane (Files / Systems / Steps) | `FindLane` | none | Foundational | Body L Bold; count Body S `Grey/500`; white `radius-2xl` | New atom | `_Atoms/FindLane` |
| 52 | Process | Full-page result row | `FindHitButton` | `_Atoms/Process/LinkRow` `1261:65427` | TeMPo · Iconography | Body L Bold `Purple Primary/600` | Wrap | |
| 53 | Process | Topics rail (desktop) | `ChapterRail` | `_Components/Process/ViewBy` `1621:4733` + `_Atoms/Process/StageHead` `1621:4677` + `_Atoms/CategoryName` `104:627`/`104:628` | TeMPo | All Caps “Topics”; phase / topic Body S; count Small `Grey/400` | Wrap | ViewBy = molecule |
| 54 | Process | Mobile Topics control | `PhaseTabs` → `DropdownField` | Confirm: `_Atoms/Process/Tabs` is a tab strip, live is a dropdown | Inputs `Dropdown` or TeMPo Tabs | Body L; `h-12` | Wrap | Do not invent a third Topics atom. Prefer matching the TeMPo control the file already uses for this breakpoint |
| 55 | Process | Topic title + “All topics” back | `PhaseDesk` / `OverlayBackBtn` | text button + `Caret-Left` | Buttons · Iconography | H5/H6 drilled; Body S Bold `Purple Primary/600` | Wrap | |
| 56 | Process | Closed step row (every card) | `PhaseDesk` `<button>` | `_Atoms/Process/RailStep` State=Idle `1621:4667` | TeMPo · `Caret-Down` | Body L Bold Black; why Body S `Grey/600` | Wrap | |
| 57 | Process | Open step row header | same, expanded | `_Atoms/Process/RailStep` State=Current `1621:4668` | TeMPo | Caret rotated; why `Grey/700` | Wrap | |
| 58 | Process | Open step body | `PathStep` in `StepCardShell` `embedded` | `_Components/Process/StepCard` Type=Default Desktop `1599:78945` / Mobile `1601:72329` | TeMPo | Uses 59–68. QuizNudge / MayApply / PermitPack variants exist; quiz types stay out | Wrap | Molecule |
| 59 | Process | Step title (open) | `PhaseDesk` / `StepCardTitle` | inside StepCard / RailStep | Foundational | Body L / Subheading Bold Black | Wrap | |
| 60 | Process | “Who” chips | `OutlineChip` in `FactField` | not Process/Chip | Chips `tag label small` | Small Bold; `Grey/200` + `Grey/700` | New atom | `_Atoms/ContextChip` Type=Who (same set as 39) |
| 61 | Process | “Your Steps” heading | `LABEL_CAPS` | All Caps in StepCard | Foundational | All Caps 12/16 Bold `Grey/400` | Wrap | Every open card |
| 62 | Process | Your Steps body | `YourStepsItem` / `PartyLineList` | `_Atoms/Process/CheckRow/_Atoms/Process/Bullet` `1672:26982` | Foundational · Iconography | Body S mobile / Body L desktop `Grey/700` | Wrap | Keep `YourStepsList` / `YourStepsItem`. Replace custom `dot.svg` if Iconography has a bullet |
| 63 | Process | Document text button / file chip | `DocFileRow` | `_Atoms/Process/LinkRow` `1261:65427` + `_Atoms/JSIDetail` Type=Link `138:5351` / Type=Text `152:11758` | TeMPo · Iconography · Buttons text | Body S Bold `Purple Primary/600`; `File` / `Write-Forms` / `Documents` / `External-Link` | Wrap | **Do not invent `_Atoms/DocumentTextButton`** |
| 64 | Process | System chip / row | `SystemTypeGroup` | `_Atoms/Process/LinkRow` + `Icons/Black/Link` | TeMPo | Same as 63; Type=System | Wrap | |
| 65 | Process | “When” SLA chip | `WhenChip` | not Process/Chip | Foundational Blue · Chips | Small Bold; `Colors/Blue/600` + `Blue/100` (`#0057B8` **is** a Foundational style) | New atom | `_Atoms/Process/WhenChip` |
| 66 | Process | When-chip info tip | `WhenTip` + `DlsTooltip` | ➗ `Tooltip & Coachmark` Type=Tooltip Mode=Light Arrows=Top Center `199:16222` (set `199:16201`) | ➗ Components | Small Regular; Light: `Grey/800` on White; trigger `Icons/Black/Information` | Wrap | Keep `DlsTooltip` API. Map `side`/`align` → `Arrows=*`. Live `bg-black` is Mode=Dark — prefer Light on Grey/50. Not Coach Mark. No `_Atoms/Tooltip` |
| 67 | Process | “May apply” chip | `MayApplyChip` | `_Atoms/Process/Chip` `1599:4262` | TeMPo | Small Bold; `Orange Warning/100` + `/600` | Reuse | |
| 68 | Process | Section labels (Who, System, Only if…) | `FactField` `LABEL_CAPS` | All Caps in StepCard | Foundational | All Caps `Grey/400` | Wrap | |
| 69 | Process | Info / warning banner | `Banner` / `GuideNote` | `_Atoms/Banner` Desktop/Mobile Type=Default\|Warning\|Success `734:23359`… | TeMPo · `Information` | Body S Bold `Grey/700`; Default `Purple Primary/100`; Warning `Orange Warning/100` | Wrap | `_Atoms/Process/Banner` is quiz-tone copy — out unless quiz is reopened |
| 70 | Process | Document preview drawer | `DocumentPreviewDrawer.tsx` | `_Atoms/DocumentActions` `436:51906` + ➗ Modal or `modal bottom sheet`; scrim = `Background overlay` | ➗ Components · Iconography `File` `Close` `External-Link` | Body L Bold; Small `Grey/500` | Wrap | Process-opened preview only. Lucide today. Do not build Document Library |
| 71 | Process | Overlay icon close | `OverlayIconBtn` | `Buttons/Icon Semi-Rounded` Tertiary | Buttons | `Icons/Black/Close` | Wrap | |
| 72 | Process | Overlay back text | `OverlayBackBtn` | text button + caret | Buttons · Iconography | Body S Bold `Purple Primary/600`; `Caret-Left` | Wrap | Same as 55 |
| 73 | Process | Step group surface | `dls/StepCardShell.tsx` | surface of StepCard / RailStep group | Foundational | `radius-2xl`; `shadow-light-bg`; White | Wrap | |
| 74 | Process | Keyword `MapChip` (coded, hidden) | `MapChip` · `dls/FilterChip` | Chips `chip` / `chip filter` | Chips | h-8 pill; selected `Purple Primary/100` + `/600` | Wrap | Not on screen (`showChips={false}`). Out unless re-enabled |
| 75 | Process | `dls/Chip` OutlineChip / FilterChip | `dls/Chip.tsx` | ContextChip / Process/Chip / Chips playground | Chips · TeMPo | see 39, 60, 67 | Wrap | One module, three Figma jobs |

## Existing `dls/*` + Button aliases (still Wrap)

| Code today | Maps to |
|---|---|
| `dls/SearchField` | New `_Atoms/SearchField` (31, 40) |
| `dls/TextField` | Inputs `Input Fields` (19) |
| `dls/ActionButton` | Buttons `Text Semi-Rounded` (23, 25, 30) |
| `dls/Chip` | ContextChip / Chips playground / Process/Chip (39, 60, 67, 75) |
| `dls/DocRow` | `_Components/DocLibrary/DocumentRow` on **Home only** (35) |
| `dls/SearchHitRow` | New `_Atoms/SearchHitRow` (33, 48) |
| `dls/StepCardShell` | `_Components/Process/StepCard` surface (73, 58) |
| `dls/PhaseCard` | New `_Atoms/PhaseCard` (29) |
| `dls/ContextStrip` | `_Atoms/Detail` or New `_Atoms/ContextStrip` (27) |
| `Button/Button.tsx` | `_Atoms/ToTopButton` (15) |
