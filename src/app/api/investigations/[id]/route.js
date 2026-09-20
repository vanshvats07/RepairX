import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Investigation from "@/models/Investigation";
import { requireAuth } from "@/services/authService";

export async function GET(_request, { params }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await connectMongo();
    if (!process.env.MONGODB_URI) return NextResponse.json({ data: null });

    const investigation = await Investigation.findOne({ _id: id, userId: user._id }).lean();
    if (!investigation) return NextResponse.json({ error: "Investigation not found." }, { status: 404 });
    return NextResponse.json({ data: investigation });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Investigation is temporarily unavailable." }, { status: error.code === "UNAUTHORIZED" ? 401 : 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const update = await request.json();
    await connectMongo();
    if (!process.env.MONGODB_URI) return NextResponse.json({ error: "Database is not configured yet." }, { status: 503 });

    const investigation = await Investigation.findOne({ _id: id, userId: user._id });
    if (!investigation) return NextResponse.json({ error: "Investigation not found." }, { status: 404 });

    Object.assign(investigation, update);
    await investigation.save();
    return NextResponse.json({ data: investigation.toObject() });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to update this investigation right now." }, { status: error.code === "UNAUTHORIZED" ? 401 : 500 });
  }
}
