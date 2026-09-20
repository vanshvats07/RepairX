import mongoose from "mongoose";

const OperationalAlertSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      "WORKSHOP_VERIFICATION",
      "REPAIR_DELAY",
      "QUALITY_ISSUE",
      "DATA_QUALITY",
      "DISPUTE",
      "EXTERNAL_DATA_STALE",
      "EXTERNAL_API_FAILURE",
    ],
    required: true,
  },
  severity: {
    type: String,
    enum: ["INFO", "ATTENTION", "CRITICAL"],
    default: "INFO",
  },
  entityType: String,
  entityId: mongoose.Schema.Types.ObjectId,
  message: { type: String, required: true },
  status: { type: String, enum: ["OPEN", "RESOLVED"], default: "OPEN" },
  createdAt: { type: Date, default: Date.now },
  resolvedAt: Date,
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

export default mongoose.models.OperationalAlert || mongoose.model("OperationalAlert", OperationalAlertSchema);
