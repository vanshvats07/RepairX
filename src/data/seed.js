export const demoDevice = {
  id: "device-s23-demo",
  brand: "Samsung",
  model: "Galaxy S23",
  variant: "SM-S911B · Phantom Black · 256 GB",
  purchaseDate: "2025-03-12",
  currentEstimatedValue: 24000,
  location: "Rohini, Delhi",
  pincode: "110017",
  owner: "Jordan Davis",
  createdAt: "2026-03-12T10:00:00.000Z",
};

export const prototypeCatalog = [
  { category: "SMARTPHONE", brand: "Apple", model: "iPhone 15", modelNumber: "A3094", variant: "Standard", variants: [{ name: "Standard", storageOptions: ["128 GB", "256 GB", "512 GB"], colorOptions: ["Black", "Blue", "Green", "Pink", "Yellow"] }] },
  { category: "SMARTPHONE", brand: "Apple", model: "iPhone 15 Pro", modelNumber: "A3102", variant: "Pro", variants: [{ name: "Pro", storageOptions: ["128 GB", "256 GB", "512 GB", "1 TB"], colorOptions: ["Black Titanium", "Blue Titanium", "Natural Titanium", "White Titanium"] }] },
  { category: "SMARTPHONE", brand: "Samsung", model: "Galaxy S23", modelNumber: "SM-S911B", variant: "Standard", variants: [{ name: "Standard", storageOptions: ["128 GB", "256 GB"], colorOptions: ["Phantom Black", "Cream", "Green", "Lavender"] }] },
  { category: "SMARTPHONE", brand: "Samsung", model: "Galaxy S22", modelNumber: "SM-S901B", variant: "Standard", variants: [{ name: "Standard", storageOptions: ["128 GB", "256 GB"], colorOptions: ["Phantom Black", "White", "Green", "Pink Gold"] }] },
  { category: "SMARTPHONE", brand: "Samsung", model: "Galaxy A54", modelNumber: "SM-A546E", variant: "Standard", variants: [{ name: "Standard", storageOptions: ["128 GB", "256 GB"], colorOptions: ["Awesome Black", "Awesome White", "Awesome Violet"] }] },
  { category: "SMARTPHONE", brand: "OnePlus", model: "OnePlus 11", modelNumber: "CPH2447", variant: "Standard", variants: [{ name: "Standard", storageOptions: ["128 GB", "256 GB"], colorOptions: ["Titan Black", "Eternal Green"] }] },
  { category: "SMARTPHONE", brand: "OnePlus", model: "OnePlus 12", modelNumber: "CPH2573", variant: "Standard", variants: [{ name: "Standard", storageOptions: ["256 GB", "512 GB"], colorOptions: ["Silky Black", "Flowy Emerald"] }] },
  { category: "SMARTPHONE", brand: "Google", model: "Pixel 8", modelNumber: "GKWS6", variant: "Standard", variants: [{ name: "Standard", storageOptions: ["128 GB", "256 GB"], colorOptions: ["Obsidian", "Hazel", "Rose"] }] },
  { category: "SMARTPHONE", brand: "Google", model: "Pixel 8 Pro", modelNumber: "GC3VE", variant: "Pro", variants: [{ name: "Pro", storageOptions: ["128 GB", "256 GB", "512 GB"], colorOptions: ["Obsidian", "Porcelain", "Bay"] }] },
  { category: "SMARTPHONE", brand: "Xiaomi", model: "Xiaomi 14", modelNumber: "24030PN60I", variant: "Standard", variants: [{ name: "Standard", storageOptions: ["512 GB"], colorOptions: ["Black", "White", "Jade Green"] }] },
  { category: "SMARTPHONE", brand: "Redmi", model: "Redmi Note 13 Pro+", modelNumber: "23090RA98I", variant: "Standard", variants: [{ name: "Standard", storageOptions: ["256 GB", "512 GB"], colorOptions: ["Fusion Black", "Fusion White", "Fusion Purple"] }] },
  { category: "SMARTPHONE", brand: "Realme", model: "Realme 12 Pro+", modelNumber: "RMX3840", variant: "Standard", variants: [{ name: "Standard", storageOptions: ["128 GB", "256 GB"], colorOptions: ["Submarine Blue", "Navigator Beige"] }] },
  { category: "SMARTPHONE", brand: "Vivo", model: "Vivo V30", modelNumber: "V2318", variant: "Standard", variants: [{ name: "Standard", storageOptions: ["128 GB", "256 GB"], colorOptions: ["Classic Black", "Andaman Blue", "Peacock Green"] }] },
  { category: "SMARTPHONE", brand: "OPPO", model: "OPPO Reno 11 Pro", modelNumber: "CPH2607", variant: "Standard", variants: [{ name: "Standard", storageOptions: ["256 GB"], colorOptions: ["Pearl White", "Rock Grey"] }] },
  { category: "SMARTPHONE", brand: "Motorola", model: "Motorola Edge 50 Pro", modelNumber: "XT2403", variant: "Standard", variants: [{ name: "Standard", storageOptions: ["256 GB", "512 GB"], colorOptions: ["Luxe Lavender", "Moonlight Pearl", "Black Beauty"] }] },
  { category: "SMARTPHONE", brand: "Nothing", model: "Nothing Phone (2)", modelNumber: "A065", variant: "Standard", variants: [{ name: "Standard", storageOptions: ["128 GB", "256 GB", "512 GB"], colorOptions: ["Dark Gray", "White"] }] },
  { category: "SMARTPHONE", brand: "POCO", model: "POCO X6 Pro", modelNumber: "2311DRK48I", variant: "Standard", variants: [{ name: "Standard", storageOptions: ["256 GB", "512 GB"], colorOptions: ["Racing Grey", "Spectre Black", "Yellow"] }] },
  { category: "SMARTPHONE", brand: "Nokia", model: "Nokia G42", modelNumber: "TA-1581", variant: "Standard", variants: [{ name: "Standard", storageOptions: ["128 GB"], colorOptions: ["So Pink", "So Grey", "So Purple"] }] },
];

