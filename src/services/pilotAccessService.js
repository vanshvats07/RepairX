export function evaluatePilotAccess({ isPilotMode = false, email = "", role = "CUSTOMER", invitations = [] }) {
  if (!isPilotMode) {
    return { allowed: true, reason: null };
  }

  const normalizedEmail = String(email || "").trim().toLowerCase();
  const activeInvitation = invitations.find((invitation) => {
    if (!invitation) return false;
    if (String(invitation.email || "").trim().toLowerCase() !== normalizedEmail) return false;
    if ((invitation.role || "CUSTOMER") !== role) return false;
    if (invitation.status && invitation.status !== "INVITED") return false;
    if (invitation.expiresAt && new Date(invitation.expiresAt).getTime() < Date.now()) return false;
    return true;
  });

  if (!activeInvitation) {
    return {
      allowed: false,
      reason: "Pilot access is required for private beta signup.",
    };
  }

  return { allowed: true, reason: null };
}

export function isPilotReadyForPublicAccess() {
  return Boolean(process.env.PILOT_MODE === "true");
}
