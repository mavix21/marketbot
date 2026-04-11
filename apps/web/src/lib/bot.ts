import { Chat } from "chat";
import { createWhatsAppAdapter } from "@chat-adapter/whatsapp";
import { createMemoryState } from "@chat-adapter/state-memory";

export const bot = new Chat({
  userName: "marketbot",
  adapters: {
    whatsapp: createWhatsAppAdapter(),
  },
  state: createMemoryState(),
});

bot.onNewMention(async (thread, _message) => {
  await thread.post("Hello from WhatsApp!");
});
