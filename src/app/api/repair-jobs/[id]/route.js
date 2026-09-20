import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import RepairJob from "@/models/RepairJob";
import RepairLog from "@/models/RepairLog";
import PartInstallation from "@/models/PartInstallation";
import QualityCheck from "@/models/QualityCheck";
import RepairRequest from "@/models/RepairRequest";
import { requireAuth } from "@/services/authService";

export async function GET(_request, { params }) {
  try {
    const user = await requireAuth();
    await connectMongo();
    if (!process.env.MONGODB_URI) return NextResponse.json({ data: null });

    const job = await RepairJob.findById(params.id).populate("deviceId workshopId quoteId selectedPartId").lean();
    if (!job) return NextResponse.json({ error: "Repair job not found." }, { status: 404 });

    const requestRecord = await RepairRequest.findById(job.repairRequestId).lean();
    if (!requestRecord) return NextResponse.json({ error: "Repair request not found." }, { status: 404 });
    if (String(requestRecord.customerId) !== String(user._id) && user.role !== "WORKSHOP_OWNER" && user.role !== "ADMIN" && String(job.technicianId || "") !== String(user._id)) {
      return NextResponse.json({ error: "You do not have access to this repair job." }, { status: 403 });
    }

    const [logs, installation, qualityCheck] = await Promise.all([
      RepairLog.find({ repairJobId: params.id }).sort({ createdAt: 1 }).lean(),
      PartInstallation.findOne({ repairJobId: params.id }).lean(),
      QualityCheck.findOne({ repairJobId: params.id }).lean()
    ]);

    return NextResponse.json({ data: { job, logs, installation, qualityCheck } });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Repair job is temporarily unavailable." }, { status: error.code === "UNAUTHORIZED" ? 401 : 500 });
  }
}
