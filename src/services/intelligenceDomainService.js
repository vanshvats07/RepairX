export function classifyIssueRelation(currentComplaint = "", historicalText = "") {
  const current = currentComplaint.toLowerCase();
  const history = historicalText.toLowerCase();
  const groups = ["battery", "drain", "power", "charge", "charging", "usb", "port", "heat", "thermal", "display", "screen", "speaker", "audio", "camera"];
  const currentGroups = groups.filter((term) => current.includes(term));
  const historyGroups = groups.filter((term) => history.includes(term));
  if (!currentGroups.length || !historyGroups.length) return "INSUFFICIENT_DATA";
  return currentGroups.some((term) => historyGroups.includes(term)) ? "RELATED" : "UNRELATED";
}

export function buildProvenanceEvent({ eventType, sourceType, sourceId, timestamp, state = "UNKNOWN", details = {} }) {
  return { eventType, sourceType, sourceId: String(sourceId), timestamp, state, ...details };
}

export function calculateIntelligenceQuality({ repairs = 0, components = 0, investigations = 0, verifiedDiagnoses = 0 }) {
  if (repairs > 0 && components > 0 && verifiedDiagnoses > 0) return "COMPLETE";
  if (repairs > 0 || components > 0 || investigations > 0) return "PARTIAL";
  return "LIMITED";
}
