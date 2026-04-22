import type { Thread, Message } from "chat";
import { Chat, Card, CardText, Actions, Button } from "chat";
import { createTelegramAdapter } from "@chat-adapter/telegram";
import { createRedisState } from "@chat-adapter/state-redis";
import { pdfToDocx, docxToPdf } from "./convert";
import {
  DEMO_ACTION_IDS,
  handleDemoAction,
  handleReaction,
  isDemoTrigger,
  sendDemoMenu,
  type DemoState,
} from "./demo";

type PendingKind = "pdf" | "docx";

interface PendingFile {
  kind: PendingKind;
  filename: string;
  dataBase64: string;
}

export interface BotThreadState extends DemoState {
  pending?: PendingFile;
}

const CONVERT_TO_WORD = "convert_to_word";
const CONVERT_TO_PDF = "convert_to_pdf";

const PDF_MIME = "application/pdf";
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export const bot = new Chat({
  userName: "ilofpdfbot",
  adapters: {
    telegram: createTelegramAdapter(),
  },
  state: createRedisState(),
  logger: "info",
});

bot.onNewMention(async (thread, message) => {
  await thread.subscribe();
  await handleIncoming(thread, message);
});

bot.onDirectMessage(async (thread, message) => {
  await thread.subscribe();
  await handleIncoming(thread, message);
});

bot.onSubscribedMessage(async (thread, message) => {
  await handleIncoming(thread, message);
});

bot.onAction(CONVERT_TO_WORD, async (event) => {
  const thread = event.thread;
  if (!thread) return;
  await runConversion(thread as Thread<BotThreadState>, "pdf");
});

bot.onAction(CONVERT_TO_PDF, async (event) => {
  const thread = event.thread;
  if (!thread) return;
  await runConversion(thread as Thread<BotThreadState>, "docx");
});

bot.onAction(DEMO_ACTION_IDS, handleDemoAction);

bot.onReaction(handleReaction);

async function handleIncoming(thread: Thread<unknown>, message: Message): Promise<void> {
  const typedThread = thread as Thread<BotThreadState>;
  const detected = detectConvertible(message);

  if (!detected) {
    if (isDemoTrigger(message.text ?? "")) {
      await sendDemoMenu(typedThread);
      return;
    }
    await typedThread.post({
      markdown:
        "Envíame un archivo *PDF* o *Word (.docx)* y lo convierto por ti.\n\nEscribe *!demo* para ver un menú con funciones del SDK.",
    });
    return;
  }

  let buffer: Buffer;
  try {
    buffer = await detected.attachment.fetchData!();
  } catch (err) {
    console.error("Error descargando archivo:", err);
    await typedThread.post({
      markdown: "❌ No pude descargar el archivo. Intenta enviarlo de nuevo.",
    });
    return;
  }

  await typedThread.setState({
    pending: {
      kind: detected.kind,
      filename: detected.filename,
      dataBase64: buffer.toString("base64"),
    },
  });

  if (detected.kind === "pdf") {
    await typedThread.post(
      Card({
        title: "PDF recibido",
        children: [
          CardText(`📄 *${detected.filename}*\n\n¿Qué quieres hacer?`),
          Actions([Button({ id: CONVERT_TO_WORD, label: "Convertir a Word", style: "primary" })]),
        ],
      }),
    );
  } else {
    await typedThread.post(
      Card({
        title: "Documento Word recibido",
        children: [
          CardText(`📝 *${detected.filename}*\n\n¿Qué quieres hacer?`),
          Actions([Button({ id: CONVERT_TO_PDF, label: "Convertir a PDF", style: "primary" })]),
        ],
      }),
    );
  }
}

async function runConversion(
  thread: Thread<BotThreadState>,
  expectedKind: PendingKind,
): Promise<void> {
  const state = await thread.state;
  const pending = state?.pending;

  if (!pending || pending.kind !== expectedKind) {
    await thread.post({
      markdown: "⚠️ No encuentro el archivo original. Envíamelo otra vez, por favor.",
    });
    return;
  }

  await thread.startTyping();

  try {
    const input = Buffer.from(pending.dataBase64, "base64");

    if (pending.kind === "pdf") {
      const docxBuffer = await pdfToDocx(input);
      const outName = replaceExt(pending.filename, ".docx");
      await thread.post({
        markdown: `✅ Tu archivo convertido a Word:`,
        files: [
          {
            data: docxBuffer,
            filename: outName,
            mimeType: DOCX_MIME,
          },
        ],
      });
    } else {
      const pdfBuffer = await docxToPdf(input);
      const outName = replaceExt(pending.filename, ".pdf");
      await thread.post({
        markdown: `✅ Tu archivo convertido a PDF:`,
        files: [
          {
            data: pdfBuffer,
            filename: outName,
            mimeType: PDF_MIME,
          },
        ],
      });
    }
  } catch (err) {
    console.error("Error en conversión:", err);
    await thread.post({
      markdown: "❌ Hubo un error convirtiendo el archivo. Intenta de nuevo.",
    });
  } finally {
    await thread.setState({ pending: undefined });
  }
}

function detectConvertible(message: Message): {
  kind: PendingKind;
  filename: string;
  attachment: NonNullable<Message["attachments"]>[number];
} | null {
  for (const att of message.attachments ?? []) {
    if (!att.fetchData) continue;
    const name = att.name ?? "archivo";
    const lower = name.toLowerCase();
    const mime = att.mimeType?.toLowerCase() ?? "";

    if (mime === PDF_MIME || lower.endsWith(".pdf")) {
      return { kind: "pdf", filename: name, attachment: att };
    }
    if (mime === DOCX_MIME || lower.endsWith(".docx")) {
      return { kind: "docx", filename: name, attachment: att };
    }
  }
  return null;
}

function replaceExt(filename: string, newExt: string): string {
  const idx = filename.lastIndexOf(".");
  const base = idx > 0 ? filename.slice(0, idx) : filename;
  return `${base}${newExt}`;
}
