import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import User from "../src/models/User.js";
import Workshop from "../src/models/Workshop.js";
import WorkshopMembership from "../src/models/WorkshopMembership.js";
import Technician from "../src/models/Technician.js";

const TEST_DB_URI = "mongodb://127.0.0.1:27017/repairx_e2e_test";
const HOST = "http://localhost:3000";

async function clearDatabase() {
  await mongoose.connect(TEST_DB_URI, { serverSelectionTimeoutMS: 5000 });
  const collections = await mongoose.connection.db.listCollections().toArray();
  await Promise.all(collections.map(({ name }) => mongoose.connection.db.collection(name).deleteMany({})));
}

async function request(path, { method = "GET", cookie = "", body } = {}) {
  const headers = {};
  if (cookie) headers.Cookie = cookie;
  if (body !== undefined) headers["content-type"] = "application/json";
  const response = await fetch(`${HOST}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const text = await response.text();
  let parsed = null;
  try { parsed = JSON.parse(text); } catch { parsed = text; }
  return { status: response.status, headers: response.headers, body: parsed, setCookie: response.headers.get("set-cookie") };
}

async function createUser(role, email, name) {
  const passwordHash = await bcrypt.hash("RepairX@12345", 12);
  return User.create({ name, email, passwordHash, role, phone: "9000000000", city: "Bengaluru", state: "Karnataka", pincode: "560001", pilotStatus: "ACTIVE" });
}

async function login(email, password) {
  const response = await request("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
  const cookie = response.setCookie ? response.setCookie.split(";")[0] : "";
  return { response, cookie };
}

test.before(async () => {
  await clearDatabase();
});

test.after(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.db.dropDatabase().catch(() => {});
    await mongoose.disconnect();
  }
});

test("real role logins and protected routes work for customer, workshop owner, technician, and admin", async () => {
  const customer = await createUser("CUSTOMER", "customer-role@test.local", "Customer User");
  const workshopOwner = await createUser("WORKSHOP_OWNER", "workshop-role@test.local", "Workshop Owner");
  const technicianUser = await createUser("TECHNICIAN", "technician-role@test.local", "Technician User");
  const admin = await createUser("ADMIN", "admin-role@test.local", "Admin User");

  const workshop = await Workshop.create({ name: "Role Demo Workshop", locality: "Koramangala", city: "Bengaluru", state: "Karnataka", verificationStatus: "VERIFIED", pilotStatus: "PILOT_ACTIVE", availability: "OPEN", isNetworkWorkshop: true });
  await WorkshopMembership.create({ workshopId: workshop._id, userId: workshopOwner._id, role: "OWNER", status: "ACTIVE" });
  await WorkshopMembership.create({ workshopId: workshop._id, userId: technicianUser._id, role: "TECHNICIAN", status: "ACTIVE" });
  await Technician.create({ userId: technicianUser._id, workshopId: workshop._id, name: technicianUser.name, email: technicianUser.email, status: "ACTIVE" });

  const badLogin = await login("customer-role@test.local", "wrong-password");
  assert.equal(badLogin.response.status, 401);

  const customerLogin = await login("customer-role@test.local", "RepairX@12345");
  assert.equal(customerLogin.response.status, 200);
  const customerMe = await request("/api/auth/me", { cookie: customerLogin.cookie });
  assert.equal(customerMe.status, 200);
  assert.equal(customerMe.body.data.role, "CUSTOMER");

  const customerDashboard = await request("/dashboard", { cookie: customerLogin.cookie });
  assert.equal(customerDashboard.status, 200);

  const workshopLogin = await login("workshop-role@test.local", "RepairX@12345");
  assert.equal(workshopLogin.response.status, 200);
  const workshopMembership = await request("/api/workshops/me", { cookie: workshopLogin.cookie });
  assert.equal(workshopMembership.status, 200);
  assert.ok(Array.isArray(workshopMembership.body.data));
  assert.equal(String(workshopMembership.body.data[0].workshopId), String(workshop._id));
  assert.equal(workshopMembership.body.data[0].ownership.role, "OWNER");
  const workshopRoute = await request("/workshop", { cookie: workshopLogin.cookie });
  assert.equal(workshopRoute.status, 200);

  const technicianLogin = await login("technician-role@test.local", "RepairX@12345");
  assert.equal(technicianLogin.response.status, 200);
  const technicianCases = await request("/api/technicians/me/cases", { cookie: technicianLogin.cookie });
  assert.equal(technicianCases.status, 200);
  assert.ok(Array.isArray(technicianCases.body.data));
  const technicianRoute = await request("/technician", { cookie: technicianLogin.cookie });
  assert.equal(technicianRoute.status, 200);

  const adminLogin = await login("admin-role@test.local", "RepairX@12345");
  assert.equal(adminLogin.response.status, 200);
  const adminMe = await request("/api/auth/me", { cookie: adminLogin.cookie });
  assert.equal(adminMe.status, 200);
  assert.equal(adminMe.body.data.role, "ADMIN");
  const adminRoute = await request("/admin", { cookie: adminLogin.cookie });
  assert.equal(adminRoute.status, 200);

  const customerBlockedFromAdmin = await request("/api/admin/overview", { cookie: customerLogin.cookie });
  assert.equal(customerBlockedFromAdmin.status, 403);

  const workshopBlockedFromAdmin = await request("/api/admin/workshops", { cookie: workshopLogin.cookie });
  assert.equal(workshopBlockedFromAdmin.status, 403);

  const logout = await request("/api/auth/logout", { method: "POST", cookie: adminLogin.cookie });
  assert.equal(logout.status, 200);
  const afterLogout = await request("/api/auth/me", { cookie: adminLogin.cookie });
  assert.equal(afterLogout.status, 200);
  assert.equal(afterLogout.body.data, null);

  const adminBlockedAfterLogout = await request("/api/devices", { cookie: adminLogin.cookie });
  assert.equal(adminBlockedAfterLogout.status, 401);
});
