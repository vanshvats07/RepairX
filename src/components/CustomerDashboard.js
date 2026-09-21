"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Bell, Plus, RefreshCw, Search, ShieldCheck, Wrench, X } from "lucide-react";
import WorkspaceNav from "@/components/WorkspaceNav";
import AccountMenu from "@/components/AccountMenu";
import DeviceCatalogSelector from "@/components/DeviceCatalogSelector";

function formatDate(value) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value));
}

function StatusBadge({ children }) {
  return <span className="data-status"><i />{String(children || "UNKNOWN").replaceAll("_", " ")}</span>;
}

function Panel({ id, title, eyebrow, children, action }) {
  return <section id={id} className="data-panel"><div className="data-panel-heading"><div><span className="section-label">{eyebrow}</span><h2>{title}</h2></div>{action}</div>{children}</section>;
}

export default function CustomerDashboard({ user }) {
  const router = useRouter();
  const [devices, setDevices] = useState([]);
  const [requests, setRequests] = useState([]);
  const [summary, setSummary] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deviceOpen, setDeviceOpen] = useState(false);
  const [savingDevice, setSavingDevice] = useState(false);
  const [investigationDevice, setInvestigationDevice] = useState(null);
  const [complaint, setComplaint] = useState("");
  const [startingInvestigation, setStartingInvestigation] = useState(false);

  async function loadDashboard({ showLoading = true } = {}) {
    if (showLoading) setLoading(true);
    setError("");
    try {
      const responses = await Promise.all([
        fetch("/api/devices"),
        fetch("/api/repair-requests"),
        fetch("/api/dashboard/summary"),
        fetch("/api/notifications"),
      ]);
      if (responses.some((response) => !response.ok)) throw new Error("Some dashboard data could not be loaded.");
      const [devicePayload, requestPayload, summaryPayload, notificationPayload] = await Promise.all(responses.map((response) => response.json()));
      setDevices(devicePayload.data || []);
      setRequests(requestPayload.data || []);
      setSummary(summaryPayload.data || null);
      setNotifications(notificationPayload.data || []);
    } catch (loadError) {
      setError(loadError.message || "Unable to load your RepairX workspace.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => loadDashboard({ showLoading: true }), 0);
    const poller = window.setInterval(() => loadDashboard({ showLoading: false }), 15000);
    return () => { window.clearTimeout(timer); window.clearInterval(poller); };
  }, []);

  async function addDevice(devicePayload) {
    setSavingDevice(true);
    setError("");
    try {
      const response = await fetch("/api/devices", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...devicePayload, components: [] }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || payload.error || "The device could not be saved.");
      setDeviceOpen(false);
      await loadDashboard();
    } catch (saveError) {
      setError(saveError.message || "The device could not be saved.");
    } finally {
      setSavingDevice(false);
    }
  }

  async function startInvestigation(event) {
    event.preventDefault();
    setStartingInvestigation(true);
    setError("");
    try {
      const response = await fetch("/api/investigations", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ deviceId: investigationDevice._id, complaint: complaint.trim(), requiredCapabilities: [], createRepairRequest: true }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || payload.error || "The investigation could not be created.");
      const analysisResponse = await fetch(`/api/investigations/${payload.data._id}/analyze`, { method: "POST" });
      if (!analysisResponse.ok) console.warn("Preliminary assessment unavailable:", await analysisResponse.text());
      if (payload.repairRequest?._id) { router.push(`/repair-requests/${payload.repairRequest._id}`); return; }
      setInvestigationDevice(null);
      setComplaint("");
      await loadDashboard();
    } catch (investigationError) {
      setError(investigationError.message || "The investigation could not be started.");
    } finally {
      setStartingInvestigation(false);
    }
  }

  if (loading) return <main className="data-shell"><div className="data-loading"><RefreshCw size={18} className="spin" />Loading your RepairX workspace...</div></main>;

  return <main className="role-workspace role-customer"><aside className="role-sidebar"><div className="role-brand"><span className="rx-symbol"><i /></span><strong>REPAIR<span>X</span></strong></div><div className="role-sidebar-context"><span>DEVICE WORKSPACE</span><strong>{user?.name || "Customer"}</strong></div><nav aria-label="Customer navigation"><a href="/dashboard">Dashboard</a><a href="#my-devices">My Devices</a><a href="#my-repairs">Repair Requests</a><a href="#my-repairs">Active Repairs</a><a href="#repair-history">Repair History</a><a href="#repair-dna">Repair DNA</a><a href="#profile">Notifications</a></nav><div className="role-sidebar-footer"><AccountMenu user={user} /></div></aside><section className="role-main customer-main">
    <header className="data-header"><div><WorkspaceNav items={[{ label: "Dashboard", href: "/dashboard" }, { label: "My Devices", href: "/dashboard#my-devices" }, { label: "Raise Repair Request", href: "/dashboard#my-devices" }, { label: "Active Repairs", href: "/dashboard#my-repairs" }, { label: "Repair History", href: "/dashboard#repair-history" }, { label: "Repair DNA", href: "/dashboard#repair-dna" }, { label: "Profile / Account", href: "/dashboard#profile" }]} /><span className="section-label">CUSTOMER WORKSPACE</span><h1>Welcome back, {user?.name || "there"}.</h1><p>Your devices, repair cases, and verified repair memory in one place.</p></div><div className="data-header-actions"><AccountMenu user={user} /><button className="data-icon-button" title="Notifications"><Bell size={17} /><b>{summary?.unreadNotifications || 0}</b></button><button className="data-secondary-button" onClick={loadDashboard}><RefreshCw size={15} />Refresh</button><button className="data-primary-button" onClick={() => setDeviceOpen(true)}><Plus size={15} />Add device</button></div></header>
    {error && <div className="data-error"><span>{error}</span><button onClick={loadDashboard}>Try again</button></div>}
    <section className="data-metrics"><div><span>MY DEVICES</span><strong>{summary?.devices ?? 0}</strong><small>Physical devices in your account</small></div><div><span>ACTIVE CASES</span><strong>{summary?.activeCases ?? 0}</strong><small>Cases still moving through RepairX</small></div><div><span>INVESTIGATIONS</span><strong>{summary?.investigations ?? 0}</strong><small>Preliminary assessments recorded</small></div><div><span>PENDING ACTIONS</span><strong>{summary?.pendingActions ?? 0}</strong><small>Notifications requiring attention</small></div></section>
    <div className="data-grid">
      <Panel id="my-devices" title="My devices" eyebrow="DEVICE MEMORY" action={<button className="data-link" onClick={() => setDeviceOpen(true)}>Add device <Plus size={14} /></button>}>
        {devices.length === 0 ? <div className="data-empty"><Search size={20} /><strong>You haven&apos;t added a device yet.</strong><span>Add a physical device to start its repair memory.</span><button className="data-primary-button" onClick={() => setDeviceOpen(true)}>Add your first device <ArrowRight size={14} /></button></div> : <div className="device-list">{devices.map((device) => <article className="device-card" key={device._id}><div className="device-card-mark"><Wrench size={18} /></div><div className="device-card-main"><span className="section-label">{device.brand}</span><h3>{device.model}</h3><p>{[device.variant, device.storage, device.location].filter(Boolean).join(" · ") || "Device context not recorded"}</p><small>Added {formatDate(device.createdAt)}</small></div><div className="device-card-actions"><StatusBadge>{device.status}</StatusBadge><button className="data-primary-button" onClick={() => setInvestigationDevice(device)}>Raise Repair Request <ArrowRight size={13} /></button><a href={`/devices/${device._id}`} aria-label={`Open ${device.brand} ${device.model}`}><ArrowRight size={16} /></a></div></article>)}</div>}
      </Panel>
      <Panel id="my-repairs" title="Active repairs" eyebrow="CASE STATUS">
        {requests.length === 0 ? <div className="data-empty compact"><ShieldCheck size={20} /><strong>No repair cases yet.</strong><span>Start an investigation from one of your devices when something needs attention.</span></div> : <div className="case-list">{requests.map((request) => <article className="case-row" key={request._id}><div><span className="section-label">{request.caseId || "CASE ID PENDING"}</span><strong>{request.deviceId?.brand} {request.deviceId?.model}</strong><p>{request.complaint || "No complaint recorded"}</p></div><div><StatusBadge>{request.status}</StatusBadge><small>Updated {formatDate(request.updatedAt)}</small><a className="data-link" href={`/repair-requests/${request._id}`}>Open case <ArrowRight size={13} /></a></div></article>)}</div>}
      </Panel>
      <Panel id="repair-dna" title="Recent activity" eyebrow="REPAIR DNA">
        {notifications.length === 0 ? <div className="data-empty compact"><Bell size={20} /><strong>No notifications yet.</strong><span>Important case and repair updates will appear here.</span></div> : <div className="notification-list">{notifications.slice(0, 6).map((notification) => <article key={notification._id}><span className="notification-dot" /><div><strong>{notification.title || notification.type}</strong><p>{notification.message || notification.body || "RepairX recorded an update."}</p><small>{formatDate(notification.createdAt)}</small></div></article>)}</div>}
      </Panel>
    </div>
    {deviceOpen && <DeviceCatalogSelector onClose={() => setDeviceOpen(false)} onSubmit={addDevice} saving={savingDevice} />}
    {investigationDevice && <div className="data-modal-backdrop"><section className="data-modal"><button className="data-modal-close" onClick={() => setInvestigationDevice(null)}><X size={18} /></button><span className="section-label">NEW INVESTIGATION</span><h2>{investigationDevice.brand} {investigationDevice.model}</h2><p>Describe the current symptom in your own words. The result is preliminary until a technician verifies it.</p><form onSubmit={startInvestigation}><label className="data-form-wide">REPORTED COMPLAINT<textarea required minLength={10} rows={6} value={complaint} onChange={(event) => setComplaint(event.target.value)} placeholder="What is happening with this device?" /></label><button className="data-primary-button" disabled={startingInvestigation}>{startingInvestigation ? "Investigating..." : "Start investigation"}<ArrowRight size={14} /></button></form></section></div>}
  </section></main>;
}
