import mongoose from "mongoose";
const EvidenceSchema = new mongoose.Schema({ investigationId: { type: mongoose.Schema.Types.ObjectId, ref: "Investigation", index: true }, category: String, source: String, sourceType: { type: String, enum: ["LIVE", "PROTOTYPE", "VERIFIED", "REPORTED", "UNKNOWN"], default: "UNKNOWN" }, title: String, url: String, snippet: String, insight: String, whyItMatters: String, relevance: Number, retrievedAt: Date }, { timestamps: true });
export default mongoose.models.Evidence || mongoose.model("Evidence", EvidenceSchema);
