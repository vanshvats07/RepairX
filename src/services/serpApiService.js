import "server-only";
import { getJson } from "serpapi";
import { serpApiConfig } from "@/config/env";
import { normalizeWorkshopResult } from "@/services/workshopService";

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function cleanText(value, fallback = "") { return typeof value === "string" ? value.replace(/<[^>]*>/g, "").replace(/[\u0000-\u001f]/g, "").trim() : fallback; }
function normalizeSearchLocation(location = "") { return location.trim().toLowerCase() === "delhi ncr, india" ? "Delhi, India" : location; }
function cacheKey(params) { return JSON.stringify(params); }

async function cachedSearch(params) {
  const normalizedParams = { ...params, location: normalizeSearchLocation(params.location) };
  const key = cacheKey(normalizedParams);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.createdAt < CACHE_TTL) return hit.value;
  const value = await getJson({ ...normalizedParams, api_key: serpApiConfig.apiKey || process.env.SERPAPI_API_KEY });
  cache.set(key, { createdAt: Date.now(), value });
  return value;
}

export async function searchGoogle({ query, location }) { if (!(serpApiConfig.apiKey || process.env.SERPAPI_API_KEY)) throw new Error("SERPAPI_API_KEY missing"); return cachedSearch({ engine: "google", q: query, location, gl: serpApiConfig.defaultCountry, hl: serpApiConfig.defaultLanguage }); }
export async function searchGoogleMaps({ query, location, start = 0 }) { if (!(serpApiConfig.apiKey || process.env.SERPAPI_API_KEY)) throw new Error("SERPAPI_API_KEY missing"); return cachedSearch({ engine: "google_maps", q: query, location, start, hl: serpApiConfig.defaultLanguage }); }
export async function searchGoogleShopping({ query, location }) { if (!(serpApiConfig.apiKey || process.env.SERPAPI_API_KEY)) throw new Error("SERPAPI_API_KEY missing"); return cachedSearch({ engine: "google_shopping", q: query, location, gl: serpApiConfig.defaultCountry, hl: serpApiConfig.defaultLanguage }); }

export function buildRepairQueries({ device, complaint, location, repairHistory = [] }) {
  const deviceName = `${device.brand} ${device.model}`.trim();
  const historyContext = repairHistory.length ? " previous repair battery replacement" : "";
  return {
    deviceQueries: [`${deviceName} specifications India`, `${deviceName} battery specifications India`],
    repairQueries: [`${deviceName} ${complaint} troubleshooting India`, `${deviceName} battery drain overheating repair India${historyContext}`],
    workshopQueries: [`${deviceName} repair ${complaint} ${location}`, `${deviceName} battery charging repair ${location}`, `${device.brand} service center ${location}`],
    partQueries: [`${deviceName} battery replacement India`, `${deviceName} charging port assembly India`],
    marketQueries: [`${deviceName} used price India`, `${deviceName} resale value India`],
  };
}

function normalizeGoogleResults(payload = {}, category, complaint) {
  return (payload.organic_results || []).slice(0, 8).map((item, index) => ({ id: item.position || `google-${index}`, category, source: cleanText(item.source || item.displayed_link || "Google Search"), title: cleanText(item.title, "Untitled result"), url: cleanText(item.link), snippet: cleanText(item.snippet), relevance: item.position ? Math.max(0.45, 1 - item.position * 0.04) : 0.5, insight: category === "REPAIR_REFERENCE" ? `Supports investigation of the reported ${complaint.toLowerCase()} symptoms.` : "Provides current device context for RepairX.", whyItMatters: `Used as supporting context for ${category.toLowerCase().replaceAll("_", " ")}.`, retrievedAt: new Date().toISOString(), confidence: "LIVE", sourceType: "LIVE" }));
}

