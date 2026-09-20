import mongoose from "mongoose";
const DeviceValueSnapshotSchema = new mongoose.Schema({ deviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Device", index: true }, snapshotVersion: { type: Number, default: 1 }, estimatedValue: Number, referenceValue: Number, currency: { type: String, default: "INR" }, source: String, sources: [String], sourceCount: Number, minValue: Number, maxValue: Number, confidence: String, retrievedAt: Date }, { timestamps: true });
export default mongoose.models.DeviceValueSnapshot || mongoose.model("DeviceValueSnapshot", DeviceValueSnapshotSchema);
