export function getNotificationProviderAdapter() {
  const provider = (process.env.EMAIL_PROVIDER || "").toLowerCase();
  if (provider === "resend" || provider === "sendgrid") {
    return { send: async (payload) => ({ provider, status: "QUEUED", payload }) };
  }
  return { send: async (payload) => ({ provider: "in_app_only", status: "QUEUED", payload }) };
}

export async function sendNotification(payload = {}) {
  return getNotificationProviderAdapter().send(payload);
}
