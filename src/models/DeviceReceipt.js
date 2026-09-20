import mongoose from "mongoose";

const DeviceReceiptSchema = new mongoose.Schema({
  repairJobId: { type: mongoose.Schema.Types.ObjectId, ref: "RepairJob", required: true, index: true },
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Device", required: true, index: true },
  receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  receivedAt: { type: Date, default: Date.now },
  visibleCondition: String,
  accessories: [String],
  customerNotes: String,
  technicianNotes: String,
  photos: [String],
  conditionSource: { type: String, enum: ["CUSTOMER_REPORTED_CONDITION", "WORKSHOP_RECEIVED_CONDITION", "DISCREPANCY_REPORTED", "UNKNOWN"], default: "UNKNOWN" }
}, { timestamps: true });

export default mongoose.models.DeviceReceipt || mongoose.model("DeviceReceipt", DeviceReceiptSchema);
