import { generatePrivateKey } from "viem/accounts";
import { createPublicClient, http, type Hex, erc20Abi } from "viem";
import { polygon } from "viem/chains";
import { RelayerTransactionState } from "@polymarket/builder-relayer-client";
import { env } from "@market-bot/env/server";
import { encryptPrivateKey, decryptPrivateKey } from "./crypto";
import { createViemWallet, createRelayClient } from "./relayer";
import { getStoredWallet, saveWallet, type StoredWallet } from "./store";

const USDC_ADDRESS = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174" as const;

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

export interface BalanceResult {
  safeAddress: string;
  usdc: string;
}

export async function getUserBalance(phoneNumber: string): Promise<BalanceResult | null> {
  const stored = await getStoredWallet(phoneNumber);
  if (!stored) return null;

  const client = createPublicClient({
    chain: polygon,
    transport: http(env.POLYGON_RPC_URL),
  });

  const raw = await client.readContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [stored.safeAddress as `0x${string}`],
  });

  const usdc = (Number(raw) / 1e6).toFixed(2);

  return { safeAddress: stored.safeAddress, usdc };
}
