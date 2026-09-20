import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Dispute from "@/models/Dispute";
import AuditEvent from "@/models/AuditEvent";
import { requireAuth, requireRole } from "@/services/authService";

export async function POST(request, { params }) {
  try {
    const user = requireRole(await requireAuth(), ["ADMIN"]);
    const payload = await request.json();
    await connectMongo();
    const dispute = await Dispute.findById(params.id);
    if (!dispute) return NextResponse.json({ error: "Dispute not found." }, { status: 404 });

    dispute.status = payload?.status || "RESOLVED";
    dispute.resolution = payload?.resolution || "Resolved by admin review.";
    dispute.resolvedBy = user._id;
    dispute.resolvedAt = new Date();
    await dispute.save();

    await AuditEvent.create({
      entityType: "Dispute",
      entityId: dispute._id,
      action: "DISPUTE_RESOLVED",
      eventType: "DISPUTE_RESOLVED",
      actorId: user._id,
      actorRole: user.role,
      metadata: { reason: payload?.reason || null, resolution: dispute.resolution }
    });

    return NextResponse.json({ data: dispute });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Dispute could not be resolved." }, { status: error.code === "FORBIDDEN" ? 403 : 401 });
  }
}
