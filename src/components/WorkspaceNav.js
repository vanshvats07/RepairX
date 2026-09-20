import Link from "next/link";
import { Activity, ClipboardList, FileText, Gauge, Package, ShieldCheck, Smartphone, Store, Wrench } from "lucide-react";

const icons = { Overview: Gauge, "My Devices": Smartphone, "My Repairs": ClipboardList, "Repair DNA": Activity, Requests: ClipboardList, "Active Repairs": Wrench, Technicians: ShieldCheck, Parts: Package, Quotes: FileText, Completed: ShieldCheck, "Assigned Cases": ClipboardList, Diagnostics: Activity, "Quality Checks": ShieldCheck, "Repair History": FileText };

export default function WorkspaceNav({ items }) {
  return <nav className="workspace-nav" aria-label="Workspace navigation">{items.map((item) => { const Icon = icons[item] || Store; return <Link href={item === "Overview" ? "/dashboard" : `#${item.toLowerCase().replaceAll(" ", "-")}`} key={item}><Icon size={15} />{item}</Link>; })}</nav>;
}
