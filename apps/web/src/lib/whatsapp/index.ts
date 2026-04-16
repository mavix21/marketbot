import { WhatsAppAdapter } from "@chat-adapter/whatsapp";
import type { Thread } from "chat";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const GRAPH_API_URL = "https://graph.facebook.com/v21.0";

function getWhatsAppContext(
  thread: Thread<unknown>,
): { userWaId: string; phoneNumberId: string; accessToken: string } | null {
  if (!(thread.adapter instanceof WhatsAppAdapter)) {
    return null;
  }

  const { userWaId } = thread.adapter.decodeThreadId(thread.id);
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!accessToken || !phoneNumberId) {
    return null;
  }

  return { userWaId, phoneNumberId, accessToken };
}

async function postGraphApi(path: string, accessToken: string, body: unknown): Promise<boolean> {
  const res = await fetch(`${GRAPH_API_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.error("WhatsApp Graph API error:", res.status, await res.text());
    return false;
  }
  return true;
}

export interface WhatsAppListRow {
  id: string;
  title: string;
  description?: string;
}

export interface WhatsAppListSection {
  title?: string;
  rows: WhatsAppListRow[];
}

export interface SendListOptions {
  header?: string;
  body: string;
  footer?: string;
  button: string;
  sections: WhatsAppListSection[];
}

/**
 * Send an interactive list message.
 * Limits: row title ≤ 24 chars, description ≤ 72 chars, section title ≤ 24 chars,
 * button label ≤ 20 chars, max 10 rows total.
 */
export async function sendWhatsAppList(
  thread: Thread<unknown>,
  options: SendListOptions,
): Promise<void> {
  const ctx = getWhatsAppContext(thread);
  if (!ctx) {
    await thread.post({ markdown: "Este menú solo está disponible en WhatsApp." });
    return;
  }

  await postGraphApi(`/${ctx.phoneNumberId}/messages`, ctx.accessToken, {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: ctx.userWaId,
    type: "interactive",
    interactive: {
      type: "list",
      ...(options.header ? { header: { type: "text", text: options.header } } : {}),
      body: { text: options.body },
      ...(options.footer ? { footer: { text: options.footer } } : {}),
      action: {
        button: options.button,
        sections: options.sections,
      },
    },
  });
}

export interface SendButtonsOptions {
  header?: string;
  body: string;
  footer?: string;
  buttons: { id: string; title: string }[];
}

/**
 * Send an interactive reply-buttons message (up to 3 buttons).
 * Button titles are limited to 20 chars.
 */
export async function sendWhatsAppButtons(
  thread: Thread<unknown>,
  options: SendButtonsOptions,
): Promise<void> {
  const ctx = getWhatsAppContext(thread);
  if (!ctx) {
    await thread.post({ markdown: options.body });
    return;
  }

  await postGraphApi(`/${ctx.phoneNumberId}/messages`, ctx.accessToken, {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: ctx.userWaId,
    type: "interactive",
    interactive: {
      type: "button",
      ...(options.header ? { header: { type: "text", text: options.header } } : {}),
      body: { text: options.body },
      ...(options.footer ? { footer: { text: options.footer } } : {}),
      action: {
        buttons: options.buttons.slice(0, 3).map((b) => ({
          type: "reply",
          reply: { id: b.id, title: b.title },
        })),
      },
    },
  });
}

export async function sendWhatsAppAudio(thread: Thread<unknown>): Promise<void> {
  const ctx = getWhatsAppContext(thread);
  if (!ctx) {
    await thread.post({ markdown: "El envío de audio solo está disponible en WhatsApp." });
    return;
  }

  const audioPath = join(process.cwd(), "public", "audio_file_example.mp3");
  const data = await readFile(audioPath);

  const { userWaId, phoneNumberId, accessToken } = ctx;
  const graphApiUrl = GRAPH_API_URL;

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
