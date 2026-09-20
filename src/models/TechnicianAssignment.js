import mongoose from "mongoose";
const TechnicianAssignmentSchema = new mongoose.Schema({
  repairRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "RepairRequest", required: true, index: true },
  workshopId: { type: mongoose.Schema.Types.ObjectId, ref: "Workshop", required: true, index: true },
  technicianId: { type: mongoose.Schema.Types.ObjectId, ref: "Technician", required: true, index: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["ASSIGNED", "ACCEPTED", "DECLINED", "REASSIGNED", "COMPLETED"], default: "ASSIGNED" },
  assignedAt: { type: Date, default: Date.now }
}, { timestamps: true });
TechnicianAssignmentSchema.index({ technicianId: 1, repairRequestId: 1 }, { unique: false });
TechnicianAssignmentSchema.index({ technicianId: 1, status: 1 });
export default mongoose.models.TechnicianAssignment || mongoose.model("TechnicianAssignment", TechnicianAssignmentSchema);
