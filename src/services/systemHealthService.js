import { connectMongo } from "@/lib/mongodb";
import { getProviderStatus } from "@/services/providerStatusService";
import RepairRequest from "@/models/RepairRequest";
import RepairJob from "@/models/RepairJob";
import AuditEvent from "@/models/AuditEvent";
import OperationalAlert from "@/models/OperationalAlert";

export async function getSystemHealth() {
  await connectMongo();
  const status = {
    application: "HEALTHY",
    database: process.env.MONGODB_URI ? "HEALTHY" : "NOT_CONFIGURED",
    ai: "NOT_CONFIGURED",
    serpApi: "NOT_CONFIGURED",
    payment: "NOT_CONFIGURED",
    notifications: "HEALTHY",
    logistics: "HEALTHY",
    storage: "NOT_CONFIGURED",
    admin: "HEALTHY",
  };

  const providerStatus = getProviderStatus();
  if (providerStatus.ai.status === "CONFIGURED") status.ai = "HEALTHY";
  if (providerStatus.serpApi.status === "CONFIGURED") status.serpApi = "HEALTHY";
  if (providerStatus.payment.status === "CONFIGURED") status.payment = "HEALTHY";
  if (providerStatus.storage.status === "CONFIGURED") status.storage = "HEALTHY";
  if (providerStatus.logistics.status === "CONFIGURED") status.logistics = "HEALTHY";

  const [pendingRequests, activeJobs, alerts, lastAudit] = await Promise.all([
    RepairRequest.countDocuments({ status: { $nin: ["COMPLETED", "DELIVERED", "CANCELLED"] } }),
    RepairJob.countDocuments({ status: { $nin: ["COMPLETED", "DELIVERED", "CANCELLED"] } }),
    OperationalAlert.countDocuments({ status: "OPEN" }),
    AuditEvent.findOne({}).sort({ createdAt: -1 }).lean(),
  ]);

  const staleCaseWindow = Number(process.env.STALE_CASE_THRESHOLD_MS || 3 * 60 * 60 * 1000);
  const staleCases = await RepairRequest.find({
    status: { $nin: ["COMPLETED", "DELIVERED", "CANCELLED"] },
    updatedAt: { $lt: new Date(Date.now() - staleCaseWindow) }
  }).select("caseId status updatedAt").lean();

  return {
    status,
    metrics: {
      pendingRequests,
      activeJobs,
      openAlerts: alerts,
      lastAuditAt: lastAudit?.createdAt || null,
      staleCases: staleCases.length,
    },
    staleCases: staleCases.slice(0, 10).map((caseItem) => ({ caseId: caseItem.caseId, status: caseItem.status, lastUpdatedAt: caseItem.updatedAt, stale: true })),
    providers: providerStatus,
  };
}
