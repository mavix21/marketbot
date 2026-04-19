/**
 * Helpers to fetch Polymarket price history from CLOB and turn it into a
 * ready-to-use chart image URL via QuickChart.
 */

const CLOB_BASE_URL = "https://clob.polymarket.com";
const QUICKCHART_BASE_URL = "https://quickchart.io/chart";

export type PriceHistoryInterval = "1h" | "6h" | "1d" | "1w" | "1m" | "max";

export interface PricePoint {
  /** Unix timestamp in seconds */
  t: number;
  /** Price 0..1 */
  p: number;
}

export interface PriceHistoryOptions {
  interval?: PriceHistoryInterval;
  /** Minutes between points (e.g. 60, 360). */
  fidelity?: number;
}

/**
 * Fetch raw price history for a CLOB token.
 */
export async function getPriceHistory(
  tokenId: string,
  options: PriceHistoryOptions = {},
): Promise<PricePoint[]> {
  const { interval = "1w", fidelity = 360 } = options;
  const url = new URL(`${CLOB_BASE_URL}/prices-history`);
  url.searchParams.set("market", tokenId);
  url.searchParams.set("interval", interval);
  url.searchParams.set("fidelity", String(fidelity));

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`CLOB prices-history failed: ${res.status}`);
  }

  const data = (await res.json()) as { history?: PricePoint[] };
  return Array.isArray(data.history) ? data.history : [];
}

/**
 * Build a QuickChart image URL showing a probability line chart (0..100%)
 * from a series of price points. Returns null if the series is too short.
 */
export function buildQuickChartUrl(
  points: PricePoint[],
  options: { title?: string; width?: number; height?: number } = {},
): string | null {
  if (points.length < 2) return null;

  const { title, width = 500, height = 260 } = options;

  // Downsample to at most 50 points for a compact URL.
  const maxPoints = 50;
  const stride = Math.max(1, Math.ceil(points.length / maxPoints));
  const sampled = points.filter((_, i) => i % stride === 0);

  const labels = sampled.map((pt) => {
    const d = new Date(pt.t * 1000);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });
  const data = sampled.map((pt) => Math.round(pt.p * 1000) / 10); // percent, 1 decimal

  const chart = {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Probability",
          data,
          borderColor: "#2563eb",
          backgroundColor: "rgba(37,99,235,0.15)",
          borderWidth: 2,
          pointRadius: 0,
          fill: true,
          tension: 0.25,
        },
      ],
    },
    options: {
      plugins: {
        legend: { display: false },
        ...(title ? { title: { display: true, text: title } } : {}),
      },
      scales: {
        y: {
          min: 0,
          max: 100,
          ticks: { callback: "function(v){return v+'%'}" },
        },
        x: {
          ticks: { maxTicksLimit: 6 },
        },
      },
    },
  };

  const url = new URL(QUICKCHART_BASE_URL);
  url.searchParams.set("c", JSON.stringify(chart));
  url.searchParams.set("w", String(width));
  url.searchParams.set("h", String(height));
  url.searchParams.set("bkg", "white");
  return url.toString();
}
