import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import AuditEvent from "@/models/AuditEvent";
import { requireAuth, requireRole } from "@/services/authService";

export async function GET() {
  try {
    requireRole(await requireAuth(), ["ADMIN"]);
    await connectMongo();
    const events = await AuditEvent.find({}).sort({ createdAt: -1 }).limit(100).lean();
    return NextResponse.json({ data: events });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Audit logs could not be loaded." }, { status: error.code === "FORBIDDEN" ? 403 : 401 });
  }
}
