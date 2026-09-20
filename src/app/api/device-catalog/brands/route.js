import { NextResponse } from "next/server";
import { getCatalogBrandList } from "@/services/deviceCatalogService";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "";
    const search = searchParams.get("search") || "";
    const data = await getCatalogBrandList({ category, search });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: "CATALOG_ERROR", message: error.message } }, { status: 500 });
  }
}
