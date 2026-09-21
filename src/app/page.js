"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CircleHelp, ShieldCheck, Wrench, X } from "lucide-react";

const roleRoutes = { CUSTOMER: "/dashboard", WORKSHOP_OWNER: "/workshop", TECHNICIAN: "/technician", ADMIN: "/admin" };

function Logo() {
  return <Link className="rx-logo" href="/"><span className="rx-symbol"><i /></span><span>REPAIR<span>X</span></span></Link>;
}

/* Legacy auth panel retained below only as migration context.
function LegacyAuthPanel({ onClose }) {
  const [mode, setMode] = useState("login");
    const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", city: "", state: "", pincode: "", role: "CUSTOMER", workshopName: "", address: "", specializations: [], workshopId: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  return <div className="auth-backdrop" role="presentation"><section className="auth-panel" role="dialog" aria-modal="true" aria-labelledby="auth-title"><button className="auth-close" onClick={onClose} aria-label="Close"><X size={18} /></button><span className="section-label">REPAIRX ACCOUNT</span><h2 id="auth-title">{mode === "login" ? "Welcome back." : "Start with RepairX."}</h2><p>{mode === "login" ? "Continue with your authenticated workspace." : "Create an account for your devices and repair cases."}</p><form onSubmit={submit}>{mode === "signup" && <><label>NAME<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>PHONE<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label><label>JOIN AS<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}><option value="CUSTOMER">Customer</option><option value="TECHNICIAN">Technician</option><option value="WORKSHOP_OWNER">Workshop</option></select></label>{form.role === "WORKSHOP_OWNER" && <><label>WORKSHOP NAME<input required value={form.workshopName} onChange={(event) => setForm({ ...form, workshopName: event.target.value })} /></label><label>ADDRESS<input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></label></>}{form.role === "TECHNICIAN" && <label>SPECIALIZATIONS<input placeholder="Battery, charging, display" value={form.specializations.join(", ")} onChange={(event) => setForm({ ...form, specializations: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} /></label>}</>}<label>EMAIL<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKeyDown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", handleKeyDown); };
  }, [onClose]);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`/api/auth/${mode === "login" ? "login" : "signup"}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || payload.error || "Authentication failed.");
      window.location.assign(roleRoutes[payload.data?.role] || "/dashboard");
    } catch (authError) {
      setError(authError.message || "Authentication failed.");
      setLoading(false);
    }
  }

  return <div className="auth-backdrop" role="presentation"><section className="auth-panel" role="dialog" aria-modal="true" aria-labelledby="auth-title"><button className="auth-close" onClick={onClose} aria-label="Close"><X size={18} /></button><span className="section-label">REPAIRX ACCOUNT</span><h2 id="auth-title">{mode === "login" ? "Welcome back." : "Start with RepairX."}</h2><p>{mode === "login" ? "Continue with your authenticated workspace." : "Create an account for your devices and repair cases."}</p><form onSubmit={submit}>{mode === "signup" && <><label>NAME<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>PHONE<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label></>}<label>EMAIL<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label>PASSWORD<input required type="password" minLength={8} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>{mode === "signup" && <div className="auth-location"><label>CITY<input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></label><label>PINCODE<input value={form.pincode} onChange={(event) => setForm({ ...form, pincode: event.target.value })} /></label></div>}{error && <div className="auth-error">{error}</div>}<button className="auth-submit" disabled={loading}>{loading ? "Continuing..." : mode === "login" ? "Sign in" : "Create account"}<ArrowRight size={15} /></button></form>{mode === "login" && process.env.NODE_ENV !== "production" && <div className="demo-accounts"><span className="section-label">DEMO ACCOUNTS</span>{demoAccounts.map((account) => <button type="button" key={account.email} onClick={() => setForm({ ...form, email: account.email, password: "RepairX@12345" })}><strong>{account.label}</strong><small>{account.email}</small></button>)}<small>Development only. These are real persisted accounts.</small></div>}<button className="auth-switch" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}>{mode === "login" ? "Create an account" : "Sign in instead"}</button></section></div>;
}

*/

