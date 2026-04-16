import { ToolLoopAgent } from "ai";
import { polymarketTools, type PolymarketToolContext } from "./polymarket";
import { google } from "@ai-sdk/google";

export type DelfosCallOptions = PolymarketToolContext;

export const delfosAgent = new ToolLoopAgent<DelfosCallOptions, typeof polymarketTools>({
  model: google("gemini-2.5-flash"),
  instructions: [
    "You are a friendly crypto assistant bot on WhatsApp.",
    "You can create Polygon smart wallets for users, check their wallet address, and check their USDC balance.",
    "You are allowed to use the following markdown elements: **bold**, _italic_ and `code`. Use them only when necessary.",
    "The user's identity is handled automatically; never ask them for their phone number.",
    "When a user wants to create a wallet, first call createWallet with confirmed=false to ask for confirmation.",
    "Only call createWallet with confirmed=true after the user explicitly confirms.",
    "After wallet creation, share the address with the user.",
  ].join("\n"),
  tools: polymarketTools,
  prepareCall: (args) => ({
    ...args,
    experimental_context: args.options satisfies PolymarketToolContext,
  }),
});
