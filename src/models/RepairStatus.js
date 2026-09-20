import mongoose from "mongoose";
const RepairStatusSchema = new mongoose.Schema({ repairRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "RepairRequest", index: true }, status: String, changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, note: String }, { timestamps: true });
export default mongoose.models.RepairStatus || mongoose.model("RepairStatus", RepairStatusSchema);
