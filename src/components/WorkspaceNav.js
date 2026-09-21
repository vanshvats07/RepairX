import Link from "next/link";
import { Activity, ClipboardList, FileText, Gauge, LogOut, Package, ShieldCheck, Smartphone, Store, UserRound, Wrench } from "lucide-react";

const icons = { Dashboard: Gauge, Overview: Gauge, "My Devices": Smartphone, "Raise Repair Request": Wrench, "Active Repairs": ClipboardList, "Repair History": FileText, "Repair DNA": Activity, "Profile / Account": UserRound, Requests: ClipboardList, Technicians: ShieldCheck, Parts: Package, Quotes: FileText, Completed: ShieldCheck, "Assigned Jobs": ClipboardList, "Repair Queue": Wrench, "Diagnosis / Verification": Activity, "Repair Execution": Wrench, "Installed Parts": Package, "Quality Check": ShieldCheck, Profile: UserRound, Logout: LogOut, Workshops: Store, "Users / Memberships": UserRound, "Repair Cases": ClipboardList, "Data Quality": ShieldCheck, Audit: FileText };
const fallbackRoutes = { Overview: "/dashboard", Requests: "/workshop#incoming-cases", "Active Repairs": "/workshop#active-repairs", Technicians: "/workshop#technicians", Parts: "/workshop#active-repairs", Quotes: "/workshop#quotes", Completed: "/workshop#active-repairs", "Assigned Cases": "/technician#assigned-cases", Diagnostics: "/technician#assigned-cases", "Quality Checks": "/technician#assigned-cases", "Repair History": "/technician#assigned-cases" };

export default function WorkspaceNav({ items }) {
  return <nav className="workspace-nav" aria-label="Workspace navigation">{items.map((item) => { const Icon = icons[item.label || item] || Store; const label = item.label || item; return <Link href={item.href || fallbackRoutes[label] || "#"} key={label}><Icon size={15} />{label}</Link>; })}</nav>;
}
