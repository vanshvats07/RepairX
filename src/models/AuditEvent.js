import mongoose from "mongoose";
const AuditEventSchema = new mongoose.Schema({
  entityType: String,
  entityId: { type: mongoose.Schema.Types.ObjectId, index: true },
  workshopId: { type: mongoose.Schema.Types.ObjectId, ref: "Workshop", index: true },
  claimId: { type: mongoose.Schema.Types.ObjectId, ref: "WorkshopClaim", index: true },
  action: String,
  eventType: String,
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  actorRole: String,
  metadata: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });
AuditEventSchema.index({ workshopId: 1, createdAt: -1 });
export default mongoose.models.AuditEvent || mongoose.model("AuditEvent", AuditEventSchema);
