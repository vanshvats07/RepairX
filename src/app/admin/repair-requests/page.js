import RepairRequest from "@/models/RepairRequest";
import { connectMongo } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export default async function AdminRepairRequestsPage() {
  let requests = [];

  if (process.env.MONGODB_URI) {
    await connectMongo();
    requests = await RepairRequest.find({}).sort({ updatedAt: -1 }).limit(50).lean();
  }

  return (
    <main style={{ minHeight: "100vh", background: "#020817", color: "#e2e8f0", fontFamily: "Arial, sans-serif", padding: 32 }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gap: 24 }}>
        <header>
          <div style={{ fontSize: 12, letterSpacing: 2, color: "#94a3b8", textTransform: "uppercase" }}>Admin queue</div>
          <h1 style={{ margin: "8px 0 0" }}>Repair request operations</h1>
        </header>

        <section style={{ background: "#111827", border: "1px solid rgba(148,163,184,0.2)", borderRadius: 16, padding: 20 }}>
          {requests.length ? requests.map((request) => (
            <div key={String(request._id)} style={{ border: "1px solid rgba(148,163,184,0.15)", borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <strong>{String(request._id).slice(-6).toUpperCase()}</strong>
                  <div style={{ color: "#94a3b8", marginTop: 4 }}>{request.complaint || "No complaint recorded"}</div>
                </div>
                <div style={{ color: "#fbbf24" }}>{request.status}</div>
              </div>
              <div style={{ marginTop: 10, color: "#cbd5e1" }}>Created: {new Date(request.createdAt).toLocaleString("en-IN")}</div>
            </div>
          )) : <p>No active repair requests.</p>}
        </section>
      </div>
    </main>
  );
}
