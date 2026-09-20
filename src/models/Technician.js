import mongoose from "mongoose";
const TechnicianSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  workshopId: { type: mongoose.Schema.Types.ObjectId, ref: "Workshop", required: true, index: true },
  name: { type: String, required: true, trim: true },
  phone: String,
  email: String,
  specializations: [String],
  supportedBrands: [String],
  supportedDevices: [String],
  status: { type: String, enum: ["ACTIVE", "INACTIVE", "SUSPENDED"], default: "INACTIVE" },
  inviteStatus: { type: String, enum: ["INVITED", "ACCEPTED", "EXPIRED"], default: "INVITED" }
}, { timestamps: true });
TechnicianSchema.index({ workshopId: 1, status: 1 });
export default mongoose.models.Technician || mongoose.model("Technician", TechnicianSchema);
