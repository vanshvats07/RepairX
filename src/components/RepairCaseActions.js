"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, ChevronRight, LoaderCircle, Send, Wrench } from "lucide-react";

function money(value) { return value ? `₹${Number(value).toLocaleString("en-IN")}` : "₹0"; }
function canManageWorkshop(user) { return user?.role === "WORKSHOP_OWNER" || user?.role === "ADMIN"; }
function canWorkJob(user) { return ["WORKSHOP_OWNER", "TECHNICIAN", "ADMIN"].includes(user?.role); }
function ActionButton({ children, onClick, disabled = false }) { return <button className="data-primary-button" onClick={onClick} disabled={disabled}>{children}</button>; }

export default function RepairCaseActions({ request, quote, user, onChanged }) {
  const [job, setJob] = useState(null);
  const [quoteForm, setQuoteForm] = useState({ partCost: "", labourCost: "", inspectionCost: "", pickupCost: "", deliveryCost: "", otherCharges: "", taxes: "" });
  const [check, setCheck] = useState({ name: "", result: "PASS", note: "" });
  const [repairOutcome, setRepairOutcome] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadJob = useCallback(async () => {
    const response = await fetch(`/api/repair-jobs?repairRequestId=${request._id}`);
    const payload = await response.json();
    if (response.ok) setJob(payload.data || null);
  }, [request._id]);
  useEffect(() => { const timer = window.setTimeout(loadJob, 0); return () => window.clearTimeout(timer); }, [loadJob]);

  async function sendQuote(event) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/quotes", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ repairRequestId: request._id, deviceId: request.deviceId?._id || request.deviceId, ...Object.fromEntries(Object.entries(quoteForm).map(([key, value]) => [key, Number(value) || 0])) }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "The quote could not be sent.");
      setQuoteForm({ partCost: "", labourCost: "", inspectionCost: "", pickupCost: "", deliveryCost: "", otherCharges: "", taxes: "" }); await onChanged();
    } catch (actionError) { setError(actionError.message); } finally { setBusy(false); }
  }

  async function decideQuote(status) {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/quotes/${quote._id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "The quote decision could not be saved.");
      await onChanged(); await loadJob();
    } catch (actionError) { setError(actionError.message); } finally { setBusy(false); }
  }

  async function updateJob(status) {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/repair-jobs/${job._id}/status`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status, repairOutcome: status === "COMPLETED" ? repairOutcome : undefined }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "The repair status could not be updated.");
      setJob(payload.data); await onChanged();
    } catch (actionError) { setError(actionError.message); } finally { setBusy(false); }
  }

  async function recordQualityCheck(event) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch(`/api/repair-jobs/${job._id}/quality-check`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ checks: [check] }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "The quality check could not be saved.");
      setJob({ ...job, status: "QUALITY_CHECK" }); setCheck({ name: "", result: "PASS", note: "" }); await onChanged();
    } catch (actionError) { setError(actionError.message); } finally { setBusy(false); }
  }

  const quotePending = quote && ["PENDING_CUSTOMER", "SENT_TO_CUSTOMER", "VIEWED"].includes(quote.status);
  const nextStatus = { APPROVED: "DEVICE_RECEIVED", DEVICE_RECEIVED: "REPAIR_QUEUED", REPAIR_QUEUED: "REPAIR_IN_PROGRESS" }[job?.status];
  const showQuoteForm = canManageWorkshop(user) && ["DIAGNOSIS_VERIFIED", "AWAITING_CUSTOMER_APPROVAL"].includes(request.status);
  const showJob = canWorkJob(user) && job && !["COMPLETED", "DELIVERED", "CANCELLED"].includes(job.status);

  if (!showQuoteForm && !(user?.role === "CUSTOMER" && quotePending) && !showJob) return null;
  return <section className="data-panel" aria-label="Case actions"><div className="data-panel-heading"><div><span className="section-label">NEXT ACTION</span><h2>Move this repair forward</h2></div><Wrench size={20} /></div>{error && <div className="data-error">{error}</div>}
    {showQuoteForm && <form onSubmit={sendQuote} className="case-action-form"><h3>{quote ? "Create a revised quote" : "Prepare customer quote"}</h3><div className="case-action-fields">{["partCost", "labourCost", "inspectionCost", "pickupCost", "deliveryCost", "otherCharges", "taxes"].map((field) => <label key={field}>{field.replaceAll("Cost", " cost").replaceAll(/([A-Z])/g, " $1").trim()}<input type="number" min="0" value={quoteForm[field]} onChange={(event) => setQuoteForm({ ...quoteForm, [field]: event.target.value })} /></label>)}</div><p className="case-action-total">The server will calculate the total from these persisted charges.</p><ActionButton disabled={busy}><Send size={14} />{busy ? "Sending..." : "Send quote"}</ActionButton></form>}
    {user?.role === "CUSTOMER" && quotePending && <div className="case-action-block"><h3>Review quote</h3><p>{quote.title || "Repair quote"} · <strong>{money(quote.total)}</strong></p><div className="case-action-buttons"><ActionButton disabled={busy} onClick={() => decideQuote("APPROVED")}><CheckCircle2 size={14} />Approve quote</ActionButton><button className="data-secondary-button" disabled={busy} onClick={() => decideQuote("REJECTED")}>Decline quote</button></div></div>}
    {showJob && <div className="case-action-block"><h3>Repair execution</h3><p>Job status: <strong>{job.status.replaceAll("_", " ")}</strong></p>{nextStatus && <ActionButton disabled={busy} onClick={() => updateJob(nextStatus)}><ChevronRight size={14} />Move to {nextStatus.replaceAll("_", " ")}</ActionButton>}{job.status === "REPAIR_IN_PROGRESS" && <form onSubmit={recordQualityCheck} className="case-action-form"><h3>Record quality check</h3><label>Check name<input required value={check.name} onChange={(event) => setCheck({ ...check, name: event.target.value })} /></label><label>Result<select value={check.result} onChange={(event) => setCheck({ ...check, result: event.target.value })}><option value="PASS">Pass</option><option value="FAIL">Fail</option><option value="NOT_APPLICABLE">Not applicable</option></select></label><label>Notes<textarea required={check.result === "FAIL"} value={check.note} onChange={(event) => setCheck({ ...check, note: event.target.value })} /></label><ActionButton disabled={busy}><CheckCircle2 size={14} />Save quality check</ActionButton></form>}{job.status === "QUALITY_CHECK" && <label>Repair outcome<textarea required value={repairOutcome} onChange={(event) => setRepairOutcome(event.target.value)} placeholder="Describe the persisted repair result" /></label>}{job.status === "QUALITY_CHECK" && <ActionButton disabled={busy || !repairOutcome.trim()} onClick={() => updateJob("COMPLETED")}><CheckCircle2 size={14} />Complete repair</ActionButton>}</div>}
    {busy && <LoaderCircle size={16} className="spin" aria-label="Saving" />}</section>;
}
