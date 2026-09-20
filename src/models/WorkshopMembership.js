import mongoose from "mongoose";
const WorkshopMembershipSchema = new mongoose.Schema({ workshopId: { type: mongoose.Schema.Types.ObjectId, ref: "Workshop", required: true, index: true }, userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true }, role: { type: String, enum: ["OWNER", "MANAGER", "TECHNICIAN"], default: "OWNER" }, status: { type: String, enum: ["PENDING", "ACTIVE", "SUSPENDED"], default: "PENDING" } }, { timestamps: true });
WorkshopMembershipSchema.index({ workshopId: 1, userId: 1 }, { unique: true });
export default mongoose.models.WorkshopMembership || mongoose.model("WorkshopMembership", WorkshopMembershipSchema);
