import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import PickupRequest from "@/models/PickupRequest";
import RepairJob from "@/models/RepairJob";
import RepairRequest from "@/models/RepairRequest";
import Notification from "@/models/Notification";
import AuditEvent from "@/models/AuditEvent";
import { requireWorkshopOwner } from "@/services/workshopAccessService";
import { isValidPickupTransition } from "@/services/logisticsService";

export async function PATCH(request, { params }) {
  try {
    const user = await requireWorkshopOwner();
    const { id } = await params;
    const { status, notes } = await request.json();
    await connectMongo();
    if (!process.env.MONGODB_URI) return NextResponse.json({ error: "Database is not configured yet." }, { status: 503 });

    const pickup = await PickupRequest.findById(id);
    if (!pickup) return NextResponse.json({ error: "Pickup request not found." }, { status: 404 });

    if (!isValidPickupTransition(pickup.status, status)) {
      return NextResponse.json({ error: `Invalid pickup transition from ${pickup.status} to ${status}.` }, { status: 409 });
    }

    pickup.status = status;
    pickup.notes = notes || pickup.notes;
    if (status === "PICKED_UP") pickup.completedAt = new Date();
    await pickup.save();

    await AuditEvent.create({
      entityType: "PickupRequest",
      entityId: pickup._id,
      eventType: status,
      actorId: user._id,
      actorRole: user.role,
      metadata: { repairJobId: pickup.repairJobId, notes: notes || null }
    });
    if (status === "PICKED_UP") {
      const job = await RepairJob.findById(pickup.repairJobId);
      const repairRequest = job ? await RepairRequest.findById(job.repairRequestId) : null;
      if (repairRequest?.customerId) await Notification.create({ userId: repairRequest.customerId, type: "PICKUP_CONFIRMED", entityType: "PickupRequest", entityId: pickup._id, title: "Device picked up", message: `Your device for case ${repairRequest.caseId} has been picked up.` });
    }

    return NextResponse.json({ data: pickup });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to update pickup status." }, { status: error.code === "FORBIDDEN" ? 403 : 401 });
  }
}
