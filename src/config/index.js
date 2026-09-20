import { aiConfig, appConfig, authConfig, databaseConfig, featureFlags, loggingConfig, serpApiConfig } from "@/config/env";

export const config = {
  app: appConfig,
  database: databaseConfig,
  auth: authConfig,
  ai: aiConfig,
  serpapi: serpApiConfig,
  logging: loggingConfig,
  features: featureFlags,
};

export default config;
