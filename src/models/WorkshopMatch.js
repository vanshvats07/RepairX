import mongoose from "mongoose";

const WorkshopMatchSchema = new mongoose.Schema({
  repairRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "RepairRequest", required: true, index: true },
  candidateWorkshopId: { type: mongoose.Schema.Types.ObjectId, ref: "Workshop", required: true, index: true },
  eligibility: { type: String, enum: ["ELIGIBLE", "INELIGIBLE", "UNCERTAIN"], required: true },
  matchReasons: [String],
  limitations: [String],
  capabilityMatch: { type: String, enum: ["MATCHED", "NOT_MATCHED", "UNKNOWN"] },
  locationMatch: { type: String, enum: ["MATCHED", "NOT_MATCHED", "UNKNOWN"] },
  serviceMatch: { type: String, enum: ["MATCHED", "NOT_MATCHED", "UNKNOWN"] },
  availabilityState: { type: String, enum: ["AVAILABLE", "UNAVAILABLE", "UNKNOWN"] },
  selected: { type: Boolean, default: false },
  selectedAt: Date,
  selectionMode: String,
  rejectionReason: String
}, { timestamps: true });

WorkshopMatchSchema.index({ repairRequestId: 1, candidateWorkshopId: 1 }, { unique: true });
export default mongoose.models.WorkshopMatch || mongoose.model("WorkshopMatch", WorkshopMatchSchema);
