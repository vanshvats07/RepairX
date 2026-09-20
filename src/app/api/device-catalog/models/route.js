import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import DeviceCatalog from "@/models/DeviceCatalog";
import { requireAuth, requireRole } from "@/services/authService";
import { searchCatalogModels } from "@/services/deviceCatalogService";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "";
    const brand = searchParams.get("brand") || "";
    const brandId = searchParams.get("brandId") || "";
    const search = searchParams.get("search") || "";
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "20");

    const result = await searchCatalogModels({ category, brand, brandId, search, page, limit });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: "CATALOG_ERROR", message: error.message } }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await requireAuth();
    requireRole(user, ["ADMIN"]);
    const input = await request.json();

    if (!input?.brand || !input?.model || !input?.category) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Category, brand, and model are required." } }, { status: 400 });
    }

    await connectMongo();
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ success: false, error: { code: "DATABASE_ERROR", message: "Database is not configured yet." } }, { status: 503 });
    }

    const record = await DeviceCatalog.create({
      category: input.category,
      brand: input.brand,
      model: input.model,
      modelSlug: input.modelSlug || String(input.model).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      modelNumber: input.modelNumber || "",
      variant: input.variant || "",
      variants: Array.isArray(input.variants) ? input.variants : [],
      releaseDate: input.releaseDate ? new Date(input.releaseDate) : undefined,
      releaseYear: input.releaseYear ? Number(input.releaseYear) : undefined,
      market: input.market || "IN",
      supportedRegions: Array.isArray(input.supportedRegions) ? input.supportedRegions : [],
      identifiers: Array.isArray(input.identifiers) ? input.identifiers : [],
      operatingSystem: input.operatingSystem || "",
      specifications: input.specifications || {},
      supportedParts: Array.isArray(input.supportedParts) ? input.supportedParts : [],
      images: Array.isArray(input.images) ? input.images : [],
      sourceType: input.sourceType || "ADMIN_ENTERED",
      source: input.source || "ADMIN",
      sourceUrl: input.sourceUrl || "",
      sourceUpdatedAt: input.sourceUpdatedAt ? new Date(input.sourceUpdatedAt) : new Date(),
      status: input.status || "UNVERIFIED",
    });

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: error.code || "CATALOG_ERROR", message: error.message } }, { status: error.code === "UNAUTHORIZED" ? 401 : error.code === "FORBIDDEN" ? 403 : 500 });
  }
}
