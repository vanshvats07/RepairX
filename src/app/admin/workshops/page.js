import Workshop from "@/models/Workshop";
import WorkshopClaim from "@/models/WorkshopClaim";
import { connectMongo } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export default async function AdminWorkshopsPage() {
  let workshops = [];
  let claims = [];

  if (process.env.MONGODB_URI) {
    await connectMongo();
    workshops = await Workshop.find({}).sort({ updatedAt: -1 }).limit(50).lean();
    claims = await WorkshopClaim.find({}).sort({ createdAt: -1 }).limit(20).lean();
  }

  return (
    <main style={{ minHeight: "100vh", background: "#020817", color: "#e2e8f0", fontFamily: "Arial, sans-serif", padding: 32 }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gap: 24 }}>
        <header>
          <div style={{ fontSize: 12, letterSpacing: 2, color: "#94a3b8", textTransform: "uppercase" }}>Admin queue</div>
          <h1 style={{ margin: "8px 0 0" }}>Workshop verification</h1>
        </header>

        <section style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: 16 }}>
          <div style={{ background: "#111827", border: "1px solid rgba(148,163,184,0.2)", borderRadius: 16, padding: 20 }}>
            {workshops.length ? workshops.map((workshop) => (
              <div key={String(workshop._id)} style={{ border: "1px solid rgba(148,163,184,0.15)", borderRadius: 12, padding: 16, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <strong>{workshop.name}</strong>
                    <div style={{ color: "#94a3b8", marginTop: 4 }}>{workshop.city || "Unknown city"} · {workshop.locality || workshop.address || "Location unavailable"}</div>
                  </div>
                  <div style={{ color: "#fbbf24" }}>{workshop.verificationStatus || "DISCOVERED"}</div>
                </div>
                <div style={{ marginTop: 10, color: "#cbd5e1" }}>
                  Source: {workshop.source || "UNKNOWN"} · Status: {workshop.authorizationStatus || "UNKNOWN"}
                </div>
              </div>
            )) : <p>No workshop records found.</p>}
          </div>

          <div style={{ background: "#111827", border: "1px solid rgba(148,163,184,0.2)", borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: 12, letterSpacing: 2, color: "#94a3b8", textTransform: "uppercase", marginBottom: 12 }}>Claim queue</div>
            {claims.length ? claims.map((claim) => (
              <div key={String(claim._id)} style={{ border: "1px solid rgba(148,163,184,0.15)", borderRadius: 12, padding: 12, marginBottom: 10 }}>
                <div>{claim.status}</div>
                <div style={{ color: "#cbd5e1", marginTop: 4 }}>Claim submitted: {new Date(claim.submittedAt || claim.createdAt).toLocaleString("en-IN")}</div>
              </div>
            )) : <p>No workshop claims pending.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
