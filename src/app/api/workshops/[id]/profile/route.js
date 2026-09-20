import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Workshop from "@/models/Workshop";
import WorkshopMembership from "@/models/WorkshopMembership";
import { sanitizeAllowedFields, validateObjectId } from "@/lib/security";
import { requireWorkshopOwner } from "@/services/workshopAccessService";
export async function PATCH(request, { params }) { try { const user = await requireWorkshopOwner(); const workshopId = validateObjectId(params.id); await connectMongo(); if (!process.env.MONGODB_URI) return NextResponse.json({ error: "Database is not configured yet." }, { status: 503 }); await WorkshopMembership.findOne({ userId: user._id, workshopId, status: "ACTIVE", role: { $in: ["OWNER", "MANAGER"] } }).orFail(); const input = sanitizeAllowedFields(await request.json(), ["name", "legalBusinessName", "address", "phone", "email", "website", "businessHours", "supportedBrands", "supportedDevices", "availability", "pickupCapability", "deliveryCapability", "serviceAreas"]); return NextResponse.json({ data: await Workshop.findByIdAndUpdate(workshopId, { $set: input }, { new: true, runValidators: true }).lean() }); } catch (error) { return NextResponse.json({ error: error.message || "Unable to update workshop profile." }, { status: error.code === "UNAUTHORIZED" ? 401 : error.code === "INVALID_ID" ? 400 : 403 }); } }
