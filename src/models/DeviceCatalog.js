import mongoose from "mongoose";
import { DEVICE_CATEGORIES, DEVICE_CATALOG_SOURCE_TYPES, DEVICE_CATALOG_STATUSES } from "@/lib/deviceCatalogConfig";

const DeviceCatalogSchema = new mongoose.Schema({
  category: { type: String, enum: DEVICE_CATEGORIES, index: true },
  brand: { type: String, required: true, trim: true, index: true },
  model: { type: String, required: true, trim: true, index: true },
  modelSlug: { type: String, trim: true, lowercase: true, index: true },
  modelNumber: { type: String, trim: true, index: true },
  variant: String,
  variants: [{
    name: { type: String, trim: true },
    modelNumber: { type: String, trim: true },
    storageOptions: [String],
    ramOptions: [String],
    colorOptions: [String],
    networkOptions: [String],
    supportedRegions: [String],
  }],
  releaseDate: Date,
  releaseYear: Number,
  market: { type: String, default: "IN", index: true },
  supportedRegions: [String],
  identifiers: [String],
  operatingSystem: String,
  specifications: mongoose.Schema.Types.Mixed,
  supportedParts: [String],
  images: [String],
  sourceType: { type: String, enum: DEVICE_CATALOG_SOURCE_TYPES, default: "ADMIN_ENTERED" },
  source: String,
  sourceUrl: String,
  sourceUpdatedAt: Date,
  status: { type: String, enum: DEVICE_CATALOG_STATUSES, default: "UNVERIFIED" },
  archivedAt: Date,
}, { timestamps: true });

DeviceCatalogSchema.index({ category: 1, brand: 1, model: 1 });
DeviceCatalogSchema.index({ brand: 1, model: 1, modelNumber: 1 });
DeviceCatalogSchema.index({ category: 1, brand: 1, model: 1, variant: 1 });

export default mongoose.models.DeviceCatalog || mongoose.model("DeviceCatalog", DeviceCatalogSchema);
