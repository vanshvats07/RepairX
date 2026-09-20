import "server-only";
import { connectMongo } from "@/lib/mongodb";
import { DEVICE_CATEGORIES } from "@/lib/deviceCatalogConfig";
import DeviceCatalog from "@/models/DeviceCatalog";

const DEFAULT_LIMIT = 20;

function normalizeDeviceText(value = "") {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ");
}

function getSimilarityScore(searchText, candidateText) {
  const base = normalizeDeviceText(searchText);
  const candidate = normalizeDeviceText(candidateText);
  if (!base || !candidate) return 0;
  if (base === candidate) return 1;
  if (candidate.includes(base) || base.includes(candidate)) return 0.9;
  const baseWords = base.split(/\s+/).filter(Boolean);
  const candidateWords = candidate.split(/\s+/).filter(Boolean);
  const overlap = baseWords.filter((word) => candidateWords.includes(word)).length;
  return Math.min(0.8, overlap / Math.max(baseWords.length, 1));
}

export function getDeviceCategories() {
  return DEVICE_CATEGORIES;
}

export async function searchCatalogModels({ category, brand, brandId, search = "", page = 1, limit = DEFAULT_LIMIT } = {}) {
  await connectMongo();
  if (!process.env.MONGODB_URI) {
    return { items: [], total: 0, page: Number(page) || 1, limit: Number(limit) || DEFAULT_LIMIT };
  }

  const query = {};
  if (category) query.category = category;
  if (brand || brandId) query.brand = new RegExp(String(brand || brandId).trim(), "i");
  query.status = { $ne: "ARCHIVED" };

  const rawSearch = String(search || "").trim();
  if (rawSearch) {
    query.$or = [
      { model: new RegExp(rawSearch, "i") },
      { brand: new RegExp(rawSearch, "i") },
      { modelNumber: new RegExp(rawSearch, "i") },
      { variant: new RegExp(rawSearch, "i") },
    ];
  }

  const safePage = Number(page) > 0 ? Number(page) : 1;
  const safeLimit = Number(limit) > 0 ? Number(limit) : DEFAULT_LIMIT;

  const [items, total] = await Promise.all([
    DeviceCatalog.find(query).sort({ brand: 1, model: 1, createdAt: -1 }).skip((safePage - 1) * safeLimit).limit(safeLimit).lean(),
    DeviceCatalog.countDocuments(query),
  ]);

  return {
    items,
    total,
    page: safePage,
    limit: safeLimit,
  };
}

export async function getCatalogBrandList({ category, search = "" } = {}) {
  await connectMongo();
  if (!process.env.MONGODB_URI) return [];
  const query = { status: { $ne: "ARCHIVED" }, ...(category ? { category } : {}), ...(search ? { brand: new RegExp(String(search).trim(), "i") } : {}) };
  const brands = await DeviceCatalog.distinct("brand", query);
  return brands.filter(Boolean).sort((a, b) => a.localeCompare(b));
}

export async function getCatalogModelById(modelId) {
  await connectMongo();
  if (!process.env.MONGODB_URI) return null;
  return DeviceCatalog.findOne({ _id: modelId, status: { $ne: "ARCHIVED" } }).lean();
}

export async function getCatalogModelVariants(modelId) {
  const item = await getCatalogModelById(modelId);
  if (!item) return [];

  const variants = Array.isArray(item.variants) ? item.variants.map((variant) => ({
    ...variant,
    storageOptions: variant.storageOptions || [],
    ramOptions: variant.ramOptions || [],
    colorOptions: variant.colorOptions || [],
    networkOptions: variant.networkOptions || [],
  })) : [];
  if (item.variant && !variants.some((entry) => entry.name === item.variant)) variants.push({ name: item.variant });
  if (!variants.length && item.supportedParts?.length) return item.supportedParts.map((name) => ({ name }));
  return variants.filter(Boolean).slice(0, 20);
}

export async function identifyDevice({ brand = "", model = "", variant = "", modelNumber = "", image = null } = {}) {
  const cleanedBrand = normalizeDeviceText(brand);
  const cleanedModel = normalizeDeviceText(model);
  const cleanedVariant = normalizeDeviceText(variant);
  const cleanedModelNumber = normalizeDeviceText(modelNumber);

  if (!cleanedBrand && !cleanedModel && !cleanedVariant && !cleanedModelNumber && !image) {
    return { catalogMatch: null, confidence: "UNKNOWN", source: "NONE" };
  }

  try {
    await connectMongo();
    if (!process.env.MONGODB_URI) {
      return { catalogMatch: null, confidence: "UNKNOWN", source: "UNAVAILABLE" };
    }

    const query = {};
    if (brand) query.brand = new RegExp(String(brand).trim(), "i");
    if (model) query.model = new RegExp(String(model).trim(), "i");
    if (modelNumber) query.modelNumber = new RegExp(String(modelNumber).trim(), "i");

    const candidates = await DeviceCatalog.find(query).limit(20).lean();
    if (!candidates.length) {
      return { catalogMatch: null, confidence: "LOW", source: "NO_MATCH" };
    }

    const scored = candidates.map((candidate) => {
      const score = [
        getSimilarityScore(brand, candidate.brand),
        getSimilarityScore(model, candidate.model),
        getSimilarityScore(variant, candidate.variant || ""),
        getSimilarityScore(modelNumber, candidate.modelNumber || ""),
      ].reduce((sum, value) => sum + value, 0);

      return { candidate, score };
    }).sort((a, b) => b.score - a.score);

    const best = scored[0];
    if (!best || best.score < 0.2) {
      return { catalogMatch: null, confidence: "LOW", source: "NO_MATCH" };
    }

    const confidence = best.score >= 0.8 ? "HIGH" : best.score >= 0.5 ? "MEDIUM" : "LOW";
    return { catalogMatch: best.candidate, confidence, source: "DATABASE_MATCH" };
  } catch (error) {
    return { catalogMatch: null, confidence: "UNKNOWN", source: "ERROR", message: error.message };
  }
}

export async function identifyDeviceFromImage({ image } = {}) {
  if (!image) {
    return { possibleDevices: [], confidence: "UNKNOWN", evidence: [], status: "IMAGE_IDENTIFICATION_UNAVAILABLE" };
  }

  if (!process.env.VISION_PROVIDER) {
    return { possibleDevices: [], confidence: "UNKNOWN", evidence: [], status: "IMAGE_IDENTIFICATION_UNAVAILABLE" };
  }

  return {
    possibleDevices: [],
    confidence: "UNKNOWN",
    evidence: [],
    status: "IMAGE_IDENTIFICATION_UNAVAILABLE",
  };
}
