import mongoose from "mongoose";

const PostRepairFollowUpSchema = new mongoose.Schema({
  repairJobId: { type: mongoose.Schema.Types.ObjectId, ref: "RepairJob", required: true, index: true },
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Device", required: true },
  scheduledAt: Date,
  completedAt: Date,
  status: { type: String, enum: ["PENDING", "COMPLETED", "SKIPPED", "OPEN_FOLLOW_UP"], default: "PENDING" },
  response: { type: String, enum: ["WORKING_WELL", "ISSUE_REMAINS", "SAME_ISSUE_RETURNED", "NEW_ISSUE", "OTHER"], default: "OTHER" },
}, { timestamps: true });

export default mongoose.models.PostRepairFollowUp || mongoose.model("PostRepairFollowUp", PostRepairFollowUpSchema);
