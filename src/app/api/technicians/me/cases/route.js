import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Technician from "@/models/Technician";
import TechnicianAssignment from "@/models/TechnicianAssignment";
import { requireAuth, requireRole } from "@/services/authService";
export async function GET() { try { const user = requireRole(await requireAuth(), ["TECHNICIAN"]); await connectMongo(); if (!process.env.MONGODB_URI) return NextResponse.json({ data: [] }); const technician = await Technician.findOne({ userId: user._id }); if (!technician) return NextResponse.json({ data: [] }); const data = await TechnicianAssignment.find({ technicianId: technician._id, status: { $in: ["ASSIGNED", "ACCEPTED"] } }).populate("repairRequestId").lean(); return NextResponse.json({ data }); } catch (error) { return NextResponse.json({ error: error.message }, { status: error.code === "FORBIDDEN" ? 403 : 401 }); } }
