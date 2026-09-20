import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import OperationalAlert from "@/models/OperationalAlert";
import AuditEvent from "@/models/AuditEvent";
import { requireAuth, requireRole } from "@/services/authService";

export async function PATCH(request, { params }) {
  try {
    const user = requireRole(await requireAuth(), ["ADMIN"]);
    const payload = await request.json();
    await connectMongo();
    const alert = await OperationalAlert.findById(params.id);
    if (!alert) return NextResponse.json({ error: "Alert not found." }, { status: 404 });

    alert.status = "RESOLVED";
    alert.resolvedAt = new Date();
    alert.resolvedBy = user._id;
    await alert.save();

    await AuditEvent.create({
      entityType: "OperationalAlert",
      entityId: alert._id,
      action: "ALERT_RESOLVED",
      eventType: "ALERT_RESOLVED",
      actorId: user._id,
      actorRole: user.role,
      metadata: { reason: payload?.reason || null }
    });

    return NextResponse.json({ data: alert });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Alert could not be resolved." }, { status: error.code === "FORBIDDEN" ? 403 : 401 });
  }
}
