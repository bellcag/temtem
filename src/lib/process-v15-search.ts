import type { Phase } from "@/lib/tenancy-data";

export type SearchVerb = "Read" | "Download" | "Open";

export type CardSearchSurface = {
  phaseId: Phase["id"];
  stageName: string;
  stepName: string;
  displayTitle: string;
  bullets: string[];
  docs: { id: string; name: string; verb: SearchVerb }[];
  systems: string[];
};

export type SearchHit = {
  id: string;
  phaseId: Phase["id"];
  stageName: string;
  stepName: string;
  displayTitle: string;
  target: string;
  verb: SearchVerb | null;
  docId?: string;
  systemLabel?: string;
};

/** Usual PO jumps — only shown if the string already appears on a card. */
export const SEARCH_CHIP_CANDIDATES = [
  "Permit submission",
  "JSI",
  "OneCal",
] as const;

/** Landing quick links — only names that already exist on cards. */
export const QUICK_LINK_CANDIDATES = [
  "OneCalendar",
  "Permit to Work",
  "Joint Site Inspection",
  "Renovation Requirements",
  "Handover",
  "Planned works",
  "Design approval",
  "Loading bay",
] as const;

/**
 * PO shorthand → names already on the cards.
 * Query must equal the alias after normalize (qsm, not qs).
 */
const SEARCH_ALIASES: Record<string, string[]> = {
  qsm: ["Quality Service Management"],
  jsi: ["Joint Site Inspection", "JSI"],
  onecal: ["OneCalendar", "OneCal"],
  hotwork: ["Hot Work", "Joint Site Inspection"],
  ptw: ["Permit to Work"],
  "first site meeting": ["KickOff meeting"],
  "after first site meeting": ["KickOff follow-up pack"],
  "loading bay": ["loading-bay", "Loading-bay"],
};

export function normalizeQuery(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Visible strings to mark in a hit — the query plus any alias expansions. */
export function matchNeedles(query: string): string[] {
  const n = normalizeQuery(query);
  if (!n) return [];
  const extras = SEARCH_ALIASES[n] ?? [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of [query.trim(), n, ...extras]) {
    const key = raw.toLowerCase();
    if (!raw || seen.has(key)) continue;
    seen.add(key);
    out.push(raw);
  }
  return out.sort((a, b) => b.length - a.length);
}

export function textMatches(haystack: string, query: string): boolean {
  const needle = normalizeQuery(query);
  if (!needle) return false;
  const hay = normalizeQuery(haystack);
  if (hay.includes(needle)) return true;
  const expansions = SEARCH_ALIASES[needle];
  if (!expansions) return false;
  return expansions.some((term) => hay.includes(normalizeQuery(term)));
}

export function chipsForCards(cards: CardSearchSurface[]): string[] {
  return SEARCH_CHIP_CANDIDATES.filter((chip) =>
    cards.some((card) => cardCorpus(card).some((text) => textMatches(text, chip))),
  );
}

export function hitsForQuery(
  cards: CardSearchSurface[],
  query: string,
): SearchHit[] {
  if (!normalizeQuery(query)) return [];
  const hits: SearchHit[] = [];
  for (const card of cards) {
    hits.push(...hitsForCard(card, query));
  }
  return hits;
}

function asStepHit(hit: SearchHit): SearchHit {
  return {
    ...hit,
    id: `${hit.phaseId}::${hit.stageName}::${hit.stepName}::step`,
    target: hit.displayTitle,
    verb: null,
    docId: undefined,
    systemLabel: undefined,
  };
}

function hitsOnSameStep(hits: SearchHit[], hit: SearchHit): SearchHit[] {
  return hits.filter(
    (h) => h.stageName === hit.stageName && h.stepName === hit.stepName,
  );
}

/** Prefer the named step or file, not the first corpus mention. */
export function preferredHitForQuery(
  cards: CardSearchSurface[],
  query: string,
): SearchHit | null {
  const hits = hitsForQuery(cards, query);
  if (hits.length === 0) return null;
  const n = normalizeQuery(query);

  const pickOnStep = (anchor: SearchHit): SearchHit => {
    const onStep = hitsOnSameStep(hits, anchor);
    const namedDoc = onStep.find(
      (h) => h.docId && textMatches(h.target, query),
    );
    if (namedDoc) return namedDoc;
    const namedSys = onStep.find(
      (h) => h.systemLabel && textMatches(h.systemLabel, query),
    );
    if (namedSys) return namedSys;
    return asStepHit(anchor);
  };

  const exactStep = hits.find((h) => normalizeQuery(h.stepName) === n);
  if (exactStep) return pickOnStep(exactStep);

  const exactTitle = hits.find((h) => normalizeQuery(h.displayTitle) === n);
  if (exactTitle) return pickOnStep(exactTitle);

  const titled = hits.find((h) => textMatches(h.displayTitle, query));
  if (titled) return pickOnStep(titled);

  const namedStep = hits.find((h) => textMatches(h.stepName, query));
  if (namedStep) return pickOnStep(namedStep);

  const exactDoc = hits.find(
    (h) => h.docId && normalizeQuery(h.target) === n,
  );
  if (exactDoc) return exactDoc;
  const docHit = hits.find((h) => h.docId && textMatches(h.target, query));
  if (docHit) return docHit;

  const exactSys = hits.find(
    (h) => h.systemLabel && normalizeQuery(h.systemLabel) === n,
  );
  if (exactSys) return exactSys;
  const systemHit = hits.find(
    (h) => h.systemLabel && textMatches(h.systemLabel, query),
  );
  if (systemHit) return systemHit;

  return hits[0];
}

function cardCorpus(card: CardSearchSurface): string[] {
  return [
    card.stepName,
    card.displayTitle,
    ...card.bullets,
    ...card.docs.map((d) => d.name),
    ...card.systems,
  ];
}

function hitsForCard(card: CardSearchSurface, query: string): SearchHit[] {
  const titleOrBullets =
    textMatches(card.stepName, query) ||
    textMatches(card.displayTitle, query) ||
    card.bullets.some((line) => textMatches(line, query));
  const hits: SearchHit[] = [];
  const key = `${card.phaseId}::${card.stageName}::${card.stepName}`;

  for (const doc of card.docs) {
    if (titleOrBullets || textMatches(doc.name, query)) {
      hits.push({
        id: `${key}::file::${doc.id}`,
        phaseId: card.phaseId,
        stageName: card.stageName,
        stepName: card.stepName,
        displayTitle: card.displayTitle,
        target: doc.name,
        verb: doc.verb,
        docId: doc.id,
      });
    }
  }

  for (const label of card.systems) {
    if (titleOrBullets || textMatches(label, query)) {
      hits.push({
        id: `${key}::system::${label}`,
        phaseId: card.phaseId,
        stageName: card.stageName,
        stepName: card.stepName,
        displayTitle: card.displayTitle,
        target: label,
        verb: "Open",
        systemLabel: label,
      });
    }
  }

  if (hits.length === 0 && titleOrBullets) {
    hits.push({
      id: `${key}::step`,
      phaseId: card.phaseId,
      stageName: card.stageName,
      stepName: card.stepName,
      displayTitle: card.displayTitle,
      target: card.displayTitle,
      verb: null,
    });
  }

  return hits;
}
