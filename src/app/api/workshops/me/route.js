import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import WorkshopMembership from "@/models/WorkshopMembership";
import Workshop from "@/models/Workshop";
import { requireWorkshopOwner } from "@/services/workshopAccessService";
import { requireAuth, requireRole } from "@/services/authService";

const ALLOWED_WORKSHOP_FIELDS = ["name", "legalBusinessName", "businessType", "address", "locality", "city", "state", "pincode", "phone", "email", "website", "latitude", "longitude", "supportedBrands", "supportedDevices", "capabilities", "businessHours", "availability", "authorizationStatus"];

export async function GET() { try { const user = requireRole(await requireAuth(), ["WORKSHOP_OWNER", "ADMIN"]); await connectMongo(); if (!process.env.MONGODB_URI) return NextResponse.json({ data: [] }); const memberships = await WorkshopMembership.find({ userId: user._id, status: "ACTIVE", role: { $in: ["OWNER", "MANAGER"] } }).sort({ createdAt: -1 }).lean(); const workshops = await Workshop.find({ _id: { $in: memberships.map((item) => item.workshopId) } }).sort({ updatedAt: -1 }).lean(); return NextResponse.json({ data: workshops.map((workshop) => ({ ...workshop, workshopId: workshop._id, ownership: memberships.find((item) => String(item.workshopId) === String(workshop._id)) })) }); } catch (error) { return NextResponse.json({ error: error.message }, { status: error.code === "FORBIDDEN" ? 403 : 401 }); } }

export async function PATCH(request) { try { const user = await requireWorkshopOwner(); await connectMongo(); if (!process.env.MONGODB_URI) return NextResponse.json({ error: "Database is not configured yet." }, { status: 503 }); const input = await request.json(); const membership = await WorkshopMembership.findOne({ userId: user._id, status: "ACTIVE", role: { $in: ["OWNER", "MANAGER"] } }).sort({ createdAt: -1 }).lean(); if (!membership) return NextResponse.json({ error: "No active workshop membership found." }, { status: 404 }); const workshopId = input.workshopId || membership.workshopId; const workshop = await Workshop.findById(workshopId); if (!workshop) return NextResponse.json({ error: "Workshop not found." }, { status: 404 }); const update = {};
  for (const field of ALLOWED_WORKSHOP_FIELDS) { if (input[field] !== undefined) update[field] = input[field]; }
  if (Object.keys(update).length === 0) return NextResponse.json({ error: "No workshop fields were provided for update." }, { status: 400 }); const updated = await Workshop.findByIdAndUpdate(workshopId, update, { new: true, runValidators: true }).lean(); return NextResponse.json({ data: updated }); } catch (error) { return NextResponse.json({ error: error.message || "Unable to update workshop profile." }, { status: error.code === "FORBIDDEN" ? 403 : 401 }); } }
