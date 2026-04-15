import { createWalletClient, http, type Hex, type WalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { polygon } from "viem/chains";
import { RelayClient, RelayerTxType } from "@polymarket/builder-relayer-client";
import { BuilderConfig } from "@polymarket/builder-signing-sdk";
import { env } from "@market-bot/env/server";

const RELAYER_URL = "https://relayer-v2.polymarket.com/";
const CHAIN_ID = 137;

export function createViemWallet(privateKey: Hex): WalletClient {
  const account = privateKeyToAccount(privateKey);
  return createWalletClient({
    account,
    chain: polygon,
    transport: http(env.POLYGON_RPC_URL),
  });
}

function createBuilderConfig(): BuilderConfig {
  return new BuilderConfig({
    localBuilderCreds: {
      key: env.POLY_BUILDER_API_KEY,
      secret: env.POLY_BUILDER_SECRET,
      passphrase: env.POLY_BUILDER_PASSPHRASE,
    },
  });
}

export function createRelayClient(wallet: WalletClient): RelayClient {
  return new RelayClient(RELAYER_URL, CHAIN_ID, wallet, createBuilderConfig(), RelayerTxType.SAFE);
}
