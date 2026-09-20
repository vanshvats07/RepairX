import mongoose from "mongoose";

const OperationalEscalationSchema = new mongoose.Schema({
  repairRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "RepairRequest", required: true, index: true },
  reason: {
    type: String,
    enum: ["customer_dispute", "repair_delay", "technician_issue", "parts_issue", "quality_issue", "data_issue", "other"],
    required: true,
  },
  priority: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], default: "MEDIUM" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"], default: "OPEN" },
  resolvedAt: Date,
}, { timestamps: true });

export default mongoose.models.OperationalEscalation || mongoose.model("OperationalEscalation", OperationalEscalationSchema);
