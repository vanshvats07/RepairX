"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";

const emptySelection = { variant: "", storage: "", ram: "", color: "", network: "", modelNumber: "", serialNumber: "", imei: "", location: "" };

function optionValues(record, variant, key) {
  const variantValues = variant?.[key];
  if (Array.isArray(variantValues) && variantValues.length) return variantValues;
  const recordValues = record?.specifications?.[key];
  return Array.isArray(recordValues) ? recordValues : [];
}

function SelectorField({ label, value, placeholder, disabled, onClick }) {
  return <button type="button" className="catalog-select-field" disabled={disabled} onClick={onClick}><span>{label}</span><strong>{value || placeholder}</strong><ArrowRight size={15} /></button>;
}

export default function DeviceCatalogSelector({ onSubmit, onClose, saving = false }) {
  const [mode, setMode] = useState("catalog");
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState(null);
  const [record, setRecord] = useState(null);
  const [variant, setVariant] = useState(null);
  const [selection, setSelection] = useState(emptySelection);
  const [picker, setPicker] = useState(null);
  const [unknown, setUnknown] = useState({ brand: "", model: "", variant: "", storage: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/device-catalog/brands?category=SMARTPHONE");
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error?.message || "Brands could not be loaded.");
        if (!cancelled) setBrands(payload.data || []);
      } catch (loadError) { if (!cancelled) setError(loadError.message); }
    }, 180);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, []);

  useEffect(() => {
    if (!brand) return undefined;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/device-catalog/models?category=SMARTPHONE&brand=${encodeURIComponent(brand)}&limit=500`);
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error?.message || "Models could not be loaded.");
        if (!cancelled) setModels(payload.items || []);
      } catch (loadError) { if (!cancelled) setError(loadError.message); }
      finally { if (!cancelled) setLoading(false); }
    }, 180);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [brand]);

  async function chooseModel(item) {
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/device-catalog/models/${item._id}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Model details could not be loaded.");
      setModel(payload.data); setRecord(payload.data); setVariant(null); setSelection(emptySelection); setPicker(null);
    } catch (loadError) { setError(loadError.message); }
    finally { setLoading(false); }
  }

  function chooseBrand(value) {
    setBrand(value); setModel(null); setRecord(null); setVariant(null); setModels([]); setSelection(emptySelection); setPicker(null);
  }

  function chooseOption(key, value) {
    const next = { ...selection, [key]: value };
    if (key === "variant") { next.storage = ""; next.ram = ""; next.color = ""; next.network = ""; setVariant(record?.variants?.find((item) => item.name === value) || { name: value }); }
    setSelection(next); setPicker(null);
  }

  function submit(event) {
    event.preventDefault();
    if (mode === "unknown") return onSubmit({ ...unknown, category: "SMARTPHONE", catalogMatchStatus: "UNMATCHED", catalogSource: "USER_ENTERED", serialNumber: selection.serialNumber, imei: selection.imei, location: selection.location });
    onSubmit({ category: record?.category || "SMARTPHONE", brand: record.brand, model: record.model, modelNumber: selection.modelNumber || variant?.modelNumber || record.modelNumber || "", variant: selection.variant, storage: selection.storage, ram: selection.ram, color: selection.color, network: selection.network, serialNumber: selection.serialNumber, imei: selection.imei, location: selection.location, catalogDeviceId: record._id, catalogMatchStatus: "MATCHED", catalogSource: record.sourceType || "DATABASE_MATCH", catalogSnapshot: record });
  }

  const variants = record?.variants?.map((item) => item.name).filter(Boolean) || (record?.variant ? [record.variant] : []);
  const currentOptions = picker ? (picker === "variant" ? variants : optionValues(record, variant, `${picker}Options`)) : [];
  const ready = mode === "unknown" ? Boolean(unknown.brand.trim() && unknown.model.trim()) : Boolean(record && (!variants.length || selection.variant));

  return <div className="catalog-modal-backdrop"><section className="catalog-modal" role="dialog" aria-modal="true" aria-labelledby="catalog-title"><button type="button" className="data-modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button><span className="section-label">DEVICE IDENTITY</span><h2 id="catalog-title">Select your device</h2><p>Choose from the live RepairX catalog so every repair record stays tied to the correct physical device.</p><div className="catalog-progress"><span className={brand ? "complete" : "active"}>01 Company</span><span className={record ? "complete" : "active"}>02 Model</span><span className={ready ? "complete" : "active"}>03 Details</span></div>{error && <div className="data-error">{error}</div>}{mode === "unknown" ? <form onSubmit={submit} className="catalog-form"><div className="catalog-unknown-note"><strong>USER-REPORTED DEVICE</strong><span>This device will remain clearly marked as unmatched until verified.</span></div>{["brand", "model", "variant", "storage"].map((field) => <label key={field}>{field.toUpperCase()}<input value={unknown[field]} onChange={(event) => setUnknown({ ...unknown, [field]: event.target.value })} placeholder={`${field[0].toUpperCase()}${field.slice(1)} (optional)`} required={field === "brand" || field === "model"} /></label>)}<button className="data-primary-button" disabled={saving}>{saving ? "Saving..." : "Save user-reported device"}<ArrowRight size={14} /></button><button type="button" className="catalog-back-button" onClick={() => setMode("catalog")}><ArrowLeft size={14} />Back to catalog</button></form> : <form onSubmit={submit} className="catalog-form"><label className="catalog-search-label">COMPANY<select autoFocus value={brand} onChange={(event) => chooseBrand(event.target.value)}><option value="">Choose a company</option>{brands.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>{brand && <label className="catalog-search-label">MODEL<select value={model?._id || ""} onChange={(event) => { const selectedModel = models.find((item) => item._id === event.target.value); if (selectedModel) chooseModel(selectedModel); }} disabled={loading}><option value="">{loading ? "Loading models..." : "Choose a model"}</option>{models.map((item) => <option key={item._id} value={item._id}>{item.model}{item.modelNumber ? ` (${item.modelNumber})` : ""}</option>)}</select></label>}{record && <div className="catalog-fields">{variants.length > 0 && <SelectorField label="VARIANT" value={selection.variant} placeholder="Choose variant" onClick={() => setPicker("variant")} />}{["storage", "ram", "color", "network"].map((key) => optionValues(record, variant, `${key}Options`).length > 0 && <SelectorField key={key} label={key.toUpperCase()} value={selection[key]} placeholder={`Choose ${key}`} onClick={() => setPicker(key)} />)}<label>MODEL NUMBER<input value={selection.modelNumber || variant?.modelNumber || record.modelNumber || ""} onChange={(event) => setSelection({ ...selection, modelNumber: event.target.value })} placeholder="Not available" /></label><label>IMEI<input value={selection.imei} onChange={(event) => setSelection({ ...selection, imei: event.target.value })} placeholder="Optional" inputMode="numeric" /></label><label>SERIAL NUMBER<input value={selection.serialNumber} onChange={(event) => setSelection({ ...selection, serialNumber: event.target.value })} placeholder="Optional" /></label><label>LOCATION<input value={selection.location} onChange={(event) => setSelection({ ...selection, location: event.target.value })} placeholder="City or locality" /></label></div>}<button className="data-primary-button" disabled={!ready || saving}>{saving ? "Saving..." : "Save device"}<ArrowRight size={14} /></button><button type="button" className="catalog-unknown-link" onClick={() => setMode("unknown")}>Can&apos;t find your device?</button></form>}{picker && <div className="catalog-picker" role="dialog" aria-label={`${picker} options`}><div className="catalog-picker-header"><strong>Choose {picker}</strong><button type="button" onClick={() => setPicker(null)} aria-label="Close options"><X size={16} /></button></div><div className="catalog-picker-options">{currentOptions.length ? currentOptions.map((item) => { const value = typeof item === "string" ? item : item.name; return <button type="button" key={value} onClick={() => chooseOption(picker, value)}>{value}<Check size={15} /></button>; }) : <span>Not available for this selection.</span>}</div></div>}</section></div>;
}
