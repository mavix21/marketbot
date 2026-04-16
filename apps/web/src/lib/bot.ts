import type { Thread } from "chat";
import { Chat, emoji } from "chat";
import { createWhatsAppAdapter } from "@chat-adapter/whatsapp";
import { createRedisState } from "@chat-adapter/state-redis";
import { sendWhatsAppButtons } from "./whatsapp";
import { extractPhoneNumber } from "./phone";
import { sendMainMenu, MENU_ACTIONS, ALL_MENU_ACTIONS } from "./menu";
import { createUserWallet, getUserSafeAddress } from "./polymarket";

const WALLET_CONFIRM_ACTION = "wallet_create_confirm";
const WALLET_CANCEL_ACTION = "wallet_create_cancel";
const HELP_COMMAND = "!help";

export const bot = new Chat({
  userName: "delfos",
  adapters: {
    whatsapp: createWhatsAppAdapter(),
  },
  state: createRedisState(),
  logger: "info",
});

bot.onNewMention(async (thread, message) => {
  await thread.subscribe();
  await thread.adapter.addReaction(thread.id, message.id, emoji.wave);

  await thread.post({
    markdown: `¡Hola, **${message.author.userName}**! Soy *delfos*, tu asistente de mercados de predicción.`,
  });
  await sendMainMenu(thread);
});

bot.onSubscribedMessage(async (thread, message) => {
  if (message.text.trim().toLowerCase() === HELP_COMMAND) {
    await sendMainMenu(thread);
    return;
  }
  await handleMessage();
});

bot.onAction(ALL_MENU_ACTIONS, async (event) => {
  const thread = event.thread;
  if (!thread) return;

  switch (event.actionId) {
    case MENU_ACTIONS.WALLET:
      await handleWalletMenu(thread);
      return;
    case MENU_ACTIONS.TRENDING:
    case MENU_ACTIONS.ENDING_SOON:
    case MENU_ACTIONS.RANDOM:
    case MENU_ACTIONS.SEARCH:
    case MENU_ACTIONS.RECOMMENDATIONS:
    case MENU_ACTIONS.PORTFOLIO:
      await thread.post({
        markdown: `🛠️ Esta opción aún está en construcción. Escribe *${HELP_COMMAND}* para volver al menú.`,
      });
      return;
  }
});

bot.onAction([WALLET_CONFIRM_ACTION, WALLET_CANCEL_ACTION], async (event) => {
  const thread = event.thread;
  if (!thread) return;

  if (event.actionId === WALLET_CANCEL_ACTION) {
    await thread.post({
      markdown: `Entendido, no se creó ninguna wallet. Escribe *${HELP_COMMAND}* para ver el menú.`,
    });
    return;
  }

  await handleWalletCreate(thread);
});

async function handleWalletMenu(thread: Thread<unknown>): Promise<void> {
  const phoneNumber = extractPhoneNumber(thread);
  if (!phoneNumber) {
    await thread.post({ markdown: "Esta función solo está disponible en WhatsApp." });
    return;
  }

  const existing = await getUserSafeAddress(phoneNumber);
  if (existing) {
    await thread.post({
      markdown: `💸 *Tu wallet ya existe*\n\nDirección:\n\`${existing}\``,
    });
    return;
  }

  await sendWhatsAppButtons(thread, {
    header: "Crear wallet en Polygon",
    body: "Voy a crear una *smart wallet* en Polygon asociada a tu número. Podrás depositar USDC y operar en Polymarket. ¿Quieres continuar?",
    footer: "Esta acción es gratuita",
    buttons: [
      { id: WALLET_CONFIRM_ACTION, title: "✅ Sí, crear" },
      { id: WALLET_CANCEL_ACTION, title: "❌ Cancelar" },
    ],
  });
}

async function handleWalletCreate(thread: Thread<unknown>): Promise<void> {
  const phoneNumber = extractPhoneNumber(thread);
  if (!phoneNumber) {
    await thread.post({ markdown: "Esta función solo está disponible en WhatsApp." });
    return;
  }

  await thread.startTyping();
  try {
    const result = await createUserWallet(phoneNumber);
    const title = result.alreadyExisted ? "Ya tenías una wallet" : "¡Wallet creada!";
    await thread.post({
      markdown: `💸 *${title}*\n\nDirección:`,
    });
    // Easier for the user to copy
    await thread.post({
      markdown: `\`${result.safeAddress}\``,
    });
  } catch (error) {
    console.error("Error creating wallet:", error);
    await thread.post({
      markdown: "Hubo un error creando tu wallet. Intenta de nuevo en unos minutos.",
    });
  }
}

async function handleMessage() {
  // No-op for now - will implement later
  // await thread.startTyping();
  // await thread.adapter.addReaction(thread.id, message.id, emoji.hourglass);
  // try {
  //   let history;
  //   try {
  //     const messages = await getThreadMessages(thread);
  //     history = await toAiMessages(messages);
  //     if (history.length === 0) {
  //       history = [{ role: "user" as const, content: message.text }];
  //     }
  //   } catch (e) {
  //     console.error("Error fetching messages:", e);
  //     await thread.post({ markdown: "Hubo un error procesando tu mensaje" });
  //     return;
  //   }
  //   const { text } = await delfosAgent.generate({
  //     options: { phoneNumber: extractPhoneNumber(thread) },
  //     messages: history,
  //   });
  //   await thread.post({ markdown: text || "No pude generar una respuesta." });
  // } catch (error) {
  //   console.error("Error generating response:", error);
  //   await thread.post({ markdown: "Hubo un error generando la respuesta" });
  // } finally {
  //   await thread.adapter.removeReaction(thread.id, message.id, emoji.hourglass);
  // }
}

// async function getThreadMessages(thread: Thread): Promise<Message[]> {
//   let messages: Message[] = [];
//   if (thread.adapter.name !== "whatsapp") {
//     const result = await thread.adapter.fetchMessages(thread.id, { limit: 100 });
//     messages = result.messages;
//   } else {
//     for await (const message of thread.messages) {
//       messages.push(message);
//       if (messages.length >= 100) break;
//     }
//   }
//   return messages;
// }
