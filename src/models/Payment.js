import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({
  repairRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "RepairRequest", required: true, index: true },
  quoteId: { type: mongoose.Schema.Types.ObjectId, ref: "Quote", required: true, index: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  paymentId: { type: String, required: true, unique: true, index: true },
  idempotencyKey: { type: String, required: true, unique: true, index: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: "INR" },
  status: { type: String, enum: ["NOT_REQUIRED", "PENDING", "AUTHORIZED", "PAID", "PARTIALLY_PAID", "FAILED", "REFUNDED", "CANCELLED"], default: "PENDING" },
  provider: { type: String, default: "UNCONFIGURED" },
  providerReference: String,
  failureReason: String,
  completedAt: Date,
  refundedAmount: { type: Number, min: 0, default: 0 },
  refundStatus: { type: String, enum: ["NONE", "REFUND_REQUESTED", "REFUND_PROCESSING", "REFUNDED", "REFUND_FAILED"], default: "NONE" }
}, { timestamps: true });

export default mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);
