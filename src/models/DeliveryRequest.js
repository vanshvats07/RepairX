import mongoose from "mongoose";

const DeliveryRequestSchema = new mongoose.Schema({
  repairJobId: { type: mongoose.Schema.Types.ObjectId, ref: "RepairJob", required: true, index: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  workshopId: { type: mongoose.Schema.Types.ObjectId, ref: "Workshop", required: true, index: true },
  addressId: { type: mongoose.Schema.Types.ObjectId, ref: "CustomerAddress" },
  mode: { type: String, enum: ["PICKUP_DELIVERY", "CUSTOMER_DROP_OFF", "CUSTOMER_PICKUP", "WORKSHOP_DELIVERY", "UNKNOWN"], default: "UNKNOWN" },
  status: { type: String, enum: ["PENDING", "SCHEDULED", "OUT_FOR_DELIVERY", "DELIVERED", "FAILED", "CANCELLED"], default: "PENDING" },
  requestedAt: { type: Date, default: Date.now },
  scheduledAt: Date,
  outForDeliveryAt: Date,
  deliveredAt: Date,
  provider: { type: String, default: "WORKSHOP_MANAGED" },
  externalReference: String,
  proofOfDelivery: String,
  preferredSlot: String
}, { timestamps: true });

export default mongoose.models.DeliveryRequest || mongoose.model("DeliveryRequest", DeliveryRequestSchema);
