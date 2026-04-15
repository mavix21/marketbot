import { WhatsAppAdapter } from "@chat-adapter/whatsapp";
import type { Thread } from "chat";

export function extractPhoneNumber(thread: Thread): string | null {
  if (thread.adapter instanceof WhatsAppAdapter) {
    const { userWaId } = thread.adapter.decodeThreadId(thread.id);
    return userWaId;
  }
  return null;
}
