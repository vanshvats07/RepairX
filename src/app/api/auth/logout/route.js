import { NextResponse } from "next/server";
import { clearSession } from "@/services/authService";
export async function POST() { await clearSession(); return NextResponse.json({ success: true, data: { loggedOut: true } }); }
