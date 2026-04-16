import { tool } from "ai";
import { z } from "zod";
import { createUserWallet, getUserSafeAddress, getUserBalance } from "./wallet";

export type PolymarketToolContext = {
  phoneNumber: string | null;
};

function requirePhone(
  context: unknown,
):
  | { ok: true; phoneNumber: string }
  | { ok: false; error: { status: "no_phone"; message: string } } {
  const phoneNumber = (context as PolymarketToolContext | undefined)?.phoneNumber;
  if (!phoneNumber) {
    return {
      ok: false,
      error: {
        status: "no_phone" as const,
        message: "Could not identify the user's phone number. This feature only works on WhatsApp.",
      },
    };
  }
  return { ok: true, phoneNumber };
}

export const polymarketTools = {
  createWallet: tool({
    description:
      "Create a new Polygon smart account (Safe wallet) for the user. " +
      "Call this when the user wants to create a wallet/account.",
    inputSchema: z.object({
      confirmed: z
        .boolean()
        .describe(
          "Whether the user has confirmed they want to create the wallet. " +
            "If false, ask for confirmation first before calling again with true.",
        ),
    }),
    execute: async ({ confirmed }, { experimental_context }) => {
      if (!confirmed) {
        return {
          status: "pending_confirmation" as const,
          message: "Ask the user to confirm they want to create a Polygon wallet.",
        };
      }

      const phone = requirePhone(experimental_context);
      if (!phone.ok) return phone.error;

      try {
        const result = await createUserWallet(phone.phoneNumber);

        if (result.alreadyExisted) {
          return {
            status: "already_exists" as const,
            safeAddress: result.safeAddress,
            message: "User already has a wallet.",
          };
        }

        return {
          status: "created" as const,
          safeAddress: result.safeAddress,
          message: "Wallet created successfully.",
        };
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        return { status: "error" as const, message: msg };
      }
    },
  }),

  getWallet: tool({
    description:
      "Get the user's existing Polygon wallet address. " +
      "Call this when the user asks about their wallet or address.",
    inputSchema: z.object({}),
    execute: async (_input, { experimental_context }) => {
      const phone = requirePhone(experimental_context);
      if (!phone.ok) return phone.error;

      const address = await getUserSafeAddress(phone.phoneNumber);
      if (!address) {
        return {
          status: "not_found" as const,
          message: "No wallet found. Ask if they want to create one.",
        };
      }
      return { status: "found" as const, safeAddress: address };
    },
  }),

  getBalance: tool({
    description:
      "Get the USDC balance of the user's Polygon wallet. " +
      "Call this when the user asks about their balance or funds.",
    inputSchema: z.object({}),
    execute: async (_input, { experimental_context }) => {
      const phone = requirePhone(experimental_context);
      if (!phone.ok) return phone.error;

      try {
        const result = await getUserBalance(phone.phoneNumber);
        if (!result) {
          return {
            status: "no_wallet" as const,
            message: "No wallet found. Ask if they want to create one.",
          };
        }
        return {
          status: "success" as const,
          safeAddress: result.safeAddress,
          usdc: result.usdc,
        };
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        return { status: "error" as const, message: msg };
      }
    },
  }),
};
