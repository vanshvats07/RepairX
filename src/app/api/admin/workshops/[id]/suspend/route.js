import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Workshop from "@/models/Workshop";
import AuditEvent from "@/models/AuditEvent";
import { requireAuth, requireRole } from "@/services/authService";

export async function POST(request, { params }) {
  try {
    const user = requireRole(await requireAuth(), ["ADMIN"]);
    const payload = await request.json();
    await connectMongo();
    const workshop = await Workshop.findById(params.id);
    if (!workshop) return NextResponse.json({ error: "Workshop not found." }, { status: 404 });

    workshop.verificationStatus = "SUSPENDED";
    workshop.authorizationStatus = payload?.authorizationStatus || "UNKNOWN";
    await workshop.save();

    await AuditEvent.create({
      entityType: "Workshop",
      entityId: workshop._id,
      action: "WORKSHOP_SUSPENDED",
      eventType: "WORKSHOP_SUSPENDED",
      actorId: user._id,
      actorRole: user.role,
      metadata: { reason: payload?.reason || null }
    });

    return NextResponse.json({ data: workshop });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Workshop could not be suspended." }, { status: error.code === "FORBIDDEN" ? 403 : 401 });
  }
}
