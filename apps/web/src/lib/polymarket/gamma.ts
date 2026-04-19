/**
 * Minimal Gamma API client for Polymarket.
 * Docs: https://gamma-api.polymarket.com
 */

const GAMMA_BASE_URL = "https://gamma-api.polymarket.com";

export interface GammaMarket {
  id: string;
  question: string;
  slug: string;
  conditionId?: string;
  image?: string;
  icon?: string;
  active?: boolean;
  closed?: boolean;
  /** JSON-encoded string, e.g. '["Yes", "No"]' */
  outcomes?: string;
  /** JSON-encoded string, e.g. '["0.42", "0.58"]' */
  outcomePrices?: string;
  /** JSON-encoded string, e.g. '["123...", "456..."]' */
  clobTokenIds?: string;
  groupItemTitle?: string;
  volumeNum?: number;
  endDate?: string;
  lastTradePrice?: number;
  oneDayPriceChange?: number;
}

export interface GammaEvent {
  id: string;
  slug: string;
  title: string;
  description?: string;
  image?: string;
  icon?: string;
  endDate?: string;
  volume?: number;
  volume24hr?: number;
  liquidity?: number;
  active?: boolean;
  closed?: boolean;
  negRisk?: boolean;
  markets: GammaMarket[];
}

/**
 * Parse a JSON-encoded string field from Gamma (like outcomes or outcomePrices).
 */
function parseJsonField<T>(value: string | undefined | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function getMarketOutcomes(market: GammaMarket): string[] {
  return parseJsonField<string[]>(market.outcomes) ?? [];
}

export function getMarketOutcomePrices(market: GammaMarket): number[] {
  const parsed = parseJsonField<string[]>(market.outcomePrices);
  if (!parsed) return [];
  return parsed.map((p) => Number(p));
}

export function getMarketClobTokenIds(market: GammaMarket): string[] {
  return parseJsonField<string[]>(market.clobTokenIds) ?? [];
}

/**
 * Fetch the top trending events sorted by 24h volume, descending.
 * Only returns active, non-closed events.
 */
export async function getTrendingEvents(limit = 5): Promise<GammaEvent[]> {
  const url = new URL(`${GAMMA_BASE_URL}/events`);
  url.searchParams.set("active", "true");
  url.searchParams.set("closed", "false");
  url.searchParams.set("order", "volume24hr");
  url.searchParams.set("ascending", "false");
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Gamma events failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as GammaEvent[];
  return Array.isArray(data) ? data : [];
}

/**
 * An outcome to show in a trending card: a human label and its current probability 0..1.
 * For multi-market events we list each market's "Yes" outcome using its groupItemTitle.
 * For single binary markets we list both "Yes" and "No" outcomes.
 */
export interface DisplayOutcome {
  label: string;
  probability: number;
  tokenId?: string;
}

/**
 * Build the list of outcomes to display for an event.
 * - Multi-market event (e.g. "2026 World Cup Winner"): one entry per market's "Yes" token,
 *   sorted by probability descending.
 * - Single binary market: both outcomes of that market.
 */
export function buildDisplayOutcomes(event: GammaEvent): DisplayOutcome[] {
  const openMarkets = event.markets.filter((m) => m.active && !m.closed);
  const source = openMarkets.length > 0 ? openMarkets : event.markets;

  if (source.length === 1) {
    const market = source[0];
    if (!market) return [];
    const outcomes = getMarketOutcomes(market);
    const prices = getMarketOutcomePrices(market);
    const tokens = getMarketClobTokenIds(market);
    return outcomes.map((label, i) => ({
      label,
      probability: Number.isFinite(prices[i]) ? (prices[i] as number) : 0,
      tokenId: tokens[i],
    }));
  }

  const entries: DisplayOutcome[] = [];
  for (const market of source) {
    const outcomes = getMarketOutcomes(market);
    const prices = getMarketOutcomePrices(market);
    const tokens = getMarketClobTokenIds(market);
    const yesIdx = outcomes.findIndex((o) => o.toLowerCase() === "yes");
    const idx = yesIdx >= 0 ? yesIdx : 0;
    const label = market.groupItemTitle || outcomes[idx] || market.question;
    const prob = Number.isFinite(prices[idx]) ? (prices[idx] as number) : 0;
    entries.push({ label, probability: prob, tokenId: tokens[idx] });
  }

  entries.sort((a, b) => b.probability - a.probability);
  return entries;
}
