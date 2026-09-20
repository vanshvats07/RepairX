import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import RepairRequest from "@/models/RepairRequest";
import DiagnosticCheck from "@/models/DiagnosticCheck";
import Diagnosis from "@/models/Diagnosis";
import Quote from "@/models/Quote";
import WorkshopMembership from "@/models/WorkshopMembership";
import { requireAuth } from "@/services/authService";
import { requireRole } from "@/services/authService";

export async function GET(_request, { params }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await connectMongo();
    if (!process.env.MONGODB_URI) return NextResponse.json({ data: null });

    let requestFilter = { _id: id };
    if (user.role !== "ADMIN") {
      const memberships = user.role === "WORKSHOP_OWNER" ? await WorkshopMembership.find({ userId: user._id, status: "ACTIVE" }).select("workshopId").lean() : [];
      requestFilter.$or = [{ customerId: user._id }, { technicianId: user._id }, { workshopId: { $in: memberships.map((membership) => membership.workshopId) } }];
    }
    const requestRecord = await RepairRequest.findOne(requestFilter).populate("deviceId investigationId workshopId").lean();

    if (!requestRecord) {
      if (user.role === "ADMIN") {
        const adminRequest = await RepairRequest.findById(id).populate("deviceId investigationId workshopId").lean();
        if (!adminRequest) return NextResponse.json({ error: "Repair case not found." }, { status: 404 });
        return NextResponse.json({ data: { request: adminRequest, checks: [], diagnoses: [], quote: null } });
      }
      return NextResponse.json({ error: "Repair case not found." }, { status: 404 });
    }

    const [checks, diagnoses, quote] = await Promise.all([
      DiagnosticCheck.find({ repairRequestId: id }).lean(),
      Diagnosis.find({ repairRequestId: id }).lean(),
      Quote.findOne({ repairRequestId: id }).sort({ createdAt: -1 }).lean()
    ]);

    return NextResponse.json({ data: { request: requestRecord, checks, diagnoses, quote } });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Repair case is temporarily unavailable." }, { status: error.code === "UNAUTHORIZED" ? 401 : 500 });
  }
}
