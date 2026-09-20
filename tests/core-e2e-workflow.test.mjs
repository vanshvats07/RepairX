import test from "node:test";
import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import User from "../src/models/User.js";
import Device from "../src/models/Device.js";
import Workshop from "../src/models/Workshop.js";
import WorkshopMembership from "../src/models/WorkshopMembership.js";
import Technician from "../src/models/Technician.js";
import PilotInvitation from "../src/models/PilotInvitation.js";
import RepairRequest from "../src/models/RepairRequest.js";
import Quote from "../src/models/Quote.js";
import RepairJob from "../src/models/RepairJob.js";
import RepairEvent from "../src/models/RepairEvent.js";
import QualityCheck from "../src/models/QualityCheck.js";
import DeliveryRequest from "../src/models/DeliveryRequest.js";
import PostRepairReport from "../src/models/PostRepairReport.js";

const TEST_DB_URI = "mongodb://127.0.0.1:27017/repairx_e2e_test";
const HOST = "http://localhost:3000";

async function waitForServer() {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${HOST}/api/health`, { cache: "no-store" });
      if (response.ok) return;
    } catch {}
    await delay(500);
  }
  throw new Error("RepairX test server did not become ready on port 3000.");
}

async function request(path, { method = "GET", cookie = "", body } = {}) {
  const headers = {};
  if (cookie) headers.Cookie = cookie;
  if (body !== undefined) {
    headers["content-type"] = "application/json";
  }

  const response = await fetch(`${HOST}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  const text = await response.text();
  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text;
  }

  return {
    status: response.status,
    headers: response.headers,
    body: parsed,
    setCookie: response.headers.get("set-cookie"),
  };
}

async function seedInvitation(email, role) {
  await PilotInvitation.create({
    email,
    role,
    status: "INVITED",
    expiresAt: new Date(Date.now() + 86_400_000),
  });
}

async function signup({ name, email, password, role, phone, city, state, pincode }) {
  const response = await request("/api/auth/signup", {
    method: "POST",
    body: {
      name,
      email,
      password,
      role,
      phone,
      city,
      state,
      pincode,
    },
  });

  assert.equal(response.status, 201, `Signup failed for ${email}: ${JSON.stringify(response.body)}`);
  const cookie = response.setCookie ? response.setCookie.split(";")[0] : "";
  return { user: response.body.data, cookie };
}

async function createDevice(cookie, payload) {
  const response = await request("/api/devices", {
    method: "POST",
    cookie,
    body: payload,
  });
  assert.equal(response.status, 201, `Device creation failed: ${JSON.stringify(response.body)}`);
  return response.body.data;
}

async function createCase(cookie, payload) {
  const response = await request("/api/repair-requests", {
    method: "POST",
    cookie,
    body: payload,
  });
  assert.equal(response.status, 201, `Repair request creation failed: ${JSON.stringify(response.body)}`);
  return response.body.data;
}

async function clearDatabase() {
  await mongoose.connect(TEST_DB_URI, { serverSelectionTimeoutMS: 5000 });
  const collections = await mongoose.connection.db.listCollections().toArray();
  await Promise.all(collections.map(({ name }) => mongoose.connection.db.collection(name).deleteMany({})));
}

test.before(async () => {
  await waitForServer();
  await clearDatabase();
});

test.after(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.db.dropDatabase().catch(() => {});
    await mongoose.disconnect();
  }
});

