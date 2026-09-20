import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Workshop from "@/models/Workshop";
import WorkshopClaim from "@/models/WorkshopClaim";
import { requireAuth, requireRole } from "@/services/authService";

export async function POST(request, { params }) {
  try { const user = requireRole(await requireAuth(), ["WORKSHOP_OWNER"]); const submittedDetails = await request.json(); await connectMongo(); if (!process.env.MONGODB_URI) return NextResponse.json({ error: "Database is not configured yet." }, { status: 503 }); const workshop = await Workshop.findById(params.id); if (!workshop) return NextResponse.json({ error: "Workshop not found." }, { status: 404 }); const existing = await WorkshopClaim.findOne({ workshopId: workshop._id, status: "PENDING" }); if (existing) return NextResponse.json({ error: "A claim is already under review." }, { status: 409 }); const claim = await WorkshopClaim.create({ workshopId: workshop._id, userId: user._id, submittedDetails, relationship: submittedDetails.relationship, status: "PENDING" }); workshop.verificationStatus = "CLAIM_REQUESTED"; await workshop.save(); return NextResponse.json({ data: claim }, { status: 201 }); } catch (error) { return NextResponse.json({ error: error.message || "Workshop claim is temporarily unavailable." }, { status: error.code === "UNAUTHORIZED" ? 401 : error.code === "FORBIDDEN" ? 403 : 500 }); }
}
