import type { Thread, Message } from "chat";
import { Chat, emoji, toAiMessages } from "chat";
import { createWhatsAppAdapter } from "@chat-adapter/whatsapp";
import { createRedisState } from "@chat-adapter/state-redis";
import { generateText, stepCountIs } from "ai";
import { google } from "@ai-sdk/google";
import { sendWhatsAppAudio } from "./whatsapp";
import { polymarketTools } from "./polymarket";
import { extractPhoneNumber } from "./phone";

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
  await handleMessage({ thread, message });
});

bot.onSubscribedMessage(async (thread, message) => {
  await handleMessage({ thread, message });
});

async function handleMessage({ thread, message }: { thread: Thread; message: Message }) {
  if (message.text.trim().toLowerCase() === "audio") {
    await sendWhatsAppAudio(thread);
    return;
  }

  await thread.startTyping();
  await thread.adapter.addReaction(thread.id, message.id, emoji.hourglass);

  try {
    let history;

    try {
      const messages = await getThreadMessages(thread);
      history = await toAiMessages(messages);
      if (history.length === 0) {
        history = [{ role: "user" as const, content: message.text }];
      }
    } catch (e) {
      console.error("Error fetching messages:", e);
      await thread.post({ markdown: "Hubo un error procesando tu mensaje" });

      return;
    }

    const phoneNumber = extractPhoneNumber(thread);

    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      system: [
        "You are a friendly crypto assistant bot on WhatsApp.",
        "You can create Polygon smart wallets for users, check their wallet address, and check their USDC balance.",
        "You are allowed to use the following markdown elements: **bold**, _italic_ and `code`. Use them only when necessary.",
        phoneNumber
          ? `The user's phone number is ${phoneNumber}. Use it when calling wallet tools.`
          : "Could not detect the user's phone number. Ask them to provide it if they want wallet features.",
        "When a user wants to create a wallet, first call createWallet with confirmed=false to ask for confirmation.",
        "Only call createWallet with confirmed=true after the user explicitly confirms.",
        "After wallet creation, share the address with the user.",
      ].join("\n"),
      tools: polymarketTools,
      stopWhen: stepCountIs(8),
      messages: history,
    });

    await thread.post({ markdown: text || "No pude generar una respuesta." });
  } catch (error) {
    console.error("Error generating response:", error);
    await thread.post({ markdown: "Hubo un error generando la respuesta" });
  } finally {
    await thread.adapter.removeReaction(thread.id, message.id, emoji.hourglass);
  }
}

async function getThreadMessages(thread: Thread): Promise<Message[]> {
  let messages: Message[] = [];
  if (thread.adapter.name !== "whatsapp") {
    const result = await thread.adapter.fetchMessages(thread.id, { limit: 100 });
    messages = result.messages;
  } else {
    for await (const message of thread.messages) {
      messages.push(message);
      if (messages.length >= 100) break;
    }
  }
  return messages;
}
