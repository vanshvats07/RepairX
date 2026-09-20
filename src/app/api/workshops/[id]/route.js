import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Workshop from "@/models/Workshop";
import WorkshopCapability from "@/models/WorkshopCapability";
import { validateObjectId } from "@/lib/security";
import { requireAuth } from "@/services/authService";
export async function GET(_request, { params }) { try { const user = await requireAuth(); validateObjectId(params.id); await connectMongo(); if (!process.env.MONGODB_URI) return NextResponse.json({ data: null }); const workshop = await Workshop.findById(params.id).lean(); if (!workshop) return NextResponse.json({ data: null }, { status: 404 }); const capabilities = await WorkshopCapability.find({ workshopId: workshop._id }).lean(); return NextResponse.json({ data: { ...workshop, capabilities } }); } catch (error) { return NextResponse.json({ data: null, message: error.message || "Workshop details are temporarily unavailable." }, { status: error.code === "UNAUTHORIZED" ? 401 : error.code === "INVALID_ID" ? 400 : 500 }); } }