export const demoRepairs = [
  { id: "repair-display", deviceId: demoDevice.id, date: "2026-01-18", reportedProblem: "Cracked display", diagnosis: "Display assembly damaged", component: "Display", part: "Genuine OLED display", partType: "Genuine / Service Part", cost: 9800, workshop: "Northstar Repair", warranty: "90 days", outcome: "Completed", status: "COMPLETED", confidence: "VERIFIED", source: "Workshop record" },
  { id: "repair-battery", deviceId: demoDevice.id, date: "2026-03-12", reportedProblem: "Battery swelling", diagnosis: "Battery capacity below service threshold", component: "Battery", part: "High-capacity battery", partType: "Aftermarket", cost: 3500, workshop: "Byte & Bench", warranty: "30 days", outcome: "Completed", status: "COMPLETED", confidence: "VERIFIED", source: "Customer receipt" },
  { id: "repair-port", deviceId: demoDevice.id, date: "2026-08-21", reportedProblem: "Intermittent charging", diagnosis: "Charging port assembly replaced", component: "Charging", part: "USB-C charging port assembly", partType: "OEM Pull", cost: 4200, workshop: "Byte & Bench", warranty: "60 days", outcome: "Completed", status: "COMPLETED", confidence: "VERIFIED", source: "Workshop record" },
  { id: "report-current", deviceId: demoDevice.id, date: "2026-09-19", reportedProblem: "Phone overheating and battery drains very quickly", diagnosis: null, component: "Charging / Thermal", part: null, partType: null, cost: null, workshop: null, warranty: null, outcome: "Investigation open", status: "INVESTIGATING", confidence: "REPORTED", source: "Customer report" },
];

