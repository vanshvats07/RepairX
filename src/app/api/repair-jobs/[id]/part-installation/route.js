import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import PartInstallation from "@/models/PartInstallation";
import RepairJob from "@/models/RepairJob";
import AuditEvent from "@/models/AuditEvent";
import WorkshopMembership from "@/models/WorkshopMembership";
import { requireAuth } from "@/services/authService";

export async function POST(request, { params }) {
  try {
    const user = await requireAuth(); const { id } = await params; const input = await request.json();
    if (!input.deviceId || !Number.isFinite(Number(input.cost)) || Number(input.cost) < 0 || !input.partType) return NextResponse.json({ error: "Device, part type and non-negative actual part cost are required." }, { status: 400 });
    await connectMongo(); if (!process.env.MONGODB_URI) return NextResponse.json({ error: "Database is not configured yet." }, { status: 503 });
    const job = await RepairJob.findById(id); if (!job) return NextResponse.json({ error: "Repair job not found." }, { status: 404 });
    const membership = user.role === "WORKSHOP_OWNER" ? await WorkshopMembership.exists({ userId: user._id, workshopId: job.workshopId, status: "ACTIVE", role: { $in: ["OWNER", "MANAGER"] } }) : false;
    if (user.role !== "ADMIN" && String(job.technicianId) !== String(user._id) && !membership) return NextResponse.json({ error: "You are not authorized to record this installation." }, { status: 403 });
    const installation = await PartInstallation.create({ ...input, cost: Number(input.cost), repairJobId: id, installedBy: user._id, installedAt: new Date() });
    await AuditEvent.create({ entityType: "RepairJob", entityId: id, eventType: "PART_INSTALLED", actorId: user._id, actorRole: user.role, metadata: { installationId: installation._id, actualCost: installation.cost, partType: installation.partType } });
    return NextResponse.json({ data: installation }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error.message || "Unable to record the installed part." }, { status: error.code === "FORBIDDEN" ? 403 : 500 }); }
}
