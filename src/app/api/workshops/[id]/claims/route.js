import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import WorkshopClaim from "@/models/WorkshopClaim";
import { requireAuth, requireRole } from "@/services/authService";
export async function GET(_request, { params }) { try { const user = requireRole(await requireAuth(), ["WORKSHOP_OWNER", "ADMIN"]); await connectMongo(); if (!process.env.MONGODB_URI) return NextResponse.json({ data: [] }); const filter = user.role === "ADMIN" ? { workshopId: params.id } : { workshopId: params.id, userId: user._id }; return NextResponse.json({ data: await WorkshopClaim.find(filter).sort({ createdAt: -1 }).lean() }); } catch (error) { return NextResponse.json({ error: error.message }, { status: error.code === "FORBIDDEN" ? 403 : 401 }); } }
