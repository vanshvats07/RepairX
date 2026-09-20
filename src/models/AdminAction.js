import mongoose from "mongoose";

const AdminActionSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  action: { type: String, required: true },
  entityType: String,
  entityId: mongoose.Schema.Types.ObjectId,
  reason: String,
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.models.AdminAction || mongoose.model("AdminAction", AdminActionSchema);