function AuthPanel({ onClose }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", city: "", state: "", pincode: "", role: "CUSTOMER", workshopName: "", address: "", specializations: [] });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  async function submit(event) {
    event.preventDefault(); setError(""); setLoading(true);
    try {
      const response = await fetch(`/api/auth/${mode === "login" ? "login" : "signup"}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || payload.error || "Authentication failed.");
      window.location.assign(roleRoutes[payload.data?.role] || "/dashboard");
    } catch (authError) { setError(authError.message || "Authentication failed."); setLoading(false); }
  }

  return <div className="auth-backdrop" role="presentation"><section className="auth-panel" role="dialog" aria-modal="true" aria-labelledby="auth-title"><button className="auth-close" onClick={onClose} aria-label="Close"><X size={18} /></button><span className="section-label">REPAIRX ACCOUNT</span><h2 id="auth-title">{mode === "login" ? "Welcome back." : "Create your RepairX account."}</h2><p>{mode === "login" ? "Sign in to the workspace assigned to your server-authenticated account." : "Choose an onboarding path. Admin accounts are provisioned separately."}</p><form onSubmit={submit}>{mode === "signup" && <><label>NAME<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>PHONE<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label><label>JOIN AS<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}><option value="CUSTOMER">Customer</option><option value="TECHNICIAN">Technician</option><option value="WORKSHOP_OWNER">Workshop</option></select></label>{form.role === "WORKSHOP_OWNER" && <><label>WORKSHOP NAME<input required value={form.workshopName} onChange={(event) => setForm({ ...form, workshopName: event.target.value })} /></label><label>ADDRESS<input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></label></>}{form.role === "TECHNICIAN" && <label>SPECIALIZATIONS<input placeholder="Battery, charging, display" value={form.specializations.join(", ")} onChange={(event) => setForm({ ...form, specializations: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} /></label>}</>}<label>EMAIL<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label>PASSWORD<input required type="password" minLength={8} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>{mode === "signup" && <div className="auth-location"><label>CITY<input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></label><label>PINCODE<input value={form.pincode} onChange={(event) => setForm({ ...form, pincode: event.target.value })} /></label></div>}{error && <div className="auth-error">{error}</div>}<button className="auth-submit" disabled={loading}>{loading ? "Continuing..." : mode === "login" ? "Sign in" : "Create account"}<ArrowRight size={15} /></button></form><button className="auth-switch" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}>{mode === "login" ? "Create an account" : "Sign in instead"}</button></section></div>;
}

function Landing({ onStart }) {
  return <main className="landing-page"><header className="landing-nav"><Logo /><nav><a href="#how-it-works">How it works</a><a href="#trust">Trust boundary</a><a href="#roles">Workspaces</a></nav><button className="nav-link" onClick={onStart}>Sign in</button></header><section className="hero-section"><div className="hero-copy"><span className="section-label">DEVICE INTELLIGENCE / REPAIRX</span><h1>Your device has a <em>memory.</em></h1><p>RepairX connects real device records, evidence, workshops, technicians, and repair outcomes.</p><div className="hero-actions"><button className="rx-button" onClick={onStart}>Open your workspace <ArrowRight size={16} /></button></div><div className="hero-note"><ShieldCheck size={14} /><span>Customer reports, AI signals, technician findings, and verified outcomes stay distinct.</span></div></div><div className="hero-stage"><div className="stage-grid" /><div className="stage-caption"><span>REPAIRX OPERATING LAYER</span><strong>One case, shared with permission</strong><small>Every workspace reads authoritative backend state</small></div><div className="hero-device-field"><div className="hero-device"><div className="device-screen-state"><span>REPAIRX</span><strong>DEVICE MEMORY</strong><small>Awaiting your data</small></div></div><div className="floating-signal signal-one"><Wrench size={16} /><span><b>Technician verified</b><small>Stored only after a real finding</small></span></div><div className="floating-signal signal-two"><CircleHelp size={16} /><span><b>Unknown stays unknown</b><small>No invented repair history</small></span></div></div></div></section><section className="proof-strip" id="how-it-works"><span>FROM FIRST DEVICE TO BETTER RECOVERY DECISION</span><div><strong>01</strong> Add device <ArrowRight size={14} /><strong>02</strong> Report issue <ArrowRight size={14} /><strong>03</strong> Verify repair <ArrowRight size={14} /><strong>04</strong> Remember outcome</div></section><section className="story-section" id="trust"><div className="story-intro"><span className="section-label">TRUST BOUNDARY</span><h2>Evidence first.<br /><em>Assumptions visible.</em></h2><p>RepairX keeps customer reports, preliminary intelligence, discovered businesses, workshop claims, technician findings, and customer outcomes separate.</p></div><div className="memory-preview"><div className="preview-head"><span>DATA STATES</span><span className="trust-badge verified"><i />DATABASE-DRIVEN</span></div>{[["REPORTED", "What the customer said"], ["INFERRED", "What evidence suggests"], ["VERIFIED", "What a technician observed"], ["UNKNOWN", "What still needs testing"]].map(([state, detail]) => <div className="memory-row" key={state}><span className="memory-node" /><div><strong>{state}</strong><small>{detail}</small></div></div>)}</div></section><section className="economics-section" id="roles"><div><span className="section-label">ROLE WORKSPACES</span><h2>One case.<br />Different responsibilities.</h2><p>Customers manage their devices, workshops manage incoming work, technicians verify physical findings, and operations protects the network.</p><button className="rx-button secondary" onClick={onStart}>Enter RepairX <ArrowRight size={15} /></button></div><div className="economics-preview"><div className="economics-top"><span>REAL WORKFLOW</span><small>Permissions follow the role</small></div><div className="recovery-list"><div className="recovery-line"><div><strong>Customer</strong><small>Own devices and repair progress</small></div><ArrowRight size={14} /></div><div className="recovery-line"><div><strong>Workshop</strong><small>Authorized requests and execution</small></div><ArrowRight size={14} /></div><div className="recovery-line"><div><strong>Technician</strong><small>Assigned cases and verification</small></div><ArrowRight size={14} /></div></div></div></section><footer className="landing-footer"><Logo /><span>Device intelligence · Repair operations · Recovery evidence</span><span>Database-backed workspaces</span></footer></main>;
}

export default function Home() {
  const [authOpen, setAuthOpen] = useState(false);
  return <><Landing onStart={() => setAuthOpen(true)} />{authOpen && <AuthPanel onClose={() => setAuthOpen(false)} />}</>;
}
