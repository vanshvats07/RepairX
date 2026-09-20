import mongoose from "mongoose";
import { assertRequiredServerEnv, databaseConfig, getAppEnvironment } from "@/config/env";

const globalCache = globalThis.__repairxMongoose || { conn: null, promise: null };
globalThis.__repairxMongoose = globalCache;

export async function connectMongo() {
  const environment = getAppEnvironment();
  if (environment === "production") {
    assertRequiredServerEnv(["MONGODB_URI", "JWT_SECRET"]);
  }

  if (!databaseConfig.mongoUri) return null;
  if (globalCache.conn) return globalCache.conn;
  if (!globalCache.promise) {
    globalCache.promise = mongoose.connect(databaseConfig.mongoUri, {
      bufferCommands: false,
      maxPoolSize: databaseConfig.maxPoolSize,
      serverSelectionTimeoutMS: databaseConfig.serverSelectionTimeoutMs,
      socketTimeoutMS: databaseConfig.socketTimeoutMs,
      connectTimeoutMS: databaseConfig.connectTimeoutMs,
      retryWrites: true,
      autoIndex: true,
    });
  }

  globalCache.conn = await globalCache.promise;
  return globalCache.conn;
}
