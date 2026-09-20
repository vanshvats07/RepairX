import "server-only";
import { searchGoogle, searchGoogleMaps, searchGoogleShopping } from "@/services/serpApiService";
import { detectRepeatedIssues } from "@/services/deviceIntelligenceService";
import { normalizeWorkshopResult } from "@/services/workshopService";

export const REPAIR_INTELLIGENCE_PROMPT_VERSION = process.env.REPAIR_AI_PROMPT_VERSION || "repair-investigation-v1";
export const REPAIR_AI_MODEL = process.env.REPAIR_AI_MODEL || "configured-llm-model";

const KEYWORD_MAP = [
  { keywords: ["battery", "drain", "heat", "overheat", "charging", "charge", "power"], components: ["Battery", "Power circuitry", "Thermal system"] },
  { keywords: ["display", "screen", "flicker", "blackout", "lines", "touch"], components: ["Display assembly", "Display cable", "Display driver"] },
  { keywords: ["camera", "lens", "photo", "video"], components: ["Camera module", "Image sensor", "Rear housing"] },
  { keywords: ["speaker", "audio", "call", "mic", "microphone"], components: ["Speaker assembly", "Audio circuit", "Microphone module"] },
  { keywords: ["button", "volume", "power button", "home button"], components: ["Button assembly", "Flex cable", "Housing"] }
];

function normalizeText(value, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.replace(/<[^>]*>/g, "").replace(/[\u0000-\u001F]/g, "").trim();
}

