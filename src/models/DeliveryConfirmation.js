import mongoose from "mongoose";

const DeliveryConfirmationSchema = new mongoose.Schema({
  deliveryRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "DeliveryRequest", required: true, index: true },
  receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  deliveredAt: { type: Date, default: Date.now },
  proof: String,
  notes: String
}, { timestamps: true });

export default mongoose.models.DeliveryConfirmation || mongoose.model("DeliveryConfirmation", DeliveryConfirmationSchema);
