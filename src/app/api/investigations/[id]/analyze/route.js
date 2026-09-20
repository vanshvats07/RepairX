import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Device from "@/models/Device";
import Investigation from "@/models/Investigation";
import RepairEvent from "@/models/RepairEvent";
import RepairRequest from "@/models/RepairRequest";
import AuditEvent from "@/models/AuditEvent";
import Evidence from "@/models/Evidence";
import { investigateRepairCase } from "@/services/repairIntelligenceService";
import { requireAuth } from "@/services/authService";

export async function POST(_request, { params }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await connectMongo();
    if (!process.env.MONGODB_URI) return NextResponse.json({ error: "Database is not configured yet." }, { status: 503 });

    const investigation = await Investigation.findOne({ _id: id, userId: user._id }).lean();
    if (!investigation) return NextResponse.json({ error: "Investigation not found." }, { status: 404 });

    const [device, repairHistory] = await Promise.all([
      Device.findById(investigation.deviceId).lean(),
      RepairEvent.find({ deviceId: investigation.deviceId }).lean(),
    ]);

    const analysis = await investigateRepairCase({
      device: device || {},
      complaint: investigation.complaint,
      repairHistory,
      location: device?.location || "Delhi NCR, India",
      images: investigation.images || [],
    });

    const evidenceRecords = analysis.searchEvidence?.length ? await Evidence.insertMany(analysis.searchEvidence.map((entry) => ({ investigationId: investigation._id, category: entry.category || entry.type || "UNKNOWN", source: entry.source || entry.seller || "Unknown source", sourceType: entry.sourceType === "LIVE" ? "LIVE" : "UNKNOWN", title: entry.title || entry.name || "Evidence record", url: entry.url || entry.productUrl || entry.productLink, snippet: entry.snippet, insight: entry.insight, whyItMatters: entry.whyItMatters, relevance: Number.isFinite(Number(entry.relevance)) ? Number(entry.relevance) : undefined, retrievedAt: entry.retrievedAt ? new Date(entry.retrievedAt) : new Date() }))) : [];

    const updated = await Investigation.findByIdAndUpdate(
      id,
      {
        ...analysis,
        aiPreliminaryAssessment: analysis.repairPrescription?.reportedProblem || investigation.complaint,
        structuredAssessment: { summary: analysis.explanation, suspectedIssues: analysis.possibleCauses, suggestedChecks: analysis.recommendedChecks, supportingEvidence: analysis.evidenceSummary, conflictingEvidence: analysis.unknowns, limitations: analysis.disclaimer },
        assessmentType: "PRELIMINARY_ASSESSMENT",
        assessmentState: "INFERRED",
        assessmentVersion: (investigation.assessmentVersion || 0) + 1,
        possibleCauses: analysis.possibleCauses,
        recommendedChecks: analysis.recommendedChecks,
        affectedComponents: analysis.affectedComponents,
        evidenceIds: evidenceRecords.map((entry) => entry._id),
        status: "AWAITING_VERIFICATION",
        analysisVersion: analysis.promptVersion || "repair-investigation-v1",
        lastAnalysisAt: new Date().toISOString(),
      },
      { new: true },
    ).lean();

    if (investigation.repairRequestId) {
      await RepairRequest.findOneAndUpdate({ _id: investigation.repairRequestId, customerId: user._id }, { preliminaryAssessment: analysis.possibleCauses.map((cause) => cause.component).join(", "), analysisVersion: analysis.promptVersion || "repair-investigation-v1", status: "AWAITING_TECHNICIAN" });
      await AuditEvent.create({ entityType: "Investigation", entityId: investigation._id, action: "AI_ASSESSMENT_CREATED", eventType: "AI_ASSESSMENT_CREATED", actorId: user._id, actorRole: user.role, metadata: { repairRequestId: investigation.repairRequestId, confidence: analysis.confidence } });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Investigation analysis failed:", error);
    return NextResponse.json({ error: error.message === "Authentication required." ? error.message : "The preliminary analysis could not be completed." }, { status: error.code === "UNAUTHORIZED" ? 401 : 500 });
  }
}
