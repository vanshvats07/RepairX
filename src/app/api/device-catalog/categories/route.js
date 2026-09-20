import { NextResponse } from "next/server";
import { getDeviceCategories } from "@/services/deviceCatalogService";

export async function GET() {
  try {
    return NextResponse.json({ success: true, data: getDeviceCategories() });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: "CATALOG_ERROR", message: error.message } }, { status: 500 });
  }
}
