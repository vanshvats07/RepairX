import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Part from "@/models/Part";
import PartListing from "@/models/PartListing";
export async function GET() { try { await connectMongo(); if (!process.env.MONGODB_URI) return NextResponse.json({ data: [], source: "empty" }); const parts = await Part.find().lean(); const listings = await PartListing.find().lean(); return NextResponse.json({ data: parts.map((part) => ({ ...part, listings: listings.filter((item) => String(item.partId) === String(part._id)) })) }); } catch { return NextResponse.json({ data: [], source: "empty", message: "Part data is temporarily unavailable." }); } }
