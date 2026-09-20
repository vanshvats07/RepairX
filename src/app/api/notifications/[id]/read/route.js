import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Notification from "@/models/Notification";
import { requireAuth } from "@/services/authService";

export async function PATCH(_request, { params }) {
  try {
    const user = await requireAuth();
    await connectMongo();
    if (!process.env.MONGODB_URI) return NextResponse.json({ error: "Database is not configured yet." }, { status: 503 });
    const notification = await Notification.findOne({ _id: params.id, userId: user._id });
    if (!notification) return NextResponse.json({ error: "Notification not found." }, { status: 404 });
    notification.read = true;
    notification.readAt = new Date();
    await notification.save();
    return NextResponse.json({ data: notification });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to update notification." }, { status: error.code === "UNAUTHORIZED" ? 401 : 500 });
  }
}
