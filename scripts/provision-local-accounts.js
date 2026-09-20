import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../src/models/User.js";
import Workshop from "../src/models/Workshop.js";
import WorkshopMembership from "../src/models/WorkshopMembership.js";
import Technician from "../src/models/Technician.js";

dotenv.config({ path: process.env.DOTENV_CONFIG_PATH || ".env.local" });

const environment = String(process.env.APP_ENV || process.env.NODE_ENV || "development").toLowerCase();
if (environment === "production") throw new Error("Local account provisioning is disabled in production.");
if (process.env.REPAIRX_PROVISION_LOCAL_ACCOUNTS !== "true") throw new Error("Set REPAIRX_PROVISION_LOCAL_ACCOUNTS=true to provision local accounts.");
if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required to provision local accounts.");

const passwordHash = await bcrypt.hash("RepairX@12345", 12);
const accounts = [
  { email: "customer@repairx.local", name: "RepairX Local Customer", role: "CUSTOMER", phone: "9000000001" },
  { email: "workshop@repairx.local", name: "RepairX Local Workshop Owner", role: "WORKSHOP_OWNER", phone: "9000000002" },
  { email: "technician@repairx.local", name: "RepairX Local Technician", role: "TECHNICIAN", phone: "9000000003" },
  { email: "admin@repairx.local", name: "RepairX Local Admin", role: "ADMIN", phone: "9000000004" },
];

await mongoose.connect(process.env.MONGODB_URI, { bufferCommands: false, autoIndex: true, serverSelectionTimeoutMS: 5000 });
const users = {};
for (const account of accounts) {
  users[account.role] = await User.findOneAndUpdate(
    { email: account.email },
    { ...account, passwordHash, pilotStatus: "ACTIVE", city: "Bengaluru", state: "Karnataka", pincode: "560001", location: "Bengaluru, Karnataka" },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
  );
}

const workshop = await Workshop.findOneAndUpdate(
  { name: "RepairX Local Workshop A" },
  { name: "RepairX Local Workshop A", ownerUserId: users.WORKSHOP_OWNER._id, businessType: "INDEPENDENT_WORKSHOP", locality: "Koramangala", city: "Bengaluru", state: "Karnataka", pincode: "560001", capabilities: ["battery", "charging", "display"], supportedBrands: ["Samsung"], supportedDevices: ["Galaxy S23"], serviceAreas: { cities: ["Bengaluru"], localities: ["Koramangala"], pincodes: ["560001"] }, availability: "OPEN", authorizationStatus: "INDEPENDENT", verificationStatus: "VERIFIED", verificationSource: "ADMIN_VERIFIED", pilotStatus: "PILOT_ACTIVE", isNetworkWorkshop: true },
  { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
);

await WorkshopMembership.findOneAndUpdate({ workshopId: workshop._id, userId: users.WORKSHOP_OWNER._id }, { workshopId: workshop._id, userId: users.WORKSHOP_OWNER._id, role: "OWNER", status: "ACTIVE" }, { upsert: true, new: true, setDefaultsOnInsert: true });
await WorkshopMembership.findOneAndUpdate({ workshopId: workshop._id, userId: users.TECHNICIAN._id }, { workshopId: workshop._id, userId: users.TECHNICIAN._id, role: "TECHNICIAN", status: "ACTIVE" }, { upsert: true, new: true, setDefaultsOnInsert: true });
await Technician.findOneAndUpdate({ workshopId: workshop._id, userId: users.TECHNICIAN._id }, { workshopId: workshop._id, userId: users.TECHNICIAN._id, name: users.TECHNICIAN.name, email: users.TECHNICIAN.email, phone: users.TECHNICIAN.phone, status: "ACTIVE", inviteStatus: "ACCEPTED" }, { upsert: true, new: true, setDefaultsOnInsert: true });

console.log("Provisioned local RepairX accounts and Workshop A relationships.");
await mongoose.disconnect();
