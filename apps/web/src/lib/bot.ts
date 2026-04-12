import type { Thread, Message } from "chat";
import { Chat, emoji, toAiMessages } from "chat";
import { createWhatsAppAdapter, WhatsAppAdapter } from "@chat-adapter/whatsapp";
import { createRedisState } from "@chat-adapter/state-redis";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

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
      console.dir({ history }, { depth: null });
    } catch (e) {
      console.error("Error fetching messages:", e);
      await thread.post({ markdown: "Hubo un error procesando tu mensaje" });

      return;
    }

    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      system: `You are a friendly support bot. Answer questions concisely.
        You are allowed to use the following markdown elements: **bold**, _italic_ and \`code\`. Use them only when necessary.`,
      messages: history,
    });
    console.log({ text });

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

async function sendWhatsAppAudio(thread: Thread): Promise<void> {
  if (!(thread.adapter instanceof WhatsAppAdapter)) {
    await thread.post({ markdown: "El envío de audio solo está disponible en WhatsApp." });
    return;
  }

  const { userWaId } = thread.adapter.decodeThreadId(thread.id);
  const audioPath = join(process.cwd(), "public", "audio_file_example.mp3");
  const data = await readFile(audioPath);

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN!;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const graphApiUrl = "https://graph.facebook.com/v21.0";

  // 1. Upload media to WhatsApp
  const form = new FormData();
  form.append("messaging_product", "whatsapp");
  form.append("type", "audio/mpeg");
  form.append("file", new Blob([data], { type: "audio/mpeg" }), "audio_file_example.mp3");

  const uploadRes = await fetch(`${graphApiUrl}/${phoneNumberId}/media`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    console.error("WhatsApp media upload failed:", err);
    await thread.post({ markdown: "No se pudo subir el archivo de audio." });
    return;
  }

  const { id: mediaId } = (await uploadRes.json()) as { id: string };

  // 2. Send audio message
  const sendRes = await fetch(`${graphApiUrl}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: userWaId,
      type: "audio",
      audio: { id: mediaId },
    }),
  });

  if (!sendRes.ok) {
    const err = await sendRes.text();
    console.error("WhatsApp audio send failed:", err);
    await thread.post({ markdown: "No se pudo enviar el audio." });
  }
}
