import mongoose from "mongoose";

const ProductLearningSchema = new mongoose.Schema({
  sourceCaseIds: [{ type: String, index: true }],
  category: { type: String, enum: ["AI", "SEARCH", "UX", "WORKSHOP", "TECHNICIAN", "PARTS", "REPAIR_FLOW", "DATA_MODEL", "OPERATIONS", "OTHER"], required: true },
  observation: { type: String, required: true },
  evidence: [String],
  impact: String,
  status: { type: String, enum: ["OBSERVED", "INVESTIGATING", "ACTION_REQUIRED", "IMPLEMENTED", "DISMISSED"], default: "OBSERVED" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  resolution: String,
  resolvedAt: Date,
}, { timestamps: true });

export default mongoose.models.ProductLearning || mongoose.model("ProductLearning", ProductLearningSchema);
