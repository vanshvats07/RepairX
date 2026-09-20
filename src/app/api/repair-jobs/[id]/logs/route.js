import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import RepairLog from "@/models/RepairLog";
import AuditEvent from "@/models/AuditEvent";
export async function POST(request, { params }) { try { const input = await request.json(); if (!input.eventType || !input.description) return NextResponse.json({ error: "Event type and description are required." }, { status: 400 }); await connectMongo(); if (!process.env.MONGODB_URI) return NextResponse.json({ error: "Database is not configured yet." }, { status: 503 }); const log = await RepairLog.create({ ...input, repairJobId: params.id }); await AuditEvent.create({ entityType: "RepairJob", entityId: params.id, eventType: input.eventType, metadata: { description: input.description } }); return NextResponse.json({ data: log }, { status: 201 }); } catch { return NextResponse.json({ error: "Unable to save the repair log." }, { status: 500 }); } }
