import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import RepairEvent from "@/models/RepairEvent";
export async function POST(request) { try { const input = await request.json(); if (!input.deviceId) return NextResponse.json({ error: "Device is required." }, { status: 400 }); await connectMongo(); if (!process.env.MONGODB_URI) return NextResponse.json({ error: "Database is not configured yet." }, { status: 503 }); return NextResponse.json({ data: await RepairEvent.create({ ...input, currency: "INR" }) }, { status: 201 }); } catch { return NextResponse.json({ error: "Unable to save this repair event right now." }, { status: 500 }); } }
