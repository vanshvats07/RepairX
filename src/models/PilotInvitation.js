import mongoose from "mongoose";

const PilotInvitationSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: String,
  role: { type: String, enum: ["CUSTOMER", "WORKSHOP_OWNER", "TECHNICIAN"], required: true },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["INVITED", "ACCEPTED", "EXPIRED", "REVOKED"], default: "INVITED" },
  expiresAt: Date,
}, { timestamps: true });

PilotInvitationSchema.index({ email: 1, role: 1 }, { unique: false });

export default mongoose.models.PilotInvitation || mongoose.model("PilotInvitation", PilotInvitationSchema);
