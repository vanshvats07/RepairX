import Device from "@/models/Device";
import DeviceComponent from "@/models/DeviceComponent";
import DeviceCatalog from "@/models/DeviceCatalog";
import RepairEvent from "@/models/RepairEvent";
import RepairRequest from "@/models/RepairRequest";
import RepairJob from "@/models/RepairJob";
import Investigation from "@/models/Investigation";
import Diagnosis from "@/models/Diagnosis";
import PartInstallation from "@/models/PartInstallation";
import QualityCheck from "@/models/QualityCheck";
import PostRepairFollowUp from "@/models/PostRepairFollowUp";
import DeviceValueSnapshot from "@/models/DeviceValueSnapshot";
import Quote from "@/models/Quote";
import WorkshopMembership from "@/models/WorkshopMembership";
import { buildRecoveryProfile, detectRepeatedIssues } from "@/services/deviceIntelligenceService";
import { calculateIntelligenceQuality, classifyIssueRelation } from "@/services/intelligenceDomainService";

function textFor(entry = {}) { return `${entry.complaint || ""} ${entry.reportedProblem || ""} ${entry.diagnosis || ""} ${entry.component || ""}`.toLowerCase(); }
function dateOf(entry) { return entry.completedAt || entry.verifiedAt || entry.createdAt || entry.date || null; }
function stateOf(entry, fallback = "UNKNOWN") { return entry.state || entry.confidence || entry.diagnosisSource || fallback; }
async function canAccessDevice(deviceId, actor) {
  if (actor.role === "ADMIN") return true;
  if (actor.role === "CUSTOMER") return Boolean(await Device.exists({ _id: deviceId, userId: actor._id }));
  const requests = await RepairRequest.find({ deviceId, ...(actor.role === "TECHNICIAN" ? { technicianId: actor._id } : {}) }).select("workshopId").lean();
  if (actor.role === "TECHNICIAN") return requests.length > 0;
  if (actor.role === "WORKSHOP_OWNER") {
    const workshopIds = (await WorkshopMembership.find({ userId: actor._id, status: "ACTIVE" }).select("workshopId").lean()).map((item) => String(item.workshopId));
    return requests.some((request) => workshopIds.includes(String(request.workshopId)));
  }
  return false;
}

function redactForActor(value, actor) {
  if (actor.role !== "CUSTOMER") return value;
  const copy = { ...value };
  delete copy.technicianNotes;
  delete copy.internalNotes;
  return copy;
}

export async function getDeviceRepairDNA(deviceId, actor, records = {}) {
  const { repairs = [], jobs = [], installations = [], qualityChecks = [], followUps = [], components = [] } = records;
  const events = [
    ...repairs.map((event) => ({ eventType: event.part ? "PART_REPLACED" : "REPAIR_EVENT", sourceType: "RepairEvent", sourceId: event._id, state: stateOf(event, "VERIFIED"), timestamp: dateOf(event), component: event.component || null, part: event.part || null, outcome: event.outcome || null, cost: event.totalCost ?? null })),
    ...jobs.map((job) => ({ eventType: "REPAIR_JOB", sourceType: "RepairJob", sourceId: job._id, state: job.status === "COMPLETED" ? "VERIFIED" : "REPORTED", timestamp: dateOf(job), component: null, part: null, outcome: job.repairOutcome || null, cost: null })),
    ...installations.map((part) => ({ eventType: "PART_INSTALLED", sourceType: "PartInstallation", sourceId: part._id, state: "VERIFIED", timestamp: dateOf(part), component: part.component || null, part: part.partType || null, outcome: null, cost: part.cost ?? null })),
    ...qualityChecks.map((check) => ({ eventType: "QUALITY_CHECK", sourceType: "QualityCheck", sourceId: check._id, state: check.passed ? "VERIFIED" : "REPORTED", timestamp: dateOf(check), component: null, part: null, outcome: check.passed ? "PASS" : "REVIEW_REQUIRED", cost: null })),
    ...followUps.map((followUp) => ({ eventType: "FOLLOW_UP", sourceType: "PostRepairFollowUp", sourceId: followUp._id, state: "REPORTED", timestamp: dateOf(followUp), component: null, part: null, outcome: followUp.response, cost: null })),
  ].filter((event) => event.timestamp).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  return { deviceId, events, components: components.map((component) => ({ component: component.name, state: component.state || "UNKNOWN", lastChanged: component.lastVerifiedAt || component.updatedAt || null, source: "DeviceComponent", sourceId: component._id, confidence: component.confidence || component.state || "UNKNOWN" })), totalRecordedRepairCost: repairs.reduce((sum, item) => sum + Number(item.totalCost || item.actualPartCost || item.partCost || 0), 0) || null };
}

