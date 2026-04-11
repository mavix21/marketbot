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

bot.onSubscribedMessage(async (thread, message) => {
  await thread.startTyping();

  // Build conversation history from thread messages
  const messages = [];
  for await (const msg of thread.allMessages) {
    messages.push(msg);
  }
  console.warn("All messages in thread", messages);

  if (message.text.match(/^card$/i)) {
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
    return;
  }

  if (message.text.match(/^ga+$/i)) {
    await thread.adapter.addReaction(thread.id, message.id, emoji.laugh);
    await thread.post({ markdown: "GAAAAAAA" });
    return;
  }

  await thread.post({ markdown: "Escuchando desde el hilo..." });
});