function safeLower(value) {
  return normalizeText(value, "").toLowerCase();
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function truncate(value, maxLength = 220) {
  if (!value) return "";
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function deriveRelevance(text = "") {
  const t = text.toLowerCase();
  if (!t) return "LOW";
  if (/(battery|charging|drain|heat|overheat|display|screen|flicker)/.test(t)) return "HIGH";
  if (/(repair|issue|service|replacement|part)/.test(t)) return "MEDIUM";
  return "LOW";
}

function dedupeEvidence(list = []) {
  const seen = new Map();
  for (const item of list) {
    const key = String(item.url || item.productUrl || item.address || item.source || item.name || item.title || "unknown").toLowerCase();
    if (!seen.has(key)) seen.set(key, item);
  }
  return [...seen.values()];
}

function extractSymptoms(complaint = "") {
  const text = safeLower(complaint);
  const findings = [];
  if (/(battery|drain|charge|charging|power)/.test(text)) findings.push("battery / power issue");
  if (/(heat|overheat|thermal)/.test(text)) findings.push("thermal issue");
  if (/(display|screen|flicker|blackout|lines)/.test(text)) findings.push("display issue");
  if (/(camera|photo|video|lens)/.test(text)) findings.push("camera issue");
  if (/(speaker|audio|call|mic|microphone)/.test(text)) findings.push("audio issue");
  if (/(button|volume|power button|touch)/.test(text)) findings.push("input / button issue");
  return findings.length ? unique(findings) : ["general device issue"];
}

function extractProblemCategories(complaint = "") {
  const text = safeLower(complaint);
  const categories = [];
  if (/(battery|drain|charge|charging|power)/.test(text)) categories.push("battery");
  if (/(heat|overheat|thermal)/.test(text)) categories.push("thermal");
  if (/(display|screen|flicker|blackout|lines)/.test(text)) categories.push("display");
  if (/(camera|photo|video|lens)/.test(text)) categories.push("camera");
  if (/(speaker|audio|call|mic|microphone)/.test(text)) categories.push("audio");
  if (/(button|touch|volume)/.test(text)) categories.push("input");
  return categories.length ? unique(categories) : ["general hardware"];
}

function extractLinkedComponents(complaint = "", device = {}) {
  const text = safeLower(complaint);
  const matches = []; 
  for (const entry of KEYWORD_MAP) {
    const ok = entry.keywords.some((keyword) => text.includes(keyword));
    if (ok) matches.push(...entry.components);
  }
  if (!matches.length) {
    const deviceName = [device.brand, device.model, device.variant].filter(Boolean).join(" ");
    if (deviceName) matches.push("Device subsystem related to complaint");
  }
  return unique(matches).slice(0, 4);
}

function buildDefaultChecks(problemCategories = []) {
  const checks = [];
  if (problemCategories.includes("battery")) {
    checks.push({ name: "Battery health / capacity test", purpose: "Verify whether battery degradation matches the reported symptom.", reason: "Battery-related symptoms need direct electrical confirmation.", priority: "HIGH" });
  }
  if (problemCategories.includes("thermal")) {
    checks.push({ name: "Thermal inspection", purpose: "Check whether the device is overheating due to the battery, charging circuit, or system load.", reason: "Heat is a common indicator of a deeper power or thermal fault.", priority: "HIGH" });
  }
  if (problemCategories.includes("display")) {
    checks.push({ name: "Display signal and connection inspection", purpose: "Look for display panel, cable, or driver issues behind flicker or blackouts.", reason: "Display symptoms often trace to panel, connector, or power delivery faults.", priority: "HIGH" });
  }
  if (problemCategories.includes("camera") || problemCategories.includes("audio")) {
    checks.push({ name: "Component-level functional test", purpose: "Validate whether the affected hardware behaves correctly under direct testing.", reason: "The complaint suggests a specific hardware subsystem should be verified in isolation.", priority: "MEDIUM" });
  }
  checks.push({ name: "Relevant power / charging inspection", purpose: "Inspect the power path and recent repair history for compatibility or recurring failures.", reason: "This helps separate part wear from a secondary or unrelated issue.", priority: "MEDIUM" });
  return checks.slice(0, 5);
}

function scoreConfidence(evidenceCount = 0, hasHistory = false, searchAvailable = false) {
  if (evidenceCount >= 3 && (hasHistory || searchAvailable)) return "HIGH";
  if (evidenceCount >= 1 || hasHistory) return "MEDIUM";
  if (searchAvailable) return "LOW";
  return "INSUFFICIENT_DATA";
}

export function buildInvestigationSearchPlan({ device = {}, complaint = "", repairHistory = [], location = "Delhi NCR, India" }) {
  const deviceName = [device.brand, device.model, device.variant].filter(Boolean).join(" ").trim();
  const complaintText = safeLower(complaint);
  const categories = ["DEVICE_INFORMATION"];
  const keywords = Array.from(new Set([...extractSymptoms(complaint), ...extractProblemCategories(complaint)]));

  if (keywords.some((word) => /battery|charge|heat|power|thermal/.test(word))) {
    categories.push("REPAIR_REFERENCES", "PART_INFORMATION");
  }
  if (keywords.some((word) => /display|screen|flicker|blackout/.test(word))) {
    categories.push("REPAIR_REFERENCES", "PART_INFORMATION");
  }
  if (repairHistory.length > 0) {
    categories.push("REPAIR_REFERENCES");
  }
  if (deviceName) {
    categories.push("LOCAL_WORKSHOPS");
  }
  if (!deviceName || !complaintText) {
    categories.push("REPAIR_REFERENCES");
  }

  const uniqueCategories = unique(categories);
  const queries = [];
  if (deviceName) {
    queries.push(`${deviceName} ${complaintText || "repair issue"} India`);
  } else {
    queries.push(`${complaintText || "device repair issue"} India`);
  }
  if (deviceName) {
    queries.push(`${deviceName} ${extractProblemCategories(complaint).join(" ")} repair ${location}`);
    queries.push(`${deviceName} ${extractSymptoms(complaint).join(" ")} replacement ${location}`);
  }
  if (repairHistory.length > 0) {
    queries.push(`${deviceName || "device"} previous repair history ${location}`);
  }

  return {
    categories: uniqueCategories,
    reason: `The investigation prioritizes evidence for ${deviceName || "the reported device"} based on the complaint and available repair history.`,
    queries: unique(queries).slice(0, 6),
    location: normalizeText(location, "Delhi NCR, India")
  };
}

function normalizeGoogleEvidence(payload = {}, category = "DEVICE_INFORMATION", complaint = "") {
  return (payload.organic_results || []).slice(0, 8).map((item, index) => ({
    id: `google-${category.toLowerCase()}-${item.position || index}`,
    category,
    source: normalizeText(item.source || item.displayed_link || "Google Search"),
    title: normalizeText(item.title, "Search result"),
    url: normalizeText(item.link || item.source_url || ""),
    snippet: truncate(normalizeText(item.snippet, "No snippet provided.")),
    relevance: deriveRelevance(`${item.title || ""} ${item.snippet || ""} ${complaint}`),
    retrievedAt: new Date().toISOString(),
    type: "SEARCH_RESULT"
  }));
}

function normalizeShoppingEvidence(payload = {}, complaint = "") {
  return (payload.shopping_results || []).slice(0, 8).map((item, index) => ({
    id: `shopping-${index}`,
    category: "PART_INFORMATION",
    source: normalizeText(item.source || item.seller || "Google Shopping"),
    name: normalizeText(item.title, "Part listing"),
    productUrl: normalizeText(item.link || item.product_link || ""),
    price: normalizeText(item.price || item.extracted_price || ""),
    seller: normalizeText(item.source || item.seller || "Unknown seller"),
    compatibility: normalizeText(item.compatibility || "Unknown compatibility"),
    categoryDetail: "PART",
    relevance: deriveRelevance(`${item.title || ""} ${complaint}`),
    retrievedAt: new Date().toISOString(),
    type: "SHOPPING_RESULT"
  }));
}

function normalizeMapEvidence(payload = {}, complaint = "") {
  const results = payload.local_results || payload.local_results?.places || [];
  return results.slice(0, 8).map((item, index) => {
    const normalized = normalizeWorkshopResult({
      id: item.place_id || `workshop-${index}`,
      name: item.title || item.name,
      address: item.address || item.address_snippet,
      phone: item.phone,
      website: item.website,
      rating: item.rating,
      reviewCount: item.reviews,
      hours: item.hours,
      distance: item.distance,
      latitude: item.gps_coordinates?.latitude,
      longitude: item.gps_coordinates?.longitude,
      source: "Google Maps",
      sourceType: "LIVE",
      retrievedAt: new Date().toISOString(),
      authorizationStatus: "UNKNOWN"
    }, index);
    return {
      ...normalized,
      category: "LOCAL_WORKSHOPS",
      relevance: deriveRelevance(`${normalized.name || ""} ${normalized.address || ""} ${complaint}`),
      type: "WORKSHOP_RESULT"
    };
  });
}

async function searchDeviceInformation({ device, complaint, location }) {
  const deviceName = [device.brand, device.model, device.variant].filter(Boolean).join(" ").trim();
  const query = deviceName ? `${deviceName} ${complaint || "repair issue"} India` : `${complaint || "device repair issue"} India`;
  const payload = await searchGoogle({ query, location: location || "Delhi NCR, India" });
  return normalizeGoogleEvidence(payload, "DEVICE_INFORMATION", complaint);
}

async function searchRepairReferences({ device, complaint, location }) {
  const deviceName = [device.brand, device.model, device.variant].filter(Boolean).join(" ").trim();
  const query = deviceName ? `${deviceName} ${complaint || "repair issue"} troubleshooting India` : `${complaint || "device repair issue"} troubleshooting India`;
  const payload = await searchGoogle({ query, location: location || "Delhi NCR, India" });
  return normalizeGoogleEvidence(payload, "REPAIR_REFERENCES", complaint);
}

async function searchRelevantParts({ device, complaint, location }) {
  const deviceName = [device.brand, device.model, device.variant].filter(Boolean).join(" ").trim();
  const query = deviceName ? `${deviceName} ${extractProblemCategories(complaint).join(" ") || "repair"} replacement India` : `${complaint || "repair"} replacement India`;
  const payload = await searchGoogleShopping({ query, location: location || "Delhi NCR, India" });
  return normalizeShoppingEvidence(payload, complaint);
}

async function searchLocalWorkshops({ device, complaint, location }) {
  const deviceName = [device.brand, device.model, device.variant].filter(Boolean).join(" ").trim();
  const query = deviceName ? `${deviceName} repair ${complaint || "service"} ${location || "Delhi NCR, India"}` : `${complaint || "device repair"} ${location || "Delhi NCR, India"}`;
  const payload = await searchGoogleMaps({ query, location: location || "Delhi NCR, India" });
  return normalizeMapEvidence(payload, complaint);
}

async function searchMarketValue({ device, complaint, location }) {
  const deviceName = [device.brand, device.model, device.variant].filter(Boolean).join(" ").trim();
  const query = deviceName ? `${deviceName} used price India` : `${complaint || "device"} used price India`;
  const payload = await searchGoogle({ query, location: location || "Delhi NCR, India" });
  return normalizeGoogleEvidence(payload, "MARKET_VALUE", complaint);
}

function buildEvidenceSummary(evidence = []) {
  const categories = [...new Set(evidence.map((entry) => entry.category || entry.type || "UNKNOWN"))];
  return {
    totalCount: evidence.length,
    categories,
    highRelevanceCount: evidence.filter((entry) => entry.relevance === "HIGH").length,
    mediumRelevanceCount: evidence.filter((entry) => entry.relevance === "MEDIUM").length
  };
}

export function explainRepairInsight(insight = "", supportingEvidence = []) {
  const evidenceText = supportingEvidence.length ? supportingEvidence.slice(0, 2).map((item) => item.title || item.name || item.source).join(", ") : "available RepairX records";
  return `RepairX considered this because the complaint and available evidence point to similar device symptoms, and relevant supporting sources include ${evidenceText}. This is a preliminary finding, not a confirmed repair outcome.`;
}

export function synthesizeRepairEvidence({ structuredProblem = {}, repairHistory = [], evidence = [], repeatPattern = null }) {
  const complaintText = safeLower(structuredProblem.complaint || "");
  const relevantHistory = repairHistory.filter((event) => {
    const combined = `${event.reportedProblem || ""} ${event.component || ""} ${event.diagnosis || ""}`.toLowerCase();
    return /battery|charge|power|heat|display|screen|flicker/.test(combined) && /battery|charge|power|heat|display|screen|flicker/.test(complaintText);
  });

  const candidateComponents = extractLinkedComponents(structuredProblem.complaint || "", structuredProblem.device || {});
  const basePossibleCauses = candidateComponents.map((component, index) => ({
    component,
    reason: `The current symptom pattern and available evidence make ${component.toLowerCase()} a relevant area to inspect.`,
    confidence: index === 0 ? "MEDIUM" : "LOW",
    supportingEvidenceIds: evidence.slice(0, 3).map((item) => item.id),
    evidenceCount: Math.max(1, evidence.filter((item) => item.category || item.type).length)
  }));

  const repeatedIssueMessage = repeatPattern?.repeatPatternDetected ? `A similar issue pattern was previously recorded for ${repeatPattern.affectedComponent || "this device"}. This does not confirm the exact root cause.` : "No similar issue pattern was found in the current repair history.";

  const checks = buildDefaultChecks(structuredProblem.problemCategories || []);

  const supportedObservations = [
    { type: "FACT", statement: `Customer-reported symptoms include ${extractSymptoms(structuredProblem.complaint || "").join(", ")}.` },
    ...(relevantHistory.length ? [{ type: "FACT", statement: `Relevant previous repair history exists for this device and is connected to the current complaint.` }] : []),
    { type: "INFERENCE", statement: `The reported pattern suggests a power or hardware subsystem should be investigated before final repair confirmation.` },
    { type: "UNKNOWN", statement: `Exact component failure has not been verified without technician testing.` },
    { type: "FACT", statement: repeatedIssueMessage }
  ];

  const recommendedChecks = checks.map((check, index) => ({
    ...check,
    priority: index === 0 ? "HIGH" : check.priority || "MEDIUM"
  }));

  return {
    supportedObservations,
    possibleCauses: basePossibleCauses,
    recommendedChecks,
    unknowns: [
      "Exact physical defect is not confirmed without technician testing.",
      "Live evidence availability may be limited for the current search environment.",
      "A final diagnosis remains dependent on technician verification."
    ],
    conflictingEvidence: evidence.filter((item) => item.relevance === "MEDIUM").slice(0, 2).map((item) => `Evidence source: ${item.title || item.name || item.source}`),
    historyRelevance: relevantHistory.length > 0
  };
}

export function structureComplaint({ device = {}, complaint = "", repairHistory = [], images = [] }) {
  const deviceName = [device.brand, device.model, device.variant].filter(Boolean).join(" ").trim();
  return {
    device: deviceName || "Unknown device",
    symptoms: extractSymptoms(complaint),
    problemCategories: extractProblemCategories(complaint),
    severity: /severe|critical|not working|dead|smoke|burn|overheat/.test(safeLower(complaint)) ? "HIGH" : "MEDIUM",
    context: repairHistory.length ? `Previous repair history exists for this device and should be considered during diagnosis.` : "No previous repair history is available.",
    complaint,
    imageCount: Array.isArray(images) ? images.length : 0,
    deviceContext: {
      brand: device.brand || null,
      model: device.model || null,
      variant: device.variant || null,
      location: device.location || null
    }
  };
}

export async function investigateRepairCase({ device = {}, complaint = "", repairHistory = [], location = "Delhi NCR, India", images = [] }) {
  const structuredProblem = structureComplaint({ device, complaint, repairHistory, images });
  const searchPlan = buildInvestigationSearchPlan({ device, complaint, repairHistory, location });
  const repeatPattern = detectRepeatedIssues({ repairs: repairHistory, investigations: [] });

  let evidence = [];
  let searchStatus = "unavailable";
  let liveSearchUsed = false;

  if (process.env.SERPAPI_API_KEY) {
    const relevantSearches = {
      DEVICE_INFORMATION: searchPlan.categories.includes("DEVICE_INFORMATION") ? [searchDeviceInformation({ device, complaint, location })] : [],
      REPAIR_REFERENCES: searchPlan.categories.includes("REPAIR_REFERENCES") ? [searchRepairReferences({ device, complaint, location })] : [],
      PART_INFORMATION: searchPlan.categories.includes("PART_INFORMATION") ? [searchRelevantParts({ device, complaint, location })] : [],
      LOCAL_WORKSHOPS: searchPlan.categories.includes("LOCAL_WORKSHOPS") ? [searchLocalWorkshops({ device, complaint, location })] : [],
      MARKET_VALUE: searchPlan.categories.includes("MARKET_VALUE") ? [searchMarketValue({ device, complaint, location })] : []
    };

    const settled = await Promise.allSettled(Object.values(relevantSearches).flat());
    const results = settled.filter((entry) => entry.status === "fulfilled").map((entry) => entry.value).flat();
    evidence = dedupeEvidence(results.filter(Boolean));
    searchStatus = evidence.length ? "available" : "empty";
    liveSearchUsed = evidence.length > 0;
  }

  const synthesis = synthesizeRepairEvidence({
    structuredProblem,
    repairHistory,
    evidence,
    repeatPattern: repeatPattern[0] || null
  });

  const confidence = scoreConfidence(evidence.length, repairHistory.length > 0, searchStatus === "available");
  const relevantParts = unique(
    evidence
      .filter((entry) => entry.category === "PART_INFORMATION" || entry.type === "SHOPPING_RESULT")
      .map((entry) => entry.name || entry.title || entry.source)
      .filter(Boolean)
  ).slice(0, 5);

  const repairPrescription = {
    reportedProblem: structuredProblem.complaint || "Unknown repair complaint",
    whatRepairXFound: synthesis.supportedObservations.map((entry) => entry.statement),
    possibleAreasToInvestigate: synthesis.possibleCauses.map((cause) => ({ component: cause.component, reason: cause.reason, confidence: cause.confidence })),
    technicianChecks: synthesis.recommendedChecks,
    potentialParts: relevantParts.length ? relevantParts : ["Relevant part inquiry required"],
    whatIsStillUnknown: synthesis.unknowns,
    confidence
  };

  return {
    structuredProblem,
    possibleCauses: synthesis.possibleCauses,
    affectedComponents: synthesis.possibleCauses.map((cause) => ({ component: cause.component, reason: cause.reason, confidence: cause.confidence, evidence: cause.evidenceCount })),
    recommendedChecks: synthesis.recommendedChecks,
    relevantParts,
    searchEvidence: evidence,
    repairPrescription,
    confidence,
    unknowns: synthesis.unknowns,
    disclaimer: "Preliminary assessment only. Technician verification is required before a final repair decision.",
    searchPlan,
    searchStatus,
    model: REPAIR_AI_MODEL,
    promptVersion: REPAIR_INTELLIGENCE_PROMPT_VERSION,
    evidenceSummary: buildEvidenceSummary(evidence),
    repeatPatternDetected: Array.isArray(repeatPattern) ? repeatPattern.some((item) => item.detected) : false,
    relatedRepairEvents: Array.isArray(repeatPattern) ? repeatPattern : [],
    liveSearchUsed,
    explanation: explainRepairInsight(repairPrescription.reportedProblem, evidence)
  };
}

const repairIntelligenceService = {
  buildInvestigationSearchPlan,
  structureComplaint,
  investigateRepairCase,
  explainRepairInsight,
  synthesizeRepairEvidence
};

export default repairIntelligenceService;
