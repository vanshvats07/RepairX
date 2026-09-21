import "server-only";
import { connectMongo } from "@/lib/mongodb";
import AuditEvent from "@/models/AuditEvent";
import DataQualityIssue from "@/models/DataQualityIssue";
import Dispute from "@/models/Dispute";
import OperationalAlert from "@/models/OperationalAlert";
import Part from "@/models/Part";
import RepairJob from "@/models/RepairJob";
import RepairRequest from "@/models/RepairRequest";
import Workshop from "@/models/Workshop";
import Quote from "@/models/Quote";
import User from "@/models/User";
import Technician from "@/models/Technician";
import Investigation from "@/models/Investigation";

export function getOperationalThresholds() {
  return {
    REQUEST_DELAY: Number(process.env.ADMIN_REQUEST_DELAY_DAYS || 3),
    TECHNICIAN_ASSIGNMENT_DELAY: Number(process.env.ADMIN_TECHNICIAN_DELAY_DAYS || 2),
    REPAIR_DELAY: Number(process.env.ADMIN_REPAIR_DELAY_DAYS || 5),
    QUALITY_CHECK_DELAY: Number(process.env.ADMIN_QUALITY_DELAY_DAYS || 2),
    DELIVERY_DELAY: Number(process.env.ADMIN_DELIVERY_DELAY_DAYS || 3),
    EXTERNAL_DATA_STALENESS_DAYS: Number(process.env.ADMIN_EXTERNAL_DATA_STALE_DAYS || 14),
  };
}

export function detectOperationalDelay({ createdAt, updatedAt, scheduledAt, expectedCompletion, type = "REQUEST_DELAY" }) {
  const thresholds = getOperationalThresholds();
  const thresholdDays = thresholds[type] ?? thresholds.REQUEST_DELAY ?? 3;
  const reference = new Date(scheduledAt || expectedCompletion || updatedAt || createdAt || Date.now());
  const now = new Date();
  const elapsedDays = Math.max(0, (now.getTime() - new Date(reference).getTime()) / 86400000);
  const exceeded = elapsedDays > thresholdDays;
  return {
    type,
    needsAttention: exceeded,
    thresholdDays,
    elapsedDays: Number(elapsedDays.toFixed(1)),
    status: exceeded ? "NEEDS_ATTENTION" : "ON_TRACK",
    lastUpdatedAt: updatedAt || createdAt || null,
  };
}

