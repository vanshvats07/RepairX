import mongoose from "mongoose";

const CustomerAddressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  label: { type: String, default: "Home" },
  name: String,
  phone: String,
  addressLine1: { type: String, required: true },
  addressLine2: String,
  locality: String,
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  landmark: String,
  isDefault: { type: Boolean, default: false }
}, { timestamps: true });

CustomerAddressSchema.index({ userId: 1, isDefault: 1 });

export default mongoose.models.CustomerAddress || mongoose.model("CustomerAddress", CustomerAddressSchema);
