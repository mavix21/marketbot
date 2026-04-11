import { Chat } from "chat";
import { createWhatsAppAdapter } from "@chat-adapter/whatsapp";
import { createMemoryState } from "@chat-adapter/state-memory";

export const bot = new Chat({
  userName: "delfos",
  adapters: {
    whatsapp: createWhatsAppAdapter(),
  },
  state: createMemoryState(),
  logger: "info",
});

bot.onNewMention(async (thread, _message) => {
  console.warn("New mention received", _message);
  await thread.post("Hello from WhatsApp!");
});
