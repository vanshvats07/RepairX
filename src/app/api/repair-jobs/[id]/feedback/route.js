import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import CustomerFeedback from "@/models/CustomerFeedback";
export async function POST(request, { params }) { try { await connectMongo(); if (!process.env.MONGODB_URI) return NextResponse.json({ error: "Database is not configured yet." }, { status: 503 }); return NextResponse.json({ data: await CustomerFeedback.create({ ...(await request.json()), repairJobId: params.id }) }, { status: 201 }); } catch { return NextResponse.json({ error: "Unable to save feedback." }, { status: 500 }); } }
