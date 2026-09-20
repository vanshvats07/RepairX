import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { parse } from "csv-parse/sync";
import DeviceCatalog from "../src/models/DeviceCatalog.js";

dotenv.config({ path: process.env.DOTENV_CONFIG_PATH || ".env.local" });

const inputPath = process.argv[2];
if (!inputPath) throw new Error("Usage: npm run catalog:import -- data/device-catalog.csv");

function clean(value) {
  return String(value ?? "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeBrand(value) {
  const brand = clean(value);
  const aliases = {
    iqoo: "iQOO",
    mi: "Xiaomi",
    oneplus: "OnePlus",
    oppo: "OPPO",
    poco: "POCO",
    redmi: "Redmi",
    vivo: "Vivo",
    realme: "Realme",
    samsung: "Samsung",
    apple: "Apple",
    google: "Google",
    motorola: "Motorola",
    infinix: "Infinix",
    nokia: "Nokia",
    honor: "Honor",
    tecno: "Tecno",
    itel: "Itel",
    lava: "Lava",
    nothing: "Nothing",
    wings: "Wings",
    lyf: "LYF",
  };
  return aliases[brand.toLowerCase()] || brand;
}

function normalizeModel(value) {
  return clean(value)
    .replace(/\biphone\b/gi, "iPhone")
    .replace(/\b(pixel|galaxy|redmi|poco|realme|motorola|vivo|nokia|oneplus|oppo|infinix|nothing)\b/gi, (word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .replace(/\b(5g|4g)\b/gi, (network) => network.toUpperCase());
}

function splitBrandAndModel(value) {
  const rawModel = clean(value);
  const knownBrands = ["OnePlus", "Motorola", "Samsung", "Realme", "Redmi", "Xiaomi", "Google", "Apple", "Vivo", "OPPO", "Oppo", "POCO", "Poco", "Infinix", "Tecno", "Nokia", "iQOO", "IQOO", "Honor", "Nothing", "Lava", "Itel", "Asus", "Sony", "Huawei", "Lenovo", "Micromax", "HTC", "LG"];
  const brand = knownBrands.find((candidate) => rawModel.toLowerCase().startsWith(`${candidate.toLowerCase()} `));
  if (brand) return { brand, model: rawModel.slice(brand.length).trim() };
  const [firstWord, ...rest] = rawModel.split(/\s+/);
  return { brand: firstWord || "", model: rest.join(" ") };
}

function extractStorage(value) {
  return String(value || "").match(/\b(\d+)\s*GB\s*(?:inbuilt|storage)?\b/i)?.[1] || "";
}

function extractRam(value) {
  return String(value || "").match(/\b(\d+)\s*GB\s*RAM\b/i)?.[1] || "";
}

function splitValues(value) {
  return clean(value).split(/[|;/]/).map(clean).filter(Boolean);
}

function addValue(target, value) {
  for (const entry of splitValues(value)) {
    if (!target.includes(entry)) target.push(entry);
  }
}

function toNumber(value) {
  const number = Number(clean(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(number) ? number : undefined;
}

const filePath = path.resolve(process.cwd(), inputPath);
if (!fs.existsSync(filePath)) throw new Error(`Catalog CSV not found: ${filePath}`);

const rows = parse(fs.readFileSync(filePath, "utf8"), {
  columns: true,
  skip_empty_lines: true,
  relax_column_count: true,
  bom: true,
  relax_quotes: true,
});

const grouped = new Map();
for (const row of rows) {
  const parsed = row.brand_name && row.model_name ? { brand: row.brand_name, model: row.model_name } : splitBrandAndModel(row.model);
  const brand = normalizeBrand(parsed.brand);
  const model = normalizeModel(parsed.model);
  if (!brand || !model) continue;

  const key = `${brand.toLowerCase()}::${model.toLowerCase()}`;
  const entry = grouped.get(key) || {
    brand,
    model,
    storageOptions: [],
    ramOptions: [],
    colorOptions: [],
    sourceRows: 0,
    prices: [],
    ratings: [],
    sample: {},
  };

  entry.sourceRows += 1;
  addValue(entry.storageOptions, row.rom ? `${clean(row.rom)} GB` : extractStorage(row.ram) ? `${extractStorage(row.ram)} GB` : "");
  addValue(entry.ramOptions, row.ram ? `${clean(row.ram).match(/\b\d+\s*GB\s*RAM\b/i)?.[0] || `${extractRam(row.ram)} GB`}` : "");
  addValue(entry.colorOptions, row.colour);

  const discountedPrice = toNumber(row.discounted_price);
  if (discountedPrice !== undefined) entry.prices.push(discountedPrice);
  const rating = toNumber(row.rating);
  if (rating !== undefined) entry.ratings.push(rating);
  if (!Object.keys(entry.sample).length) entry.sample = {
    screenSizeInch: clean(row.display_size_inch || row.display),
    displayType: clean(row.display_type || row.display),
    frontCamera: clean(row.front_camera || row.camera),
    rearCamera: clean(row.rear_camera || row.camera),
    battery: clean(row.battery),
    processor: clean(row.processor),
  };
  grouped.set(key, entry);
}

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGODB_URI is required. Set it to the intended prototype or demo database.");

const environment = String(process.env.APP_ENV || process.env.NODE_ENV || "development").toLowerCase();
if (environment === "production") throw new Error("Catalog import is disabled in production.");

await mongoose.connect(mongoUri, { bufferCommands: false, autoIndex: true, serverSelectionTimeoutMS: 5000 });

for (const entry of grouped.values()) {
  const averageRating = entry.ratings.length ? entry.ratings.reduce((sum, value) => sum + value, 0) / entry.ratings.length : undefined;
  const lowestPrice = entry.prices.length ? Math.min(...entry.prices) : undefined;
  await DeviceCatalog.findOneAndUpdate(
    { brand: entry.brand, model: entry.model },
    {
      category: "SMARTPHONE",
      brand: entry.brand,
      model: entry.model,
      modelSlug: `${entry.brand}-${entry.model}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      variant: "Standard",
      variants: [{ name: "Standard", storageOptions: entry.storageOptions, ramOptions: entry.ramOptions, colorOptions: entry.colorOptions }],
      market: "IN",
      supportedRegions: ["IN"],
      sourceType: "EXTERNAL_DATABASE",
      source: "USER_SUPPLIED_CSV",
      status: "UNVERIFIED",
      specifications: {
        ...entry.sample,
        lowestListedPriceInr: lowestPrice,
        averageRating,
        sourceRowCount: entry.sourceRows,
      },
      sourceUpdatedAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
  );
}

console.log(`Imported ${grouped.size} unique smartphone models from ${rows.length} CSV rows.`);
console.log(`Companies imported: ${new Set([...grouped.values()].map((entry) => entry.brand)).size}`);
await mongoose.disconnect();
