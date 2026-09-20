import "server-only";
import Notification from "@/models/Notification";

function getEmailAdapter() {
  const provider = (process.env.EMAIL_PROVIDER || "").toLowerCase();
  if (provider === "resend" || provider === "sendgrid") {
    return { send: async (payload) => ({ provider, status: "QUEUED", payload }) };
  }
  return { send: async (payload) => ({ provider: "in_app_only", status: "QUEUED", payload }) };
}

export async function createNotification({ userId, type, title, message, entityType, entityId, body }) {
  if (!userId) return null;
  const entry = await Notification.create({
    userId,
    type,
    title,
    message: message || body || title,
    body: body || message || title,
    entityType,
    entityId,
    read: false
  });
  const provider = getEmailAdapter();
  await provider.send({ userId, type, title, message: entry.message, entityType, entityId });
  return entry;
}

export async function notifyCustomer({ userId, type, title, message, entityType, entityId }) {
  return createNotification({ userId, type, title, message, entityType, entityId });
}

export async function notifyTechnician({ userId, type, title, message, entityType, entityId }) {
  return createNotification({ userId, type, title, message, entityType, entityId });
}

export async function notifyWorkshopOwner({ userId, type, title, message, entityType, entityId }) {
  return createNotification({ userId, type, title, message, entityType, entityId });
}

export async function getUnreadNotificationCount(userId) {
  if (!userId) return 0;
  return Notification.countDocuments({ userId, read: false });
}

const notificationService = {
  createNotification,
  notifyCustomer,
  notifyTechnician,
  notifyWorkshopOwner,
  getUnreadNotificationCount
};

export default notificationService;
