import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import User from "@/models/User";
import { requireAuth, publicUser } from "@/services/authService";
export async function GET() { try { return NextResponse.json({ success: true, data: publicUser(await requireAuth()) }); } catch (error) { return NextResponse.json({ success: false, error: { code: error.code || "UNAUTHORIZED", message: error.message } }, { status: error.code === "UNAUTHORIZED" ? 401 : 500 }); } }
export async function PATCH(request) { try { const user = await requireAuth(); const input = await request.json(); const allowed = (({ name, phone, city, state, pincode, preferredLanguage }) => ({ name, phone, city, state, pincode, preferredLanguage }))(input); await connectMongo(); const updated = await User.findByIdAndUpdate(user._id, allowed, { new: true, runValidators: true }); return NextResponse.json({ success: true, data: publicUser(updated) }); } catch (error) { return NextResponse.json({ success: false, error: { code: error.code || "VALIDATION_ERROR", message: error.message } }, { status: error.code === "UNAUTHORIZED" ? 401 : 400 }); } }
