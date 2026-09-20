import mongoose from "mongoose";
const PostRepairReportSchema = new mongoose.Schema({ repairJobId: { type: mongoose.Schema.Types.ObjectId, ref: "RepairJob", required: true }, deviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Device", required: true }, reportedOutcome: { type: String, enum: ["WORKING_WELL", "ISSUE_REMAINS", "NEW_ISSUE", "SAME_ISSUE_RETURNED", "OTHER"] }, description: String }, { timestamps: true });
export default mongoose.models.PostRepairReport || mongoose.model("PostRepairReport", PostRepairReportSchema);