export const demoComponents = [
  { id: "battery", deviceId: demoDevice.id, name: "Battery", state: "VERIFIED", confidence: "VERIFIED", lastVerified: "2026-03-12", repairCount: 1, recentIssue: "Replaced 7 months ago" },
  { id: "display", deviceId: demoDevice.id, name: "Display", state: "VERIFIED", confidence: "VERIFIED", lastVerified: "2026-01-18", repairCount: 1, recentIssue: "No current signal" },
  { id: "charging", deviceId: demoDevice.id, name: "Charging", state: "INFERRED", confidence: "INFERRED", lastVerified: "2026-08-21", repairCount: 1, recentIssue: "Similar issue recorded" },
  { id: "camera", deviceId: demoDevice.id, name: "Camera", state: "UNKNOWN", confidence: "UNKNOWN", lastVerified: null, repairCount: 0, recentIssue: "No evidence" },
  { id: "thermal", deviceId: demoDevice.id, name: "Thermal", state: "REPORTED", confidence: "REPORTED", lastVerified: null, repairCount: 0, recentIssue: "Overheating reported" },
  { id: "connectivity", deviceId: demoDevice.id, name: "Connectivity", state: "UNKNOWN", confidence: "UNKNOWN", lastVerified: null, repairCount: 0, recentIssue: "No evidence" },
];

export const demoWorkshops = [
  { id: "northstar", name: "Northstar Repair", location: "Rohini, Delhi", pincode: "110085", specializations: ["Samsung board-level repair", "Charging systems"], supportedBrands: ["Samsung", "Apple"], supportedDevices: ["Galaxy S23", "Galaxy S22"], availability: "Available today", distance: "1.8 km", prototype: true },
  { id: "byte-bench", name: "Byte & Bench", location: "Pitampura, Delhi", pincode: "110034", specializations: ["Battery replacement", "Port repair"], supportedBrands: ["Samsung", "OnePlus"], supportedDevices: ["Galaxy S23", "OnePlus 11"], availability: "Next slot tomorrow", distance: "4.6 km", prototype: true },
];

export const demoParts = [
  { id: "part-genuine", name: "Samsung Galaxy S23 display", device: "SM-S911B", partType: "Genuine / Service Part", price: 12800, availability: "2 units nearby", warranty: "6 months", source: "Samsung service market signal", lastChecked: "2026-09-19T10:11:00.000Z" },
  { id: "part-oem", name: "Samsung Galaxy S23 display", device: "SM-S911B", partType: "OEM Pull", price: 8900, availability: "Available", warranty: "90 days", source: "Delhi parts supplier signal", lastChecked: "2026-09-19T10:11:00.000Z" },
  { id: "part-refurb", name: "Samsung Galaxy S23 display", device: "SM-S911B", partType: "Refurbished", price: 6400, availability: "Limited", warranty: "30 days", source: "Source classification unavailable", lastChecked: "2026-09-19T10:11:00.000Z" },
  { id: "part-aftermarket", name: "Samsung Galaxy S23 display", device: "SM-S911B", partType: "Aftermarket", price: 4500, availability: "Available", warranty: "30 days", source: "Delhi parts supplier signal", lastChecked: "2026-09-19T10:11:00.000Z" },
];

export const demoEvidence = [
  { source: "Samsung Support", title: "Samsung Galaxy S23 battery specifications", url: "https://www.samsung.com/in/support/", snippet: "Reference specifications for battery capacity and charging behavior.", relevance: 0.94, category: "DEVICE_INFO", insight: "Used to contextualize the reported battery symptoms.", retrievedAt: "2026-09-19T10:06:00.000Z", confidence: "VERIFIED" },
  { source: "iFixit", title: "Charging heat near lower USB-C assembly", url: "https://www.ifixit.com/", snippet: "Heat around the lower USB-C assembly can indicate contamination or board-level resistance.", relevance: 0.88, category: "REPAIR_REFERENCE", insight: "Supports technician investigation steps.", retrievedAt: "2026-09-19T10:08:00.000Z", confidence: "INFERRED" },
  { source: "Google Maps", title: "Northstar Repair has Samsung charging capability", url: "https://maps.google.com/", snippet: "Local workshop capability and current availability signal.", relevance: 0.82, category: "WORKSHOP", insight: "Relevant to the current workshop match.", retrievedAt: "2026-09-19T10:11:00.000Z", confidence: "REPORTED" },
];
