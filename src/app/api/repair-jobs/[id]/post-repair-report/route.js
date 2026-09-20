import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import PostRepairReport from "@/models/PostRepairReport";
import RepairJob from "@/models/RepairJob";
import { requireAuth } from "@/services/authService";

export async function POST(request, { params }) {
  try {
    const user = await requireAuth();
    const payload = await request.json();
    await connectMongo();
    if (!process.env.MONGODB_URI) return NextResponse.json({ error: "Database is not configured yet." }, { status: 503 });

    const job = await RepairJob.findById(params.id);
    if (!job) return NextResponse.json({ error: "Repair job not found." }, { status: 404 });

    if (user.role !== "WORKSHOP_OWNER" && user.role !== "ADMIN" && user.role !== "TECHNICIAN") {
      return NextResponse.json({ error: "You do not have access to save a post-repair report." }, { status: 403 });
    }

    const report = await PostRepairReport.create({
      ...payload,
      repairJobId: params.id,
      deviceId: payload.deviceId || job.deviceId,
      reportedOutcome: payload.reportedOutcome || "OTHER",
      description: payload.description || "Post-repair summary recorded."
    });

    return NextResponse.json({ data: report }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to save the post-repair report." }, { status: error.code === "UNAUTHORIZED" ? 401 : 500 });
  }
}

