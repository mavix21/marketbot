import { env } from "@market-bot/env/server";
import { createClient } from "redis";

export interface StoredWallet {
  encryptedKey: string;
  safeAddress: string;
  createdAt: string;
}

const WALLET_PREFIX = "wallet:";

function getRedisUrl(): string {
  return env.REDIS_URL;
}

let redis: ReturnType<typeof createClient> | null = null;

async function getRedis() {
  if (!redis) {
    redis = createClient({ url: getRedisUrl() });
    await redis.connect();
  }
  return redis;
}

export async function getStoredWallet(phoneNumber: string): Promise<StoredWallet | null> {
  const client = await getRedis();
  const data = await client.get(`${WALLET_PREFIX}${phoneNumber}`);
  if (!data) return null;
  return JSON.parse(data) as StoredWallet;
}

export async function saveWallet(phoneNumber: string, wallet: StoredWallet): Promise<void> {
  const client = await getRedis();
  await client.set(`${WALLET_PREFIX}${phoneNumber}`, JSON.stringify(wallet));
}
