import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import RepairRequest from "@/models/RepairRequest";
import RepairStatus from "@/models/RepairStatus";
import { canTransition } from "@/services/repairRequestService";
export async function POST(_request, { params }) { try { await connectMongo(); if (!process.env.MONGODB_URI) return NextResponse.json({ error: "Database is not configured yet." }, { status: 503 }); const record = await RepairRequest.findById(params.id); if (!record) return NextResponse.json({ error: "Repair request not found." }, { status: 404 }); if (!canTransition(record.status, "DIAGNOSIS_VERIFIED")) return NextResponse.json({ error: "Complete technician verification before advancing this case." }, { status: 409 }); record.status = "DIAGNOSIS_VERIFIED"; await record.save(); await RepairStatus.create({ repairRequestId: record._id, status: record.status, note: "Technician verification accepted" }); return NextResponse.json({ data: record }); } catch { return NextResponse.json({ error: "Unable to verify this case." }, { status: 500 }); } }
