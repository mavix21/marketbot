// Next.js App Router example
import { after } from "next/server";
import { bot } from "@/lib/bot";

export async function GET(request: Request) {
  return bot.webhooks.whatsapp(request);
}

export async function POST(request: Request) {
  return bot.webhooks.whatsapp(request, {
    waitUntil: (task) => after(() => task),
  });
}
