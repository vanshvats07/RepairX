import "server-only";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { authConfig, getAppEnvironment } from "@/config/env";
import { connectMongo } from "@/lib/mongodb";
import User from "@/models/User";
import WorkshopMembership from "@/models/WorkshopMembership";
import PilotInvitation from "@/models/PilotInvitation";
import Workshop from "@/models/Workshop";
import Technician from "@/models/Technician";
import { evaluatePilotAccess } from "@/services/pilotAccessService";

const COOKIE = "repairx_session";
const secret = () => authConfig.jwtSecret || authConfig.sessionSecret || process.env.JWT_SECRET || process.env.SESSION_SECRET;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const pincodePattern = /^\d{6}$/;

export function validateSignup(input) { if (!input?.name?.trim()) throw new Error("Name is required."); if (!emailPattern.test(input.email || "")) throw new Error("Enter a valid email address."); if (!input.password || input.password.length < 8) throw new Error("Password must be at least 8 characters."); if (input.pincode && !pincodePattern.test(input.pincode)) throw new Error("Enter a valid 6-digit Indian pincode."); if (!secret()) throw new Error("Authentication is not configured."); }
export function publicUser(user) { const value = user.toObject ? user.toObject() : user; const { passwordHash, ...safe } = value; return safe; }
export function signUser(user) { if (!secret()) throw new Error("Authentication is not configured."); return jwt.sign({ sub: String(user._id), role: user.role, sessionVersion: user.sessionVersion || 0 }, secret(), { expiresIn: `${authConfig.sessionMaxAgeDays || 7}d` }); }
export async function setSession(user) { const store = await cookies(); store.set(COOKIE, signUser(user), { httpOnly: true, secure: getAppEnvironment() === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * (authConfig.sessionMaxAgeDays || 7) }); }
export async function clearSession() { const store = await cookies(); const token = store.get(COOKIE)?.value; try { const payload = token && jwt.verify(token, secret()); if (payload?.sub) { await connectMongo(); if (process.env.MONGODB_URI) await User.updateOne({ _id: payload.sub }, { $inc: { sessionVersion: 1 } }); } } catch {} store.delete(COOKIE); }
export async function getSessionUser() { const store = await cookies(); const token = store.get(COOKIE)?.value; if (!token || !secret()) return null; try { const payload = jwt.verify(token, secret()); await connectMongo(); if (!process.env.MONGODB_URI) return null; const user = await User.findById(payload.sub).lean(); if (!user || (payload.sessionVersion !== undefined && payload.sessionVersion !== (user.sessionVersion || 0))) return null; return user; } catch { return null; } }
export async function requireAuth() { const user = await getSessionUser(); if (!user) { const error = new Error("Authentication required."); error.code = "UNAUTHORIZED"; throw error; } return user; }
export function requireRole(user, roles) { if (!roles.includes(user.role)) { const error = new Error("You do not have access to this resource."); error.code = "FORBIDDEN"; throw error; } return user; }
export async function requireActiveWorkshopOwner(user) {
  await connectMongo();
  if (!process.env.MONGODB_URI) throw new Error("Database is not configured yet.");
  const membership = await WorkshopMembership.findOne({ userId: user._id, status: "ACTIVE", role: { $in: ["OWNER", "MANAGER"] } }).lean();
  if (!membership) {
    const error = new Error("Workshop ownership access is not active for this account.");
    error.code = "FORBIDDEN";
    throw error;
  }
  return membership;
}
export async function requireActiveWorkshopTechnician(user) {
  await connectMongo();
  if (!process.env.MONGODB_URI) throw new Error("Database is not configured yet.");
  const membership = await WorkshopMembership.findOne({ userId: user._id, status: "ACTIVE", role: "TECHNICIAN" }).lean();
  if (!membership) {
    const error = new Error("Technician access is not active for this account.");
    error.code = "FORBIDDEN";
    throw error;
  }
  return membership;
}
export async function createAccount(input) {
  validateSignup(input);
  await connectMongo();
  if (!process.env.MONGODB_URI) throw new Error("Database is not configured yet.");
  const requestedRole = String(input.role || "CUSTOMER").toUpperCase();
  if (requestedRole === "ADMIN") { const error = new Error("Admin accounts are provisioned by a secure development or production administrator flow."); error.code = "FORBIDDEN"; throw error; }
  if (!["CUSTOMER", "TECHNICIAN", "WORKSHOP_OWNER"].includes(requestedRole)) { const error = new Error("Choose a supported RepairX account type."); error.code = "VALIDATION_ERROR"; throw error; }
  if (requestedRole === "WORKSHOP_OWNER" && !input.workshopName?.trim()) throw new Error("Workshop name is required.");
  const email = input.email.toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) { const error = new Error("An account with this email already exists."); error.code = "CONFLICT"; throw error; }
  const isPilotMode = String(process.env.PILOT_MODE || "true").toLowerCase() === "true";
  const inviteOnly = String(process.env.PILOT_INVITE_ONLY || "false").toLowerCase() === "true";
  const invitation = isPilotMode && inviteOnly ? await PilotInvitation.findOne({ email, role: requestedRole, status: "INVITED" }) : null;
  const access = evaluatePilotAccess({ isPilotMode: isPilotMode && inviteOnly, email, role: requestedRole, invitations: invitation ? [invitation.toObject ? invitation.toObject() : invitation] : [] });
  if (!access.allowed) { const error = new Error(access.reason); error.code = "PILOT_ACCESS_REQUIRED"; throw error; }
  const pending = requestedRole === "TECHNICIAN";
  const user = await User.create({ name: input.name.trim(), email, phone: input.phone, city: input.city, state: input.state, pincode: input.pincode, location: [input.city, input.state].filter(Boolean).join(", "), passwordHash: await bcrypt.hash(input.password, 12), role: requestedRole, pilotStatus: pending ? "ONBOARDING" : "ACTIVE" });
  if (requestedRole === "WORKSHOP_OWNER") {
    const workshop = await Workshop.create({ name: input.workshopName.trim(), ownerUserId: user._id, phone: input.phone, email, address: input.address, city: input.city, state: input.state, pincode: input.pincode, capabilities: input.specializations || [], supportedDevices: input.supportedDevices || [], availability: "OPEN", verificationStatus: "VERIFICATION_PENDING", verificationSource: "OWNER_SUBMITTED", pilotStatus: "ONBOARDING", isNetworkWorkshop: false });
    await WorkshopMembership.create({ workshopId: workshop._id, userId: user._id, role: "OWNER", status: "ACTIVE" });
  }
  if (requestedRole === "TECHNICIAN") {
    if (input.workshopId) {
      const workshop = await Workshop.findById(input.workshopId).lean();
      if (!workshop) throw new Error("The selected workshop was not found.");
      await WorkshopMembership.create({ workshopId: workshop._id, userId: user._id, role: "TECHNICIAN", status: "PENDING" });
      await Technician.create({ workshopId: workshop._id, userId: user._id, name: user.name, phone: user.phone, email: user.email, specializations: input.specializations || [], status: "INACTIVE", inviteStatus: "INVITED" });
    }
  }
  if (invitation) { invitation.status = "ACCEPTED"; await invitation.save(); }
  return user;
}
export async function authenticate(input) { if (!emailPattern.test(input.email || "") || !input.password) throw new Error("Email or password is incorrect."); await connectMongo(); if (!process.env.MONGODB_URI) throw new Error("Database is not configured yet."); const user = await User.findOne({ email: input.email.toLowerCase() }).select("+passwordHash"); if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) throw new Error("Email or password is incorrect."); user.lastLoginAt = new Date(); await user.save(); return user; }
export { COOKIE };
