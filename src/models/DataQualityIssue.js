import mongoose from "mongoose";

const DataQualityIssueSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      "MISSING_WORKSHOP_PHONE",
      "MISSING_WORKSHOP_LOCATION",
      "UNKNOWN_AUTHORIZATION",
      "PART_WITHOUT_SOURCE",
      "PART_WITHOUT_COMPATIBILITY",
      "REPAIR_WITHOUT_OUTCOME",
      "QUOTE_WITHOUT_REPAIR",
      "DEVICE_COMPONENT_NO_CONFIDENCE",
      "DUPLICATE_WORKSHOP_CANDIDATE",
      "BROKEN_EXTERNAL_SOURCE_URL",
      "STALE_EXTERNAL_DATA",
    ],
    required: true,
  },
  entityType: String,
  entityId: mongoose.Schema.Types.ObjectId,
  severity: { type: String, enum: ["INFO", "ATTENTION", "CRITICAL"], default: "ATTENTION" },
  title: String,
  details: String,
  status: { type: String, enum: ["OPEN", "RESOLVED", "DISMISSED"], default: "OPEN" },
  createdAt: { type: Date, default: Date.now },
  resolvedAt: Date,
}, { timestamps: true });

export default mongoose.models.DataQualityIssue || mongoose.model("DataQualityIssue", DataQualityIssueSchema);
