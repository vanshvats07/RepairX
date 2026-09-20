import Dispute from "@/models/Dispute";
import { connectMongo } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export default async function AdminDisputesPage() {
  let disputes = [];

  if (process.env.MONGODB_URI) {
    await connectMongo();
    disputes = await Dispute.find({}).sort({ createdAt: -1 }).limit(50).lean();
  }

  return (
    <main style={{ minHeight: "100vh", background: "#020817", color: "#e2e8f0", fontFamily: "Arial, sans-serif", padding: 32 }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gap: 24 }}>
        <header>
          <div style={{ fontSize: 12, letterSpacing: 2, color: "#94a3b8", textTransform: "uppercase" }}>Admin queue</div>
          <h1 style={{ margin: "8px 0 0" }}>Dispute center</h1>
        </header>

        <section style={{ background: "#111827", border: "1px solid rgba(148,163,184,0.2)", borderRadius: 16, padding: 20 }}>
          {disputes.length ? disputes.map((dispute) => (
            <div key={String(dispute._id)} style={{ border: "1px solid rgba(148,163,184,0.15)", borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <strong>{dispute.type || "OTHER"}</strong>
                  <div style={{ color: "#94a3b8", marginTop: 4 }}>{dispute.description || "No description."}</div>
                </div>
                <div style={{ color: dispute.status === "RESOLVED" ? "#34d399" : "#fbbf24" }}>{dispute.status || "OPEN"}</div>
              </div>
              <div style={{ marginTop: 10, color: "#cbd5e1" }}>Reported by: {dispute.reportedBy || "Customer"} · Created: {new Date(dispute.createdAt).toLocaleString("en-IN")}</div>
            </div>
          )) : <p>All clear. No open disputes.</p>}
        </section>
      </div>
    </main>
  );
}
