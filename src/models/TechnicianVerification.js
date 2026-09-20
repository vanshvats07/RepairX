import mongoose from "mongoose";
const TechnicianVerificationSchema = new mongoose.Schema({ investigationId: { type: mongoose.Schema.Types.ObjectId, ref: "Investigation", index: true }, technicianId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, action: { type: String, enum: ["CONFIRM", "RULE_OUT", "NEEDS_FURTHER_TESTING"] }, finalDiagnosis: String, notes: String, component: String, recommendedRepair: String, estimatedCost: Number }, { timestamps: true });
export default mongoose.models.TechnicianVerification || mongoose.model("TechnicianVerification", TechnicianVerificationSchema);
