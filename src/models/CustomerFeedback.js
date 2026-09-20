import mongoose from "mongoose";
const CustomerFeedbackSchema = new mongoose.Schema({ repairJobId: { type: mongoose.Schema.Types.ObjectId, ref: "RepairJob", required: true }, rating: { type: Number, min: 1, max: 5 }, comment: String }, { timestamps: true });
export default mongoose.models.CustomerFeedback || mongoose.model("CustomerFeedback", CustomerFeedbackSchema);
