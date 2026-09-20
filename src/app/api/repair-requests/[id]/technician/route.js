import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import RepairRequest from "@/models/RepairRequest";
import DiagnosticCheck from "@/models/DiagnosticCheck";
import Diagnosis from "@/models/Diagnosis";
import WorkshopMembership from "@/models/WorkshopMembership";
import { requireAuth } from "@/services/authService";

export async function GET(_request, { params }) {
  try {
    const user = await requireAuth(); const { id } = await params; await connectMongo(); if (!process.env.MONGODB_URI) return NextResponse.json({ data: null });
    const requestRecord = await RepairRequest.findById(id).populate("deviceId investigationId workshopId").lean(); if (!requestRecord) return NextResponse.json({ error: "Repair case not found." }, { status: 404 });
    const member = user.role === "WORKSHOP_OWNER" ? await WorkshopMembership.exists({ userId: user._id, workshopId: requestRecord.workshopId?._id || requestRecord.workshopId, status: "ACTIVE" }) : false;
    if (user.role !== "ADMIN" && String(requestRecord.customerId) !== String(user._id) && String(requestRecord.technicianId) !== String(user._id) && !member) return NextResponse.json({ error: "You do not have access to this case." }, { status: 403 });
    const [checks, diagnoses] = await Promise.all([DiagnosticCheck.find({ repairRequestId: id }).lean(), Diagnosis.find({ repairRequestId: id }).sort({ createdAt: -1 }).lean()]);
    return NextResponse.json({ data: { request: requestRecord, checks, diagnoses } });
  } catch (error) { return NextResponse.json({ data: null, message: error.message || "Technician case is temporarily unavailable." }, { status: error.code === "UNAUTHORIZED" ? 401 : 500 }); }
}
