import mongoose from "mongoose";

const CaseReviewSchema = new mongoose.Schema({
  caseId: { type: String, required: true, index: true },
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: "RepairRequest", index: true },
  reviewStatus: { type: String, enum: ["REVIEW_PENDING", "REVIEWED"], default: "REVIEW_PENDING" },
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reviewedAt: Date,
  customerProblemClarity: { type: String, enum: ["HIGH", "MEDIUM", "LOW"], default: "MEDIUM" },
  evidenceQuality: { type: String, enum: ["HIGH", "MEDIUM", "LOW"], default: "MEDIUM" },
  aiUsefulness: { type: String, enum: ["HIGH", "MEDIUM", "LOW"], default: "MEDIUM" },
  technicianMatch: { type: String, enum: ["MATCHED", "DIFFERENT", "INSUFFICIENT_DATA", "NOT_COMPARABLE"], default: "NOT_COMPARABLE" },
  repairOutcome: { type: String, enum: ["SUCCESSFUL", "PARTIALLY_RESOLVED", "FAILED", "FURTHER_DIAGNOSTICS_REQUIRED", "CUSTOMER_DECLINED", "CANCELLED"], default: "SUCCESSFUL" },
  customerExperience: String,
  workshopExperience: String,
  finalObservation: String,
  notes: String,
}, { timestamps: true });

export default mongoose.models.CaseReview || mongoose.model("CaseReview", CaseReviewSchema);
