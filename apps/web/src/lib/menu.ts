import type { Thread } from "chat";
import { sendWhatsAppList } from "./whatsapp";

export const MENU_ACTIONS = {
  TRENDING: "menu_trending",
  ENDING_SOON: "menu_ending_soon",
  RANDOM: "menu_random",
  SEARCH: "menu_search",
  RECOMMENDATIONS: "menu_recommendations",
  PORTFOLIO: "menu_portfolio",
  WALLET: "menu_wallet",
} as const;

export const ALL_MENU_ACTIONS = Object.values(MENU_ACTIONS);

export async function sendMainMenu(thread: Thread<unknown>): Promise<void> {
  await sendWhatsAppList(thread, {
    header: "Delfos · Menú principal",
    body: "¿Qué te gustaría hacer hoy?",
    footer: "Escribe !help para volver aquí",
    button: "Ver opciones",
    sections: [
      {
        title: "Descubrir mercados",
        rows: [
          {
            id: MENU_ACTIONS.TRENDING,
            title: "🔥 Trending",
            description: "Mercados con más volumen en las últimas 24h",
          },
          {
            id: MENU_ACTIONS.ENDING_SOON,
            title: "📅 Próximos a cerrar",
            description: "Mercados que resuelven en menos de 48h",
          },
          {
            id: MENU_ACTIONS.RANDOM,
            title: "🎲 Descubrir al azar",
            description: "Un mercado sorpresa para explorar",
          },
          {
            id: MENU_ACTIONS.SEARCH,
            title: "🔎 Buscar",
            description: "Encuentra mercados por palabra clave",
          },
        ],
      },
      {
        title: "Tu cuenta",
        rows: [
          {
            id: MENU_ACTIONS.RECOMMENDATIONS,
            title: "❤️ Recomendados",
            description: "Mercados según tus intereses",
          },
          {
            id: MENU_ACTIONS.PORTFOLIO,
            title: "📊 Mi portafolio",
            description: "Tus posiciones y balance",
          },
          {
            id: MENU_ACTIONS.WALLET,
            title: "💸 Crear Wallet",
            description: "Crea o consulta tu wallet en Polygon",
          },
        ],
      },
    ],
  });
}
