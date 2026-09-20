import { NextResponse } from "next/server";
import { getSessionUser, publicUser } from "@/services/authService";
export async function GET() { const user = await getSessionUser(); return NextResponse.json({ success: true, data: user ? publicUser(user) : null }); }
