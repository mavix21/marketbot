import type { Thread, Message } from "chat";
import { Chat, emoji } from "chat";
import { createWhatsAppAdapter } from "@chat-adapter/whatsapp";
import { createRedisState } from "@chat-adapter/state-redis";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

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

  await thread.post({ markdown: `Hola, **${message.author.userName}**!` });
  handleMessage({ thread, message });
});

bot.onSubscribedMessage(async (thread, message) => {
  handleMessage({ thread, message });
});

async function handleMessage({ thread, message }: { thread: Thread; message: Message }) {
  await thread.startTyping();
  await thread.adapter.addReaction(thread.id, message.id, emoji.hourglass);

  let history: { role: "user" | "assistant"; content: string }[] = [];
  try {
    const result = await thread.adapter.fetchMessages(thread.id, { limit: 100 });
    console.log({ messages: result.messages });
    history = result.messages
      .slice(0, -1)
      .filter((msg) => msg.text.trim() !== "")
      .map((msg) => ({
        role: msg.author.isMe ? ("assistant" as const) : ("user" as const),
        content: msg.text,
      }));
    if (history.length === 0) {
      history = [{ role: "user", content: message.text }];
    }
  } catch (e) {
    console.error("Error fetching messages:", e);
    await thread.post({ markdown: "Hubo un error procesando tu mensaje" });

    return;
  } finally {
    await thread.adapter.removeReaction(thread.id, message.id, emoji.hourglass);
  }

  try {
    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      system: `You are a friendly support bot. Answer questions concisely.
        You are allowed to use the following markdown elements: **bold**, _italic_ and \`code\`. Use them only when necessary.`,
      messages: history,
    });
    console.log({ text });

    await thread.post({ markdown: text });
  } catch (error) {
    console.error("Error generating response:", error);
    await thread.post({ markdown: "Hubo un error generando la respuesta" });
  } finally {
    await thread.adapter.removeReaction(thread.id, message.id, emoji.hourglass);
  }
}
