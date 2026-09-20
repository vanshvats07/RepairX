import mongoose from "mongoose";
const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: { type: String, enum: ["NEW_REPAIR_REQUEST", "REQUEST_ACCEPTED", "CASE_ASSIGNED", "CASE_REASSIGNED", "QUOTE_READY", "QUOTE_APPROVED", "PICKUP_REQUESTED", "PICKUP_CONFIRMED", "DEVICE_RECEIVED", "DIAGNOSIS_VERIFIED", "REPAIR_STARTED", "QUALITY_CHECK_COMPLETED", "REPAIR_COMPLETED", "DELIVERY_STARTED", "DEVICE_DELIVERED", "POST_REPAIR_FOLLOWUP", "CUSTOMER_APPROVED", "OTHER"], required: true },
  entityType: String,
  entityId: mongoose.Schema.Types.ObjectId,
  title: String,
  message: String,
  body: String,
  read: { type: Boolean, default: false, index: true },
  readAt: Date
}, { timestamps: true });
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });
export default mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);
