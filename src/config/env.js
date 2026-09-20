import "server-only";

export const APP_ENVIRONMENTS = ["development", "test", "production"];

export function getEnvValue(key, fallback = "") {
  const value = process.env[key];
  return value === undefined ? fallback : value;
}

export function isAppEnv(value) {
  return APP_ENVIRONMENTS.includes(value);
}

export function getAppEnvironment() {
  const env = getEnvValue("APP_ENV", getEnvValue("NODE_ENV", "development"));
  return isAppEnv(env) ? env : "development";
}

export function assertRequiredServerEnv(requiredKeys = [], options = {}) {
  const environment = getAppEnvironment();
  const { allowEmptyInDev = true } = options;

  const missing = requiredKeys.filter((key) => {
    const value = getEnvValue(key, "");
    if (!value && environment === "production") return true;
    if (!value && environment !== "production" && !allowEmptyInDev) return true;
    return false;
  });

  if (missing.length > 0) {
    throw new Error(`Missing required server configuration: ${missing.join(", ")}.`);
  }
}

export const appConfig = {
  env: getAppEnvironment(),
  name: getEnvValue("APP_NAME", "RepairX"),
  url: getEnvValue("NEXT_PUBLIC_APP_URL", getEnvValue("APP_URL", "http://localhost:3000")),
  logLevel: getEnvValue("LOG_LEVEL", "info"),
  isProduction: getAppEnvironment() === "production",
  isDevelopment: getAppEnvironment() === "development",
  isTest: getAppEnvironment() === "test",
};

export const databaseConfig = {
  mongoUri: getEnvValue("MONGODB_URI", ""),
  maxPoolSize: Number(getEnvValue("MONGODB_MAX_POOL_SIZE", "10")),
  serverSelectionTimeoutMs: Number(getEnvValue("MONGODB_SERVER_SELECTION_TIMEOUT_MS", "5000")),
  socketTimeoutMs: Number(getEnvValue("MONGODB_SOCKET_TIMEOUT_MS", "45000")),
  connectTimeoutMs: Number(getEnvValue("MONGODB_CONNECT_TIMEOUT_MS", "15000")),
};

export const authConfig = {
  jwtSecret: getEnvValue("JWT_SECRET", ""),
  sessionSecret: getEnvValue("SESSION_SECRET", getEnvValue("JWT_SECRET", "")),
  sessionMaxAgeDays: Number(getEnvValue("SESSION_MAX_AGE_DAYS", "7")),
};

export const aiConfig = {
  apiKey: getEnvValue("AI_API_KEY", ""),
  model: getEnvValue("AI_MODEL", "gpt-4o-mini"),
  provider: getEnvValue("AI_PROVIDER", "openai"),
};

export const serpApiConfig = {
  apiKey: getEnvValue("SERPAPI_API_KEY", ""),
  defaultCountry: getEnvValue("SERPAPI_COUNTRY", "in"),
  defaultLanguage: getEnvValue("SERPAPI_LANGUAGE", "en"),
};

export const paymentConfig = {
  provider: getEnvValue("PAYMENT_PROVIDER", ""),
  apiKey: getEnvValue("PAYMENT_API_KEY", ""),
  webhookSecret: getEnvValue("PAYMENT_WEBHOOK_SECRET", ""),
  policy: getEnvValue("PAYMENT_POLICY", "PAY_AFTER_REPAIR"),
};

export const providerConfig = {
  emailProvider: getEnvValue("EMAIL_PROVIDER", ""),
  emailApiKey: getEnvValue("EMAIL_API_KEY", ""),
  smsProvider: getEnvValue("SMS_PROVIDER", ""),
  smsApiKey: getEnvValue("SMS_API_KEY", ""),
  storageProvider: getEnvValue("STORAGE_PROVIDER", ""),
  storageBucket: getEnvValue("STORAGE_BUCKET", ""),
  logisticsProvider: getEnvValue("LOGISTICS_PROVIDER", ""),
  logisticsApiKey: getEnvValue("LOGISTICS_API_KEY", ""),
};

export const loggingConfig = {
  serviceName: getEnvValue("LOG_SERVICE_NAME", "repairx"),
  enableJsonLogs: getEnvValue("LOG_JSON", "true") === "true",
};

export const featureFlags = {
  serpApi: getEnvValue("ENABLE_SERPAPI", "true") === "true",
  imageAnalysis: getEnvValue("ENABLE_IMAGE_ANALYSIS", "false") === "true",
  recoveryAnalysis: getEnvValue("ENABLE_RECOVERY_ANALYSIS", "true") === "true",
  logistics: getEnvValue("ENABLE_LOGISTICS", "false") === "true",
  pilotMode: getEnvValue("PILOT_MODE", "true") === "true",
  inviteOnly: getEnvValue("PILOT_INVITE_ONLY", "true") === "true",
  pickup: getEnvValue("ENABLE_PICKUP", "true") === "true",
  postRepairFollowUp: getEnvValue("ENABLE_POST_REPAIR_FOLLOWUP", "true") === "true",
};
