import mongoose from "mongoose";

const ImprovementTaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  sourceLearningId: { type: mongoose.Schema.Types.ObjectId, ref: "ProductLearning", index: true },
  description: { type: String, required: true },
  priority: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], default: "MEDIUM" },
  owner: String,
  status: { type: String, enum: ["OPEN", "IN_PROGRESS", "VALIDATING", "COMPLETED", "CANCELLED"], default: "OPEN" },
  createdAt: { type: Date, default: Date.now },
  completedAt: Date,
}, { timestamps: true });

export default mongoose.models.ImprovementTask || mongoose.model("ImprovementTask", ImprovementTaskSchema);
