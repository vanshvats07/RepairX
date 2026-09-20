import mongoose from "mongoose";

const ProviderWebhookEventSchema = new mongoose.Schema({
  provider: { type: String, required: true },
  eventId: { type: String, required: true },
  eventType: String,
  receivedAt: { type: Date, default: Date.now },
  processedAt: Date,
  result: String,
  errorCategory: String
}, { timestamps: true });

ProviderWebhookEventSchema.index({ provider: 1, eventId: 1 }, { unique: true });
export default mongoose.models.ProviderWebhookEvent || mongoose.model("ProviderWebhookEvent", ProviderWebhookEventSchema);
