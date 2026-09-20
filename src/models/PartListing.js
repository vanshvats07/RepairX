import mongoose from "mongoose";
const PartListingSchema = new mongoose.Schema({ partId: { type: mongoose.Schema.Types.ObjectId, ref: "Part", index: true }, supplier: String, price: Number, currency: { type: String, default: "INR" }, availability: String, warranty: String, condition: String, source: String, sourceUrl: String, lastCheckedAt: Date }, { timestamps: true });
export default mongoose.models.PartListing || mongoose.model("PartListing", PartListingSchema);
