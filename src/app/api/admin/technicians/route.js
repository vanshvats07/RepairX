import { NextResponse } from "next/server";
import Technician from "@/models/Technician";
import { connectMongo } from "@/lib/mongodb";
import { requireAuth, requireRole } from "@/services/authService";

export async function GET() { try { requireRole(await requireAuth(), ["ADMIN"]); await connectMongo(); const data = await Technician.find({}).populate("workshopId", "name city").sort({ createdAt: -1 }).limit(500).lean(); return NextResponse.json({ data }); } catch (error) { return NextResponse.json({ error: error.message }, { status: error.code === "FORBIDDEN" ? 403 : 401 }); } }
