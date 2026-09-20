import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import DeviceComponent from "@/models/DeviceComponent";
import RepairEvent from "@/models/RepairEvent";
import { analyzeComponentStability } from "@/services/deviceIntelligenceService";
import { requireAuth } from "@/services/authService";
import { getOwnedDevice } from "@/services/deviceAccessService";
export async function GET(_request, { params }) { try { const user = await requireAuth(); const { id } = await params; await connectMongo(); if (!process.env.MONGODB_URI) return NextResponse.json({ data: [], message: "Limited history available." }); if (!await getOwnedDevice(id, user)) return NextResponse.json({ error: "This device is not available to your account." }, { status: 404 }); const [components, repairs] = await Promise.all([DeviceComponent.find({ deviceId: id }).lean(), RepairEvent.find({ deviceId: id }).lean()]); return NextResponse.json({ data: analyzeComponentStability(components, repairs) }); } catch (error) { return NextResponse.json({ data: [], message: error.message || "Condition profile is temporarily unavailable." }, { status: error.code === "UNAUTHORIZED" ? 401 : 500 }); } }
