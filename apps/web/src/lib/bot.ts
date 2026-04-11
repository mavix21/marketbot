import { Chat, emoji } from "chat";
import { createWhatsAppAdapter } from "@chat-adapter/whatsapp";
import { createRedisState } from "@chat-adapter/state-redis";

export const bot = new Chat({
  userName: "delfos",
  adapters: {
    whatsapp: createWhatsAppAdapter(),
  },
  state: createRedisState(),
  logger: "info",
});

bot.onNewMention(async (thread, message) => {
  const channel = thread.channel;

  // Debugging
  console.warn({ channel });
  console.warn("New mention received", message);

  await thread.post(`Hola, ${message.author.userName}!`);
});

bot.onSubscribedMessage(async (thread, message) => {
  console.warn("Subscribed message received", message);
});

bot.onReaction(async (event) => {
  if (!event.added) {
    console.warn("Reaction removed", event);
    return;
  }

  await event.adapter.addReaction(event.threadId, event.messageId, emoji.laugh);
  console.warn("Reaction added", event);
});
