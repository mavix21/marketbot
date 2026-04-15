import { generatePrivateKey } from "viem/accounts";
import type { Hex } from "viem";
import { RelayerTransactionState } from "@polymarket/builder-relayer-client";
import { encryptPrivateKey, decryptPrivateKey } from "./crypto";
import { createViemWallet, createRelayClient } from "./relayer";
import { getStoredWallet, saveWallet, type StoredWallet } from "./store";

export interface WalletResult {
  safeAddress: string;
  alreadyExisted: boolean;
}

export async function createUserWallet(phoneNumber: string): Promise<WalletResult> {
  const existing = await getStoredWallet(phoneNumber);
  if (existing) {
    return { safeAddress: existing.safeAddress, alreadyExisted: true };
  }

  const privateKey = generatePrivateKey();
  const wallet = createViemWallet(privateKey);
  const relayClient = createRelayClient(wallet);

  const response = await relayClient.deploy();
  const result = await response.wait();

  if (
    !result ||
    result.state === RelayerTransactionState.STATE_FAILED ||
    result.state === RelayerTransactionState.STATE_INVALID
  ) {
    throw new Error("Safe deployment failed via Polymarket relayer");
  }

  const safeAddress = result.proxyAddress;
  if (!safeAddress) {
    throw new Error("No proxy address returned from relayer");
  }

  const stored: StoredWallet = {
    encryptedKey: encryptPrivateKey(privateKey),
    safeAddress,
    createdAt: new Date().toISOString(),
  };
  await saveWallet(phoneNumber, stored);

  return { safeAddress, alreadyExisted: false };
}

export async function getUserSafeAddress(phoneNumber: string): Promise<string | null> {
  const stored = await getStoredWallet(phoneNumber);
  return stored?.safeAddress ?? null;
}

export async function getUserPrivateKey(phoneNumber: string): Promise<Hex | null> {
  const stored = await getStoredWallet(phoneNumber);
  if (!stored) return null;
  return decryptPrivateKey(stored.encryptedKey) as Hex;
}
