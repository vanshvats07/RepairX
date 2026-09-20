import mongoose from "mongoose";
const WorkshopCapabilitySchema = new mongoose.Schema({ workshopId: { type: mongoose.Schema.Types.ObjectId, ref: "Workshop", required: true, index: true }, name: { type: String, required: true }, category: String, confidence: String, source: String }, { timestamps: true });
export default mongoose.models.WorkshopCapability || mongoose.model("WorkshopCapability", WorkshopCapabilitySchema);
