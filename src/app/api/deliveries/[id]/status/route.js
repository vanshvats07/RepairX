import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import DeliveryRequest from "@/models/DeliveryRequest";
import RepairJob from "@/models/RepairJob";
import RepairRequest from "@/models/RepairRequest";
import Notification from "@/models/Notification";
import { recordCaseTransition } from "@/services/caseStateMachine";
import AuditEvent from "@/models/AuditEvent";
import { requireWorkshopOwner } from "@/services/workshopAccessService";
import { isValidDeliveryTransition } from "@/services/logisticsService";

export async function PATCH(request, { params }) {
  try {
    const user = await requireWorkshopOwner();
    const { id } = await params;
    const { status, notes } = await request.json();
    await connectMongo();
    if (!process.env.MONGODB_URI) return NextResponse.json({ error: "Database is not configured yet." }, { status: 503 });

    const delivery = await DeliveryRequest.findById(id);
    if (!delivery) return NextResponse.json({ error: "Delivery request not found." }, { status: 404 });

    if (!isValidDeliveryTransition(delivery.status, status)) {
      return NextResponse.json({ error: `Invalid delivery transition from ${delivery.status} to ${status}.` }, { status: 409 });
    }

    delivery.status = status;
    if (status === "OUT_FOR_DELIVERY") delivery.outForDeliveryAt = new Date();
    if (status === "DELIVERED") delivery.deliveredAt = new Date();
    if (notes) delivery.proofOfDelivery = notes;
    await delivery.save();

    await AuditEvent.create({
      entityType: "DeliveryRequest",
      entityId: delivery._id,
      eventType: status,
      actorId: user._id,
      actorRole: user.role,
      metadata: { repairJobId: delivery.repairJobId, notes: notes || null }
    });
    if (status === "DELIVERED") {
      const job = await RepairJob.findById(delivery.repairJobId);
      const repairRequest = job ? await RepairRequest.findById(job.repairRequestId) : null;
      if (job) { job.status = "DELIVERED"; await job.save(); }
      if (repairRequest) {
        if (repairRequest.status !== "DELIVERED") await recordCaseTransition(repairRequest, "DELIVERED", { actorId: user._id, actorRole: user.role, note: "Device delivered to customer", metadata: { deliveryId: delivery._id } });
        if (repairRequest.customerId) await Notification.create({ userId: repairRequest.customerId, type: "DEVICE_DELIVERED", entityType: "DeliveryRequest", entityId: delivery._id, title: "Device delivered", message: `Your repaired device for case ${repairRequest.caseId} has been delivered.` });
      }
    }

    return NextResponse.json({ data: delivery });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to update delivery status." }, { status: error.code === "FORBIDDEN" ? 403 : 401 });
  }
}
