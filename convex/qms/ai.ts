import { action } from "../_generated/server";
import { v } from "convex/values";

const LLM_URL = process.env.LLM_API_URL ?? "https://api.anthropic.com/v1/messages";
const LLM_KEY = process.env.ANTHROPIC_API_KEY ?? "";

async function callClaude(systemPrompt: string, userContent: string): Promise<string> {
  const res = await fetch(LLM_URL, {
    method: "POST",
    headers: {
      "x-api-key": LLM_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LLM call failed: ${err}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

// ── 1. SOP Draft Generator ────────────────────────────────────────────────────
export const generateSopDraft = action({
  args: {
    promptText: v.string(),
    docType: v.optional(v.string()),
    regulatoryStandard: v.optional(v.string()),
  },
  handler: async (_ctx, { promptText, docType, regulatoryStandard }) => {
    const system = `You are a regulatory affairs specialist drafting medical device quality documents.
Produce a structured ${docType ?? "SOP"} draft that complies with ${regulatoryStandard ?? "ISO 13485:2016 and FDA 21 CFR Part 820"}.
Format your response with the following sections:
1. PURPOSE
2. SCOPE
3. RESPONSIBILITIES
4. DEFINITIONS
5. PROCEDURE (numbered steps)
6. RELATED DOCUMENTS
7. REVISION HISTORY TABLE (header row only)
Be concise but complete. Use imperative voice for procedure steps.`;

    const draft = await callClaude(system, `Activity to document: ${promptText}`);
    return { draft };
  },
});

// ── 2. Risk / Hazard Suggester (FMEA) ────────────────────────────────────────
export const suggestHazards = action({
  args: {
    requirementText: v.string(),
    context: v.optional(v.string()),
  },
  handler: async (_ctx, { requirementText, context }) => {
    const system = `You are an ISO 14971 risk management expert for Software as a Medical Device (SaMD).
Given a software requirement description, identify potential hazards, their consequences, and suggest FMEA scores.
Return a JSON array where each object has:
  { hazard: string, consequence: string, severity: 1-5, probability: 1-5, detectability: 1-5, mitigation: string }
Respond with ONLY the JSON array, no prose.`;

    const raw = await callClaude(system,
      `System context: ${context ?? "AI-enhanced MRI analysis SaMD (Class B, IEC 62304)"}\nRequirement: ${requirementText}`
    );

    let hazards: any[] = [];
    try {
      // Strip markdown code fences if present
      const cleaned = raw.replace(/```json|```/g, "").trim();
      hazards = JSON.parse(cleaned);
    } catch {
      hazards = [{ hazard: "Parse error — raw LLM output", consequence: raw, severity: 0, probability: 0, detectability: 0, mitigation: "" }];
    }

    return { hazards };
  },
});

// ── 3. Traceability Auditor ───────────────────────────────────────────────────
export const auditTraceMatrix = action({
  args: {
    matrixJson: v.string(),
  },
  handler: async (_ctx, { matrixJson }) => {
    const system = `You are an IEC 62304 software lifecycle compliance auditor.
Analyse the provided requirements traceability matrix (JSON).
Identify:
  1. Requirements missing a verification test case (no verificationRef)
  2. Requirements with no downstream links (orphans)
  3. Any duplicate requirement numbers
  4. Gaps that would prevent a full bi-directional trace
Return a JSON object: { findings: Array<{ severity: "critical"|"major"|"minor", issue: string, reqNumbers: string[] }>, summary: string }
Respond with ONLY the JSON.`;

    const raw = await callClaude(system, `Traceability matrix: ${matrixJson}`);

    let result: any = { findings: [], summary: "Parse error" };
    try {
      const cleaned = raw.replace(/```json|```/g, "").trim();
      result = JSON.parse(cleaned);
    } catch {
      result = { findings: [{ severity: "minor", issue: raw, reqNumbers: [] }], summary: "Could not parse LLM response" };
    }

    return result;
  },
});