export async function getAdminOverview() {
  await connectMongo();
  if (!process.env.MONGODB_URI) {
    return {
      queues: {
        verification: { count: 0, label: "Workshop verification" },
        repairRequests: { count: 0, label: "Repair requests" },
        activeRepairs: { count: 0, label: "Active repairs" },
        disputes: { count: 0, label: "Customer disputes" },
        alerts: { count: 0, label: "Operational alerts" },
        dataQuality: { count: 0, label: "Data quality" },
      },
      recentActivity: [],
      health: { searchStatus: "UNAVAILABLE", dbStatus: "UNAVAILABLE" },
      metrics: { totalUsers: 0, totalWorkshops: 0, activeTechnicians: 0, openRepairCases: 0, completedRepairs: 0, aiAssessments: 0 },
    };
  }

  const [workshopVerification, repairRequests, activeRepairs, disputes, alerts, dataQualityIssues, recentActivity, totalUsers, totalWorkshops, activeTechnicians, completedRepairs, aiAssessments] = await Promise.all([
    Workshop.countDocuments({ verificationStatus: { $in: ["DISCOVERED", "UNDER_REVIEW", "CLAIM_REQUESTED"] } }),
    RepairRequest.countDocuments({ status: { $nin: ["COMPLETED", "DELIVERED", "CANCELLED"] } }),
    RepairJob.countDocuments({ status: { $nin: ["COMPLETED", "DELIVERED", "CANCELLED"] } }),
    Dispute.countDocuments({ status: { $in: ["OPEN", "UNDER_REVIEW", "WAITING_FOR_INFORMATION"] } }),
    OperationalAlert.countDocuments({ status: "OPEN" }),
    DataQualityIssue.countDocuments({ status: { $in: ["OPEN", "DISMISSED"] } }),
    AuditEvent.find({}).sort({ createdAt: -1 }).limit(8).lean(),
    User.countDocuments({}),
    Workshop.countDocuments({}),
    Technician.countDocuments({ status: "ACTIVE" }),
    RepairRequest.countDocuments({ status: { $in: ["COMPLETED", "DELIVERED"] } }),
    Investigation.countDocuments({}),
  ]);

  return {
    queues: {
      verification: { count: workshopVerification, label: "Workshop verification" },
      repairRequests: { count: repairRequests, label: "Repair requests" },
      activeRepairs: { count: activeRepairs, label: "Active repairs" },
      disputes: { count: disputes, label: "Customer disputes" },
      alerts: { count: alerts, label: "Operational alerts" },
      dataQuality: { count: dataQualityIssues, label: "Data quality" },
    },
    recentActivity: recentActivity.map((event) => ({
      id: String(event._id),
      action: event.action || event.eventType || "SYSTEM_EVENT",
      entityType: event.entityType || "UNKNOWN",
      timestamp: event.createdAt || event.timestamp || new Date().toISOString(),
      metadata: event.metadata || {},
    })),
    health: {
      searchStatus: process.env.SERPAPI_API_KEY ? "AVAILABLE" : "UNAVAILABLE",
      dbStatus: "AVAILABLE",
    },
    metrics: { totalUsers, totalWorkshops, activeTechnicians, openRepairCases: repairRequests, completedRepairs, aiAssessments },
  };
}

export async function getPilotOverview() {
  await connectMongo();
  const [activePilotCases, investigationsStarted, repairRequestsCreated, workshopsAcceptingRequests, technicianVerificationRate, quoteApprovalCount, repairsCompleted, followUpsPending] = await Promise.all([
    RepairRequest.countDocuments({ pilotCase: true, status: { $nin: ["CANCELLED", "DELIVERED"] } }),
    Investigation.countDocuments({ pilotCase: true }),
    RepairRequest.countDocuments({ pilotCase: true }),
    Workshop.countDocuments({ pilotStatus: "ACTIVE" }),
    RepairRequest.countDocuments({ pilotCase: true, status: { $in: ["DIAGNOSIS_VERIFIED", "QUOTE_READY", "AWAITING_CUSTOMER_APPROVAL", "APPROVED", "REPAIR_IN_PROGRESS", "QUALITY_CHECK", "COMPLETED", "DELIVERED"] } }),
    RepairRequest.countDocuments({ pilotCase: true, status: { $in: ["APPROVED", "REPAIR_IN_PROGRESS", "QUALITY_CHECK", "COMPLETED", "DELIVERED"] } }),
    RepairJob.countDocuments({ pilotCase: true, status: "COMPLETED" }),
    0,
  ]);

  return {
    metrics: {
      investigationsStarted,
      repairRequestsCreated,
      activePilotCases,
      workshopsAcceptingRequests,
      technicianVerificationRate: technicianVerificationRate ? "Limited pilot data" : "Limited pilot data",
      quoteApprovalCount,
      repairsCompleted,
      followUpsPending,
    },
    message: "Private pilot data only. Visibility is limited to operational learning.",
  };
}

