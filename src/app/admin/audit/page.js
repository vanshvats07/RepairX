import AuditEvent from "@/models/AuditEvent";
import { connectMongo } from "@/lib/mongodb";
import { requireAuth, requireRole } from "@/services/authService";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  const user = await requireAuth();
  requireRole(user, ["ADMIN"]);
  await connectMongo();
  const events = process.env.MONGODB_URI ? await AuditEvent.find({}).sort({ createdAt: -1 }).limit(100).lean() : [];
  return <main style={{ minHeight: "100vh", background: "#020817", color: "#e2e8f0", fontFamily: "Arial, sans-serif", padding: 32 }}><div style={{ maxWidth: 1100, margin: "0 auto" }}><span style={{ color: "#94a3b8", fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>RepairX operations</span><h1>Audit log</h1>{events.length === 0 ? <p>No audit events recorded yet.</p> : <ul>{events.map((event) => <li key={event._id.toString()}>{event.eventType || event.action || "AUDIT_EVENT"} · {event.entityType} · {new Date(event.createdAt).toLocaleString("en-IN")}</li>)}</ul>}</div></main>;
}
