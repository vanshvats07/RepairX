export function calculateRecoveryScenarios({ currentDeviceValue, repairCost, previousRepairSpend, recentRepairFrequency, repeatIssue, estimatedPostRepairValue }) {
  const scenarios = [
    { key: "repair", label: "Repair", cost: repairCost, expectedValue: estimatedPostRepairValue, complexity: "Medium", risk: repeatIssue ? "Medium" : "Low", confidence: "Medium" },
    { key: "refurbish", label: "Refurbish", cost: repairCost + 2300, expectedValue: estimatedPostRepairValue + 1100, complexity: "High", risk: "Medium", confidence: "Low" },
    { key: "sellAsIs", label: "Sell as-is", cost: 0, expectedValue: Math.round(currentDeviceValue * 0.72), complexity: "Low", risk: "Low", confidence: "Market signal" },
    { key: "partRecovery", label: "Part recovery", cost: 900, expectedValue: Math.round(currentDeviceValue * 0.38), complexity: "High", risk: "High", confidence: "Low" },
    { key: "recycle", label: "Recycle", cost: 0, expectedValue: 500, complexity: "Low", risk: "Low", confidence: "Verified" },
  ];
  return { scenarios, assumptions: { currentDeviceValue, repairCost, previousRepairSpend, recentRepairFrequency, repeatIssue, estimatedPostRepairValue }, note: "RepairX analysis based on available records. Compare scenarios before deciding." };
}
