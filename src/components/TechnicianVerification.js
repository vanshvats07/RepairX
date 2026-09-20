"use client";

import { useState } from "react";
import { ArrowRight, X } from "lucide-react";

export default function TechnicianVerification({ request, onSaved }) {
  const [open, setOpen] = useState(false);
  const [component, setComponent] = useState("Battery");
  const [diagnosis, setDiagnosis] = useState("");
  const [result, setResult] = useState("CONFIRMED");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/repair-requests/${request._id}/diagnosis`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ component, diagnosis: diagnosis.trim(), result, predictionOutcome: "MATCHED" }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Verification could not be saved.");
      setOpen(false);
      setDiagnosis("");
      await onSaved();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  return <>
    <button className="data-link" onClick={() => setOpen(true)}>Open case <ArrowRight size={13} /></button>
    {open && <div className="data-modal-backdrop"><section className="data-modal"><button className="data-modal-close" onClick={() => setOpen(false)} aria-label="Close"><X size={18} /></button><span className="section-label">TECHNICIAN VERIFICATION</span><h2>{request.caseId || "Repair case"}</h2><p>{request.complaint || "Record the physical finding for this case."}</p><form onSubmit={submit}><label>COMPONENT<input required value={component} onChange={(event) => setComponent(event.target.value)} /></label><label>DIAGNOSIS<textarea required minLength={10} rows={5} value={diagnosis} onChange={(event) => setDiagnosis(event.target.value)} placeholder="Describe the verified finding" /></label><label>RESULT<select value={result} onChange={(event) => setResult(event.target.value)}><option value="CONFIRMED">CONFIRMED</option><option value="RULED_OUT">RULED OUT</option><option value="UNCERTAIN">UNCERTAIN</option><option value="NEEDS_FURTHER_DIAGNOSTICS">NEEDS FURTHER DIAGNOSTICS</option></select></label>{error && <div className="data-error">{error}</div>}<button className="data-primary-button" disabled={saving}>{saving ? "Submitting..." : "Submit verification"}<ArrowRight size={14} /></button></form></section></div>}
  </>;
}
