import mongoose from "mongoose";

const PickupRequestSchema = new mongoose.Schema({
  repairJobId: { type: mongoose.Schema.Types.ObjectId, ref: "RepairJob", required: true, index: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  workshopId: { type: mongoose.Schema.Types.ObjectId, ref: "Workshop", required: true, index: true },
  addressId: { type: mongoose.Schema.Types.ObjectId, ref: "CustomerAddress" },
  mode: { type: String, enum: ["PICKUP_DELIVERY", "CUSTOMER_DROP_OFF", "CUSTOMER_PICKUP", "WORKSHOP_DELIVERY", "UNKNOWN"], default: "UNKNOWN" },
  status: { type: String, enum: ["REQUESTED", "SCHEDULED", "OUT_FOR_PICKUP", "PICKED_UP", "FAILED", "CANCELLED"], default: "REQUESTED" },
  requestedAt: { type: Date, default: Date.now },
  scheduledAt: Date,
  completedAt: Date,
  notes: String,
  provider: { type: String, default: "WORKSHOP_MANAGED" },
  externalReference: String,
  preferredSlot: String
}, { timestamps: true });

export default mongoose.models.PickupRequest || mongoose.model("PickupRequest", PickupRequestSchema);
