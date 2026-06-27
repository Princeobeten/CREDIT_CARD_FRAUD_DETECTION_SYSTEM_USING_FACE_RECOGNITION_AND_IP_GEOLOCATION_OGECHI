import "server-only";
import mongoose from "mongoose";
import { env } from "@/lib/env";

// Mongoose connection singleton.
// Next.js hot-reloads modules in dev, which would otherwise open a new connection
// on every change and exhaust the Atlas connection pool. We cache the connection
// promise on globalThis so it survives reloads. (Never call this from proxy.ts —
// Proxy runs on every request/prefetch and must stay DB-free.)

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = global._mongooseCache ?? { conn: null, promise: null };
global._mongooseCache = cache;

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(env.mongodbUri, {
        // Fail fast in dev if the cluster/URI is wrong rather than hanging.
        serverSelectionTimeoutMS: 10_000,
        bufferCommands: false,
      })
      .then((m) => m);
  }

  try {
    cache.conn = await cache.promise;
  } catch (err) {
    cache.promise = null; // allow a retry on the next request
    throw err;
  }

  return cache.conn;
}
