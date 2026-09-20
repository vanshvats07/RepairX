import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Device from "@/models/Device";
import DeviceComponent from "@/models/DeviceComponent";
import UserDevice from "@/models/UserDevice";
import { identifyDevice } from "@/services/deviceCatalogService";
import { requireAuth } from "@/services/authService";

export async function GET() {
  try { const user = await requireAuth(); await connectMongo(); if (!process.env.MONGODB_URI) return NextResponse.json({ success: true, data: [], source: "empty" }); const data = await Device.find({ userId: user._id }).sort({ createdAt: -1 }).lean(); return NextResponse.json({ success: true, data, source: "mongodb" }); } catch (error) { return NextResponse.json({ success: false, error: { code: error.code || "DATABASE_ERROR", message: error.message } }, { status: error.code === "UNAUTHORIZED" ? 401 : 500 }); }
}

export async function POST(request) {
  try {
    const user = await requireAuth();
    const input = await request.json();
    if (!input.brand || !input.model) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Brand and model are required." } }, { status: 400 });
    }

    await connectMongo();
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ success: false, error: { code: "DATABASE_ERROR", message: "Database is not configured yet." } }, { status: 503 });
    }

    const match = await identifyDevice({
      brand: input.brand,
      model: input.model,
      variant: input.variant,
      modelNumber: input.modelNumber,
      image: input.image,
    });

    const device = await Device.create({
      ...input,
      userId: user._id,
      category: input.category || match?.catalogMatch?.category || "SMARTPHONE",
      currency: "INR",
    });

    const userDevice = await UserDevice.create({
      userId: user._id,
      deviceId: device._id,
      catalogDeviceId: match?.catalogMatch?._id || null,
      category: input.category || match?.catalogMatch?.category || "SMARTPHONE",
      brand: input.brand,
      model: input.model,
      modelNumber: input.modelNumber || "",
      variant: input.variant || "",
      storage: input.storage || "",
      purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : undefined,
      purchasePrice: input.purchasePrice,
      serialNumber: input.serialNumber || "",
      imei: input.imei || "",
      location: input.location || "",
      userLabel: input.userLabel || "",
      catalogMatchStatus: match?.catalogMatch ? "MATCHED" : "UNMATCHED",
      catalogSource: match?.catalogMatch ? "DATABASE_MATCH" : "USER_ENTERED",
      catalogSnapshot: match?.catalogMatch || null,
    });

    if (Array.isArray(input.components)) {
      await DeviceComponent.insertMany(input.components.map((component) => ({ ...component, deviceId: device._id })));
    }

    return NextResponse.json({ success: true, data: { ...device.toObject(), userDevice: userDevice.toObject(), catalogMatch: match } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: error.code || "DATABASE_ERROR", message: error.message } }, { status: error.code === "UNAUTHORIZED" ? 401 : 500 });
  }
}
