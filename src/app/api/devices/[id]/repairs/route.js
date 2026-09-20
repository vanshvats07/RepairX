import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import RepairEvent from "@/models/RepairEvent";
import { requireAuth } from "@/services/authService";
import { getOwnedDevice } from "@/services/deviceAccessService";
export async function GET(_request, { params }) { try { const user = await requireAuth(); const { id } = await params; await connectMongo(); if (!process.env.MONGODB_URI) return NextResponse.json({ data: [] }); if (!await getOwnedDevice(id, user)) return NextResponse.json({ error: "This device is not available to your account." }, { status: 404 }); return NextResponse.json({ data: await RepairEvent.find({ deviceId: id }).sort({ createdAt: -1 }).lean() }); } catch (error) { return NextResponse.json({ data: [], message: error.message || "Repair history is temporarily unavailable." }, { status: error.code === "UNAUTHORIZED" ? 401 : 500 }); } }
