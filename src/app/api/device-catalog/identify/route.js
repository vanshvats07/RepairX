import { NextResponse } from "next/server";
import { identifyDevice, identifyDeviceFromImage } from "@/services/deviceCatalogService";

export async function POST(request) {
  try {
    const input = await request.json();
    const result = input?.image ? await identifyDeviceFromImage({ image: input.image }) : await identifyDevice(input || {});
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: "CATALOG_ERROR", message: error.message } }, { status: 500 });
  }
}
