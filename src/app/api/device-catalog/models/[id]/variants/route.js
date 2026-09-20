import { NextResponse } from "next/server";
import { getCatalogModelVariants } from "@/services/deviceCatalogService";

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const items = await getCatalogModelVariants(id);
    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: "CATALOG_ERROR", message: error.message } }, { status: 500 });
  }
}
