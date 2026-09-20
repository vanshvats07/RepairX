import "dotenv/config";
import mongoose from "mongoose";

const runtimeEnvironment = (process.env.APP_ENV || process.env.NODE_ENV || "development").toLowerCase();
if (runtimeEnvironment === "production") {
  console.error("Seed data is disabled in production. Use a development or test environment only.");
  process.exit(1);
}

const [{ default: Device }, { default: DeviceComponent }, { default: RepairEvent }, { default: Workshop }, { default: WorkshopCapability }, { default: DeviceCatalog }, { demoComponents, demoDevice, demoRepairs, demoWorkshops, prototypeCatalog }] = await Promise.all([
  import("../src/models/Device.js"),
  import("../src/models/DeviceComponent.js"),
  import("../src/models/RepairEvent.js"),
  import("../src/models/Workshop.js"),
  import("../src/models/WorkshopCapability.js"),
  import("../src/models/DeviceCatalog.js"),
  import("../src/data/seed.js"),
]);

if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required to seed RepairX.");
await mongoose.connect(process.env.MONGODB_URI, {
  bufferCommands: false,
  autoIndex: true,
  serverSelectionTimeoutMS: 5000,
});

const device = await Device.findOneAndUpdate({ brand: demoDevice.brand, model: demoDevice.model }, { ...demoDevice, _id: undefined, currency: "INR" }, { upsert: true, new: true, setDefaultsOnInsert: true });
for (const catalogData of prototypeCatalog) {
  await DeviceCatalog.findOneAndUpdate(
    { brand: catalogData.brand, model: catalogData.model, modelNumber: catalogData.modelNumber },
    {
      ...catalogData,
      modelSlug: `${catalogData.brand}-${catalogData.model}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      market: "IN",
      supportedRegions: ["IN"],
      sourceType: "ADMIN_ENTERED",
      source: "REPAIRX_PROTOTYPE_SEED",
      status: "REPAIRX_VERIFIED",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
  );
}
await DeviceComponent.deleteMany({ deviceId: device._id });
await DeviceComponent.insertMany(demoComponents.map(({ id, deviceId, ...component }) => ({ ...component, deviceId: device._id })));
await RepairEvent.deleteMany({ deviceId: device._id });
await RepairEvent.insertMany(demoRepairs.map(({ id, deviceId, ...repair }) => ({ ...repair, deviceId, totalCost: repair.cost, diagnosisSource: repair.confidence === "VERIFIED" ? "TECHNICIAN_VERIFIED" : "CUSTOMER_REPORTED" })).map((repair) => ({ ...repair, deviceId: device._id })));
for (const workshopData of demoWorkshops) { const { id, specializations, ...workshop } = workshopData; const saved = await Workshop.findOneAndUpdate({ name: workshop.name }, { ...workshop, businessType: "INDEPENDENT_WORKSHOP", dataSource: "SEED", verificationStatus: "DISCOVERED" }, { upsert: true, new: true, setDefaultsOnInsert: true }); await WorkshopCapability.deleteMany({ workshopId: saved._id }); await WorkshopCapability.insertMany((specializations || []).map((name) => ({ workshopId: saved._id, name, confidence: "REPORTED", source: "Seed data" }))); }
console.log(`Seeded RepairX development data for ${device.brand} ${device.model} and ${prototypeCatalog.length} catalog models.`);
process.exit(0);
