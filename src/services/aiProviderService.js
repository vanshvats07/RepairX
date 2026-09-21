import "server-only";
import { aiConfig } from "@/config/env";

function parseJson(content) {
  const text = String(content || "").trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  return JSON.parse(text);
}

export async function generatePreliminaryAssessment({ device = {}, complaint = "", repairHistory = [], evidence = [] }) {
  if (aiConfig.provider !== "openai" || !aiConfig.apiKey) throw new Error("AI provider is not configured.");
  const response = await fetch(`${aiConfig.baseUrl.replace(/\/$/, "")}/chat/completions`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${aiConfig.apiKey}` }, body: JSON.stringify({ model: aiConfig.model, temperature: 0.1, response_format: { type: "json_object" }, messages: [{ role: "system", content: "You provide cautious preliminary device-repair assessments. Never claim an exact diagnosis. Return JSON with summary, possibleCauses (array of strings), recommendedChecks (array of strings), confidence (LOW, MEDIUM, or HIGH), and disclaimer. State that physical technician verification is required." }, { role: "user", content: JSON.stringify({ device, complaint, repairHistory: repairHistory.slice(0, 10), evidence: evidence.slice(0, 10) }) }] }) });
  if (!response.ok) throw new Error(`AI provider request failed with status ${response.status}.`);
  const payload = await response.json();
  const result = parseJson(payload.choices?.[0]?.message?.content);
  return { summary: result.summary || "Preliminary assessment returned without a summary.", possibleCauses: Array.isArray(result.possibleCauses) ? result.possibleCauses : [], recommendedChecks: Array.isArray(result.recommendedChecks) ? result.recommendedChecks : [], confidence: ["LOW", "MEDIUM", "HIGH"].includes(result.confidence) ? result.confidence : "LOW", disclaimer: result.disclaimer || "Preliminary assessment only. Final diagnosis requires physical technician verification.", model: aiConfig.model };
}
