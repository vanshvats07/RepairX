import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Device from "@/models/Device";
import RepairEvent from "@/models/RepairEvent";
import Quote from "@/models/Quote";
import { calculateRecoveryScenarios } from "@/services/recoveryService";
import { requireAuth } from "@/services/authService";
import { getOwnedDevice } from "@/services/deviceAccessService";

export async function GET(_request, { params }) {
  try {
    const user = await requireAuth();
    const { deviceId } = await params;
    await connectMongo();
    if (!process.env.MONGODB_URI) return NextResponse.json({ data: null, message: "No recovery data is available yet." });
    const device = await getOwnedDevice(deviceId, user);
    if (!device) return NextResponse.json({ data: null }, { status: 404 });
    const [repairs, quote] = await Promise.all([RepairEvent.find({ deviceId }).sort({ createdAt: -1 }).lean(), Quote.findOne({ deviceId }).sort({ createdAt: -1 }).lean()]);
    const previousRepairSpend = repairs.reduce((total, repair) => total + (Number(repair.totalCost) || 0), 0);
    const repairCost = quote?.total || null;
    if (!device.currentEstimatedValue || !repairCost) return NextResponse.json({ data: null, message: "Insufficient repair or market evidence for recovery scenarios." });
    return NextResponse.json({ data: calculateRecoveryScenarios({ currentDeviceValue: device.currentEstimatedValue, repairCost, previousRepairSpend, recentRepairFrequency: repairs.length > 2 ? "HIGH" : repairs.length ? "MEDIUM" : "LOW", repeatIssue: false, estimatedPostRepairValue: device.currentEstimatedValue }) });
  } catch (error) { return NextResponse.json({ data: null, message: error.message || "Recovery analysis is temporarily unavailable." }, { status: error.code === "UNAUTHORIZED" ? 401 : 500 }); }
}
