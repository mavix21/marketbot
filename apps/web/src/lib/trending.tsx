/** @jsxImportSource chat */
import type { Thread } from "chat";
import { Card, CardText, Divider, Field, Fields } from "chat";
import {
  buildDisplayOutcomes,
  getTrendingEvents,
  type DisplayOutcome,
  type GammaEvent,
} from "./polymarket/gamma";
import { buildQuickChartUrl, getPriceHistory } from "./polymarket/charts";
import { sendWhatsAppImage } from "./whatsapp";

const POLYMARKET_EVENT_URL = "https://polymarket.com/event";
const MAX_EVENTS_TO_SHOW = 3;
const MAX_OUTCOMES_PER_CARD = 5;

function formatCompactNumber(value: number): string {
  if (!Number.isFinite(value)) return "—";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function formatProbability(prob: number): string {
  if (!Number.isFinite(prob)) return "—";
  return `${(prob * 100).toFixed(1)}%`;
}

function formatEndDate(iso?: string): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function buildSubtitle(event: GammaEvent): string {
  const parts: string[] = [];
  if (typeof event.volume24hr === "number") {
    parts.push(`Vol 24h: ${formatCompactNumber(event.volume24hr)}`);
  }
  const ends = formatEndDate(event.endDate);
  if (ends) parts.push(`Cierra: ${ends}`);
  return parts.join(" · ");
}

async function buildEventChartUrl(outcomes: DisplayOutcome[]): Promise<string | null> {
  const top = outcomes[0];
  if (!top?.tokenId) return null;
  try {
    const history = await getPriceHistory(top.tokenId, {
      interval: "1w",
      fidelity: 360,
    });
    return buildQuickChartUrl(history, { title: `${top.label} (7d)` });
  } catch (err) {
    console.error("Error fetching price history:", err);
    return null;
  }
}

async function postEventCard(thread: Thread<unknown>, event: GammaEvent): Promise<void> {
  const outcomes = buildDisplayOutcomes(event).slice(0, MAX_OUTCOMES_PER_CARD);
  const eventUrl = `${POLYMARKET_EVENT_URL}/${event.slug}`;

  // Chart URL is still computed (useful for logging / future reuse) but not rendered yet.
  const chartUrl = await buildEventChartUrl(outcomes);
  if (chartUrl) {
    console.debug(`[trending] chart for ${event.slug}: ${chartUrl}`);
  }

  if (event.image) {
    await sendWhatsAppImage(thread, {
      imageUrl: event.image,
      caption: event.title,
    });
  }

  await thread.post(
    <Card title={event.title} subtitle={buildSubtitle(event)}>
      {outcomes.length > 0 ? (
        <Fields>
          {outcomes.map((o) => (
            <Field key={o.label} label={o.label} value={formatProbability(o.probability)} />
          ))}
        </Fields>
      ) : (
        <CardText>Sin mercados activos en este momento.</CardText>
      )}
      <Divider />
      <CardText>Ver mercado: {eventUrl}</CardText>
    </Card>,
  );
}

/**
 * Fetch the current trending events on Polymarket and post one Card per event
 * into the given thread. No betting interactions are attached yet.
 */
export async function sendTrending(thread: Thread<unknown>): Promise<void> {
  await thread.startTyping();

  let events: GammaEvent[];
  try {
    events = await getTrendingEvents(MAX_EVENTS_TO_SHOW);
  } catch (err) {
    console.error("Error fetching trending events:", err);
    await thread.post({
      markdown:
        "No pude obtener los mercados trending en este momento. Intenta de nuevo en unos minutos.",
    });
    return;
  }

  if (events.length === 0) {
    await thread.post({ markdown: "No hay mercados trending en este momento." });
    return;
  }

  await thread.post({
    markdown: `🔥 *Mercados trending en Polymarket* (top ${events.length} por volumen 24h)`,
  });

  for (const event of events) {
    try {
      await postEventCard(thread, event);
    } catch (err) {
      console.error(`Error posting event ${event.slug}:`, err);
    }
  }
}
