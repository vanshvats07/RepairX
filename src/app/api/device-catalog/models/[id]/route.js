import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import DeviceCatalog from "@/models/DeviceCatalog";
import { requireAuth, requireRole } from "@/services/authService";
import { getCatalogModelById } from "@/services/deviceCatalogService";

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const item = await getCatalogModelById(id);
    if (!item) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Device catalog model was not found." } }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: "CATALOG_ERROR", message: error.message } }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const user = await requireAuth();
    requireRole(user, ["ADMIN"]);
    const { id } = await params;
    const input = await request.json();
    const allowed = ["category", "brand", "model", "modelSlug", "modelNumber", "variant", "variants", "releaseDate", "releaseYear", "market", "supportedRegions", "identifiers", "operatingSystem", "specifications", "supportedParts", "images", "sourceType", "source", "sourceUrl", "sourceUpdatedAt", "status", "archivedAt"];
    const update = Object.fromEntries(allowed.filter((field) => input[field] !== undefined).map((field) => [field, input[field]]));
    if (update.releaseDate) update.releaseDate = new Date(update.releaseDate);
    if (update.sourceUpdatedAt) update.sourceUpdatedAt = new Date(update.sourceUpdatedAt);
    if (update.status === "ARCHIVED" && !update.archivedAt) update.archivedAt = new Date();
    await connectMongo();
    if (!process.env.MONGODB_URI) return NextResponse.json({ success: false, error: { code: "DATABASE_ERROR", message: "Database is not configured yet." } }, { status: 503 });
    const record = await DeviceCatalog.findByIdAndUpdate(id, update, { new: true, runValidators: true }).lean();
    if (!record) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Device catalog model was not found." } }, { status: 404 });
    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: error.code || "CATALOG_ERROR", message: error.message } }, { status: error.code === "UNAUTHORIZED" ? 401 : error.code === "FORBIDDEN" ? 403 : 500 });
  }
}
