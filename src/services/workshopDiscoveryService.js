import "server-only";
import { connectMongo } from "@/lib/mongodb";
import Workshop from "@/models/Workshop";
import { searchGoogleMaps } from "@/services/serpApiService";

function clean(value) { return typeof value === "string" ? value.replace(/<[^>]*>/g, "").trim() : value || null; }
export function buildWorkshopSearchQueries({ deviceBrand, deviceModel, problem, requiredCapabilities = [], locality, city, state }) {
  const place = [locality, city, state, "India"].filter(Boolean).join(" ");
  const device = [deviceBrand, deviceModel].filter(Boolean).join(" ");
  const capability = requiredCapabilities[0] || "mobile repair";
  return [...new Set([`${device || "mobile"} repair shops ${place}`, `${deviceBrand || "mobile"} ${capability} ${place}`, `mobile repair shops ${place}`])];
}

export function calculateWorkshopDistance(origin, destination) {
  if (!origin?.latitude || !origin?.longitude || !destination?.latitude || !destination?.longitude) return null;
  const radians = (value) => value * Math.PI / 180;
  const earthRadius = 6371;
  const latitudeDelta = radians(destination.latitude - origin.latitude);
  const longitudeDelta = radians(destination.longitude - origin.longitude);
  const a = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(radians(origin.latitude)) * Math.cos(radians(destination.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return Math.round(earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

export function normalizeMapsResult(item = {}, query, index = 0, location = {}) {
  const coordinates = item.gps_coordinates || {};
  const externalId = item.place_id || item.data_id || item.data_cid || null;
  const now = new Date();
  return { externalIds: externalId ? { placeId: externalId } : {}, name: clean(item.title) || "Business name unavailable", address: clean(item.address), locality: clean(item.locality) || location.locality || null, city: clean(item.city) || location.city || null, state: clean(item.state) || location.state || null, country: location.country || "India", pincode: clean(item.postal_code) || location.pincode || null, latitude: coordinates.latitude || null, longitude: coordinates.longitude || null, phone: clean(item.phone), website: clean(item.website), hours: item.hours || null, businessType: clean(item.type), description: clean(item.description), authorizationStatus: "UNKNOWN", supportedBrands: [], supportedDevices: [], source: "Google Maps", sourceType: "LIVE", sourceUrl: clean(item.link), sourceRetrievedAt: now, dataSource: "SERPAPI", verificationStatus: "DISCOVERED", firstDiscoveredAt: now, lastDiscoveredAt: now, discoveryQuery: query, distance: item.distance || null, _resultIndex: index };
}

function dedupeKey(workshop) { return workshop.externalIds?.placeId || `${(workshop.name || "").toLowerCase()}|${(workshop.address || "").toLowerCase()}|${(workshop.phone || "").replace(/\D/g, "")}`; }
export function deduplicateWorkshops(workshops) { return [...new Map(workshops.map((workshop) => [dedupeKey(workshop), workshop])).values()]; }

export async function upsertWorkshop(workshop) {
  if (!process.env.MONGODB_URI) return { ...workshop, persisted: false };
  await connectMongo();
  const externalId = workshop.externalIds?.placeId;
  const filter = externalId ? { "externalIds.placeId": externalId } : { name: workshop.name, address: workshop.address, phone: workshop.phone };
  return Workshop.findOneAndUpdate(filter, { $set: workshop, $setOnInsert: { verificationStatus: "DISCOVERED" } }, { upsert: true, new: true, setDefaultsOnInsert: true }).lean();
}

export async function discoverWorkshops({ locality, city = "Delhi", state = "Delhi", country = "India", deviceBrand, deviceModel, problem = "mobile repair", requiredCapabilities = [], page = 0 }) {
  const queries = buildWorkshopSearchQueries({ deviceBrand, deviceModel, problem, requiredCapabilities, locality, city, state });
  if (!process.env.SERPAPI_API_KEY) return { data: [], queries, live: false, page, message: "Live workshop discovery is temporarily unavailable." };
  const responses = await Promise.allSettled(queries.map((query) => searchGoogleMaps({ query, location: `${locality}, ${city}, ${state}, ${country}`, start: page * 20 })));
  const location = { locality, city, state, country };
  const results = deduplicateWorkshops(responses.flatMap((response, queryIndex) => response.status === "fulfilled" ? (response.value.local_results || []).map((item, index) => normalizeMapsResult(item, queries[queryIndex], index, location)) : []));
  const data = await Promise.all(results.map((result) => upsertWorkshop(result)));
  return { data, queries, live: true, page, statuses: responses.map((response) => response.status === "fulfilled" ? "available" : "unavailable"), message: results.length ? null : "No local businesses found for this search." };
}
