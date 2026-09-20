import { NextResponse } from "next/server";
import { discoverWorkshops } from "@/services/workshopDiscoveryService";

export async function GET(request) {
  const params = request.nextUrl.searchParams;
  const locality = params.get("locality")?.trim();
  if (!locality) return NextResponse.json({ error: "Locality is required." }, { status: 400 });
  const page = Math.min(Math.max(Number(params.get("page") || 0), 0), 2);
  try { return NextResponse.json(await discoverWorkshops({ locality, city: params.get("city") || "Delhi", state: params.get("state") || "Delhi", country: params.get("country") || "India", deviceBrand: params.get("deviceBrand") || "", deviceModel: params.get("deviceModel") || "", problem: params.get("problem") || "mobile repair", requiredCapabilities: params.getAll("capability"), page })); } catch { return NextResponse.json({ data: [], live: false, message: "Live workshop discovery is temporarily unavailable." }, { status: 200 }); }
}
