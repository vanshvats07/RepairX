import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import DeviceValueSnapshot from "@/models/DeviceValueSnapshot";
export async function GET(_request, { params }) { try { await connectMongo(); if (!process.env.MONGODB_URI) return NextResponse.json({ data: null, message: "Not enough market references to estimate resale value." }); return NextResponse.json({ data: await DeviceValueSnapshot.findOne({ deviceId: params.id }).sort({ retrievedAt: -1 }).lean() }); } catch { return NextResponse.json({ data: null, message: "Market value is temporarily unavailable." }); } }
