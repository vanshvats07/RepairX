import mongoose from "mongoose";
const PartSchema = new mongoose.Schema({ name: String, deviceCompatibility: [String], component: String, partType: { type: String, default: "UNKNOWN" } }, { timestamps: true });
export default mongoose.models.Part || mongoose.model("Part", PartSchema);
