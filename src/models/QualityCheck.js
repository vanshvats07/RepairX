import mongoose from "mongoose";
const QualityCheckSchema = new mongoose.Schema({ repairJobId: { type: mongoose.Schema.Types.ObjectId, ref: "RepairJob", required: true, index: true }, performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, checks: [{ name: String, result: { type: String, enum: ["PASS", "FAIL", "NOT_TESTED", "NOT_APPLICABLE"] }, note: String, required: Boolean }], notes: String, passed: Boolean, failedChecks: [String], completedAt: Date }, { timestamps: true });
export default mongoose.models.QualityCheck || mongoose.model("QualityCheck", QualityCheckSchema);
