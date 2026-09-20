import mongoose from "mongoose";
import { DEVICE_CATEGORIES } from "@/lib/deviceCatalogConfig";

const UserDeviceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Device", index: true },
  catalogDeviceId: { type: mongoose.Schema.Types.ObjectId, ref: "DeviceCatalog", index: true },
  category: { type: String, enum: DEVICE_CATEGORIES, default: "SMARTPHONE" },
  brand: { type: String, required: true, trim: true },
  model: { type: String, required: true, trim: true },
  modelNumber: String,
  variant: String,
  storage: String,
  purchaseDate: Date,
  purchasePrice: Number,
  serialNumber: String,
  imei: String,
  location: String,
  userLabel: String,
  status: { type: String, enum: ["ACTIVE", "ARCHIVED"], default: "ACTIVE" },
  catalogMatchStatus: { type: String, enum: ["MATCHED", "PARTIAL", "UNMATCHED"], default: "UNMATCHED" },
  catalogSource: { type: String, enum: ["MANUFACTURER", "EXTERNAL_DATABASE", "ADMIN_ENTERED", "USER_ENTERED", "DATABASE_MATCH", "OTHER"], default: "USER_ENTERED" },
  catalogSnapshot: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

UserDeviceSchema.index({ userId: 1, brand: 1, model: 1 });
UserDeviceSchema.index({ userId: 1, catalogDeviceId: 1 });

export default mongoose.models.UserDevice || mongoose.model("UserDevice", UserDeviceSchema);
