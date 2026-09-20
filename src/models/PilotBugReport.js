import mongoose from "mongoose";

const PilotBugReportSchema = new mongoose.Schema({
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  type: { type: String, enum: ["UI_ISSUE", "API_ISSUE", "DATA_ISSUE", "WORKFLOW_ISSUE", "EXTERNAL_SEARCH_ISSUE"], required: true },
  description: { type: String, required: true },
  entityType: String,
  entityId: mongoose.Schema.Types.ObjectId,
  status: { type: String, enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"], default: "OPEN" },
  resolvedAt: Date,
}, { timestamps: true });

export default mongoose.models.PilotBugReport || mongoose.model("PilotBugReport", PilotBugReportSchema);