function normalizeShoppingResults(payload = {}) {
  return (payload.shopping_results || []).slice(0, 10).map((item, index) => ({ id: item.product_id || `shopping-${index}`, name: cleanText(item.title, "Part name unavailable"), price: cleanText(item.price), extractedPrice: Number(String(item.extracted_price || "").replace(/[^0-9.]/g, "")) || null, currency: "INR", seller: cleanText(item.source || item.seller), productLink: cleanText(item.link), thumbnail: cleanText(item.thumbnail), availability: cleanText(item.delivery || item.availability), condition: "Unknown", source: "Google Shopping", sourceType: "LIVE", retrievedAt: new Date().toISOString(), authenticity: "Unknown" }));
}

function normalizeMarketResults(payload = {}) { return (payload.organic_results || payload.shopping_results || []).slice(0, 6).map((item, index) => ({ id: `market-${index}`, title: cleanText(item.title, "Market reference unavailable"), source: cleanText(item.source || "Google Search"), url: cleanText(item.link), price: cleanText(item.price), extractedPrice: item.extracted_price || null, confidence: "LIVE", retrievedAt: new Date().toISOString() })); }

function normalizeMapResults(payload = {}) { return (payload.local_results || payload.local_results?.places || []).slice(0, 10).map((item, index) => normalizeWorkshopResult({ id: item.place_id || `maps-${index}`, name: item.title, address: item.address, phone: item.phone, website: item.website, rating: item.rating || null, reviewCount: item.reviews || null, hours: item.hours || null, distance: item.distance || null, latitude: item.gps_coordinates?.latitude, longitude: item.gps_coordinates?.longitude, source: "Google Maps", sourceType: "LIVE", retrievedAt: new Date().toISOString(), authorizationStatus: "UNKNOWN" }, index)); }

export async function runRepairIntelligence({ device, complaint, location, repairHistory = [] }) {
  const queries = buildRepairQueries({ device, complaint, location, repairHistory });
  if (!process.env.SERPAPI_API_KEY) return { live: false, statuses: { search: "unavailable", maps: "unavailable", shopping: "unavailable" }, queries, evidence: [], workshops: [], parts: [], market: [], fallbackMessage: "Live information could not be retrieved right now. Showing available RepairX records." };

  const jobs = await Promise.allSettled([
    Promise.all(queries.deviceQueries.map((query) => searchGoogle({ query, location }))),
    Promise.all(queries.repairQueries.map((query) => searchGoogle({ query, location }))),
    Promise.all(queries.workshopQueries.slice(0, 2).map((query) => searchGoogleMaps({ query, location }))),
    Promise.all(queries.partQueries.slice(0, 2).map((query) => searchGoogleShopping({ query, location }))),
    Promise.all(queries.marketQueries.map((query) => searchGoogle({ query, location }))),
  ]);
  const value = (index) => jobs[index].status === "fulfilled" ? jobs[index].value : [];
  const devicePayload = value(0)[0] || {};
  const repairPayload = value(1)[0] || {};
  const mapPayload = value(2)[0] || {};
  const shoppingPayload = value(3)[0] || {};
  const marketPayload = value(4)[0] || {};
  const evidence = [...normalizeGoogleResults(devicePayload, "DEVICE_INFO", complaint), ...normalizeGoogleResults(repairPayload, "REPAIR_REFERENCE", complaint)];
  const workshops = normalizeMapResults(mapPayload);
  const parts = normalizeShoppingResults(shoppingPayload);
  const market = normalizeMarketResults(marketPayload);
  const anyLive = jobs.some((job) => job.status === "fulfilled");
  return { live: anyLive, statuses: { search: jobs[1].status === "fulfilled" ? "available" : "unavailable", maps: jobs[2].status === "fulfilled" ? "available" : "unavailable", shopping: jobs[3].status === "fulfilled" ? "available" : "unavailable", market: jobs[4].status === "fulfilled" ? "available" : "unavailable" }, queries, evidence, workshops, parts, market, fallbackMessage: jobs.some((job) => job.status === "rejected") ? "Some live sources were unavailable. Showing the sources that responded alongside available RepairX records." : null };
}
