import mongoose from "mongoose";
const DeviceSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }, catalogDeviceId: { type: mongoose.Schema.Types.ObjectId, ref: "DeviceCatalog", index: true }, brand: { type: String, required: true }, model: { type: String, required: true }, variant: String, serialNumber: String, imei: String, purchaseDate: Date, purchasePrice: Number, currentEstimatedValue: Number, currency: { type: String, default: "INR" }, location: String, status: { type: String, default: "NEEDS_ATTENTION" } }, { timestamps: true });
DeviceSchema.index({ userId: 1, createdAt: -1 });
export default mongoose.models.Device || mongoose.model("Device", DeviceSchema);
