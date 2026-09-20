import mongoose from "mongoose";
const RepairLogSchema = new mongoose.Schema({ repairJobId: { type: mongoose.Schema.Types.ObjectId, ref: "RepairJob", required: true, index: true }, eventType: { type: String, required: true }, description: String, technicianId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, metadata: mongoose.Schema.Types.Mixed }, { timestamps: true });
export default mongoose.models.RepairLog || mongoose.model("RepairLog", RepairLogSchema);
