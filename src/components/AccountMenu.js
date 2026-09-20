"use client";

import Link from "next/link";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const workspaceRoutes = {
  CUSTOMER: "/dashboard",
  WORKSHOP_OWNER: "/workshop",
  TECHNICIAN: "/technician",
  ADMIN: "/admin",
};

const roleLabels = {
  CUSTOMER: "Customer",
  WORKSHOP_OWNER: "Workshop owner",
  TECHNICIAN: "Technician",
  ADMIN: "Administrator",
};

function isDevelopmentEnvironment() {
  return process.env.NODE_ENV !== "production";
}

export default function AccountMenu({ user }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const router = useRouter();
  const role = roleLabels[user?.role] || "RepairX user";
  const workspace = workspaceRoutes[user?.role] || "/";

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    function closeOnEscape(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  async function logout() {
    setOpen(false);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    } finally {
      router.replace("/");
      router.refresh();
    }
  }

  return <div className="account-menu" ref={rootRef}>
    <button type="button" className="account-trigger" aria-label={`${user?.name || "RepairX account"} ${role}`} aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen(!open)}>
      <span className="account-avatar"><UserRound size={16} /></span>
      <span className="account-identity"><strong>{user?.name || "RepairX user"}</strong><small>{role}</small></span>
      <ChevronDown size={15} className={open ? "account-chevron open" : "account-chevron"} />
    </button>
    {open && <div className="account-dropdown" role="menu">
      <div className="account-dropdown-heading"><strong>{user?.email || "Authenticated account"}</strong><small>Server-authenticated session</small></div>
      <div className="account-dropdown-divider" />
      <div className="account-menu-item account-menu-profile"><UserRound size={15} /><span>Profile</span></div>
      <Link className="account-menu-item" href={workspace} onClick={() => setOpen(false)}><span>Current workspace</span><small>{role}</small></Link>
      {isDevelopmentEnvironment() && <div className="account-demo-note">Switch stakeholders by logging out and signing in with another authorized account.</div>}
      <button type="button" className="account-menu-item account-menu-logout" onClick={logout}><LogOut size={15} /><span>Logout</span></button>
    </div>}
  </div>;
}