export async function getDataQualityIssues() {
  await connectMongo();
  const workshops = await Workshop.find({}).lean();
  const parts = await Part.find({}).lean();
  const quotes = await Quote.find({}).lean();
  const repairJobs = await RepairJob.find({}).lean();

  const issues = [];

  for (const workshop of workshops) {
    if (!workshop.phone) issues.push({ type: "MISSING_WORKSHOP_PHONE", severity: "ATTENTION", entityType: "Workshop", entityId: workshop._id, title: "Missing workshop phone", details: `${workshop.name || "Workshop"} has no phone number recorded.` });
    if (!workshop.address && !workshop.locality && !workshop.city) issues.push({ type: "MISSING_WORKSHOP_LOCATION", severity: "ATTENTION", entityType: "Workshop", entityId: workshop._id, title: "Missing workshop location", details: `${workshop.name || "Workshop"} has no location data in the RepairX record.` });
    if (!workshop.authorizationStatus || workshop.authorizationStatus === "UNKNOWN") issues.push({ type: "UNKNOWN_AUTHORIZATION", severity: "INFO", entityType: "Workshop", entityId: workshop._id, title: "Unknown authorization status", details: `${workshop.name || "Workshop"} does not have a verified authorization state.` });
    if (workshop.sourceRetrievedAt) {
      const staleDays = (Date.now() - new Date(workshop.sourceRetrievedAt).getTime()) / 86400000;
      if (staleDays > (getOperationalThresholds().EXTERNAL_DATA_STALENESS_DAYS || 14)) {
        issues.push({ type: "STALE_EXTERNAL_DATA", severity: "ATTENTION", entityType: "Workshop", entityId: workshop._id, title: "Stale external data", details: `${workshop.name || "Workshop"} was last refreshed ${Math.round(staleDays)} days ago.` });
      }
    }
  }

  for (const part of parts) {
    if (!part.source && !part.partType) issues.push({ type: "PART_WITHOUT_SOURCE", severity: "ATTENTION", entityType: "Part", entityId: part._id, title: "Part without source", details: `${part.name || "Part"} has no clear source or provenance.` });
    if (!part.deviceCompatibility || !part.deviceCompatibility.length) issues.push({ type: "PART_WITHOUT_COMPATIBILITY", severity: "ATTENTION", entityType: "Part", entityId: part._id, title: "Part without compatibility", details: `${part.name || "Part"} has no recorded compatibility data.` });
  }

  for (const quote of quotes) {
    if (!quote.repairRequestId) issues.push({ type: "QUOTE_WITHOUT_REPAIR", severity: "ATTENTION", entityType: "Quote", entityId: quote._id, title: "Quote without repair context", details: "A quote exists without an associated repair request." });
  }

  for (const repairJob of repairJobs) {
    if (!repairJob.repairOutcome && repairJob.status === "COMPLETED") issues.push({ type: "REPAIR_WITHOUT_OUTCOME", severity: "ATTENTION", entityType: "RepairJob", entityId: repairJob._id, title: "Repair without outcome", details: "A completed repair job is missing a final outcome." });
  }

  const existingIssues = await DataQualityIssue.find({ status: { $ne: "RESOLVED" } }).lean();
  const merged = [...issues, ...existingIssues.map((issue) => ({
    type: issue.type,
    severity: issue.severity,
    entityType: issue.entityType,
    entityId: issue.entityId,
    title: issue.title,
    details: issue.details,
    status: issue.status,
    createdAt: issue.createdAt,
  }))];

  return merged.slice(0, 200);
}

export async function getPlatformHealth() {
  await connectMongo();
  const [auditCount, openAlerts, openDisputes, activeJobs, pendingRequests] = await Promise.all([
    AuditEvent.countDocuments({}),
    OperationalAlert.countDocuments({ status: "OPEN" }),
    Dispute.countDocuments({ status: { $in: ["OPEN", "UNDER_REVIEW"] } }),
    RepairJob.countDocuments({ status: { $nin: ["COMPLETED", "DELIVERED", "CANCELLED"] } }),
    RepairRequest.countDocuments({ status: { $nin: ["COMPLETED", "DELIVERED", "CANCELLED"] } }),
  ]);

  const lastAudit = await AuditEvent.findOne({}).sort({ createdAt: -1 }).lean();

  return {
    database: "HEALTHY",
    search: process.env.SERPAPI_API_KEY ? "AVAILABLE" : "UNAVAILABLE",
    pendingRequests,
    activeJobs,
    openDisputes,
    openAlerts,
    auditEvents: auditCount,
    lastSuccessfulEvent: lastAudit?.createdAt || null,
  };
}