export async function getDeviceIntelligenceSummary(deviceId, actor) {
  if (!await canAccessDevice(deviceId, actor)) { const error = new Error("This device is not available to your account."); error.code = "FORBIDDEN"; throw error; }
  const [device, components, repairs, requests, investigations, valueSnapshot] = await Promise.all([
    Device.findById(deviceId).lean(), DeviceComponent.find({ deviceId }).lean(), RepairEvent.find({ deviceId }).sort({ createdAt: 1 }).lean(), RepairRequest.find({ deviceId }).sort({ updatedAt: -1 }).lean(), Investigation.find({ deviceId }).sort({ createdAt: -1 }).lean(), DeviceValueSnapshot.findOne({ deviceId }).sort({ retrievedAt: -1 }).lean(),
  ]);
  if (!device) return null;
  const catalog = await DeviceCatalog.findOne({ brand: device.brand, model: device.model, ...(device.variant ? { variant: device.variant } : {}) }).lean();
  const visibleRequests = actor.role === "CUSTOMER" ? requests.filter((item) => String(item.customerId) === String(actor._id)) : requests;
  const requestIds = visibleRequests.map((item) => item._id);
  const [jobs, diagnoses, installations, followUps, quotes] = await Promise.all([
    RepairJob.find({ repairRequestId: { $in: requestIds } }).lean(), Diagnosis.find({ repairRequestId: { $in: requestIds } }).sort({ createdAt: -1 }).lean(), PartInstallation.find({ deviceId }).lean(), PostRepairFollowUp.find({ deviceId }).lean(), Quote.find({ repairRequestId: { $in: requestIds } }).sort({ version: -1, createdAt: -1 }).lean(),
  ]);
  const jobIds = jobs.map((job) => job._id);
  const actualQuality = jobIds.length ? await QualityCheck.find({ repairJobId: { $in: jobIds } }).lean() : [];
  const latestRequest = visibleRequests[0] || null;
  const latestInvestigation = investigations.find((item) => String(item.repairRequestId) === String(latestRequest?.investigationId)) || investigations[0] || null;
  const currentIssue = latestRequest ? { complaint: latestRequest.complaint, status: latestRequest.status, relevance: repairs.length ? repairs.reduce((best, event) => best === "RELATED" ? best : classifyIssueRelation(latestRequest.complaint, textFor(event)), "INSUFFICIENT_DATA") : "INSUFFICIENT_DATA" } : null;
  const relatedHistory = currentIssue ? repairs.filter((event) => classifyIssueRelation(currentIssue.complaint, textFor(event)) === "RELATED") : [];
  const recurrence = detectRepeatedIssues({ repairs, investigations });
  const dna = await getDeviceRepairDNA(deviceId, actor, { repairs, jobs, installations, qualityChecks: actualQuality, followUps, components });
  const actualRepairCost = repairs.filter((repair) => repair.status === "COMPLETED").reduce((sum, repair) => sum + Number(repair.totalCost || repair.actualPartCost || repair.partCost || 0), 0) || null;
  const profile = buildRecoveryProfile({ repairs, components, investigations, valueSnapshot, quote: actualRepairCost != null ? { ...(quotes[0] || {}), total: actualRepairCost } : quotes[0] || null });
  const dataQuality = calculateIntelligenceQuality({ repairs: repairs.length, components: components.length, investigations: investigations.length, verifiedDiagnoses: diagnoses.length });
  return { device: redactForActor(device, actor), catalog, currentIssue, components: dna.components, repairDNA: dna, repairHistory: dna.events, relevantHistory: relatedHistory.map((event) => redactForActor(event, actor)), activeInvestigation: latestInvestigation ? redactForActor(latestInvestigation, actor) : null, investigations: investigations.map((item) => redactForActor(item, actor)), technicianVerifications: diagnoses.map((item) => redactForActor(item, actor)), installedParts: installations, qualityResults: actualQuality, repairJobs: jobs, quotes, actualRepairCost, latestValueSnapshot: valueSnapshot, value: valueSnapshot ? { currentValue: valueSnapshot.referenceValue || valueSnapshot.estimatedValue || null, minValue: valueSnapshot.minValue || null, maxValue: valueSnapshot.maxValue || null, source: valueSnapshot.source || "MARKET_REFERENCE", retrievedAt: valueSnapshot.retrievedAt || null, snapshotVersion: valueSnapshot.snapshotVersion || 1 } : null, recurrence, recovery: profile.recovery, history: profile.history, condition: profile.condition, repeatIssues: profile.repeatIssues, dataQuality, limitations: dataQuality === "COMPLETE" ? [] : ["Some device history or verification records are not available yet."] };
}
