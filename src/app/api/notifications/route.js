import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Notification from "@/models/Notification";
import { requireAuth } from "@/services/authService";
export async function GET() { try { const user = await requireAuth(); await connectMongo(); if (!process.env.MONGODB_URI) return NextResponse.json({ data: [] }); return NextResponse.json({ data: await Notification.find({ userId: user._id }).sort({ createdAt: -1 }).limit(50).lean() }); } catch (error) { return NextResponse.json({ error: error.message }, { status: error.code === "UNAUTHORIZED" ? 401 : 500 }); } }
