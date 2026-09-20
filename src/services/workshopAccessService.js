import "server-only";
import WorkshopMembership from "@/models/WorkshopMembership";
import { requireAuth, requireRole } from "@/services/authService";
export async function requireWorkshopOwner() { const user = requireRole(await requireAuth(), ["WORKSHOP_OWNER", "ADMIN"]); return user; }
export async function requireWorkshopMembership(userId, workshopId, roles = ["OWNER", "MANAGER"]) { const membership = await WorkshopMembership.findOne({ userId, workshopId, status: "ACTIVE", role: { $in: roles } }); if (!membership) { const error = new Error("You do not manage this workshop."); error.code = "FORBIDDEN"; throw error; } return membership; }
export async function getActiveWorkshopMemberships(userId) { return WorkshopMembership.find({ userId, status: "ACTIVE" }).sort({ createdAt: -1 }).lean(); }
