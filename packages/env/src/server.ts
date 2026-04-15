import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    CORS_ORIGIN: z.url(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    POLYGON_RPC_URL: z.url(),
    POLY_BUILDER_API_KEY: z.string().min(1),
    POLY_BUILDER_SECRET: z.string().min(1),
    POLY_BUILDER_PASSPHRASE: z.string().min(1),
    WALLET_ENCRYPTION_KEY: z.string().length(64),
    REDIS_URL: z.string().min(1),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
