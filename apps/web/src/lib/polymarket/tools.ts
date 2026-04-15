import { tool } from "ai";
import { z } from "zod";
import { createUserWallet, getUserSafeAddress } from "./wallet";

export const polymarketTools = {
  createWallet: tool({
    description:
      "Create a new Polygon smart account (Safe wallet) for the user. " +
      "Call this when the user wants to create a wallet/account. " +
      "Requires the user's phone number.",
    inputSchema: z.object({
      phoneNumber: z.string().describe("The user's phone number including country code"),
      confirmed: z
        .boolean()
        .describe(
          "Whether the user has confirmed they want to create the wallet. " +
            "If false, ask for confirmation first before calling again with true.",
        ),
    }),
    execute: async ({ phoneNumber, confirmed }) => {
      if (!confirmed) {
        return {
          status: "pending_confirmation" as const,
          message: "Ask the user to confirm they want to create a Polygon wallet.",
        };
      }

      try {
        const result = await createUserWallet(phoneNumber);

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
    inputSchema: z.object({
      phoneNumber: z.string().describe("The user's phone number including country code"),
    }),
    execute: async ({ phoneNumber }) => {
      const address = await getUserSafeAddress(phoneNumber);
      if (!address) {
        return {
          status: "not_found" as const,
          message: "No wallet found. Ask if they want to create one.",
        };
      }
      return { status: "found" as const, safeAddress: address };
    },
  }),
};