test("pilot signup and multi-device isolation work with real app auth", async () => {
  const sessions = {};
  await Promise.all([
    seedInvitation("customer-a@test.local", "CUSTOMER"),
    seedInvitation("customer-b@test.local", "CUSTOMER"),
    seedInvitation("workshop-a-owner@test.local", "WORKSHOP_OWNER"),
    seedInvitation("workshop-b-owner@test.local", "WORKSHOP_OWNER"),
    seedInvitation("tech-a@test.local", "TECHNICIAN"),
    seedInvitation("tech-b@test.local", "TECHNICIAN"),
  ]);

  const customerA = await signup({ name: "Customer A", email: "customer-a@test.local", password: "Passw0rd123", role: "CUSTOMER", phone: "9999999999", city: "Bengaluru", state: "Karnataka", pincode: "560001" });
  sessions.customerA = customerA.cookie;

  const customerB = await signup({ name: "Customer B", email: "customer-b@test.local", password: "Passw0rd123", role: "CUSTOMER", phone: "8888888888", city: "Bengaluru", state: "Karnataka", pincode: "560010" });
  sessions.customerB = customerB.cookie;

  const workshopOwnerA = await signup({ name: "Workshop A Owner", email: "workshop-a-owner@test.local", password: "Passw0rd123", role: "WORKSHOP_OWNER", phone: "7777777777", city: "Bengaluru", state: "Karnataka", pincode: "560001" });
  sessions.workshopA = workshopOwnerA.cookie;

  const workshopOwnerB = await signup({ name: "Workshop B Owner", email: "workshop-b-owner@test.local", password: "Passw0rd123", role: "WORKSHOP_OWNER", phone: "6666666666", city: "Hyderabad", state: "Telangana", pincode: "500001" });
  sessions.workshopB = workshopOwnerB.cookie;

  const techA = await signup({ name: "Technician A", email: "tech-a@test.local", password: "Passw0rd123", role: "TECHNICIAN", phone: "5555555555", city: "Bengaluru", state: "Karnataka", pincode: "560001" });
  sessions.techA = techA.cookie;

  const techB = await signup({ name: "Technician B", email: "tech-b@test.local", password: "Passw0rd123", role: "TECHNICIAN", phone: "4444444444", city: "Hyderabad", state: "Telangana", pincode: "500001" });
  sessions.techB = techB.cookie;

  const admin = await User.create({
    name: "Admin User",
    email: "admin@test.local",
    passwordHash: await bcrypt.hash("Passw0rd123", 12),
    role: "ADMIN",
    phone: "3333333333",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560001",
    pilotStatus: "ACTIVE",
  });
  sessions.admin = `repairx_session=${await bcrypt.hash(Math.random().toString(), 1)}`;

  const workshopACreation = await request("/api/workshops", {
    method: "POST",
    cookie: sessions.workshopA,
    body: {
      name: "Workshop A",
      city: "Bengaluru",
      locality: "Koramangala",
      state: "Karnataka",
      verificationStatus: "VERIFIED",
      pilotStatus: "PILOT_ACTIVE",
      isNetworkWorkshop: true,
      capabilities: ["battery", "charging", "display"],
      supportedBrands: ["Samsung"],
      supportedDevices: ["Galaxy S23"],
      serviceAreas: { cities: ["Bengaluru"], localities: ["Koramangala"], pincodes: ["560001"] },
      availability: "OPEN",
    },
  });
  assert.equal(workshopACreation.status, 201, `Workshop A creation failed: ${JSON.stringify(workshopACreation.body)}`);
  const workshopARecord = workshopACreation.body.data;

  const workshopBRecord = await Workshop.create({
    name: "Workshop B",
    city: "Hyderabad",
    locality: "Gachibowli",
    state: "Telangana",
    verificationStatus: "VERIFIED",
    pilotStatus: "PILOT_ACTIVE",
    isNetworkWorkshop: true,
    capabilities: ["speaker", "audio", "camera"],
    supportedBrands: ["OnePlus"],
    supportedDevices: ["OnePlus 11"],
    serviceAreas: { cities: ["Hyderabad"], localities: ["Gachibowli"], pincodes: ["500001"] },
    availability: "OPEN",
  });

  await WorkshopMembership.create({ workshopId: workshopBRecord._id, userId: workshopOwnerB.user._id, role: "OWNER", status: "ACTIVE" });
  await WorkshopMembership.create({ workshopId: workshopARecord._id, userId: techA.user._id, role: "TECHNICIAN", status: "ACTIVE" });
  await WorkshopMembership.create({ workshopId: workshopBRecord._id, userId: techB.user._id, role: "TECHNICIAN", status: "ACTIVE" });

  const techARecord = await Technician.create({ userId: techA.user._id, workshopId: workshopARecord._id, name: "Technician A", status: "ACTIVE" });
  const techBRecord = await Technician.create({ userId: techB.user._id, workshopId: workshopBRecord._id, name: "Technician B", status: "ACTIVE" });

  const deviceA = await createDevice(sessions.customerA, {
    brand: "Samsung",
    model: "Galaxy S23",
    variant: "SM-S911B",
    category: "SMARTPHONE",
    purchaseDate: "2024-01-12",
    location: "Bengaluru",
    serialNumber: "TEST-S23-A",
  });

  const deviceB = await createDevice(sessions.customerA, {
    brand: "Apple",
    model: "iPhone 14",
    variant: "A2649",
    category: "SMARTPHONE",
    purchaseDate: "2023-04-01",
    location: "Bengaluru",
    serialNumber: "TEST-IP14-B",
  });

  const deviceC = await createDevice(sessions.customerB, {
    brand: "OnePlus",
    model: "OnePlus 11",
    variant: "OnePlus 11",
    category: "SMARTPHONE",
    purchaseDate: "2024-02-15",
    location: "Hyderabad",
    serialNumber: "TEST-OP11-C",
  });

  const customerADevices = await request("/api/devices", { cookie: sessions.customerA });
  assert.equal(customerADevices.status, 200);
  const customerADeviceIds = customerADevices.body.data.map((item) => String(item._id));
  assert.deepEqual(customerADeviceIds.sort(), [String(deviceA._id), String(deviceB._id)].sort());
  assert.ok(!customerADeviceIds.includes(String(deviceC._id)));

  const customerBDevices = await request("/api/devices", { cookie: sessions.customerB });
  assert.equal(customerBDevices.status, 200);
  const customerBDeviceIds = customerBDevices.body.data.map((item) => String(item._id));
  assert.deepEqual(customerBDeviceIds.sort(), [String(deviceC._id)].sort());
  assert.ok(!customerBDeviceIds.includes(String(deviceA._id)));

  const caseA = await createCase(sessions.customerA, {
    deviceId: deviceA._id,
    workshopId: workshopARecord._id,
    complaint: "phone intermittently stops charging",
    requiredCapabilities: ["battery", "charging"],
  });

  const caseB = await createCase(sessions.customerA, {
    deviceId: deviceA._id,
    workshopId: workshopARecord._id,
    complaint: "speaker crackles during calls",
    requiredCapabilities: ["speaker", "audio"],
  });

  const customerCaseList = await request("/api/repair-requests", { cookie: sessions.customerA });
  assert.equal(customerCaseList.status, 200);
  const caseIdsForCustomer = customerCaseList.body.data.map((item) => String(item._id));
  assert.ok(caseIdsForCustomer.includes(String(caseA._id)) && caseIdsForCustomer.includes(String(caseB._id)));

  const workshopAList = await request("/api/repair-requests", { cookie: sessions.workshopA });
  assert.equal(workshopAList.status, 200);
  const workshopACaseIds = workshopAList.body.data.map((item) => String(item._id));
  assert.ok(workshopACaseIds.includes(String(caseA._id)));
  assert.ok(workshopACaseIds.includes(String(caseB._id)));

  const workshopBList = await request("/api/repair-requests", { cookie: sessions.workshopB });
  assert.equal(workshopBList.status, 200);
  const workshopBCaseIds = workshopBList.body.data.map((item) => String(item._id));
  assert.ok(!workshopBCaseIds.includes(String(caseA._id)));
  assert.ok(!workshopBCaseIds.includes(String(caseB._id)));

  const acceptResult = await request(`/api/repair-requests/${caseA._id}/accept`, { method: "PATCH", cookie: sessions.workshopA });
  assert.equal(acceptResult.status, 200, `case accept failed: ${JSON.stringify(acceptResult.body)}`);

  const assignmentResult = await request(`/api/repair-requests/${caseA._id}/assign-technician`, {
    method: "POST",
    cookie: sessions.workshopA,
    body: { technicianId: techARecord._id },
  });
  assert.equal(assignmentResult.status, 201, `assignment failed: ${JSON.stringify(assignmentResult.body)}`);

  const technicianCaseList = await request("/api/repair-requests", { cookie: sessions.techA });
  assert.equal(technicianCaseList.status, 200);
  const technicianCaseIds = technicianCaseList.body.data.map((item) => String(item._id));
  assert.ok(technicianCaseIds.includes(String(caseA._id)));

  const diagnosisResult = await request(`/api/repair-requests/${caseA._id}/diagnosis`, {
    method: "PATCH",
    cookie: sessions.techA,
    body: {
      component: "Battery",
      diagnosis: "Charging circuit is intermittently failing under load.",
      result: "CONFIRMED",
      predictionOutcome: "MATCHED",
    },
  });
  assert.equal(diagnosisResult.status, 201, `diagnosis failed: ${JSON.stringify(diagnosisResult.body)}`);

  const requestRecordAfterDiagnosis = await RepairRequest.findById(caseA._id).lean();
  assert.equal(requestRecordAfterDiagnosis.status, "DIAGNOSIS_VERIFIED");

  const quoteResponse = await request("/api/quotes", {
    method: "POST",
    cookie: sessions.workshopA,
    body: {
      repairRequestId: caseA._id,
      deviceId: deviceA._id,
      partCost: 6000,
      labourCost: 1800,
      inspectionCost: 500,
      taxes: 400,
    },
  });
  assert.equal(quoteResponse.status, 201, `quote generation failed: ${JSON.stringify(quoteResponse.body)}`);
  const quote = quoteResponse.body.data;
  assert.equal(quote.status, "PENDING_CUSTOMER");

  const quoteDecision = await request(`/api/quotes/${quote._id}`, {
    method: "PATCH",
    cookie: sessions.customerA,
    body: { status: "APPROVED", reason: "Accepted" },
  });
  assert.equal(quoteDecision.status, 200, `quote approval failed: ${JSON.stringify(quoteDecision.body)}`);

  const repairJob = await RepairJob.findOne({ repairRequestId: caseA._id });
  assert.ok(repairJob, "repair job should be created after quote approval");
  assert.equal(String(repairJob.deviceId), String(deviceA._id));

  const deviceReceived = await request(`/api/repair-jobs/${repairJob._id}/status`, {
    method: "PATCH",
    cookie: sessions.workshopA,
    body: { status: "DEVICE_RECEIVED", technicianNotes: "Device received in workshop." },
  });
  assert.equal(deviceReceived.status, 200, `device received failed: ${JSON.stringify(deviceReceived.body)}`);

  const repairQueued = await request(`/api/repair-jobs/${repairJob._id}/status`, {
    method: "PATCH",
    cookie: sessions.workshopA,
    body: { status: "REPAIR_QUEUED", technicianNotes: "Repair queue assigned to the technician." },
  });
  assert.equal(repairQueued.status, 200, `repair queued failed: ${JSON.stringify(repairQueued.body)}`);

  const repairInProgress = await request(`/api/repair-jobs/${repairJob._id}/status`, {
    method: "PATCH",
    cookie: sessions.techA,
    body: { status: "REPAIR_IN_PROGRESS", technicianNotes: "Battery replacement in progress." },
  });
  assert.equal(repairInProgress.status, 200, `repair in progress failed: ${JSON.stringify(repairInProgress.body)}`);

  await QualityCheck.create({
    repairJobId: repairJob._id,
    performedBy: techA.user._id,
    checks: [{ name: "Charging test", result: "PASS", required: true }],
    notes: "Charging and battery behavior tested successfully.",
    passed: true,
    failedChecks: [],
    completedAt: new Date(),
  });

  const qualityCheckStatus = await request(`/api/repair-jobs/${repairJob._id}/status`, {
    method: "PATCH",
    cookie: sessions.workshopA,
    body: { status: "QUALITY_CHECK", technicianNotes: "Quality check scheduled." },
  });
  assert.equal(qualityCheckStatus.status, 200, `quality check state failed: ${JSON.stringify(qualityCheckStatus.body)}`);

  const completion = await request(`/api/repair-jobs/${repairJob._id}/status`, {
    method: "PATCH",
    cookie: sessions.techA,
    body: { status: "COMPLETED", repairOutcome: "Charging port restored and battery stabilized.", affectedComponent: "Battery" },
  });
  assert.equal(completion.status, 200, `repair completion failed: ${JSON.stringify(completion.body)}`);

  const deliveryRequest = await DeliveryRequest.create({
    repairJobId: repairJob._id,
    customerId: customerA.user._id,
    workshopId: workshopARecord._id,
    status: "SCHEDULED",
    mode: "WORKSHOP_DELIVERY",
    provider: "WORKSHOP_MANAGED",
  });

  const followUp = await PostRepairReport.create({
    repairJobId: repairJob._id,
    deviceId: deviceA._id,
    reportedOutcome: "WORKING_WELL",
    description: "Charging is stable after battery service.",
  });

  const repairEvent = await RepairEvent.create({
    deviceId: deviceA._id,
    repairRequestId: caseA._id,
    repairJobId: repairJob._id,
    workshopId: workshopARecord._id,
    technicianId: techA.user._id,
    diagnosisSource: "TECHNICIAN_VERIFIED",
    status: "COMPLETED",
    outcome: "Charging port restored and battery stabilized.",
    confidence: "VERIFIED",
    technicianNotes: "Resolved open-circuit charging issue.",
  });

  const deviceAHistory = await RepairEvent.find({ deviceId: deviceA._id }).lean();
  const deviceBHistory = await RepairEvent.find({ deviceId: deviceB._id }).lean();
  assert.ok(deviceAHistory.some((item) => String(item._id) === String(repairEvent._id)));
  assert.equal(deviceBHistory.length, 0);

  const customerBCase = await createCase(sessions.customerB, {
    deviceId: deviceC._id,
    workshopId: workshopBRecord._id,
    complaint: "speaker crackles during calls",
    requiredCapabilities: ["speaker", "audio"],
  });

  const unauthorizedCaseAccess = await request(`/api/repair-requests/${customerBCase._id}`, { cookie: sessions.customerA });
  assert.equal(unauthorizedCaseAccess.status, 404, "customer A should not access customer B’s case");

  const unauthorizedWorkshopAccess = await request(`/api/workshops/${workshopBRecord._id}/repair-requests`, { cookie: sessions.workshopA });
  assert.equal(unauthorizedWorkshopAccess.status, 403, "workshop A should not read workshop B private case data");

  const unauthorizedTechnicianAccess = await request(`/api/repair-requests/${customerBCase._id}/diagnosis`, {
    method: "PATCH",
    cookie: sessions.techA,
    body: { component: "Speaker", diagnosis: "Should not be allowed", result: "CONFIRMED" },
  });
  assert.equal(unauthorizedTechnicianAccess.status, 403, "technician A should not modify unrelated case data");

  assert.ok(deliveryRequest._id);
  assert.ok(followUp._id);
  assert.equal(String(caseA.deviceId), String(deviceA._id));
  assert.equal(String(caseB.deviceId), String(deviceA._id));
  assert.notEqual(String(caseA._id), String(caseB._id));
  assert.ok((await Quote.findOne({ repairRequestId: caseA._id }))); 
});
