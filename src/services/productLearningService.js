export function buildPilotMetricSummary({
  requestsCreated = 0,
  completedRepairs = 0,
  cancelledCases = 0,
  disputedCases = 0,
  quotesCreated = 0,
  quotesApproved = 0,
  quotesRejected = 0,
  qualityChecksPassed = 0,
  qualityChecksFailed = 0,
  avgVerificationMs = null,
  avgRepairMs = null,
  avgCaseMs = null,
  repeatedIssueCases = 0,
  timeWindow = "all available data",
}) {
  return {
    timeWindow,
    metrics: {
      requestsCreated: { value: requestsCreated, n: requestsCreated, definition: "Actual repair requests created within the selected time window." },
      completedRepairs: { value: completedRepairs, n: completedRepairs, definition: "Completed repairs with actual repair job closure and follow-up available." },
      cancelledCases: { value: cancelledCases, n: cancelledCases, definition: "Cases cancelled or terminated before repair closure." },
      disputedCases: { value: disputedCases, n: disputedCases, definition: "Open or historical disputes associated with a repair case." },
      quotesCreated: { value: quotesCreated, n: quotesCreated, definition: "Quotes created for actual repair requests." },
      quotesApproved: { value: quotesApproved, n: quotesApproved, definition: "Quotes approved by the customer." },
      quotesRejected: { value: quotesRejected, n: quotesRejected, definition: "Quotes rejected by the customer." },
      qualityChecksPassed: { value: qualityChecksPassed, n: qualityChecksPassed, definition: "Quality checks that passed." },
      qualityChecksFailed: { value: qualityChecksFailed, n: qualityChecksFailed, definition: "Quality checks that failed or required rework." },
      averageVerificationMs: avgVerificationMs == null ? null : { value: Number(avgVerificationMs), n: Number.isFinite(avgVerificationMs) ? 1 : 0, definition: "Average time from case creation to technician verification for cases with a verified timestamp." },
      averageRepairMs: avgRepairMs == null ? null : { value: Number(avgRepairMs), n: Number.isFinite(avgRepairMs) ? 1 : 0, definition: "Average repair duration for completed repair jobs with known timestamps." },
      averageCaseMs: avgCaseMs == null ? null : { value: Number(avgCaseMs), n: Number.isFinite(avgCaseMs) ? 1 : 0, definition: "Average total case duration for cases with complete start and resolution timestamps." },
      repeatedIssueCases: { value: repeatedIssueCases, n: repeatedIssueCases, definition: "Cases where a repeated issue pattern was detected using actual historical records." },
    },
  };
}

export function buildV1ReadinessReport({
  hasCustomerFlow = false,
  hasWorkshopFlow = false,
  hasTechnicianFlow = false,
  hasDeviceIntelligence = false,
  hasRepairDna = false,
  hasAi = false,
  hasWorkshopNetwork = false,
  hasPayments = false,
  hasLogistics = false,
  hasObservability = false,
  hasSecurity = false,
  hasDataQuality = false,
}) {
  const dimensions = {
    CUSTOMER_EXPERIENCE: hasCustomerFlow ? "READY" : "INSUFFICIENT_DATA",
    WORKSHOP_EXPERIENCE: hasWorkshopFlow ? "READY" : "INSUFFICIENT_DATA",
    TECHNICIAN_EXPERIENCE: hasTechnicianFlow ? "READY" : "INSUFFICIENT_DATA",
    DEVICE_INTELLIGENCE: hasDeviceIntelligence ? "READY" : "INSUFFICIENT_DATA",
    REPAIR_DNA: hasRepairDna ? "READY" : "INSUFFICIENT_DATA",
    AI: hasAi ? "READY" : "PARTIAL",
    WORKSHOP_NETWORK: hasWorkshopNetwork ? "READY" : "PARTIAL",
    PAYMENTS: hasPayments ? "READY" : "PARTIAL",
    LOGISTICS: hasLogistics ? "READY" : "PARTIAL",
    OBSERVABILITY: hasObservability ? "READY" : "PARTIAL",
    SECURITY: hasSecurity ? "READY" : "PARTIAL",
    DATA_QUALITY: hasDataQuality ? "READY" : "INSUFFICIENT_DATA",
  };

  return {
    dimensions,
    summary: "This report is evidence-based and uses dimension-level readiness signals instead of a single composite score.",
  };
}

export function summarizePatterns(records = []) {
  return records
    .map((record) => ({
      category: record.category,
      observation: record.observation,
      count: Array.isArray(record.sourceCaseIds) ? record.sourceCaseIds.length : 1,
      status: record.status || "OBSERVED",
      evidence: Array.isArray(record.evidence) ? record.evidence : [],
    }))
    .filter((record) => record.count > 0)
    .slice(0, 20);
}

export function summarizeCaseReviewResults(reviews = []) {
  if (!reviews.length) {
    return { pending: 0, reviewed: 0, outcomes: {}, technicianDifferences: 0 };
  }

  const outcomes = {};
  let technicianDifferences = 0;
  for (const review of reviews) {
    const key = review.repairOutcome || "UNKNOWN";
    outcomes[key] = (outcomes[key] || 0) + 1;
    if (review.technicianMatch === "DIFFERENT") technicianDifferences += 1;
  }

  return {
    pending: reviews.filter((review) => review.reviewStatus === "REVIEW_PENDING").length,
    reviewed: reviews.filter((review) => review.reviewStatus === "REVIEWED").length,
    outcomes,
    technicianDifferences,
  };
}
