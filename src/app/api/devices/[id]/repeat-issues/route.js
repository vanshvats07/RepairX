import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import RepairEvent from "@/models/RepairEvent";
import { detectRepeatedIssues } from "@/services/deviceIntelligenceService";
export async function GET(_request, { params }) { try { await connectMongo(); if (!process.env.MONGODB_URI) return NextResponse.json({ data: [], message: "No repeat patterns yet." }); const repairs = await RepairEvent.find({ deviceId: params.id }).sort({ createdAt: 1 }).lean(); return NextResponse.json({ data: detectRepeatedIssues({ repairs, investigations: [] }) }); } catch { return NextResponse.json({ data: [], message: "Repeat issue analysis is temporarily unavailable." }); } }
