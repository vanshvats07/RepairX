import mongoose from "mongoose";
const WorkshopSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  legalBusinessName: String,
  businessType: { type: String, enum: ["INDEPENDENT_WORKSHOP", "AUTHORIZED_SERVICE_CENTER", "REPAIR_CHAIN", "REFURBISHER", "OTHER", "UNKNOWN"], default: "UNKNOWN" },
  externalIds: { type: Map, of: String },
  ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  address: String,
  locality: String,
  city: String,
  state: String,
  country: { type: String, default: "India" },
  pincode: String,
  phone: String,
  email: String,
  website: String,
  latitude: Number,
  longitude: Number,
  hours: mongoose.Schema.Types.Mixed,
  businessHours: mongoose.Schema.Types.Mixed,
  capabilities: [String],
  supportedBrands: [String],
  supportedDevices: [String],
  availability: { type: String, enum: ["OPEN", "CLOSED", "TEMPORARILY_UNAVAILABLE", "PAUSED", "UNKNOWN"], default: "UNKNOWN" },
  authorizationStatus: { type: String, enum: ["AUTHORIZED", "INDEPENDENT", "UNKNOWN"], default: "UNKNOWN" },
  verificationStatus: { type: String, enum: ["DISCOVERED", "CLAIMED", "CLAIM_REQUESTED", "UNDER_REVIEW", "VERIFICATION_PENDING", "VERIFIED", "SUSPENDED", "REJECTED"], default: "DISCOVERED" },
  verificationSource: { type: String, enum: ["OWNER_SUBMITTED", "ADMIN_VERIFIED", "CONTACT_VERIFIED", "DOCUMENT_VERIFIED", "UNKNOWN"], default: "UNKNOWN" },
  pilotStatus: { type: String, enum: ["INVITED", "ONBOARDING", "UNDER_REVIEW", "ACTIVE", "PILOT_ACTIVE", "PAUSED", "REMOVED"], default: "INVITED" },
  pilotCase: { type: Boolean, default: false },
  pilotSource: String,
  pilotStartedAt: Date,
  pilotCompletedAt: Date,
  source: String,
  sourceUrl: String,
  sourceRetrievedAt: Date,
  dataSource: String,
  description: String,
  lastDiscoveredAt: Date,
  firstDiscoveredAt: Date,
  serviceAreas: { localities: [String], pincodes: [String], cities: [String], radiusKm: Number, pickupAreas: [String], deliveryAreas: [String] },
  pickupCapability: { type: String, enum: ["AVAILABLE", "UNAVAILABLE", "UNKNOWN"], default: "UNKNOWN" },
  deliveryCapability: { type: String, enum: ["AVAILABLE", "UNAVAILABLE", "UNKNOWN"], default: "UNKNOWN" },
  isNetworkWorkshop: { type: Boolean, default: false }
}, { timestamps: true });
WorkshopSchema.index({ ownerUserId: 1 });
WorkshopSchema.index({ city: 1, locality: 1 });
WorkshopSchema.index({ verificationStatus: 1 });
WorkshopSchema.index({ "externalIds.placeId": 1 }, { sparse: true });
WorkshopSchema.index({ name: 1, address: 1, phone: 1 });
export default mongoose.models.Workshop || mongoose.model("Workshop", WorkshopSchema);
