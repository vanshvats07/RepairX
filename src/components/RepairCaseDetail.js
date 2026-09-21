"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, RefreshCw, ShieldCheck } from "lucide-react";
import AccountMenu from "@/components/AccountMenu";
import WorkspaceNav from "@/components/WorkspaceNav";

function label(value) { return String(value || "UNKNOWN").replaceAll("_", " "); }
function dateLabel(value) { return value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Not recorded"; }
function Status({ value }) { return <span className="data-status"><i />{label(value)}</span>; }
function Section({ title, eyebrow, children }) { return <section className="data-panel"><div className="data-panel-heading"><div><span className="section-label">{eyebrow}</span><h2>{title}</h2></div></div>{children}</section>; }
function Empty({ children }) { return <div className="data-empty compact"><ShieldCheck size={20} /><span>{children}</span></div>; }

export default function RepairCaseDetail({ caseId, user }) {
  const [data, setData] = useState(null); const [statusHistory, setStatusHistory] = useState([]); const [parts, setParts] = useState([]); const [technician, setTechnician] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const responses = await Promise.all([fetch(`/api/repair-requests/${caseId}`), fetch(`/api/repair-requests/${caseId}/status`), fetch(`/api/repair-requests/${caseId}/parts`), fetch(`/api/repair-requests/${caseId}/technician`)]);
      const payloads = await Promise.all(responses.map((response) => response.json()));
      if (!responses[0].ok) throw new Error(payloads[0].error || "This repair case is not available to your account.");
      setData(payloads[0].data); setStatusHistory(responses[1].ok ? payloads[1].data || [] : []); setParts(responses[2].ok ? payloads[2].data || [] : []); setTechnician(responses[3].ok ? payloads[3].data : null);
    } catch (loadError) { setError(loadError.message || "Unable to load this repair case."); } finally { setLoading(false); }
  }, [caseId]);
  useEffect(() => { const timer = window.setTimeout(load, 0); return () => window.clearTimeout(timer); }, [load]);
  if (loading) return <main className="data-shell"><div className="data-loading"><RefreshCw size={18} className="spin" />Loading repair case...</div></main>;
  if (error || !data?.request) return <main className="data-shell"><div className="data-error"><span>{error || "Repair case not found."}</span><a href="/dashboard">Back to workspace</a></div></main>;

  const { request, checks = [], diagnoses = [], quote, evidence = [] } = data;
  const investigation = request.investigationId;
  const device = request.deviceId;
  return <main className="data-shell">
    <header className="data-header"><div><a className="data-link" href={user?.role === "CUSTOMER" ? "/dashboard" : user?.role === "TECHNICIAN" ? "/technician" : user?.role === "WORKSHOP_OWNER" ? "/workshop" : "/admin"}><ArrowLeft size={14} />Back to workspace</a><WorkspaceNav items={[{ label: "Overview", href: user?.role === "CUSTOMER" ? "/dashboard" : user?.role === "TECHNICIAN" ? "/technician" : user?.role === "WORKSHOP_OWNER" ? "/workshop" : "/admin" }, { label: "Active Repairs", href: "#case-status" }, { label: "Repair DNA", href: "#case-history" }]} /><span className="section-label">REPAIR CASE</span><h1>{request.caseId || "Repair case"}</h1><p>{device?.brand} {device?.model} · {request.complaint || "Complaint not recorded"}</p></div><div className="data-header-actions"><AccountMenu user={user} /><button className="data-secondary-button" onClick={load}><RefreshCw size={15} />Refresh</button></div></header>
    <section className="data-metrics"><div><span>CURRENT STATUS</span><strong><Status value={request.status} /></strong><small>Authoritative case state</small></div><div><span>WORKSHOP</span><strong>{request.workshopId?.name || "Not assigned"}</strong><small>{request.workshopId?.city || request.workshopId?.locality || "No location recorded"}</small></div><div><span>TECHNICIAN</span><strong>{technician?.technician?.name || technician?.technician?.email || request.technicianId ? "Assigned" : "Not assigned"}</strong><small>Visible when assigned and authorized</small></div><div><span>LAST UPDATED</span><strong>{dateLabel(request.updatedAt)}</strong><small>Persisted case record</small></div></section>
    <div className="data-grid">
      <Section title="Case timeline" eyebrow="STATUS HISTORY"><div id="case-status" className="timeline-list">{statusHistory.length === 0 ? <Empty>No status history has been recorded yet.</Empty> : statusHistory.map((entry) => <article key={entry._id}><span className="notification-dot" /><div><strong>{label(entry.status)}</strong><p>{entry.note || "Case status recorded."}</p><small>{dateLabel(entry.createdAt)}</small></div></article>)}</div></Section>
      <Section title={investigation?.structuredAssessment?.provider === "LOCAL_DEMO_AI" ? "AI Preliminary Assessment - Development Analyzer" : "Preliminary AI Assessment"} eyebrow="INFERRED"><p><strong>Reported problem:</strong> {request.complaint || "No complaint recorded."}</p>{investigation?.assessmentState === "FAILED" ? <div className="data-error">External AI is not configured. {investigation.structuredAssessment?.error || "Configure a server-side AI provider or enable LOCAL_DEMO_AI in development."}</div> : investigation?.assessmentState === "INFERRED" ? <><p>{investigation.structuredAssessment?.summary || request.preliminaryAssessment || "Assessment recorded without a summary."}</p><h3>Possible causes</h3>{investigation.possibleCauses?.length > 0 ? <ul>{investigation.possibleCauses.map((cause, index) => <li key={`${cause.component || "cause"}-${index}`}>{cause.component || "Possible cause"}: {cause.explanation || cause.reason || "Recorded by investigation"}</li>)}</ul> : <Empty>No possible causes have been recorded.</Empty>}<h3>Recommended checks</h3>{investigation.recommendedChecks?.length > 0 ? <ul>{investigation.recommendedChecks.map((check, index) => <li key={`${check.name || "check"}-${index}`}>{check.name || check}</li>)}</ul> : <Empty>No recommended checks have been recorded.</Empty>}<p><strong>Confidence:</strong> {label(investigation.aiConfidence)} · <strong>Evidence:</strong> {evidence.length ? `${evidence.length} evidence records` : "Customer report and device context only"}</p><small>{investigation.structuredAssessment?.provider === "LOCAL_DEMO_AI" ? "Development analyzer used. No external AI provider was called." : "Preliminary assessment only. Final diagnosis requires physical technician verification."}</small></> : <div className="data-empty compact"><span>AI analysis in progress or not yet recorded.</span></div>}</Section>
      {(checks.length > 0 || diagnoses.length > 0 || technician) && <Section title="Technician verification" eyebrow="DIAGNOSIS"><div className="case-list">{checks.map((check) => <article className="case-row" key={check._id}><div><strong>{check.name}</strong><p>{check.result || check.notes || "Diagnostic check recorded"}</p></div><Status value={check.status || check.result} /></article>)}{diagnoses.map((diagnosis) => <article className="case-row" key={diagnosis._id}><div><strong>{diagnosis.component}</strong><p>{diagnosis.diagnosis}</p></div><Status value={diagnosis.result} /></article>)}</div></Section>}
      {(quote || parts.length > 0) && <Section title="Quote and installed parts" eyebrow="REPAIR COSTS">{quote && <div className="case-row"><div><strong>{quote.title || "Repair quote"}</strong><p>{quote.version ? `Version ${quote.version}` : "Latest quote"}</p></div><div><strong>{quote.total != null ? `₹${Number(quote.total).toLocaleString("en-IN")}` : "Amount not recorded"}</strong><Status value={quote.status} /></div></div>}{parts.length > 0 && <div className="case-list">{parts.map((part) => <article className="case-row" key={part._id}><div><strong>{part.name}</strong><p>{part.partType || "Part record"}</p></div><span>{part.price != null ? `₹${Number(part.price).toLocaleString("en-IN")}` : "Price not recorded"}</span></article>)}</div>}</Section>}
      <Section title="Repair DNA" eyebrow="DEVICE HISTORY"><div id="case-history"><p>Relevant repair memory remains attached to the device record.</p><a className="data-link" href={device?._id ? `/devices/${device._id}` : "/dashboard"}>Open device memory <ArrowLeft size={14} /></a></div></Section>
    </div>
  </main>;
}
