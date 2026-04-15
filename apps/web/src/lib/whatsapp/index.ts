import { WhatsAppAdapter } from "@chat-adapter/whatsapp";
import type { Thread } from "chat";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function sendWhatsAppAudio(thread: Thread): Promise<void> {
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
