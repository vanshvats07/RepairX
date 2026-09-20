import { getAdminOverview } from "@/services/adminService";

export const dynamic = "force-dynamic";

const panelStyle = { background: "#111827", border: "1px solid rgba(148,163,184,0.2)", borderRadius: 16, padding: 20, boxShadow: "0 10px 30px rgba(15,23,42,0.25)" };
const listStyle = { listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 };

export default async function AdminOverviewPage() {
  const overview = process.env.MONGODB_URI ? await getAdminOverview() : { queues: {}, recentActivity: [], health: { dbStatus: "UNAVAILABLE" } };
  const queueEntries = Object.entries(overview?.queues || {});

  return (
    <main className="admin-control-center" style={{ minHeight: "100vh", background: "#020817", color: "#e2e8f0", fontFamily: "Arial, sans-serif", padding: 32 }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gap: 24 }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: 2, color: "#94a3b8", textTransform: "uppercase" }}>RepairX operations</div>
            <h1 style={{ margin: "8px 0 0", fontSize: 38 }}>Operations control center</h1>
          </div>
          <div style={{ ...panelStyle, padding: "14px 18px", minWidth: 220 }}>
            <div style={{ fontSize: 12, color: "#94a3b8", textTransform: "uppercase" }}>Platform health</div>
            <div style={{ marginTop: 8, fontWeight: 700 }}>{overview?.health?.dbStatus || "UNAVAILABLE"}</div>
          </div>
        </header>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          {queueEntries.map(([key, item]) => (
            <article key={key} style={panelStyle}>
              <div style={{ fontSize: 12, color: "#94a3b8", textTransform: "uppercase" }}>{item.label}</div>
              <div style={{ marginTop: 14, fontSize: 36, fontWeight: 800 }}>{item.count}</div>
              <div style={{ marginTop: 4, color: "#cbd5e1" }}>Needs attention</div>
            </article>
          ))}
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16 }}>
          <div style={panelStyle}>
            <div style={{ fontSize: 12, letterSpacing: 2, color: "#94a3b8", textTransform: "uppercase", marginBottom: 16 }}>Recent platform activity</div>
            {overview?.recentActivity?.length ? (
              <ul style={listStyle}>
                {overview.recentActivity.map((event) => (
                  <li key={event.id} style={{ border: "1px solid rgba(148,163,184,0.15)", background: "rgba(15,23,42,0.7)", borderRadius: 12, padding: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
                      <strong>{event.action}</strong>
                      <span style={{ color: "#94a3b8", fontSize: 12 }}>{new Date(event.timestamp).toLocaleString("en-IN")}</span>
                    </div>
                    <div style={{ color: "#cbd5e1", fontSize: 14 }}>{event.entityType}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: "#cbd5e1" }}>No operational activity recorded yet.</p>
            )}
          </div>

          <div style={panelStyle}>
            <div style={{ fontSize: 12, letterSpacing: 2, color: "#94a3b8", textTransform: "uppercase", marginBottom: 16 }}>Operational queues</div>
            <ul style={listStyle}>
              <li><a href="/admin/workshops" style={{ color: "#e2e8f0", textDecoration: "none" }}>Workshop verification queue</a></li>
              <li><a href="/admin/repair-requests" style={{ color: "#e2e8f0", textDecoration: "none" }}>Repair request operations</a></li>
              <li><a href="/admin/disputes" style={{ color: "#e2e8f0", textDecoration: "none" }}>Dispute center</a></li>
              <li><a href="/admin/data-quality" style={{ color: "#e2e8f0", textDecoration: "none" }}>Data quality center</a></li>
              <li><a href="/admin/audit" style={{ color: "#e2e8f0", textDecoration: "none" }}>Audit log</a></li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
