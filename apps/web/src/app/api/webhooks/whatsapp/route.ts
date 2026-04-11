// Next.js App Router example
import { bot } from "@/lib/bot";

export async function GET(request: Request) {
  return bot.getAdapter("whatsapp").handleWebhook(request);
}

export async function POST(request: Request) {
  return bot.getAdapter("whatsapp").handleWebhook(request);
}
