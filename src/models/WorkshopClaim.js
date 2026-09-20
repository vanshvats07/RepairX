import mongoose from "mongoose";
const WorkshopClaimSchema = new mongoose.Schema({
  workshopId: { type: mongoose.Schema.Types.ObjectId, ref: "Workshop", required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  submittedDetails: mongoose.Schema.Types.Mixed,
  relationship: String,
  businessAddressConfirmed: { type: Boolean, default: false },
  status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: Date,
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });
WorkshopClaimSchema.index({ workshopId: 1, status: 1 });
export default mongoose.models.WorkshopClaim || mongoose.model("WorkshopClaim", WorkshopClaimSchema);
