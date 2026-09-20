import { NextResponse } from "next/server";
import { searchCatalogModels } from "@/services/deviceCatalogService";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || searchParams.get("search") || "";
    const result = await searchCatalogModels({ category: searchParams.get("category") || "", brand: searchParams.get("brand") || "", search: q, page: 1, limit: Number(searchParams.get("limit") || "20") });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: "CATALOG_ERROR", message: error.message } }, { status: 500 });
  }
}
