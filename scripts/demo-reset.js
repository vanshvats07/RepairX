import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import User from "../src/models/User.js";
import Device from "../src/models/Device.js";
import DeviceCatalog from "../src/models/DeviceCatalog.js";
import RepairRequest from "../src/models/RepairRequest.js";
import Workshop from "../src/models/Workshop.js";
import WorkshopMembership from "../src/models/WorkshopMembership.js";
import Technician from "../src/models/Technician.js";
import Investigation from "../src/models/Investigation.js";
import DiagnosticCheck from "../src/models/DiagnosticCheck.js";
import RepairStatus from "../src/models/RepairStatus.js";
import Quote from "../src/models/Quote.js";
import RepairJob from "../src/models/RepairJob.js";
import RepairEvent from "../src/models/RepairEvent.js";
import Part from "../src/models/Part.js";
import SelectedPart from "../src/models/SelectedPart.js";

const DEMO_DB_NAME = "repairx_demo";
const DEFAULT_DEMO_PASSWORD = process.env.DEMO_PASSWORD || "RepairX@12345";

const ensureDemoGuard = (mongoUri) => {
  const url = new URL(mongoUri);
  if (process.env.APP_ENV === "production" || process.env.NODE_ENV === "production") {
    throw new Error("Demo reset is disabled in production.");
  }
  if (!url.pathname || url.pathname === "/" || !url.pathname.endsWith(`/${DEMO_DB_NAME}`)) {
    throw new Error(`Demo reset only supports the dedicated database '${DEMO_DB_NAME}'. Configure MONGODB_URI to use mongodb://127.0.0.1:27017/${DEMO_DB_NAME}.`);
  }
};

const buildMongoUri = () => process.env.MONGODB_URI || `mongodb://127.0.0.1:27017/${DEMO_DB_NAME}`;

const secureDemoPassword = async () => bcrypt.hash(DEFAULT_DEMO_PASSWORD, 12);

