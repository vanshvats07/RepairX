import mongoose from "mongoose";

const DisputeSchema = new mongoose.Schema({
  repairJobId: { type: mongoose.Schema.Types.ObjectId, ref: "RepairJob", index: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  workshopId: { type: mongoose.Schema.Types.ObjectId, ref: "Workshop", index: true },
  technicianId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  type: {
    type: String,
    enum: [
      "PRICE_DISPUTE",
      "REPAIR_OUTCOME",
      "DEVICE_CONDITION",
      "PICKUP_ISSUE",
      "DELIVERY_ISSUE",
      "WARRANTY",
      "PART_ISSUE",
      "OTHER",
    ],
    default: "OTHER"
  },
  description: String,
  status: {
    type: String,
    enum: ["OPEN", "UNDER_REVIEW", "WAITING_FOR_INFORMATION", "RESOLVED", "REJECTED"],
    default: "OPEN"
  },
  reportedBy: { type: String, default: "CUSTOMER" },
  evidence: mongoose.Schema.Types.Mixed,
  resolution: String,
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
  resolvedAt: Date,
}, { timestamps: true });

export default mongoose.models.Dispute || mongoose.model("Dispute", DisputeSchema);
