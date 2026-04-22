import { after } from "next/server";
import { bot } from "@/lib/bot";

export async function GET(request: Request) {
  return bot.webhooks.telegram(request);
}

export async function POST(request: Request) {
  return bot.webhooks.telegram(request, {
    waitUntil: (task) => after(() => task),
  });
}