export async function resetDemoDatabase() {
  dotenv.config({ path: process.env.DOTENV_CONFIG_PATH || ".env.local" });

  const runtimeEnvironment = String(process.env.APP_ENV || process.env.NODE_ENV || "development").toLowerCase();
  if (runtimeEnvironment === "production") {
    throw new Error("Demo reset is disabled in production.");
  }

  const mongoUri = buildMongoUri();
  ensureDemoGuard(mongoUri);

  await mongoose.connect(mongoUri, {
    bufferCommands: false,
    autoIndex: true,
    serverSelectionTimeoutMS: 5000,
  });

  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB connection is not ready.");
  await db.dropDatabase();

  const demoPasswordHash = await secureDemoPassword();

  const customer = await User.findOneAndUpdate(
    { email: "customer@repairx.local" },
    {
      name: "RepairX Demo Customer",
      email: "customer@repairx.local",
      phone: "9000000001",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
      location: "Bengaluru, Karnataka",
      passwordHash: demoPasswordHash,
      role: "CUSTOMER",
      pilotStatus: "ACTIVE",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
  );

  const workshopOwner = await User.findOneAndUpdate(
    { email: "workshop@repairx.local" },
    {
      name: "RepairX Demo Workshop Owner",
      email: "workshop@repairx.local",
      phone: "9000000002",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
      location: "Bengaluru, Karnataka",
      passwordHash: demoPasswordHash,
      role: "WORKSHOP_OWNER",
      pilotStatus: "ACTIVE",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
  );

  const technicianUser = await User.findOneAndUpdate(
    { email: "technician@repairx.local" },
    {
      name: "RepairX Demo Technician",
      email: "technician@repairx.local",
      phone: "9000000003",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
      location: "Bengaluru, Karnataka",
      passwordHash: demoPasswordHash,
      role: "TECHNICIAN",
      pilotStatus: "ACTIVE",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
  );

  const admin = await User.findOneAndUpdate(
    { email: "admin@repairx.local" },
    {
      name: "RepairX Demo Admin",
      email: "admin@repairx.local",
      phone: "9000000004",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
      location: "Bengaluru, Karnataka",
      passwordHash: demoPasswordHash,
      role: "ADMIN",
      pilotStatus: "ACTIVE",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
  );

  const workshop = await Workshop.findOneAndUpdate(
    { name: "Workshop A" },
    {
      name: "Workshop A",
      legalBusinessName: "Workshop A Demo",
      ownerUserId: workshopOwner._id,
      businessType: "INDEPENDENT_WORKSHOP",
      locality: "Koramangala",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
      phone: "9000000100",
      email: "workshop@repairx.local",
      availability: "OPEN",
      authorizationStatus: "INDEPENDENT",
      verificationStatus: "VERIFIED",
      verificationSource: "ADMIN_VERIFIED",
      pilotStatus: "PILOT_ACTIVE",
      isNetworkWorkshop: true,
      supportedBrands: ["Apple", "Samsung"],
      supportedDevices: ["iPhone 15", "Galaxy S24"],
      capabilities: ["battery", "display", "charging"],
      serviceAreas: { cities: ["Bengaluru"], localities: ["Koramangala"], pincodes: ["560001"] },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
  );

  await WorkshopMembership.findOneAndUpdate(
    { workshopId: workshop._id, userId: workshopOwner._id },
    { workshopId: workshop._id, userId: workshopOwner._id, role: "OWNER", status: "ACTIVE" },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  const technicianRecord = await Technician.findOneAndUpdate(
    { workshopId: workshop._id, userId: technicianUser._id },
    {
      workshopId: workshop._id,
      userId: technicianUser._id,
      name: "RepairX Demo Technician",
      email: technicianUser.email,
      phone: technicianUser.phone,
      status: "ACTIVE",
      inviteStatus: "ACCEPTED",
      specializations: ["battery", "display"],
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
  );

  await WorkshopMembership.findOneAndUpdate(
    { workshopId: workshop._id, userId: technicianUser._id },
    { workshopId: workshop._id, userId: technicianUser._id, role: "TECHNICIAN", status: "ACTIVE" },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  const catalogA = await DeviceCatalog.findOneAndUpdate(
    { brand: "Apple", model: "iPhone 15", modelNumber: "A3094" },
    {
      category: "SMARTPHONE",
      brand: "Apple",
      model: "iPhone 15",
      modelSlug: "iphone-15",
      modelNumber: "A3094",
      variant: "Standard",
      market: "IN",
      status: "REPAIRX_VERIFIED",
      sourceType: "ADMIN_ENTERED",
      supportedRegions: ["IN"],
      identifiers: ["A3094", "iphone-15"],
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
  );

  const catalogB = await DeviceCatalog.findOneAndUpdate(
    { brand: "Samsung", model: "Galaxy S24", modelNumber: "SM-S921B" },
    {
      category: "SMARTPHONE",
      brand: "Samsung",
      model: "Galaxy S24",
      modelSlug: "galaxy-s24",
      modelNumber: "SM-S921B",
      variant: "Standard",
      market: "IN",
      status: "REPAIRX_VERIFIED",
      sourceType: "ADMIN_ENTERED",
      supportedRegions: ["IN"],
      identifiers: ["SM-S921B", "galaxy-s24"],
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
  );

  const deviceA = await Device.findOneAndUpdate(
    { userId: customer._id, serialNumber: "DEMO-IPHONE-15-A" },
    {
      userId: customer._id,
      catalogDeviceId: catalogA._id,
      brand: "Apple",
      model: "iPhone 15",
      variant: "Standard",
      serialNumber: "DEMO-IPHONE-15-A",
      imei: "356710040000001",
      purchaseDate: new Date("2024-04-15"),
      purchasePrice: 79999,
      currentEstimatedValue: 62000,
      currency: "INR",
      location: "Bengaluru",
      status: "NEEDS_ATTENTION",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
  );

  const deviceB = await Device.findOneAndUpdate(
    { userId: customer._id, serialNumber: "DEMO-S24-B" },
    {
      userId: customer._id,
      catalogDeviceId: catalogB._id,
      brand: "Samsung",
      model: "Galaxy S24",
      variant: "Standard",
      serialNumber: "DEMO-S24-B",
      imei: "356720040000002",
      purchaseDate: new Date("2024-02-10"),
      purchasePrice: 69999,
      currentEstimatedValue: 58000,
      currency: "INR",
      location: "Bengaluru",
      status: "WORKING",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
  );

  await RepairEvent.create({
    deviceId: deviceA._id,
    workshopId: workshop._id,
    technicianId: technicianUser._id,
    reportedProblem: "Battery health dropped after a fall",
    diagnosis: "Battery replacement completed",
    diagnosisSource: "TECHNICIAN_VERIFIED",
    component: "Battery",
    part: "Battery assembly",
    partType: "BATTERY",
    status: "COMPLETED",
    outcome: "Battery replaced",
    confidence: "VERIFIED",
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120),
  });

  const part = await Part.findOneAndUpdate(
    { name: "iPhone 15 battery assembly" },
    { name: "iPhone 15 battery assembly", component: "Battery", deviceCompatibility: ["iPhone 15"], partType: "BATTERY" },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
  );

  const repairedCase = await RepairRequest.findOneAndUpdate(
    { caseId: "DEMO-CASE-0001" },
    {
      caseId: "DEMO-CASE-0001",
      deviceId: deviceA._id,
      workshopId: workshop._id,
      customerId: customer._id,
      technicianId: technicianUser._id,
      complaint: "Phone reboots and battery drains rapidly after impact.",
      preliminaryAssessment: "Likely battery degradation and charging circuit instability after drop.",
      requiredCapabilities: ["battery", "display", "charging"],
      pilotCase: true,
      pilotSource: "PRIVATE_PILOT",
      status: "DIAGNOSIS_VERIFIED",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
  );

  await RepairStatus.create({ repairRequestId: repairedCase._id, status: "REQUESTED", note: "Customer reported rapid battery drain after impact." });
  await RepairStatus.create({ repairRequestId: repairedCase._id, status: "AWAITING_TECHNICIAN", note: "Workshop assigned and ready for diagnosis." });
  await RepairStatus.create({ repairRequestId: repairedCase._id, status: "DIAGNOSIS_VERIFIED", note: "Technician confirmed battery and charging circuit issue." });

  const investigation = await Investigation.findOneAndUpdate(
    { repairRequestId: repairedCase._id },
    {
      deviceId: deviceA._id,
      userId: customer._id,
      repairRequestId: repairedCase._id,
      complaint: "Phone reboots and battery drains rapidly after impact.",
      possibleCauses: ["Battery degradation", "Charging circuit issue"],
      recommendedChecks: ["Battery health check", "Charging port inspection"],
      affectedComponents: ["Battery", "Charging IC"],
      aiPreliminaryAssessment: "Possible battery wear and charging instability following impact.",
      technicianDiagnosis: "Battery assembly is degraded and needs replacement; charging circuit inspection passed.",
      assessmentType: "PRELIMINARY_ASSESSMENT",
      assessmentState: "INFERRED",
      aiConfidence: "HIGH",
      pilotCase: true,
      status: "REQUESTED",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
  );

  await DiagnosticCheck.findOneAndUpdate(
    { repairRequestId: repairedCase._id, name: "Battery health" },
    {
      repairRequestId: repairedCase._id,
      technicianId: technicianUser._id,
      name: "Battery health",
      result: "FAIL",
      notes: "Battery cycle count suggests degraded cell performance and rapid discharge after impact.",
      checkedAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
  );

  await DiagnosticCheck.findOneAndUpdate(
    { repairRequestId: repairedCase._id, name: "Charging port" },
    {
      repairRequestId: repairedCase._id,
      technicianId: technicianUser._id,
      name: "Charging port",
      result: "PASS",
      notes: "Charging port is intact and not causing the issue.",
      checkedAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
  );

  const quote = await Quote.findOneAndUpdate(
    { repairRequestId: repairedCase._id, version: 1 },
    {
      repairRequestId: repairedCase._id,
      version: 1,
      deviceId: deviceA._id,
      investigationId: investigation._id,
      workshopId: workshop._id,
      technicianId: technicianUser._id,
      partId: part._id,
      partCost: 4800,
      labourCost: 2600,
      inspectionCost: 500,
      total: 7900,
      currency: "INR",
      source: "TECHNICIAN_VERIFIED",
      status: "APPROVED",
      decisionReason: "Battery replacement required after diagnosed failure.",
      decidedBy: workshopOwner._id,
      decidedAt: new Date(),
      validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
  );

  const selectedPart = await SelectedPart.findOneAndUpdate(
    { repairRequestId: repairedCase._id, deviceId: deviceA._id },
    {
      repairRequestId: repairedCase._id,
      deviceId: deviceA._id,
      workshopId: workshop._id,
      technicianId: technicianUser._id,
      partId: part._id,
      name: part.name,
      price: 4800,
      partType: part.partType,
      source: "WORKSHOP_ASSIGNED",
      compatibility: "iPhone 15",
      selectedAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
  );

  const repairJob = await RepairJob.findOneAndUpdate(
    { repairRequestId: repairedCase._id },
    {
      caseId: "DEMO-JOB-0001",
      repairRequestId: repairedCase._id,
      deviceId: deviceA._id,
      workshopId: workshop._id,
      technicianId: technicianUser._id,
      quoteId: quote._id,
      selectedPartId: selectedPart._id,
      status: "QUALITY_CHECK",
      pilotCase: true,
      pilotSource: "PRIVATE_PILOT",
      technicianNotes: "Battery replaced and charging checks passed. Awaiting quality verification.",
      repairOutcome: "Battery replaced after rapid discharge diagnosis.",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
  );

  await RepairEvent.create({
    deviceId: deviceA._id,
    repairJobId: repairJob._id,
    investigationId: investigation._id,
    workshopId: workshop._id,
    technicianId: technicianUser._id,
    reportedProblem: repairedCase.complaint,
    diagnosis: "Battery assembly replaced after verified diagnosis.",
    diagnosisSource: "TECHNICIAN_VERIFIED",
    component: "Battery",
    part: part.name,
    partType: part.partType,
    totalCost: quote.total,
    workshopId: workshop._id,
    status: "QUALITY_CHECK",
    outcome: "Awaiting final verification",
    confidence: "VERIFIED",
    completedAt: new Date(),
  });

  await User.updateOne({ _id: admin._id }, { $set: { lastLoginAt: new Date() } });

  console.log(JSON.stringify({
    database: DEMO_DB_NAME,
    customer: { email: customer.email, role: customer.role },
    workshopOwner: { email: workshopOwner.email, role: workshopOwner.role },
    technician: { email: technicianUser.email, role: technicianUser.role },
    admin: { email: admin.email, role: admin.role },
    workshop: { id: String(workshop._id), name: workshop.name },
    deviceA: { id: String(deviceA._id), serialNumber: deviceA.serialNumber },
    deviceB: { id: String(deviceB._id), serialNumber: deviceB.serialNumber },
    repairRequest: { id: String(repairedCase._id), caseId: repairedCase.caseId },
    technicianAssignment: { technicianId: String(technicianRecord._id), workshopId: String(workshop._id) },
    demoPassword: "RepairX@12345",
    message: "Demo reset complete. Use the development accounts listed in DEMO_SETUP.md.",
  }, null, 2));

  await mongoose.disconnect();
  return {
    customer,
    workshopOwner,
    technicianUser,
    admin,
    workshop,
    deviceA,
    deviceB,
    repairRequest: repairedCase,
    technicianRecord,
  };
}

async function main() {
  try {
    await resetDemoDatabase();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
