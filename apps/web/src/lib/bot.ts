import { Actions, Card, Button, Chat, emoji } from "chat";
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
  await thread.subscribe();
  await thread.startTyping();
  await thread.adapter.addReaction(thread.id, message.id, emoji.wave);

  console.warn("New mention received", message);

  await thread.post({ markdown: `Hola, **${message.author.userName}**!` });
});

bot.onSubscribedMessage(async (thread) => {
  await thread.startTyping();

  const allMessagesInThread = thread.allMessages;
  console.warn("All messages in thread", allMessagesInThread);

  await thread.post({ markdown: "Hello from subscribed message!" });
});

bot.onNewMessage(/^card$/, async (thread, message) => {
  console.warn("New message received", message);

  await thread.post(
    Card({
      title: "Card Title",
      children: [
        "Ejemplo de texto en el card",
        Actions([
          Button({ id: "approve", label: "Approve", style: "primary" }),
          Button({ id: "reject", label: "Reject", style: "danger" }),
        ]),
      ],
    }),
  );
});
